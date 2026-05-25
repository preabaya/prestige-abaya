/**
 * @deprecated Use prestige-core.js — shim for legacy script tags
 */
(function (global) {
  'use strict';
  if (global.PrestigeCore) {
    const core = global.PrestigeCore.Dashboard || global.PrestigeCore;
    global.DashboardService = core;
    global.dashboardService = core;
  } else {
    console.warn('[dashboard-service.js] Load prestige-core.js before this shim');
  }
})(typeof window !== 'undefined' ? window : global);
