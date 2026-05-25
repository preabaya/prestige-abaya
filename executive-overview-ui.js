/**
 * Prestige Abaya — Executive Overview Dashboard UI
 */
(function (global) {
  'use strict';

  const DUMMY_KPIS = {
    totalRevenue: { value: '128,450', unit: 'AUD', delta: '+12.4%', label: 'إجمالي الإيرادات' },
    netProfit: { value: '42,380', unit: 'AUD', delta: '+8.1%', label: 'صافي الربح' },
    dailySales: { value: '3,240', unit: 'AUD', delta: '+5.2%', label: 'المبيعات اليومية' },
    customers: { value: '1,284', unit: '', delta: '+18', label: 'عدد العملاء' },
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function bindExecNav() {
    const nav = document.getElementById('exec-nav');
    if (!nav || nav.dataset.bound) return;
    nav.dataset.bound = '1';

    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-exec-section]');
      if (!btn) return;
      e.preventDefault();

      nav.querySelectorAll('.exec-nav__item').forEach((el) => {
        el.classList.toggle('exec-nav__item--active', el === btn);
      });

      const sectionId = btn.getAttribute('data-exec-section');
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      global.dispatchEvent(
        new CustomEvent('exec-nav-change', { detail: { section: sectionId } })
      );
    });
  }

  function bindSidebarToggle() {
    const toggle = document.getElementById('exec-sidebar-toggle');
    const layout = document.getElementById('app-layout');
    if (!toggle || !layout || toggle.dataset.bound) return;
    toggle.dataset.bound = '1';

    toggle.addEventListener('click', () => {
      const open = layout.classList.toggle('app-layout--sidebar-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (!layout.classList.contains('app-layout--sidebar-open')) return;
      if (e.target.closest('.app-sidebar') || e.target.closest('#exec-sidebar-toggle')) return;
      layout.classList.remove('app-layout--sidebar-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  function renderDummyKpis() {
    const map = {
      'exec-kpi-revenue': DUMMY_KPIS.totalRevenue,
      'exec-kpi-profit': DUMMY_KPIS.netProfit,
      'exec-kpi-daily': DUMMY_KPIS.dailySales,
      'exec-kpi-customers': DUMMY_KPIS.customers,
    };

    Object.entries(map).forEach(([id, kpi]) => {
      const card = document.getElementById(id);
      if (!card) return;
      const val = card.querySelector('.exec-kpi-card__value');
      const delta = card.querySelector('.exec-kpi-card__delta');
      const unit = card.querySelector('.exec-kpi-card__unit');
      if (val) val.textContent = kpi.value;
      if (unit) unit.textContent = kpi.unit;
      if (delta) {
        delta.textContent = kpi.delta;
        delta.classList.toggle('exec-kpi-card__delta--up', String(kpi.delta).startsWith('+'));
      }
    });
  }

  function boot() {
    document.documentElement.classList.add('exec-theme', 'exec-theme--luxury-light');
    document.documentElement.setAttribute('data-theme', 'light');
    bindExecNav();
    bindSidebarToggle();
    if (typeof global.refreshUI !== 'function' && typeof global.updateDashboard !== 'function') {
      renderDummyKpis();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.ExecutiveOverviewUI = {
    renderDummyKpis,
    DUMMY_KPIS,
  };
})(typeof window !== 'undefined' ? window : global);
