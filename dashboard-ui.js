/**
 * Prestige Abaya — Interactive Dashboard UI (Chart.js + AuthGuard)
 */
(function (global) {
  'use strict';

  const THEME_KEY = 'prestige-theme';
  const REFRESH_MS = 5 * 60 * 1000;

  let salesChart = null;
  let stockChart = null;
  let refreshTimer = null;
  let adminAccessGranted = false;

  function $(id) {
    return document.getElementById(id);
  }

  function chartPalette() {
    const s = getComputedStyle(document.documentElement);
    const pick = (v, fallback) => (v || '').trim() || fallback;
    return {
      text: pick(s.getPropertyValue('--text-muted'), '#64748b'),
      grid: pick(s.getPropertyValue('--border'), '#e2e6ed'),
      accent: pick(s.getPropertyValue('--accent'), '#9a7b4f'),
      accentLight: pick(s.getPropertyValue('--accent-light'), '#c4a574'),
      success: pick(s.getPropertyValue('--success'), '#0d9488'),
      warning: pick(s.getPropertyValue('--warning'), '#ca8a04'),
      danger: pick(s.getPropertyValue('--danger'), '#dc2626'),
      info: pick(s.getPropertyValue('--info'), '#3b82f6'),
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

  async function ensureAdminAccess() {
    if (!global.AuthGuard?.checkAccess) return true;
    const result = await global.AuthGuard.checkAccess('admin');
    if (result?.bypassed) return true;
    return result?.ok === true;
  }

  function setInteractiveDashboardVisible(visible) {
    const panel = $('interactive-dashboard');
    if (!panel) return;
    if (visible) {
      panel.removeAttribute('hidden');
      panel.classList.add('interactive-dashboard--visible');
    } else {
      panel.setAttribute('hidden', '');
      panel.classList.remove('interactive-dashboard--visible');
    }
  }

  function barChartOptions(palette) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const v = ctx.parsed?.y ?? 0;
              return `${ctx.label}: ${Number(v).toFixed(2)} AUD`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: palette.text, maxRotation: 0 },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: palette.text },
          grid: { color: palette.grid },
        },
      },
    };
  }

  function doughnutChartOptions(palette) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: palette.text,
            boxWidth: 12,
            font: { family: 'Tajawal, Inter, sans-serif', size: 11 },
          },
        },
      },
    };
  }

  async function renderSalesBarChart(summary) {
    const canvas = $('chart-dash-sales');
    if (!canvas) return;

    const palette = chartPalette();
    const daily = summary?.dailySales || [];
    const labels = daily.length ? daily.map((d) => d.label) : ['لا بيانات'];
    const values = daily.length ? daily.map((d) => d.total) : [0];

    if (salesChart) {
      salesChart.destroy();
      salesChart = null;
    }

    salesChart = new global.Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'مبيعات يومية (AUD)',
          data: values,
          backgroundColor: palette.accent,
          borderRadius: 10,
          maxBarThickness: 48,
        }],
      },
      options: barChartOptions(palette),
    });

    const meta = $('chart-dash-sales-meta');
    if (meta) {
      const weekTotal = daily.reduce((s, d) => s + (d.total || 0), 0);
      meta.textContent = `آخر 7 أيام: ${weekTotal.toFixed(2)} AUD · إجمالي السجل: ${(summary?.totalSalesAud || 0).toFixed(2)} AUD · ${summary?.salesCount || 0} عملية`;
    }
  }

  async function renderStockDoughnutChart(summary) {
    const canvas = $('chart-dash-stock');
    if (!canvas) return;

    const palette = chartPalette();
    const health = summary?.inventoryHealth || { low: 0, healthy: 0, outOfStock: 0, total: 0 };
    const low = health.low || 0;
    const healthy = health.healthy || 0;
    const out = health.outOfStock || 0;

    if (stockChart) {
      stockChart.destroy();
      stockChart = null;
    }

    const data = [healthy, low, out];
    const labels = ['مكتمل', 'منخفض', 'نفاد'];
    const colors = [palette.success, palette.warning, palette.danger];
    const hasData = data.some((n) => n > 0);

    stockChart = new global.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: hasData ? labels : ['لا بيانات'],
        datasets: [{
          data: hasData ? data : [1],
          backgroundColor: hasData ? colors : [palette.grid],
          borderWidth: 0,
          hoverOffset: 8,
        }],
      },
      options: doughnutChartOptions(palette),
    });

    const meta = $('chart-dash-stock-meta');
    if (meta) {
      meta.textContent = `صحة المخزون · مكتمل: ${healthy} · منخفض: ${low} · نفاد: ${out} · إجمالي: ${health.total || 0}`;
    }
  }

  /**
   * جلب الملخص التنفيذي ورسم المبيعات اليومية + صحة المخزون.
   */
  async function renderCharts() {
    if (global.DashboardCharts?.updateCharts && $('chart-sales-bar')) {
      return global.DashboardCharts.updateCharts();
    }

    if (!adminAccessGranted) return { ok: false, reason: 'auth' };

    await waitForChart().catch((err) => {
      console.warn('[DashboardUI]', err);
      return null;
    });
    if (!global.Chart) return { ok: false, error: 'Chart.js غير محمّل' };

    const core = global.prestigeCore || global.PrestigeCore;
    const getSummary =
      core?.getDashboardSummary || global.ExecutiveDashboard?.getDashboardSummary;
    if (!getSummary) {
      return { ok: false, error: 'PrestigeCore غير متاح' };
    }

    const summary = await getSummary();

    await Promise.all([
      renderSalesBarChart(summary),
      renderStockDoughnutChart(summary),
    ]);

    return { ok: true, summary };
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
          document.querySelector(`.site-nav__btn[data-tab="${tab}"]`)?.click();
        }
        $('app-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function getTheme() {
    try {
      const stored = global.localStorage?.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch (_) { /* ignore */ }
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
      const label = btn.querySelector('.theme-toggle__label');
      if (label) label.textContent = isDark ? '☀️' : '🌙';
    }
  }

  function initTheme() {
    applyTheme(getTheme());
  }

  function bindThemeToggle() {
    const btn = $('theme-toggle');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
      if (global.DashboardCharts?.updateCharts) {
        global.DashboardCharts.updateCharts();
      } else {
        renderCharts().catch((e) => console.warn('[DashboardUI]', e));
      }
    });
  }

  async function refresh() {
    if (!adminAccessGranted) return;
    bindNavShortcuts();
    await renderCharts();
  }

  function scheduleRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => {
      refresh().catch((e) => console.warn('[DashboardUI]', e));
    }, REFRESH_MS);
  }

  async function boot() {
    initTheme();
    bindThemeToggle();

    adminAccessGranted = await ensureAdminAccess();
    setInteractiveDashboardVisible(adminAccessGranted);

    if (!adminAccessGranted) {
      console.info('[DashboardUI] لوحة الرسوم مخفية — صلاحية admin مطلوبة');
      return;
    }

    await refresh();
    scheduleRefresh();

    document.addEventListener('prestige-app-ready', () => {
      refresh().catch((e) => console.warn('[DashboardUI] ready', e));
    });

    global.addEventListener('prestige-theme-change', () => {
      renderCharts().catch((e) => console.warn('[DashboardUI] theme', e));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      boot().catch((e) => console.warn('[DashboardUI] boot', e));
    });
  } else {
    boot().catch((e) => console.warn('[DashboardUI] boot', e));
  }

  global.DashboardUI = {
    refresh,
    renderCharts,
    ensureAdminAccess,
    initTheme,
    getTheme,
  };
})(typeof window !== 'undefined' ? window : global);
