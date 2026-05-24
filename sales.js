/**
 * Prestige Abaya — Sales tab bootstrap (#sales)
 * Requires: supabase.config.js, supabase-bridge.js, script.js (loaded before this file)
 */
(function () {
  'use strict';

  const SALES_TAB = 'sales';

  function getConfig() {
    return typeof window !== 'undefined' ? window.SUPABASE_CONFIG || {} : {};
  }

  function isConfigReady() {
    const cfg = getConfig();
    return Boolean(String(cfg.url || '').trim() && String(cfg.anonKey || '').trim());
  }

  function hashTab() {
    const raw = (location.hash || '').replace(/^#/, '').trim().toLowerCase();
    return raw === SALES_TAB ? SALES_TAB : null;
  }

  function showConfigBanner() {
    const panel = document.getElementById(SALES_TAB);
    if (!panel || panel.querySelector('[data-sales-config-banner]')) return;
    panel.insertAdjacentHTML(
      'afterbegin',
      `<div class="card" data-sales-config-banner role="alert" style="margin-bottom:1rem;border-color:#fecaca;background:#fef2f2">
        <p class="card__title" style="margin:0 0 0.35rem">إعداد Supabase</p>
        <p class="form-hint" style="margin:0">انسخ <code>supabase.config.example.js</code> إلى <code>supabase.config.js</code> وأضف <code>url</code> و <code>anonKey</code>.</p>
      </div>`
    );
  }

  function waitForSalesDom(maxMs = 12000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        if (document.getElementById('sale-form')) return resolve(true);
        if (Date.now() - start > maxMs) return resolve(false);
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  async function activateSalesTab() {
    if (typeof window.navigateToTab === 'function') {
      await window.navigateToTab(SALES_TAB);
      return;
    }

    const section = document.getElementById(SALES_TAB);
    if (section) {
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('panel--active'));
      section.classList.add('panel--active');
    }

    if (typeof window.loadInventoryForSales === 'function') {
      await window.loadInventoryForSales();
    } else if (typeof window.populateSaleSelect === 'function') {
      window.populateSaleSelect();
    }
  }

  async function boot() {
    if (hashTab() !== SALES_TAB) return;

    const ready = await waitForSalesDom();
    if (!ready) {
      if (typeof window.renderApp === 'function') {
        window.renderApp(SALES_TAB);
        await waitForSalesDom();
      }
    }

    if (!document.getElementById('sale-form')) {
      console.error('[Sales] sale-form not found — check renderApp / #sales panel');
      return;
    }

    if (!isConfigReady()) showConfigBanner();

    await activateSalesTab();
  }

  window.PrestigeSalesPage = {
    boot,
    isConfigReady,
    SALES_TAB,
  };

  document.addEventListener('prestige-app-ready', () => {
    void boot();
  });

  window.addEventListener('hashchange', () => {
    void boot();
  });

  if (hashTab() === SALES_TAB) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => void boot());
    } else {
      void boot();
    }
  }
})();
