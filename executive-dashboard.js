/**
 * Prestige Abaya — Executive Dashboard (KPI overview)
 * Aggregates OperationsCenter, AIEngine, CustomerExperience, and sales data.
 */
(function (global) {
  'use strict';

  function getClient() {
    if (global.DbHelper?.getClient) return global.DbHelper.getClient();
    if (global.SupabaseBridge?.getClient) return global.SupabaseBridge.getClient();
    return null;
  }

  function resolveTenantId() {
    if (global.DbHelper?.resolveTenantId) return global.DbHelper.resolveTenantId();
    const cfg = global.SUPABASE_CONFIG || {};
    return cfg.defaultTenantId ? String(cfg.defaultTenantId).trim() : null;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatAud(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return '0.00 AUD';
    return `${n.toFixed(2)} AUD`;
  }

  const CHART_DAYS = 7;

  function saleRowAmount(row) {
    const line = row.line_total_aud ?? row.lineTotalAud;
    if (line != null && Number.isFinite(Number(line))) return Number(line);
    const price = Number(row.price ?? row.unitPriceAud) || 0;
    const qty = Math.max(1, parseInt(row.quantity ?? row.qty, 10) || 1);
    return Math.round(price * qty * 100) / 100;
  }

  function parseSaleDate(row) {
    const raw = row.created_at ?? row.createdAt ?? row.sale_date;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function buildDailySalesSeries(rows) {
    const buckets = [];
    const today = startOfDay(new Date());
    for (let i = CHART_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets.push({
        date: d,
        key: startOfDay(d).toISOString().slice(0, 10),
        label: new Intl.DateTimeFormat('ar-AE', { weekday: 'short', day: 'numeric' }).format(d),
        total: 0,
      });
    }
    const weekStart = buckets[0]?.date || today;
    const map = Object.fromEntries(buckets.map((b) => [b.key, b]));

    (rows || []).forEach((row) => {
      const d = parseSaleDate(row);
      if (!d || d < weekStart) return;
      const key = startOfDay(d).toISOString().slice(0, 10);
      if (map[key]) map[key].total += saleRowAmount(row);
    });

    return buckets.map((b) => ({
      label: b.label,
      total: Math.round(b.total * 100) / 100,
    }));
  }

  async function fetchSalesRowsDetailed() {
    if (global.SupabaseBridge?.fetchSales) {
      const res = await global.SupabaseBridge.fetchSales();
      if (!res.ok) return { ok: false, error: res.error, rows: [] };
      return { ok: true, rows: res.data || [] };
    }

    const client = getClient();
    if (!client) return { ok: false, error: 'Supabase غير مهيأ', rows: [] };

    let query = client
      .from('sales')
      .select('id, created_at, price, quantity, line_total_aud, tenant_id')
      .order('created_at', { ascending: false })
      .limit(500);

    const tenantId = resolveTenantId();
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
    if (error) return { ok: false, error: error.message, rows: [] };
    return { ok: true, rows: data || [] };
  }

  async function fetchSalesTotals() {
    if (global.SupabaseBridge?.fetchSales) {
      const res = await global.SupabaseBridge.fetchSales();
      if (!res.ok) return { ok: false, error: res.error, totalAud: 0, count: 0 };

      const rows = res.data || [];
      const totalAud = rows.reduce((sum, sale) => {
        const line = sale.lineTotalAud ?? sale.line_total_aud;
        const price = sale.unitPriceAud ?? sale.price;
        const qty = sale.quantity ?? sale.qty ?? 1;
        const amount = line != null ? Number(line) : Number(price || 0) * Math.max(1, parseInt(qty, 10) || 1);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0);

      return { ok: true, totalAud, count: rows.length };
    }

    const client = getClient();
    if (!client) return { ok: false, error: 'Supabase غير مهيأ', totalAud: 0, count: 0 };

    let query = client.from('sales').select('line_total_aud, price, quantity');
    const tenantId = resolveTenantId();
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
    if (error) return { ok: false, error: error.message, totalAud: 0, count: 0 };

    const rows = data || [];
    const totalAud = rows.reduce((sum, row) => {
      const line = row.line_total_aud != null ? Number(row.line_total_aud) : NaN;
      if (Number.isFinite(line)) return sum + line;
      const price = Number(row.price) || 0;
      const qty = Math.max(1, parseInt(row.quantity, 10) || 1);
      return sum + price * qty;
    }, 0);

    return { ok: true, totalAud, count: rows.length };
  }

  /**
   * Aggregated executive metrics from operations, AI, CX, and sales.
   */
  async function getDashboardSummary() {
    const summary = {
      ok: true,
      totalSalesAud: 0,
      salesCount: 0,
      bestProduct: null,
      bestProductUnits: 0,
      customerRating: null,
      customerSentiment: 'neutral',
      customerSentimentLabel: '—',
      feedbackCount: 0,
      activeBranches: 0,
      totalBranches: 0,
      branches: [],
      dailySales: [],
      inventoryHealth: { low: 0, healthy: 0, outOfStock: 0, total: 0 },
      errors: [],
    };

    const salesRowsRes = await fetchSalesRowsDetailed();
    if (salesRowsRes.ok) {
      const rows = salesRowsRes.rows;
      summary.dailySales = buildDailySalesSeries(rows);
      summary.totalSalesAud = Math.round(
        rows.reduce((sum, row) => sum + saleRowAmount(row), 0) * 100
      ) / 100;
      summary.salesCount = rows.length;
    } else {
      summary.errors.push(salesRowsRes.error || 'فشل جلب المبيعات');
    }

    if (global.OperationsCenter?.getBranchStatus) {
      const branchRes = await global.OperationsCenter.getBranchStatus();
      if (branchRes.ok) {
        summary.branches = branchRes.branches || [];
        summary.totalBranches = summary.branches.length;
        summary.activeBranches = summary.branches.filter((b) => b.status === 'active').length;
      } else {
        summary.errors.push(branchRes.error || 'فشل جلب حالة الفروع');
      }
    } else {
      summary.errors.push('OperationsCenter غير متاح');
    }

    if (global.AIEngine?.predictBestSellingProduct) {
      try {
        const prediction = await global.AIEngine.predictBestSellingProduct();
        if (prediction?.product) {
          summary.bestProduct = prediction.product;
          summary.bestProductUnits = prediction.totalSold || 0;
        }
      } catch (e) {
        summary.errors.push('فشل توقع المبيعات');
        console.warn('[ExecutiveDashboard] predictBestSellingProduct:', e);
      }
    } else {
      summary.errors.push('AIEngine غير متاح');
    }

    if (global.CustomerExperience?.getOverallCustomerSatisfaction) {
      const cxRes = await global.CustomerExperience.getOverallCustomerSatisfaction();
      if (cxRes.ok) {
        summary.customerRating = cxRes.averageRating;
        summary.customerSentiment = cxRes.sentiment || 'neutral';
        summary.customerSentimentLabel = cxRes.label || '—';
        summary.feedbackCount = cxRes.feedbackCount || 0;
      } else {
        summary.errors.push(cxRes.error || 'فشل جلب رضا العملاء');
      }
    } else {
      summary.errors.push('CustomerExperience غير متاح');
    }

    if (global.InventoryManager?.checkStockLevels) {
      const stockRes = await global.InventoryManager.checkStockLevels();
      if (stockRes.ok) {
        const items = stockRes.data || [];
        const lowList = stockRes.lowStock || items.filter((i) => i.isLow);
        const low = lowList.length;
        let outOfStock = 0;
        items.forEach((item) => {
          const q = parseInt(item.stock_quantity, 10);
          if (Number.isFinite(q) && q === 0) outOfStock += 1;
        });
        const total = items.length;
        summary.inventoryHealth = {
          low,
          healthy: Math.max(0, total - low),
          outOfStock,
          total,
        };
      } else {
        summary.errors.push(stockRes.error || 'فشل جلب المخزون');
      }
    }

    summary.ok = summary.errors.length === 0 || summary.salesCount > 0 || summary.totalBranches > 0;
    return summary;
  }

  /**
   * Render executive KPI overview into a container.
   */
  async function renderExecutiveOverview(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn('[ExecutiveDashboard] container not found:', containerId);
      return { ok: false, error: 'container not found' };
    }

    container.innerHTML = `
      <section class="exec-overview card" aria-live="polite">
        <header class="exec-overview__head">
          <h2 class="exec-overview__title">لوحة المؤشرات التنفيذية</h2>
          <p class="exec-overview__subtitle">Executive Overview</p>
        </header>
        <div class="exec-overview__grid exec-overview__grid--loading">
          <p class="exec-overview__loading">جاري تحميل المؤشرات…</p>
        </div>
      </section>
    `;

    const grid = container.querySelector('.exec-overview__grid');
    const summary = await getDashboardSummary();

    const bestProductLabel = summary.bestProduct
      ? `${escapeHtml(summary.bestProduct)} <span class="exec-kpi__sub">(${summary.bestProductUnits} وحدة)</span>`
      : '—';

    const ratingLabel = summary.customerRating != null
      ? `${summary.customerRating} / 5 <span class="exec-kpi__sub">(${escapeHtml(summary.customerSentimentLabel)})</span>`
      : escapeHtml(summary.customerSentimentLabel);

    if (!grid) return { ok: false, error: 'grid not found' };

    grid.classList.remove('exec-overview__grid--loading');
    grid.innerHTML = `
      <article class="exec-kpi exec-kpi--sales">
        <span class="exec-kpi__label">إجمالي المبيعات</span>
        <strong class="exec-kpi__value">${escapeHtml(formatAud(summary.totalSalesAud))}</strong>
        <span class="exec-kpi__meta">${summary.salesCount} عملية</span>
      </article>
      <article class="exec-kpi exec-kpi--product">
        <span class="exec-kpi__label">أفضل منتج (متوقع)</span>
        <strong class="exec-kpi__value exec-kpi__value--text">${bestProductLabel}</strong>
      </article>
      <article class="exec-kpi exec-kpi--cx exec-kpi--${escapeHtml(summary.customerSentiment)}">
        <span class="exec-kpi__label">تقييم العملاء</span>
        <strong class="exec-kpi__value exec-kpi__value--text">${ratingLabel}</strong>
        <span class="exec-kpi__meta">${summary.feedbackCount} تقييم</span>
      </article>
      <article class="exec-kpi exec-kpi--branches">
        <span class="exec-kpi__label">الفروع النشطة</span>
        <strong class="exec-kpi__value">${summary.activeBranches}</strong>
        <span class="exec-kpi__meta">من ${summary.totalBranches} فرع</span>
      </article>
    `;

    if (summary.errors.length) {
      grid.insertAdjacentHTML(
        'beforeend',
        `<p class="exec-overview__errors" role="status">${summary.errors.map((e) => escapeHtml(e)).join(' · ')}</p>`
      );
    }

    return { ok: true, summary };
  }

  const ExecutiveDashboard = {
    getDashboardSummary,
    renderExecutiveOverview,
  };

  global.ExecutiveDashboard = ExecutiveDashboard;

  function boot() {
    const host = document.getElementById('executive-overview-host');
    if (host) void renderExecutiveOverview('executive-overview-host');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : global);
