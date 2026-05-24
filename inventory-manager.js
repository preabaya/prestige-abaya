/**
 * Prestige Abaya — Inventory Manager
 * Requires: db-helper.js or supabase-bridge.js, supabase.config.js
 */
(function (global) {
  'use strict';

  const TENANT_STORAGE_KEY = 'current_tenant_id';

  function getClient() {
    if (global.DbHelper?.getClient) return global.DbHelper.getClient();
    if (global.SupabaseBridge?.getClient) return global.SupabaseBridge.getClient();
    return null;
  }

  function resolveTenantId() {
    if (global.DbHelper?.resolveTenantId) return global.DbHelper.resolveTenantId();
    try {
      const stored = global.localStorage?.getItem(TENANT_STORAGE_KEY);
      if (stored && String(stored).trim()) return String(stored).trim();
    } catch (_) { /* ignore */ }
    const cfg = global.SUPABASE_CONFIG || {};
    return cfg.defaultTenantId ? String(cfg.defaultTenantId).trim() : null;
  }

  function normalizeProductName(name) {
    return String(name ?? '').replace(/\s+/g, ' ').trim();
  }

  function mapInventoryRow(row) {
    const stockQuantity = Math.max(0, parseInt(row?.stock_quantity, 10) || 0);
    const minThreshold = Math.max(0, parseInt(row?.min_threshold, 10) || 0);
    return {
      id: row.id,
      product_name: normalizeProductName(row.product_name) || '—',
      stock_quantity: stockQuantity,
      min_threshold: minThreshold,
      isLow: stockQuantity < minThreshold,
      isOut: stockQuantity === 0,
    };
  }

  /**
   * Fetch all inventory rows and flag items below min_threshold.
   * @returns {Promise<{ ok: boolean, data?: object[], lowStock?: object[], error?: string }>}
   */
  async function checkStockLevels() {
    const client = getClient();
    if (!client) {
      return { ok: false, data: [], lowStock: [], error: 'Supabase غير مهيأ — راجع supabase.config.js' };
    }

    let query = client
      .from('inventory')
      .select('id, product_name, stock_quantity, min_threshold, tenant_id');

    const tenantId = resolveTenantId();
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query.order('product_name', { ascending: true });

    if (error) {
      return { ok: false, data: [], lowStock: [], error: error.message };
    }

    const items = (data || []).map(mapInventoryRow);
    const lowStock = items.filter((item) => item.isLow);

    return { ok: true, data: items, lowStock };
  }

  /**
   * Send reorder alert when stock is below min_threshold.
   * @param {{ id, product_name, stock_quantity, min_threshold, isLow?, isOut? }} item
   */
  async function triggerReorderAlert(item) {
    if (!item) {
      return { ok: false, error: 'بيانات المنتج غير صالحة' };
    }

    const stock = Math.max(0, parseInt(item.stock_quantity, 10) || 0);
    const min = Math.max(0, parseInt(item.min_threshold, 10) || 0);
    const name = normalizeProductName(item.product_name) || 'منتج';

    if (stock >= min) {
      return { ok: true, skipped: true, message: 'المخزون ضمن الحد الآمن' };
    }

    const message = stock === 0
      ? `نفاد المخزون: ${name} — يلزم إعادة الطلب فوراً`
      : `مخزون منخفض: ${name} (${stock} متبقية، الحد ${min}) — يلزم إعادة الطلب`;

    const tenantId = resolveTenantId();
    let logged = { ok: false };

    if (typeof global.SupabaseBridge !== 'undefined' && global.SupabaseBridge.logAiAlert && tenantId) {
      logged = await global.SupabaseBridge.logAiAlert({
        tenantId,
        alertType: 'REORDER_NEEDED',
        message,
        tableName: 'inventory',
        recordId: item.id,
        severity: stock === 0 ? 'error' : 'warning',
        metadata: {
          product_name: name,
          stock_quantity: stock,
          min_threshold: min,
        },
      });
    }

    try {
      global.dispatchEvent(
        new CustomEvent('inventory-reorder-alert', { detail: { item: { ...item, product_name: name, stock_quantity: stock, min_threshold: min }, message } })
      );
    } catch (_) { /* ignore */ }

    console.warn('[InventoryManager]', message);

    if (typeof global.Notification !== 'undefined' && global.Notification.permission === 'granted') {
      try {
        new global.Notification('تنبيه مخزون — Prestige Abaya', { body: message });
      } catch (_) { /* ignore */ }
    }

    return { ok: true, message, logged };
  }

  /** Check all rows and fire reorder alerts for low-stock items. */
  async function scanAndAlert() {
    const check = await checkStockLevels();
    if (!check.ok) {
      return { ok: false, error: check.error, data: [], lowStock: [], alerts: [] };
    }

    const alerts = [];
    for (const item of check.lowStock) {
      const result = await triggerReorderAlert(item);
      alerts.push({ item, result });
    }

    return {
      ok: true,
      data: check.data,
      lowStock: check.lowStock,
      alerts,
    };
  }

  const InventoryManager = {
    checkStockLevels,
    triggerReorderAlert,
    scanAndAlert,
  };

  global.InventoryManager = InventoryManager;
})(typeof window !== 'undefined' ? window : global);
