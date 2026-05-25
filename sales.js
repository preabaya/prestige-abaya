/**
 * Prestige Abaya — Sales tab bootstrap (#sales)
 * Requires: supabase.config.js, db-helper.js, supabase-bridge.js, script.js
 */
(function () {
  'use strict';

  const SALES_TAB = 'sales';

  function getConfig() {
    return typeof window !== 'undefined' ? (window.SUPABASE_CONFIG || {}) : {};
  }

  function isConfigReady() {
    const cfg = getConfig();
    return Boolean(String(cfg.url || '').trim() && String(cfg.anonKey || '').trim());
  }

  function hashTab() {
    const raw = (location.hash || '').replace(/^#/, '').trim().toLowerCase();
    return raw === SALES_TAB ? SALES_TAB : null;
  }

  function getSalesRoot() {
    return (
      document.getElementById('sales-panel')
      || document.getElementById(SALES_TAB)
    );
  }

  function getSaleFormEl() {
    if (typeof window.getSaleFormEl === 'function') {
      return window.getSaleFormEl();
    }
    const root = getSalesRoot();
    if (root) {
      const form = root.querySelector('#sale-form');
      if (form) return form;
    }
    return document.getElementById('sale-form');
  }

  function showConfigBanner() {
    const panel = getSalesRoot();
    if (!panel || panel.querySelector('[data-sales-config-banner]')) return;
    panel.insertAdjacentHTML(
      'afterbegin',
      `<div class="card" data-sales-config-banner role="alert" style="margin-bottom:1rem;border-color:#fecaca;background:#fef2f2">
        <p class="card__title" style="margin:0 0 0.35rem">إعداد Supabase</p>
        <p class="form-hint" style="margin:0">انسخ <code>supabase.config.example.js</code> إلى <code>supabase.config.js</code> وأضف <code>url</code> و <code>anonKey</code>.</p>
      </div>`
    );
  }

  function waitForSalesDom(maxMs = 15000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        if (getSaleFormEl()) return resolve(true);
        if (Date.now() - start > maxMs) return resolve(false);
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  async function loadCatalog() {
    if (typeof window.loadInventoryForSales === 'function') {
      await window.loadInventoryForSales();
      return;
    }
    if (typeof DbHelper !== 'undefined' && typeof DbHelper.getProducts === 'function') {
      const res = await DbHelper.getProducts();
      if (!res.ok) {
        console.warn('[Sales] DbHelper.getProducts:', res.error);
        return;
      }
      if (typeof window.populateSaleSelect === 'function') {
        window.populateSaleSelect();
      }
    }
  }

  async function ensureSalesShell() {
    if (typeof window.renderApp === 'function') {
      window.renderApp(SALES_TAB);
    }
    if (typeof window.navigateToTab === 'function') {
      await window.navigateToTab(SALES_TAB);
      return;
    }

    const section = document.getElementById(SALES_TAB);
    if (section) {
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('panel--active'));
      section.classList.add('panel--active');
    }

    await loadCatalog();
  }

  async function boot() {
    if (hashTab() !== SALES_TAB) return;

    await ensureSalesShell();

    const ready = await waitForSalesDom();
    if (!ready) {
      console.error('[Sales] sale-form not found inside #sales / #sales-panel — app may still be loading');
      return;
    }

    if (!isConfigReady()) showConfigBanner();

    await loadCatalog();
  }

  window.PrestigeSalesPage = {
    boot,
    isConfigReady,
    getSaleFormEl,
    getSalesRoot,
    SALES_TAB,
  };

  document.addEventListener('prestige-app-ready', () => {
    void boot();
  });

  window.addEventListener('hashchange', () => {
    void boot();
  });
})();
