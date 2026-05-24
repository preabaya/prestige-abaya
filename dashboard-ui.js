/**
 * Prestige Abaya — Dashboard UI (grid cards, Chart.js, theme toggle)
 * Requires: Chart.js, ExecutiveDashboard, InventoryManager
 */
(function (global) {
  'use strict';

  const THEME_KEY = 'prestige-theme';
  const REFRESH_MS = 5 * 60 * 1000;

  let salesChart = null;
  let stockChart = null;
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

  function barChartOptions(palette) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const v = ctx.parsed?.y ?? ctx.parsed ?? 0;
              const label = ctx.label || '';
              if (label.includes('AUD') || label.includes('إيراد')) {
                return `${label}: ${Number(v).toFixed(2)} AUD`;
              }
              return `${label}: ${v}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: palette.text, maxRotation: 45, minRotation: 0 },
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
      cutout: '58%',
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

  function salesBarFromSummary(summary) {
    const s = summary || {};
    return {
      labels: [
        'إيرادات المبيعات (AUD)',
        'عدد عمليات البيع',
        'وحدات الأكثر مبيعاً',
        'الفروع النشطة',
      ],
      values: [
        Number(s.totalSalesAud) || 0,
        Number(s.salesCount) || 0,
        Number(s.bestProductUnits) || 0,
        Number(s.activeBranches) || 0,
      ],
      metaParts: [
        `إجمالي: ${(Number(s.totalSalesAud) || 0).toFixed(2)} AUD`,
        `${s.salesCount || 0} عملية`,
        s.bestProduct ? `الأفضل: ${s.bestProduct}` : '—',
        `${s.activeBranches || 0} / ${s.totalBranches || 0} فرع`,
      ],
    };
  }

  async function fetchStockStatus() {
    if (!global.InventoryManager?.checkStockLevels) {
      return { ok: false, low: 0, healthy: 0, total: 0 };
    }
    const res = await global.InventoryManager.checkStockLevels();
    if (!res?.ok) {
      return { ok: false, low: 0, healthy: 0, total: 0, error: res?.error };
    }
    const items = res.data || [];
    const low = (res.lowStock || items.filter((i) => i.isLow)).length;
    const total = items.length;
    const healthy = Math.max(0, total - low);
    return { ok: true, low, healthy, total };
  }

  async function renderSalesBarChart(summary) {
    const canvas = $('chart-dash-sales');
    if (!canvas) return;

    const palette = chartPalette();
    const { labels, values, metaParts } = salesBarFromSummary(summary);

    if (salesChart) {
      salesChart.destroy();
      salesChart = null;
    }

    salesChart = new global.Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'المبيعات',
          data: values,
          backgroundColor: [
            palette.accent,
            palette.info,
            palette.accentLight,
            palette.success,
          ],
          borderRadius: 8,
          maxBarThickness: 56,
        }],
      },
      options: barChartOptions(palette),
    });

    const meta = $('chart-dash-sales-meta');
    if (meta) {
      meta.textContent = metaParts.filter(Boolean).join(' · ') || 'لا توجد بيانات مبيعات';
    }
  }

  async function renderStockDoughnutChart() {
    const canvas = $('chart-dash-stock');
    if (!canvas) return;

    const stock = await fetchStockStatus();
    const palette = chartPalette();
    const low = stock.low || 0;
    const healthy = stock.healthy || 0;

    if (stockChart) {
      stockChart.destroy();
      stockChart = null;
    }

    stockChart = new global.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['مخزون منخفض', 'مخزون مكتمل'],
        datasets: [{
          data: low === 0 && healthy === 0 ? [0, 1] : [low, healthy],
          backgroundColor: [palette.danger, palette.success],
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: doughnutChartOptions(palette),
    });

    const meta = $('chart-dash-stock-meta');
    if (meta) {
      if (!stock.ok && stock.error) {
        meta.textContent = escapeHtml(stock.error);
        return;
      }
      const total = stock.total || low + healthy;
      meta.textContent = `منخفض: ${low} · مكتمل: ${healthy} · إجمالي المنتجات: ${total}`;
    }
  }

  /**
   * Bar chart (sales KPIs from ExecutiveDashboard) + doughnut (stock status).
   */
  async function renderCharts() {
    await waitForChart().catch((err) => {
      console.warn('[DashboardUI]', err);
      return null;
    });
    if (!global.Chart) return { ok: false, error: 'Chart.js غير محمّل' };

    let summary = null;
    if (global.ExecutiveDashboard?.getDashboardSummary) {
      summary = await global.ExecutiveDashboard.getDashboardSummary();
    }

    await Promise.all([
      renderSalesBarChart(summary),
      renderStockDoughnutChart(),
    ]);

    return { ok: true, summary };
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
        const low = stock.lowStock || [];
        const count = Array.isArray(low) ? low.length : 0;
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
            await renderCharts();
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
      if (label) label.textContent = isDark ? '☀️' : '🌙';
    }

    global.dispatchEvent(new CustomEvent('prestige-theme-change', { detail: { theme: next } }));
  }

  function initTheme() {
    applyTheme(getTheme());
  }

  function toggleTheme() {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    renderCharts().catch((e) => console.warn('[DashboardUI]', e));
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
          document.querySelector(`.site-nav__btn[data-tab="${tab}"]`)?.click();
        }
        $('app-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  async function refresh() {
    bindNavShortcuts();
    await renderCharts();
    await renderModuleCards();
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
      renderCharts().catch((e) => console.warn('[DashboardUI] theme', e));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.DashboardUI = {
    refresh,
    renderCharts,
    initTheme,
    toggleTheme,
    getTheme,
  };
})(typeof window !== 'undefined' ? window : global);
