/**
 * Prestige Abaya — Dashboard Charts (Chart.js + dummy dynamic data)
 */
(function (global) {
  'use strict';

  const PERIODS = ['day', 'week', 'month'];
  let currentPeriod = 'week';
  let salesChart = null;
  let customersChart = null;

  const BASE_SALES = {
    day: {
      labels: ['8ص', '10ص', '12ظ', '2م', '4م', '6م', '8م'],
      values: [420, 680, 920, 1100, 840, 620, 380],
    },
    week: {
      labels: ['سبت', 'أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمعة'],
      values: [2400, 3100, 2800, 3600, 4200, 3900, 4500],
    },
    month: {
      labels: ['أسبوع 1', 'أسبوع 2', 'أسبوع 3', 'أسبوع 4'],
      values: [18200, 21400, 19800, 24100],
    },
  };

  const BASE_CUSTOMERS = {
    day: { labels: ['جدد', 'عائدون', 'VIP'], values: [42, 68, 24] },
    week: { labels: ['جدد', 'عائدون', 'VIP', 'غير نشط'], values: [186, 412, 98, 54] },
    month: { labels: ['جدد', 'عائدون', 'VIP', 'شركات', 'غير نشط'], values: [520, 480, 142, 88, 54] },
  };

  function $(id) {
    return document.getElementById(id);
  }

  function jitter(n, spread) {
    const s = spread || 0.12;
    const factor = 1 + (Math.random() * 2 - 1) * s;
    return Math.round(n * factor);
  }

  function buildSalesDataset(period) {
    const base = BASE_SALES[period] || BASE_SALES.week;
    return {
      labels: [...base.labels],
      values: base.values.map((v) => jitter(v, period === 'day' ? 0.08 : 0.1)),
    };
  }

  function buildCustomersDataset(period) {
    const base = BASE_CUSTOMERS[period] || BASE_CUSTOMERS.week;
    return {
      labels: [...base.labels],
      values: base.values.map((v) => jitter(v, 0.12)),
    };
  }

  function palette() {
    const s = getComputedStyle(document.documentElement);
    const pick = (v, fb) => (s.getPropertyValue(v) || fb).trim() || fb;
    return {
      text: pick('--exec-muted', '#94a3b8'),
      grid: pick('--exec-border', 'rgba(255,255,255,0.08)'),
      accent: pick('--exec-accent', '#c4a574'),
      accentLight: '#dfc89a',
      success: pick('--exec-success', '#2dd4bf'),
      info: '#60a5fa',
      warning: '#fbbf24',
      danger: '#f87171',
    };
  }

  function waitForChart(ms = 10000) {
    if (global.Chart) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const t0 = Date.now();
      (function poll() {
        if (global.Chart) return resolve();
        if (Date.now() - t0 > ms) return reject(new Error('Chart.js غير محمّل'));
        setTimeout(poll, 40);
      })();
    });
  }

  function destroyCharts() {
    if (salesChart) {
      salesChart.destroy();
      salesChart = null;
    }
    if (customersChart) {
      customersChart.destroy();
      customersChart = null;
    }
  }

  function renderSalesBar(data) {
    const canvas = $('chart-sales-bar');
    if (!canvas || !global.Chart) return;

    const p = palette();
    if (salesChart) {
      salesChart.destroy();
      salesChart = null;
    }

    salesChart = new global.Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'المبيعات (AUD)',
          data: data.values,
          backgroundColor: p.accent,
          borderRadius: 10,
          maxBarThickness: 52,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'المبيعات',
            color: p.text,
            font: { family: 'Tajawal, sans-serif', size: 14, weight: '700' },
          },
        },
        scales: {
          x: { ticks: { color: p.text }, grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { color: p.text },
            grid: { color: p.grid },
          },
        },
      },
    });

    const meta = $('chart-sales-bar-meta');
    if (meta) {
      const total = data.values.reduce((a, b) => a + b, 0);
      meta.textContent = `إجمالي الفترة: ${total.toLocaleString('en-AU')} AUD`;
    }
  }

  function renderCustomersDoughnut(data) {
    const canvas = $('chart-customers-doughnut');
    if (!canvas || !global.Chart) return;

    const p = palette();
    if (customersChart) {
      customersChart.destroy();
      customersChart = null;
    }

    const colors = [p.success, p.info, p.accent, p.warning, p.danger];

    customersChart = new global.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: data.labels.map((_, i) => colors[i % colors.length]),
          borderWidth: 0,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          title: {
            display: true,
            text: 'توزيع العملاء',
            color: p.text,
            font: { family: 'Tajawal, sans-serif', size: 14, weight: '700' },
          },
          legend: {
            position: 'bottom',
            labels: { color: p.text, boxWidth: 10, font: { size: 11 } },
          },
        },
      },
    });

    const meta = $('chart-customers-doughnut-meta');
    if (meta) {
      const total = data.values.reduce((a, b) => a + b, 0);
      meta.textContent = `إجمالي العملاء: ${total.toLocaleString('en-AU')}`;
    }
  }

  function setActivePeriodButton(period) {
    document.querySelectorAll('[data-chart-period]').forEach((btn) => {
      const active = btn.getAttribute('data-chart-period') === period;
      btn.classList.toggle('chart-period-btn--active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function bindPeriodToolbar() {
    const toolbar = $('dashboard-charts-toolbar');
    if (!toolbar || toolbar.dataset.bound) return;
    toolbar.dataset.bound = '1';

    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-chart-period]');
      if (!btn) return;
      const period = btn.getAttribute('data-chart-period');
      if (!PERIODS.includes(period)) return;
      currentPeriod = period;
      setActivePeriodButton(period);
      updateCharts();
    });
  }

  function updateCharts() {
    const sales = buildSalesDataset(currentPeriod);
    const customers = buildCustomersDataset(currentPeriod);
    renderSalesBar(sales);
    renderCustomersDoughnut(customers);
    return { period: currentPeriod, sales, customers };
  }

  async function init() {
    const panel = $('dashboard-charts-panel');
    if (!panel) return;

    await waitForChart().catch((err) => {
      console.warn('[DashboardCharts]', err);
      return;
    });

    bindPeriodToolbar();
    setActivePeriodButton(currentPeriod);
    updateCharts();

    global.addEventListener('prestige-theme-change', () => {
      destroyCharts();
      updateCharts();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init().catch(console.warn));
  } else {
    init().catch(console.warn);
  }

  global.DashboardCharts = {
    updateCharts,
    setPeriod(period) {
      if (!PERIODS.includes(period)) return;
      currentPeriod = period;
      setActivePeriodButton(period);
      return updateCharts();
    },
    getPeriod: () => currentPeriod,
  };
})(typeof window !== 'undefined' ? window : global);
