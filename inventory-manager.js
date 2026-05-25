/**
 * @deprecated Use prestige-core.js — shim for legacy script tags
 */
(function (global) {
  'use strict';
  if (global.PrestigeCore?.Inventory || global.InventoryManager) {
    global.InventoryManager = global.PrestigeCore?.Inventory || global.InventoryManager;
  } else {
    console.warn('[inventory-manager.js] Load prestige-core.js before this shim');
  }
})(typeof window !== 'undefined' ? window : global);
