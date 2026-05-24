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
      errors: [],
    };

    const salesRes = await fetchSalesTotals();
    if (salesRes.ok) {
      summary.totalSalesAud = Math.round(salesRes.totalAud * 100) / 100;
      summary.salesCount = salesRes.count;
    } else {
      summary.errors.push(salesRes.error || 'فشل جلب المبيعات');
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
