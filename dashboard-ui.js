/**
 * Prestige Abaya — Dashboard UI (grid cards, Chart.js, theme toggle)
 * Requires: Chart.js, SupabaseBridge, CustomerExperience, OperationsCenter, etc.
 */
(function (global) {
  'use strict';

  const THEME_KEY = 'prestige-theme';
  const CHART_DAYS = 7;
  const REFRESH_MS = 5 * 60 * 1000;

  let salesChart = null;
  let customerChart = null;
  let refreshTimer = null;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function chartPalette() {
    const s = getComputedStyle(document.documentElement);
    const pick = (v, fallback) => {
      const t = (v || '').trim();
      return t || fallback;
    };
    return {
      text: pick(s.getPropertyValue('--text-muted'), '#64748b'),
      grid: pick(s.getPropertyValue('--border'), '#e2e6ed'),
      accent: pick(s.getPropertyValue('--accent'), '#9a7b4f'),
      accentLight: pick(s.getPropertyValue('--accent-light'), '#c4a574'),
      success: pick(s.getPropertyValue('--success'), '#0d9488'),
      warning: pick(s.getPropertyValue('--warning'), '#ca8a04'),
      danger: pick(s.getPropertyValue('--danger'), '#dc2626'),
      info: pick(s.getPropertyValue('--info'), '#3b82f6'),
      surface: pick(s.getPropertyValue('--surface'), '#ffffff'),
    };
  }

  function waitForChart(maxMs = 12000) {
    if (global.Chart) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = () => {
        if (global.Chart) {
          resolve();
          return;
        }
        if (Date.now() - start > maxMs) {
          reject(new Error('Chart.js غير محمّل'));
          return;
        }
        setTimeout(tick, 50);
      };
      tick();
    });
  }

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

  function saleAmount(row) {
    const line = row.line_total_aud ?? row.lineTotalAud;
    if (line != null && Number.isFinite(Number(line))) return Number(line);
    const price = Number(row.price) || 0;
    const qty = Math.max(1, parseInt(row.quantity, 10) || 1);
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

  function dayKey(d) {
    return startOfDay(d).toISOString().slice(0, 10);
  }

  function buildLast7DayBuckets() {
    const buckets = [];
    const today = startOfDay(new Date());
    for (let i = CHART_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets.push({
        date: d,
        key: dayKey(d),
        total: 0,
        label: new Intl.DateTimeFormat('ar-AE', { weekday: 'short', day: 'numeric' }).format(d),
      });
    }
    return buckets;
  }

  async function fetchSalesRows() {
    if (global.SupabaseBridge?.fetchSales) {
      const res = await global.SupabaseBridge.fetchSales();
      if (res.ok) return res.data || [];
    }

    const client = getClient();
    if (!client) return [];

    let query = client
      .from('sales')
      .select('id, created_at, price, quantity, line_total_aud, tenant_id')
      .order('created_at', { ascending: false })
      .limit(500);

    const tenantId = resolveTenantId();
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
    if (error) {
      console.warn('[DashboardUI] sales', error.message);
      return [];
    }
    return data || [];
  }

  function aggregateSalesByDay(rows) {
    const weekStart = startOfDay(new Date());
    weekStart.setDate(weekStart.getDate() - (CHART_DAYS - 1));

    const buckets = buildLast7DayBuckets();
    const map = Object.fromEntries(buckets.map((b) => [b.key, b]));

    rows.forEach((row) => {
      const d = parseSaleDate(row);
      if (!d || d < weekStart) return;
      const key = dayKey(d);
      if (!map[key]) return;
      map[key].total += saleAmount(row);
    });

    return buckets.map((b) => ({
      label: b.label,
      total: Math.round(b.total * 100) / 100,
    }));
  }

  async function fetchFeedbackRows() {
    const client = getClient();
    if (!client) return [];

    let query = client
      .from('customer_feedback')
      .select('rating, sentiment')
      .order('created_at', { ascending: false })
      .limit(200);

    const tenantId = resolveTenantId();
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
    if (error) {
      console.warn('[DashboardUI] feedback', error.message);
      return [];
    }
    return data || [];
  }

  function ratingHistogram(rows) {
    const counts = [0, 0, 0, 0, 0];
    rows.forEach((r) => {
      const n = parseInt(r.rating, 10);
      if (Number.isFinite(n) && n >= 1 && n <= 5) counts[n - 1] += 1;
    });
    return counts;
  }

  function sentimentCounts(rows) {
    const out = { happy: 0, neutral: 0, angry: 0 };
    rows.forEach((r) => {
      const s = r.sentiment || 'neutral';
      if (out[s] != null) out[s] += 1;
      else out.neutral += 1;
    });
    return out;
  }

  function baseChartOptions(palette) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: palette.text, font: { family: 'Tajawal, Inter, sans-serif' } },
        },
      },
      scales: {
        x: {
          ticks: { color: palette.text },
          grid: { color: palette.grid },
        },
        y: {
          beginAtZero: true,
          ticks: { color: palette.text },
          grid: { color: palette.grid },
        },
      },
    };
  }

  async function renderSalesChart() {
    const canvas = $('chart-dash-sales');
    if (!canvas) return;

    await waitForChart().catch(() => null);
    if (!global.Chart) return;

    const rows = await fetchSalesRows();
    const series = aggregateSalesByDay(rows);
    const palette = chartPalette();

    if (salesChart) {
      salesChart.destroy();
      salesChart = null;
    }

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(154, 123, 79, 0.35)');
    gradient.addColorStop(1, 'rgba(154, 123, 79, 0.02)');

    salesChart = new global.Chart(canvas, {
      type: 'line',
      data: {
        labels: series.map((s) => s.label),
        datasets: [{
          label: 'المبيعات (AUD)',
          data: series.map((s) => s.total),
          borderColor: palette.accent,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: palette.accentLight,
        }],
      },
      options: baseChartOptions(palette),
    });

    const meta = $('chart-dash-sales-meta');
    if (meta) {
      const weekTotal = series.reduce((s, x) => s + x.total, 0);
      meta.textContent = `إجمالي ${CHART_DAYS} أيام: ${weekTotal.toFixed(2)} AUD · ${rows.length} عملية في السجل`;
    }
  }

  async function renderCustomerChart() {
    const canvas = $('chart-dash-customer-ratings');
    if (!canvas) return;

    await waitForChart().catch(() => null);
    if (!global.Chart) return;

    let rows = [];
    let cxMeta = '';
    if (global.CustomerExperience?.getOverallCustomerSatisfaction) {
      const cx = await global.CustomerExperience.getOverallCustomerSatisfaction();
      if (cx.ok) {
        const avg = cx.averageRating != null ? `${cx.averageRating}/5` : '—';
        cxMeta = `متوسط التقييم: ${avg} · ${cx.feedbackCount || 0} ملاحظة · ${cx.label || ''}`;
      }
    }

    const metaEl = $('chart-dash-customer-meta');
    if (metaEl) metaEl.textContent = cxMeta || 'جاري التحميل…';

    rows = await fetchFeedbackRows();
    const hist = ratingHistogram(rows);
    const sent = sentimentCounts(rows);
    const palette = chartPalette();

    if (customerChart) {
      customerChart.destroy();
      customerChart = null;
    }

    if (metaEl) {
      metaEl.textContent = `${cxMeta || 'تقييمات العملاء'} · مشاعر: راضٍ ${sent.happy} · محايد ${sent.neutral} · غاضب ${sent.angry}`;
    }

    customerChart = new global.Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['★1', '★2', '★3', '★4', '★5'],
        datasets: [{
          label: 'عدد التقييمات',
          data: hist,
          backgroundColor: [
            palette.danger,
            palette.warning,
            palette.text,
            palette.info,
            palette.success,
          ],
          borderRadius: 8,
        }],
      },
      options: baseChartOptions(palette),
    });
  }

  function renderSlotHtml(slotId, innerHtml) {
    const el = $(slotId);
    if (el) el.innerHTML = innerHtml;
  }

  async function renderModuleCards() {
    if (global.OperationsCenter?.getBranchStatus) {
      const res = await global.OperationsCenter.getBranchStatus();
      if (res?.ok) {
        const branches = res.branches || [];
        const active = branches.filter((b) => String(b.status || 'active').toLowerCase() === 'active').length;
        const list = branches.slice(0, 4).map((b) => {
          const label = b.company_name || b.name || b.id;
          const isActive = String(b.status || 'active').toLowerCase() === 'active';
          return `<li class="dash-mini-list__item"><span>${escapeHtml(label)}</span><span class="dash-mini-list__badge">${isActive ? 'نشط' : escapeHtml(b.status || '—')}</span></li>`;
        }).join('');
        renderSlotHtml('dash-operations-slot', `
          <p class="dash-mini-stat"><strong>${active}</strong> / ${branches.length} فرع نشط</p>
          <ul class="dash-mini-list" role="list">${list || '<li class="dash-mini-list__item">لا توجد فروع</li>'}</ul>
          <button type="button" class="btn btn--outline btn--sm dash-card__link" data-dash-nav="dashboard">فتح لوحة التحكم</button>`);
      }
    }

    if (global.InventoryManager?.checkStockLevels) {
      const stock = await global.InventoryManager.checkStockLevels();
      if (stock?.ok) {
        const low = stock.lowStock || stock.items || [];
        const count = Array.isArray(low) ? low.length : Number(stock.lowCount) || 0;
        const preview = (Array.isArray(low) ? low : []).slice(0, 3).map((item) =>
          `<li class="dash-mini-list__item">${escapeHtml(item.product_name || item.name)} <span class="dash-mini-list__badge dash-mini-list__badge--warn">${escapeHtml(String(item.stock_quantity ?? item.qty ?? '—'))}</span></li>`
        ).join('');
        renderSlotHtml('dash-inventory-slot', `
          <p class="dash-mini-stat"><strong>${count}</strong> منتج تحت الحد الأدنى</p>
          <ul class="dash-mini-list" role="list">${preview || '<li class="dash-mini-list__item">المخزون مستقر</li>'}</ul>
          <button type="button" class="btn btn--outline btn--sm dash-card__link" data-dash-nav="inventory">إدارة المخزون</button>`);
      }
    }

    if (global.SecurityCenter?.getSecuritySummary) {
      const sec = await global.SecurityCenter.getSecuritySummary();
      if (sec?.ok) {
        const crit = sec.criticalCount ?? 0;
        const warn = sec.warningCount ?? 0;
        renderSlotHtml('dash-security-slot', `
          <p class="dash-mini-stat"><strong>${sec.count ?? 0}</strong> تنبيه غير مراجع</p>
          <p class="dash-mini-hint">حرج: ${crit} · تحذير: ${warn}</p>
          <button type="button" class="btn btn--outline btn--sm dash-card__link" data-dash-nav="sales">مراجعة المبيعات</button>`);
      }
    }

    if (global.AutomationCenter) {
      renderSlotHtml('dash-automation-slot', `
        <p class="dash-mini-hint">تنظيف التنبيهات اليومي · إعادة الطلب التلقائي عند انخفاض المخزون</p>
        <button type="button" class="btn btn--outline btn--sm" id="dash-run-automation-btn">تشغيل المهام الآن</button>`);
      const btn = $('dash-run-automation-btn');
      if (btn && !btn.dataset.bound) {
        btn.dataset.bound = '1';
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            if (global.AutomationCenter.runDailyCleanup) await global.AutomationCenter.runDailyCleanup();
            if (global.AutomationCenter.autoReorderStock) await global.AutomationCenter.autoReorderStock();
            btn.textContent = 'تم التشغيل';
          } catch (e) {
            console.warn('[DashboardUI] automation', e);
          } finally {
            setTimeout(() => {
              btn.disabled = false;
              btn.textContent = 'تشغيل المهام الآن';
            }, 3000);
          }
        });
      }
    }

    const notifBadge = $('notifications-count');
    const notifSlot = $('dash-notifications-slot');
    if (notifSlot && notifBadge) {
      const n = notifBadge.textContent || '0';
      const hidden = notifBadge.hasAttribute('hidden');
      notifSlot.innerHTML = `
        <p class="dash-mini-stat"><strong>${hidden ? '0' : escapeHtml(n)}</strong> تنبيه غير مقروء</p>
        <button type="button" class="btn btn--outline btn--sm" id="dash-open-notifications">فتح مركز التنبيهات</button>`;
      const openBtn = $('dash-open-notifications');
      if (openBtn && !openBtn.dataset.bound) {
        openBtn.dataset.bound = '1';
        openBtn.addEventListener('click', () => {
          $('notifications-center-toggle')?.click();
        });
      }
    }

  }

  function getTheme() {
    try {
      const stored = global.localStorage?.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch (_) { /* ignore */ }
    if (global.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }

  function applyTheme(theme) {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try {
      global.localStorage?.setItem(THEME_KEY, next);
    } catch (_) { /* ignore */ }

    const btn = $('theme-toggle');
    if (btn) {
      const isDark = next === 'dark';
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.title = isDark ? 'الوضع الفاتح' : 'الوضع المظلم';
      const label = btn.querySelector('.theme-toggle__label');
      if (label) label.textContent = isDark ? '☀️ فاتح' : '🌙 مظلم';
    }

    global.dispatchEvent(new CustomEvent('prestige-theme-change', { detail: { theme: next } }));
  }

  function initTheme() {
    applyTheme(getTheme());
  }

  function toggleTheme() {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    renderSalesChart();
    renderCustomerChart();
  }

  function bindThemeToggle() {
    const btn = $('theme-toggle');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', toggleTheme);
  }

  function bindNavShortcuts() {
    document.querySelectorAll('[data-dash-nav]').forEach((el) => {
      if (el.dataset.bound) return;
      el.dataset.bound = '1';
      el.addEventListener('click', () => {
        const tab = el.getAttribute('data-dash-nav');
        if (tab && typeof global.navigateToTab === 'function') {
          global.navigateToTab(tab);
        } else {
          const navBtn = document.querySelector(`.site-nav__btn[data-tab="${tab}"]`);
          navBtn?.click();
        }
        $('dashboard-shell__main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  async function refresh() {
    bindNavShortcuts();
    await Promise.all([
      renderSalesChart(),
      renderCustomerChart(),
      renderModuleCards(),
    ]);
  }

  function scheduleRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => {
      refresh().catch((e) => console.warn('[DashboardUI]', e));
    }, REFRESH_MS);
  }

  function boot() {
    initTheme();
    bindThemeToggle();
    bindNavShortcuts();

    refresh().catch((e) => console.warn('[DashboardUI] boot', e));
    scheduleRefresh();

    document.addEventListener('prestige-app-ready', () => {
      refresh().catch((e) => console.warn('[DashboardUI] ready', e));
    });

    global.addEventListener('prestige-theme-change', () => {
      /* charts rebuilt in toggleTheme */
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.DashboardUI = {
    refresh,
    initTheme,
    toggleTheme,
    getTheme,
  };
})(typeof window !== 'undefined' ? window : global);
