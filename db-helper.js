/**
 * @deprecated Use prestige-core.js — shim for legacy pages
 */
(function (global) {
  'use strict';
  if (global.PrestigeCore || global.DbHelper) {
    global.DbHelper = global.DbHelper || {
      getClient: () => (global.PrestigeCore || global.DashboardService).getClient(),
      getProducts: () => (global.PrestigeCore || global.DashboardService).getProducts(),
      addProduct: (item) => (global.PrestigeCore || global.DashboardService).addProduct(item),
      saveSale: (sale) => (global.PrestigeCore || global.DashboardService).saveSale(sale),
      resolveTenantId: () => (global.PrestigeCore || global.DashboardService).resolveTenantId(),
      isConfigured: () => (global.PrestigeCore || global.DashboardService).isConfigured(),
    };
    global.getProducts = global.DbHelper.getProducts;
    global.addProduct = global.DbHelper.addProduct;
    global.saveSale = global.DbHelper.saveSale;
  } else {
    console.warn('[db-helper.js] Load prestige-core.js before this shim');
  }
})(typeof window !== 'undefined' ? window : global);
