/**
 * Prestige Abaya — unified Supabase access for all pages.
 * Requires: @supabase/supabase-js, supabase.config.js → window.SUPABASE_CONFIG
 *
 * Usage:
 *   const { data } = await getProducts();
 *   await addProduct({ product_name: 'عباية سوداء', price: 120, stock_quantity: 10 });
 *   await saveSale({ product_name: 'عباية سوداء', quantity: 1, price: 120 });
 */
(function (global) {
  'use strict';

  const AUTH_STORAGE_KEY = 'prestige-abaya-supabase-auth';
  const TENANT_STORAGE_KEY = 'current_tenant_id';
  const INSUFFICIENT_STOCK_MSG = 'عفواً، الكمية غير كافية!';

  /** @type {import('@supabase/supabase-js').SupabaseClient | null} */
  let _client = null;
  let _configKey = null;

  function getConfig() {
    return global.SUPABASE_CONFIG || {};
  }

  function buildConfigKey() {
    const cfg = getConfig();
    return `${cfg.url || ''}|${cfg.anonKey || ''}`;
  }

  function isConfigured() {
    const cfg = getConfig();
    return !!(cfg.url && cfg.anonKey && cfg.enabled !== false);
  }

  function resolveTenantId() {
    try {
      const stored = global.localStorage?.getItem(TENANT_STORAGE_KEY);
      if (stored && String(stored).trim()) return String(stored).trim();
    } catch (_) { /* ignore */ }
    const cfg = getConfig();
    return cfg.defaultTenantId ? String(cfg.defaultTenantId).trim() : null;
  }

  function normalizeProductName(name) {
    return String(name ?? '').replace(/\s+/g, ' ').trim();
  }

  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function isInsufficientStockMessage(message) {
    const msg = String(message || '');
    return msg.includes('غير كافية') || msg.includes('INSUFFICIENT_STOCK');
  }

  /**
   * Singleton Supabase client (createClient).
   * @returns {import('@supabase/supabase-js').SupabaseClient | null}
   */
  function getClient() {
    if (!isConfigured()) return null;

    const key = buildConfigKey();
    if (_client && _configKey === key) return _client;

    if (typeof global.supabase === 'undefined' || !global.supabase.createClient) {
      console.warn('[DbHelper] Load https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      return null;
    }

    const cfg = getConfig();
    _client = global.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: AUTH_STORAGE_KEY,
      },
    });
    _configKey = key;
    return _client;
  }

  /**
   * Inventory catalog — id, product_name, price (from selling_price), stock_quantity only.
   * @returns {Promise<{ ok: boolean, data?: Array<{id, product_name, price, stock_quantity}>, error?: string }>}
   */
  async function getProducts() {
    const client = getClient();
    if (!client) {
      return { ok: false, data: [], error: 'Supabase غير مهيأ — راجع supabase.config.js' };
    }

    let query = client
      .from('inventory')
      .select('id, product_name, selling_price, stock_quantity');

    const tenantId = resolveTenantId();
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query.order('product_name', { ascending: true });

    if (error) return { ok: false, data: [], error: error.message };

    return {
      ok: true,
      data: (data || []).map((row) => ({
        id: row.id,
        product_name: normalizeProductName(row.product_name) || '—',
        price: roundMoney(row.selling_price),
        stock_quantity: Math.max(0, parseInt(row.stock_quantity, 10) || 0),
      })),
    };
  }

  /**
   * Add inventory row — product_name, price (selling_price), stock_quantity only.
   * @param {{ product_name: string, price: number, stock_quantity: number, tenant_id?: string }} item
   */
  async function addProduct(item) {
    const client = getClient();
    if (!client) {
      return { ok: false, error: 'Supabase غير مهيأ — راجع supabase.config.js' };
    }

    const productName = normalizeProductName(item?.product_name);
    const price = roundMoney(item?.price);
    const stockQuantity = Math.max(0, parseInt(item?.stock_quantity, 10) || 0);

    if (!productName) {
      return { ok: false, error: 'اسم المنتج مطلوب', code: 'MISSING_PRODUCT_NAME' };
    }

    const tenantId = item?.tenant_id ? String(item.tenant_id).trim() : resolveTenantId();
    const row = {
      product_name: productName,
      selling_price: price,
      stock_quantity: stockQuantity,
    };
    if (tenantId) row.tenant_id = tenantId;

    const { data, error } = await client
      .from('inventory')
      .insert(row)
      .select('id, product_name, selling_price, stock_quantity')
      .single();

    if (error) return { ok: false, error: error.message };

    return {
      ok: true,
      data: {
        id: data.id,
        product_name: normalizeProductName(data.product_name),
        price: roundMoney(data.selling_price),
        stock_quantity: Math.max(0, parseInt(data.stock_quantity, 10) || 0),
      },
    };
  }

  /**
   * Record a sale via insert_sale_with_inventory (product_name, quantity, price + tenant_id).
   * @param {{ product_name: string, quantity: number, price: number, tenant_id?: string }} sale
   * @returns {Promise<{ ok: boolean, data?: object, error?: string, code?: string }>}
   */
  async function saveSale(sale) {
    const client = getClient();
    if (!client) {
      return { ok: false, error: 'Supabase غير مهيأ — راجع supabase.config.js' };
    }

    const productName = normalizeProductName(sale?.product_name);
    const quantity = Math.max(1, parseInt(sale?.quantity, 10) || 1);
    const price = roundMoney(sale?.price);

    if (!productName) {
      return { ok: false, error: 'اسم المنتج مطلوب', code: 'MISSING_PRODUCT_NAME' };
    }

    const tenantId = sale?.tenant_id ? String(sale.tenant_id).trim() : resolveTenantId();
    if (!tenantId) {
      return {
        ok: false,
        error: 'tenant_id غير مضبوط في supabase.config.js',
        code: 'MISSING_TENANT_ID',
      };
    }

    const now = new Date().toISOString();
    const payload = {
      id: String(Date.now() + Math.floor(Math.random() * 1000)),
      product_name: productName,
      quantity,
      price,
      line_total_aud: roundMoney(price * quantity),
      tenant_id: tenantId,
      created_at: now,
      updated_at: now,
      customer_name: 'POS Guest',
      customer: 'POS Guest',
      created_by: 'guest',
      status: 'completed',
    };

    const { data, error } = await client.rpc('insert_sale_with_inventory', {
      p_sale: payload,
    });

    if (error) {
      const msg = error.message || 'Database error';
      return {
        ok: false,
        error: isInsufficientStockMessage(msg) ? INSUFFICIENT_STOCK_MSG : msg,
        code: isInsufficientStockMessage(msg) ? 'INSUFFICIENT_STOCK' : undefined,
      };
    }

    const inserted = typeof data === 'string' ? JSON.parse(data) : data;
    return { ok: true, data: inserted };
  }

  const DbHelper = {
    getClient,
    getProducts,
    addProduct,
    saveSale,
    resolveTenantId,
    isConfigured,
  };

  global.DbHelper = DbHelper;
  global.getProducts = getProducts;
  global.addProduct = addProduct;
  global.saveSale = saveSale;
})(typeof window !== 'undefined' ? window : global);
