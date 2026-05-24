/**
 * Prestige Abaya — Automation Center
 * Requires: purchase_orders table, ai_alerts delete policy — see supabase/migrate-purchase-orders.sql
 */
(function (global) {
  'use strict';

  const TENANT_STORAGE_KEY = 'current_tenant_id';
  const LAST_CLEANUP_KEY = 'prestige_automation_last_cleanup';
  const CLEANUP_AGE_DAYS = 30;
  const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000;
  const REORDER_CHECK_INTERVAL_MS = 60 * 60 * 1000;

  let loopStarted = false;
  let reorderTimer = null;
  let dailyTimer = null;

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

  function normalizeName(name) {
    return String(name ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function cutoffIso(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  }

  function suggestedReorderQty(item) {
    const stock = Math.max(0, parseInt(item.stock_quantity, 10) || 0);
    const min = Math.max(1, parseInt(item.min_threshold, 10) || 5);
    const deficit = Math.max(0, min - stock);
    return Math.max(min, deficit + min);
  }

  /**
   * Delete ai_alerts older than 30 days for current tenant.
   */
  async function runDailyCleanup() {
    const client = getClient();
    if (!client) {
      return { ok: false, error: 'Supabase غير مهيأ', deletedCount: 0 };
    }

    const tenantId = resolveTenantId();
    const before = cutoffIso(CLEANUP_AGE_DAYS);

    let query = client.from('ai_alerts').delete().lt('created_at', before);
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query.select('id');

    if (error) {
      return { ok: false, error: error.message, deletedCount: 0 };
    }

    const deletedCount = Array.isArray(data) ? data.length : 0;
    console.info('[Automation] Cleaned ai_alerts older than', CLEANUP_AGE_DAYS, 'days:', deletedCount);

    try {
      global.localStorage?.setItem(LAST_CLEANUP_KEY, String(Date.now()));
    } catch (_) { /* ignore */ }

    return { ok: true, deletedCount, cutoff: before };
  }

  async function hasPendingReorder(client, tenantId, productName) {
    let query = client
      .from('purchase_orders')
      .select('id')
      .eq('product_name', productName)
      .eq('status', 'pending')
      .eq('source', 'auto_reorder')
      .limit(1);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
    if (error) return { ok: false, exists: false, error: error.message };
    return { ok: true, exists: (data || []).length > 0 };
  }

  /**
   * Auto reorder when best-selling product is low stock.
   */
  async function autoReorderStock() {
    const client = getClient();
    if (!client) {
      return { ok: false, error: 'Supabase غير مهيأ', orders: [] };
    }

    if (typeof global.AIEngine?.predictBestSellingProduct !== 'function') {
      return { ok: false, error: 'AIEngine غير متاح', orders: [] };
    }
    if (typeof global.InventoryManager?.checkStockLevels !== 'function') {
      return { ok: false, error: 'InventoryManager غير متاح', orders: [] };
    }

    const prediction = await global.AIEngine.predictBestSellingProduct();
    if (!prediction?.product) {
      return { ok: true, skipped: true, reason: 'NO_PREDICTION', orders: [] };
    }

    const stockRes = await global.InventoryManager.checkStockLevels();
    if (!stockRes.ok) {
      return { ok: false, error: stockRes.error || 'فشل فحص المخزون', orders: [] };
    }

    const target = normalizeName(prediction.product);
    const item = (stockRes.lowStock || stockRes.data || []).find(
      (row) => normalizeName(row.product_name) === target
    ) || (stockRes.data || []).find(
      (row) => normalizeName(row.product_name) === target && row.isLow
    );

    if (!item || !item.isLow) {
      return {
        ok: true,
        skipped: true,
        reason: 'BEST_SELLER_NOT_LOW',
        bestProduct: prediction.product,
        orders: [],
      };
    }

    const tenantId = resolveTenantId(item.tenant_id);
    if (!tenantId) {
      return { ok: false, error: 'tenant_id غير مضبوط', orders: [] };
    }

    const productName = String(item.product_name || prediction.product).trim();
    const pending = await hasPendingReorder(client, tenantId, productName);
    if (!pending.ok) {
      return { ok: false, error: pending.error, orders: [] };
    }
    if (pending.exists) {
      return {
        ok: true,
        skipped: true,
        reason: 'PENDING_ORDER_EXISTS',
        bestProduct: productName,
        orders: [],
      };
    }

    const quantityOrdered = suggestedReorderQty(item);
    const notes = `إعادة توريد تلقائية — الأكثر مبيعاً (${prediction.totalSold || 0} وحدة مباعة) · مخزون ${item.stock_quantity}/${item.min_threshold}`;

    const { data, error } = await client
      .from('purchase_orders')
      .insert({
        tenant_id: tenantId,
        inventory_id: item.id || null,
        product_name: productName,
        quantity_ordered: quantityOrdered,
        status: 'pending',
        source: 'auto_reorder',
        notes,
      })
      .select('id, product_name, quantity_ordered, status, created_at')
      .single();

    if (error) {
      return { ok: false, error: error.message, orders: [] };
    }

    console.info('[Automation] Auto reorder created:', productName, quantityOrdered);

    if (global.InventoryManager?.triggerReorderAlert) {
      await global.InventoryManager.triggerReorderAlert(item);
    }

    return {
      ok: true,
      bestProduct: productName,
      orders: [data],
    };
  }

  function shouldRunDailyCleanup() {
    try {
      const last = global.localStorage?.getItem(LAST_CLEANUP_KEY);
      if (!last) return true;
      return Date.now() - parseInt(last, 10) >= DAILY_INTERVAL_MS;
    } catch (_) {
      return true;
    }
  }

  async function runScheduledTasks() {
    if (shouldRunDailyCleanup()) {
      await runDailyCleanup();
    }
    await autoReorderStock();
  }

  /**
   * Start automation loop on app load (daily cleanup + hourly reorder check).
   */
  function initializeAutomationLoop() {
    if (loopStarted) return;
    loopStarted = true;

    const cfg = global.SUPABASE_CONFIG || {};
    if (cfg.enabled === false) {
      console.info('[Automation] Skipped — Supabase disabled in config');
      return;
    }

    void runScheduledTasks();

    dailyTimer = global.setInterval(() => {
      if (shouldRunDailyCleanup()) void runDailyCleanup();
    }, DAILY_INTERVAL_MS);

    reorderTimer = global.setInterval(() => {
      void autoReorderStock();
    }, REORDER_CHECK_INTERVAL_MS);

    console.info('[Automation] Loop started');
  }

  function stopAutomationLoop() {
    if (dailyTimer) global.clearInterval(dailyTimer);
    if (reorderTimer) global.clearInterval(reorderTimer);
    dailyTimer = null;
    reorderTimer = null;
    loopStarted = false;
  }

  const AutomationCenter = {
    runDailyCleanup,
    autoReorderStock,
    initializeAutomationLoop,
    stopAutomationLoop,
    CLEANUP_AGE_DAYS,
    DAILY_INTERVAL_MS,
    REORDER_CHECK_INTERVAL_MS,
  };

  global.AutomationCenter = AutomationCenter;

  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        global.addEventListener('prestige-app-ready', () => initializeAutomationLoop(), { once: true });
        global.setTimeout(initializeAutomationLoop, 5000);
      });
    } else {
      global.addEventListener('prestige-app-ready', () => initializeAutomationLoop(), { once: true });
      global.setTimeout(initializeAutomationLoop, 5000);
    }
  }

  boot();
})(typeof window !== 'undefined' ? window : global);
