/**
 * Prestige Abaya — Core Engine (Production)
 * Unified: DashboardService + InventoryManager + SalesLogic
 * Tables: profiles, sales, inventory, expenses
 */
(function (global) {
  'use strict';

  const BRANCH_STORAGE_KEY = 'current_branch_id';
  const TENANT_STORAGE_KEY = 'current_tenant_id';
  const AUTH_STORAGE_KEY = 'prestige-abaya-supabase-auth';
  const INSUFFICIENT_STOCK_MSG = 'عفواً، الكمية غير كافية!';
  const CORE_TABLES_REQUIRED = ['sales', 'inventory', 'expenses'];
  const CORE_TABLES_OPTIONAL = ['profiles', 'ai_alerts', 'customer_feedback'];
  const CORE_TABLES = [...CORE_TABLES_REQUIRED, ...CORE_TABLES_OPTIONAL];
  const TABLES_USE_TENANT_ONLY = new Set(['sales', 'inventory', 'expenses']);

  /** @type {Record<string, boolean | undefined>} */
  const _tableAvailability = {};
  /** حدّ التنبيه على لوحة التحكم — أقل من هذه القطع */
  const STOCK_ALERT_THRESHOLD = 5;

  let _coreClient = null;
  let _coreConfigKey = null;
  let _initPromise = null;

  /** Country tax presets (extend as needed) */
  const TAX_BY_COUNTRY = {
    AU: { name: 'GST', rate: 0.1, inclusive: false },
    SA: { name: 'VAT', rate: 0.15, inclusive: false },
    AE: { name: 'VAT', rate: 0.05, inclusive: false },
    US: { name: 'Sales Tax', rate: 0.08, inclusive: false },
    GB: { name: 'VAT', rate: 0.2, inclusive: false },
    EU: { name: 'VAT', rate: 0.21, inclusive: false },
  };

  function getConfig() {
    return global.SUPABASE_CONFIG || {};
  }

  /**
   * دمج متغيرات البيئة مع supabase.config.js
   * يدعم: window.__PRESTIGE_ENV__, meta tags, أو SUPABASE_CONFIG مباشرة
   */
  function loadEnvConfig() {
    const env = global.__PRESTIGE_ENV__ || global.ENV || {};
    const cfg = { ...(global.SUPABASE_CONFIG || {}) };
    const metaUrl = global.document?.querySelector?.('meta[name="supabase-url"]')?.content;
    const metaKey = global.document?.querySelector?.('meta[name="supabase-anon-key"]')?.content;

    const url =
      env.SUPABASE_URL ||
      env.VITE_SUPABASE_URL ||
      metaUrl ||
      cfg.url;
    const anonKey =
      env.SUPABASE_ANON_KEY ||
      env.VITE_SUPABASE_ANON_KEY ||
      metaKey ||
      cfg.anonKey;

    if (url) cfg.url = String(url).trim();
    if (anonKey) cfg.anonKey = String(anonKey).trim();
    if (env.DEFAULT_TENANT_ID) cfg.defaultTenantId = String(env.DEFAULT_TENANT_ID).trim();
    if (env.DEFAULT_BRANCH_ID) cfg.defaultBranchId = String(env.DEFAULT_BRANCH_ID).trim();
    if (env.DEFAULT_COUNTRY_CODE) cfg.defaultCountryCode = String(env.DEFAULT_COUNTRY_CODE).trim();
    if (cfg.enabled == null) cfg.enabled = true;

    global.SUPABASE_CONFIG = cfg;
    return cfg;
  }

  function isConfigured() {
    loadEnvConfig();
    const cfg = getConfig();
    return !!(cfg.url && cfg.anonKey && cfg.enabled !== false);
  }

  function buildConfigKey() {
    const cfg = getConfig();
    return `${cfg.url || ''}|${cfg.anonKey || ''}`;
  }

  function normalizeProductName(name) {
    return String(name ?? '').replace(/\s+/g, ' ').trim();
  }

  function isInsufficientStockMessage(message) {
    const msg = String(message || '');
    return msg.includes('غير كافية') || msg.includes('INSUFFICIENT_STOCK');
  }

  function resolveTenantId() {
    try {
      const stored = global.localStorage?.getItem(TENANT_STORAGE_KEY);
      if (stored && String(stored).trim()) return String(stored).trim();
    } catch (_) { /* ignore */ }
    const cfg = getConfig();
    return cfg.defaultTenantId ? String(cfg.defaultTenantId).trim() : null;
  }

  /**
   * Branch / store scope — prefers current_branch_id, falls back to tenant (branch = tenant in ERP).
   */
  function resolveBranchId(explicit) {
    if (explicit != null && String(explicit).trim()) {
      return String(explicit).trim();
    }
    try {
      const stored = global.localStorage?.getItem(BRANCH_STORAGE_KEY);
      if (stored && String(stored).trim()) return String(stored).trim();
    } catch (_) { /* ignore */ }
    const cfg = getConfig();
    if (cfg.defaultBranchId) return String(cfg.defaultBranchId).trim();
    return resolveTenantId();
  }

  function getClient() {
    loadEnvConfig();
    if (!isConfigured()) return null;

    const key = buildConfigKey();
    if (_coreClient && _coreConfigKey === key) return _coreClient;

    if (typeof global.supabase === 'undefined' || !global.supabase.createClient) {
      console.warn('[PrestigeCore] Load @supabase/supabase-js@2');
      return null;
    }

    const cfg = getConfig();
    _coreClient = global.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: AUTH_STORAGE_KEY,
      },
    });
    _coreConfigKey = key;
    return _coreClient;
  }

  function roundMoney(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

  function saleLineAmount(row) {
    const line = row?.line_total_aud ?? row?.lineTotalAud;
    if (line != null && Number.isFinite(Number(line))) return Number(line);
    const price = Number(row?.price) || 0;
    const qty = Math.max(1, parseInt(row?.quantity, 10) || 1);
    return roundMoney(price * qty);
  }

  function expenseAmount(row) {
    const fin = row?.financials;
    if (fin && typeof fin === 'object') {
      const aud = fin.audTotal ?? fin.aud_total;
      if (aud != null && Number.isFinite(Number(aud))) return Number(aud);
    }
    const amount = Number(row?.amount_original) || 0;
    const rate = Number(row?.exchange_rate) || 1;
    return roundMoney(amount * rate);
  }

  function isRelationMissingError(error) {
    const msg = String(error?.message || error || '').toLowerCase();
    const code = String(error?.code || '');
    return (
      code === 'PGRST205' ||
      code === '42P01' ||
      (msg.includes('relation') && msg.includes('does not exist')) ||
      (msg.includes('schema cache') && msg.includes('could not find'))
    );
  }

  function extractMissingColumn(error) {
    const msg = String(error?.message || '');
    const patterns = [
      /column ['"]?([\w]+)['"]? does not exist/i,
      /Could not find the ['"]?([\w]+)['"]? column/i,
      /['"]?([\w]+)['"]? column of/i,
    ];
    for (const re of patterns) {
      const m = msg.match(re);
      if (m && m[1]) return m[1];
    }
    return null;
  }

  function isMissingColumnError(error) {
    const msg = String(error?.message || error || '').toLowerCase();
    const code = String(error?.code || '');
    if (code === 'PGRST204' || code === '42703') return true;
    if (msg.includes('column') && (msg.includes('does not exist') || msg.includes('not found'))) {
      return true;
    }
    return msg.includes('branch_id') && msg.includes('column');
  }

  function isSchemaMismatchError(error) {
    return isMissingColumnError(error) || isRelationMissingError(error);
  }

  /**
   * فحص وجود جدول (يُخزَّن في الذاكرة بعد أول طلب).
   */
  async function probeTable(tableName) {
    const name = String(tableName || '').trim();
    if (!name) return false;
    if (_tableAvailability[name] === true) return true;
    if (_tableAvailability[name] === false) return false;

    const client = getClient();
    if (!client) {
      _tableAvailability[name] = false;
      return false;
    }

    const { error } = await client.from(name).select('*').limit(0);
    if (!error) {
      _tableAvailability[name] = true;
      return true;
    }
    if (isRelationMissingError(error)) {
      _tableAvailability[name] = false;
      return false;
    }
    _tableAvailability[name] = true;
    return true;
  }

  function isTableAvailable(tableName) {
    const name = String(tableName || '').trim();
    if (_tableAvailability[name] === false) return false;
    if (_tableAvailability[name] === true) return true;
    return true;
  }

  async function writeRowWithFallback(table, row, selectCols = 'id', writeOpts = {}) {
    const client = getClient();
    if (!client) return fail('NO_CLIENT', 'Supabase غير مهيأ');
    const useUpsert = !!writeOpts.upsert;

    let payload = { ...row };
    for (let i = 0; i < 8; i++) {
      const builder = useUpsert
        ? client.from(table).upsert(payload)
        : client.from(table).insert(payload);
      const { data, error } = await builder.select(selectCols).single();
      if (!error) return { ok: true, data };
      if (isRelationMissingError(error)) {
        _tableAvailability[table] = false;
        return fail('TABLE_MISSING', error.message);
      }
      if (!isMissingColumnError(error)) {
        return fail('INSERT_ERROR', error.message);
      }
      const col = extractMissingColumn(error);
      if (col && Object.prototype.hasOwnProperty.call(payload, col)) {
        delete payload[col];
        continue;
      }
      return fail('INSERT_ERROR', error.message);
    }
    return fail('INSERT_ERROR', 'تعذّر مطابقة أعمدة الجدول');
  }

  function fail(code, message, extra = {}) {
    return { ok: false, code, error: message, ...extra };
  }

  /**
   * Apply branch_id filter; on missing column, retry with tenant_id.
   * @param {import('@supabase/supabase-js').PostgrestFilterBuilder} query
   */
  async function runScopedQuery(buildQuery, branchId, queryMeta = {}) {
    const client = getClient();
    if (!client) {
      return { ok: false, error: 'Supabase غير مهيأ — راجع supabase.config.js', data: [] };
    }

    if (!branchId) {
      try {
        const { data, error } = await buildQuery(client, null);
        if (error) return { ok: false, error: error.message, data: [] };
        return { ok: true, data: data || [], scope: 'none' };
      } catch (err) {
        return { ok: false, error: err.message || String(err), data: [] };
      }
    }

    const tableName = queryMeta.tableName || null;
    const tenantOnly = tableName && TABLES_USE_TENANT_ONLY.has(tableName);

    if (!tenantOnly) {
      try {
        let q = buildQuery(client, branchId);
        q = q.eq('branch_id', branchId);
        const { data, error } = await q;
        if (!error) {
          return { ok: true, data: data || [], scope: 'branch_id', branchId };
        }
        if (!isMissingColumnError(error)) {
          return { ok: false, error: error.message, data: [] };
        }
      } catch (err) {
        if (!isMissingColumnError(err)) {
          return { ok: false, error: err.message || String(err), data: [] };
        }
      }
    }

    try {
      let q = buildQuery(client, branchId);
      q = q.eq('tenant_id', branchId);
      const { data, error } = await q;
      if (error) return { ok: false, error: error.message, data: [] };
      return { ok: true, data: data || [], scope: 'tenant_id', branchId };
    } catch (err) {
      return { ok: false, error: err.message || String(err), data: [] };
    }
  }

  /**
   * Load signed-in profile (tenant / branch context).
   */
  async function getProfileContext() {
    const client = getClient();
    if (!client) {
      return fail('NO_CLIENT', 'تعذّر إنشاء عميل Supabase');
    }

    try {
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) {
        return fail('SESSION_ERROR', sessionError.message);
      }

      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        return {
          ok: true,
          authenticated: false,
          branchId: resolveBranchId(),
          profile: null,
        };
      }

      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('id, tenant_id, display_name, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        return fail('PROFILE_ERROR', profileError.message);
      }

      const branchId = profile?.tenant_id
        ? String(profile.tenant_id)
        : resolveBranchId();

      return {
        ok: true,
        authenticated: true,
        branchId: branchId ? String(branchId) : null,
        profile,
      };
    } catch (err) {
      return fail('PROFILE_EXCEPTION', err.message || String(err));
    }
  }

  /**
   * إجمالي الإيرادات من جدول sales.
   * @param {{ branchId?: string }} [options]
   */
  async function getTotalRevenue(options = {}) {
    try {
      const branchId = resolveBranchId(options.branchId);
      const res = await runScopedQuery(
        (client) => client.from('sales').select('line_total_aud, price, quantity, status'),
        branchId,
        { tableName: 'sales' }
      );

      if (!res.ok) {
        return fail('SALES_FETCH_ERROR', res.error || 'فشل جلب المبيعات', { branchId });
      }

      const rows = (res.data || []).filter((r) => String(r.status || 'completed') !== 'returned');
      const totalRevenue = roundMoney(rows.reduce((sum, row) => sum + saleLineAmount(row), 0));

      return {
        ok: true,
        totalRevenue,
        currency: 'AUD',
        salesCount: rows.length,
        branchId: branchId || null,
        scope: res.scope,
      };
    } catch (err) {
      return fail('REVENUE_EXCEPTION', err.message || String(err));
    }
  }

  /**
   * صافي الربح = الإيرادات − المصروفات.
   * @param {{ branchId?: string }} [options]
   */
  async function getNetProfit(options = {}) {
    try {
      const [revenueRes, expensesRes] = await Promise.all([
        getTotalRevenue(options),
        getTotalExpensesInternal(options),
      ]);

      if (!revenueRes.ok) {
        return fail('REVENUE_ERROR', revenueRes.error, { partial: { expenses: expensesRes } });
      }
      if (!expensesRes.ok) {
        return fail('EXPENSES_ERROR', expensesRes.error, { partial: { revenue: revenueRes } });
      }

      const totalRevenue = revenueRes.totalRevenue;
      const totalExpenses = expensesRes.totalExpenses;
      const netProfit = roundMoney(totalRevenue - totalExpenses);

      return {
        ok: true,
        totalRevenue,
        totalExpenses,
        netProfit,
        currency: 'AUD',
        salesCount: revenueRes.salesCount,
        expensesCount: expensesRes.expensesCount,
        branchId: revenueRes.branchId,
        scope: { sales: revenueRes.scope, expenses: expensesRes.scope },
      };
    } catch (err) {
      return fail('NET_PROFIT_EXCEPTION', err.message || String(err));
    }
  }

  async function getTotalExpensesInternal(options = {}) {
    const branchId = resolveBranchId(options.branchId);
    const client = getClient();
    if (!client) {
      return fail('NO_CLIENT', 'Supabase غير مهيأ');
    }

    try {
      const { data, error } = await client
        .from('expenses')
        .select('amount_original, exchange_rate, financials');
      if (error) return fail('EXPENSES_FETCH_ERROR', error.message);
      const rows = data || [];
      return {
        ok: true,
        totalExpenses: roundMoney(rows.reduce((s, r) => s + expenseAmount(r), 0)),
        expensesCount: rows.length,
        branchId: branchId || null,
        scope: 'unscoped',
      };
    } catch (err) {
      return fail('EXPENSES_EXCEPTION', err.message || String(err));
    }
  }

  /**
   * حالة المخزون مع تنبيه بالناقص.
   * @param {{ branchId?: string }} [options]
   */
  async function getInventoryStatus(options = {}) {
    try {
      const branchId = resolveBranchId(options.branchId);
      const res = await runScopedQuery(
        (client) =>
          client
            .from('inventory')
            .select('id, product_name, stock_quantity, min_threshold, selling_price, cost_price'),
        branchId,
        { tableName: 'inventory' }
      );

      if (!res.ok) {
        return fail('INVENTORY_FETCH_ERROR', res.error || 'فشل جلب المخزون', { branchId });
      }

      const items = (res.data || []).map((row) => {
        const stock = Math.max(0, parseInt(row.stock_quantity, 10) || 0);
        const min = Math.max(0, parseInt(row.min_threshold, 10) || 0);
        const isLow = stock < min;
        const isOut = stock === 0;
        return {
          id: row.id,
          product_name: row.product_name,
          stock_quantity: stock,
          min_threshold: min,
          selling_price: Number(row.selling_price) || 0,
          isLow,
          isOut,
          alert: isOut ? 'نفاد' : isLow ? 'منخفض' : 'مكتمل',
        };
      });

      const lowStock = items.filter((i) => i.isLow);
      const outOfStock = items.filter((i) => i.isOut);
      const healthy = items.filter((i) => !i.isLow);

      const stockCheck = items.map((i) => ({
        ...i,
        belowThreshold: i.stock_quantity < STOCK_ALERT_THRESHOLD,
      }));
      const thresholdAlerts = stockCheck.filter((i) => i.belowThreshold);

      return {
        ok: true,
        branchId: branchId || null,
        scope: res.scope,
        total: items.length,
        healthyCount: healthy.length,
        lowCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        lowStock,
        outOfStock,
        alertFlag: thresholdAlerts.length > 0,
        alert_flag: thresholdAlerts.length > 0,
        stockAlertThreshold: STOCK_ALERT_THRESHOLD,
        stockAlertCount: thresholdAlerts.length,
        thresholdAlerts,
        alerts: lowStock.map((i) => ({
          product_name: i.product_name,
          stock_quantity: i.stock_quantity,
          min_threshold: i.min_threshold,
          severity: i.isOut ? 'critical' : 'warning',
          message:
            i.stock_quantity === 0
              ? `نفاد: ${i.product_name}`
              : `مخزون منخفض: ${i.product_name} (${i.stock_quantity}/${i.min_threshold})`,
        })),
      };
    } catch (err) {
      return fail('INVENTORY_EXCEPTION', err.message || String(err));
    }
  }

  /**
   * ملخص ضريبي حسب رمز الدولة (ISO 3166-1 alpha-2).
   * @param {string} countryCode — e.g. AU, SA, AE
   * @param {{ branchId?: string, revenue?: number }} [options]
   */
  async function getTaxSummary(countryCode, options = {}) {
    try {
      const code = String(countryCode || '')
        .trim()
        .toUpperCase();
      if (!code || code.length < 2) {
        return fail('INVALID_COUNTRY', 'countryCode مطلوب (مثال: AU, SA, AE)');
      }

      const preset = TAX_BY_COUNTRY[code];
      if (!preset) {
        return fail('UNKNOWN_COUNTRY', `لا يوجد إعداد ضريبي لـ ${code}`, {
          supported: Object.keys(TAX_BY_COUNTRY),
        });
      }

      let revenue = options.revenue;
      if (revenue == null || !Number.isFinite(Number(revenue))) {
        const revRes = await getTotalRevenue(options);
        if (!revRes.ok) {
          return fail('REVENUE_FOR_TAX_ERROR', revRes.error, { countryCode: code });
        }
        revenue = revRes.totalRevenue;
      } else {
        revenue = roundMoney(revenue);
      }

      const rate = preset.rate;
      let taxAmount;
      let netExclusive;

      if (preset.inclusive) {
        taxAmount = roundMoney(revenue - revenue / (1 + rate));
        netExclusive = roundMoney(revenue - taxAmount);
      } else {
        taxAmount = roundMoney(revenue * rate);
        netExclusive = revenue;
      }

      const grossWithTax = preset.inclusive ? revenue : roundMoney(revenue + taxAmount);

      return {
        ok: true,
        countryCode: code,
        taxName: preset.name,
        taxRate: rate,
        taxRatePercent: roundMoney(rate * 100),
        inclusive: !!preset.inclusive,
        taxableRevenue: netExclusive,
        taxAmount,
        grossWithTax,
        currency: 'AUD',
        branchId: resolveBranchId(options.branchId),
        note: preset.inclusive
          ? 'الإيرادات تفترض شاملة للضريبة'
          : 'الضريبة تُضاف على الإيرادات',
      };
    } catch (err) {
      return fail('TAX_EXCEPTION', err.message || String(err));
    }
  }

  /**
   * فحص مستويات المخزون — تنبيه إذا كانت الكمية أقل من 5 قطع.
   * @param {{ branchId?: string }} [options]
   */
  async function checkStockLevels(options = {}) {
    try {
      const branchId = resolveBranchId(options.branchId);
      const res = await runScopedQuery(
        (client) =>
          client
            .from('inventory')
            .select('id, product_name, stock_quantity, selling_price, last_updated, tenant_id'),
        branchId,
        { tableName: 'inventory' }
      );

      if (!res.ok) {
        return fail('STOCK_CHECK_ERROR', res.error || 'فشل فحص المخزون', { branchId });
      }

      const items = (res.data || []).map((row) => {
        const stock = Math.max(0, parseInt(row.stock_quantity, 10) || 0);
        const needsAlert = stock < STOCK_ALERT_THRESHOLD;
        return {
          id: row.id,
          product_name: row.product_name,
          stock_quantity: stock,
          selling_price: Number(row.selling_price) || 0,
          last_updated: row.last_updated,
          needsAlert,
          alertFlag: needsAlert,
          severity: stock === 0 ? 'critical' : needsAlert ? 'warning' : 'ok',
          message: needsAlert
            ? stock === 0
              ? `نفاد: ${row.product_name}`
              : `تنبيه: ${row.product_name} — ${stock} قطع (أقل من ${STOCK_ALERT_THRESHOLD})`
            : null,
        };
      });

      const alerts = items.filter((i) => i.needsAlert);

      return {
        ok: true,
        branchId: branchId || null,
        scope: res.scope,
        threshold: STOCK_ALERT_THRESHOLD,
        alertFlag: alerts.length > 0,
        alert_flag: alerts.length > 0,
        alertCount: alerts.length,
        total: items.length,
        alerts,
        items,
      };
    } catch (err) {
      return fail('STOCK_CHECK_EXCEPTION', err.message || String(err));
    }
  }

  /**
   * آخر منتجات أُدخلت في المخزون (للوحة الإدخال).
   * @param {{ branchId?: string, limit?: number }} [options]
   */
  async function getRecentInventoryEntries(options = {}) {
    try {
      const branchId = resolveBranchId(options.branchId);
      const limit = Math.min(20, Math.max(1, parseInt(options.limit, 10) || 5));
      const res = await runScopedQuery(
        (client) =>
          client
            .from('inventory')
            .select('id, product_name, stock_quantity, selling_price, last_updated, tenant_id')
            .order('last_updated', { ascending: false })
            .limit(limit),
        branchId,
        { tableName: 'inventory' }
      );

      if (!res.ok) {
        return fail('RECENT_INVENTORY_ERROR', res.error || 'فشل جلب آخر المخزون');
      }

      const rows = res.data || [];

      const recent = rows.map((row) => ({
        id: row.id,
        product_name: row.product_name,
        stock_quantity: Math.max(0, parseInt(row.stock_quantity, 10) || 0),
        selling_price: Number(row.selling_price) || 0,
        last_updated: row.last_updated || row.created_at,
        branch_id: row.tenant_id,
        alertFlag: Math.max(0, parseInt(row.stock_quantity, 10) || 0) < STOCK_ALERT_THRESHOLD,
      }));

      return { ok: true, branchId, scope: res.scope, recent, limit };
    } catch (err) {
      return fail('RECENT_INVENTORY_EXCEPTION', err.message || String(err));
    }
  }

  /** InventoryManager — تنبيه إعادة الطلب */
  async function triggerReorderAlert(item) {
    if (!item) return fail('INVALID_ITEM', 'بيانات المنتج غير صالحة');

    const stock = Math.max(0, parseInt(item.stock_quantity, 10) || 0);
    const min = Math.max(0, parseInt(item.min_threshold, 10) || STOCK_ALERT_THRESHOLD);
    const name = normalizeProductName(item.product_name) || 'منتج';

    if (stock >= min && stock >= STOCK_ALERT_THRESHOLD) {
      return { ok: true, skipped: true, message: 'المخزون ضمن الحد الآمن' };
    }

    const message =
      stock === 0
        ? `نفاد المخزون: ${name} — يلزم إعادة الطلب فوراً`
        : `مخزون منخفض: ${name} (${stock} متبقية) — يلزم إعادة الطلب`;

    const tenantId = resolveTenantId();
    if (global.SupabaseBridge?.logAiAlert && tenantId) {
      await global.SupabaseBridge.logAiAlert({
        tenantId,
        alertType: 'REORDER_NEEDED',
        message,
        tableName: 'inventory',
        recordId: item.id,
        severity: stock === 0 ? 'error' : 'warning',
        metadata: { product_name: name, stock_quantity: stock, min_threshold: min },
      });
    }

    try {
      global.dispatchEvent(
        new CustomEvent('inventory-reorder-alert', {
          detail: { item: { ...item, product_name: name, stock_quantity: stock }, message },
        })
      );
    } catch (_) { /* ignore */ }

    console.warn('[PrestigeCore:Inventory]', message);
    return { ok: true, message };
  }

  async function scanAndAlert() {
    const check = await checkStockLevels();
    if (!check.ok) return { ok: false, error: check.error, alerts: [] };
    const alerts = [];
    for (const item of check.alerts || []) {
      alerts.push({ item, result: await triggerReorderAlert(item) });
    }
    return { ok: true, alerts, alertCount: alerts.length };
  }

  /** SalesLogic — كتالوج ونقطة البيع */
  async function getProducts() {
    const client = getClient();
    if (!client) return fail('NO_CLIENT', 'Supabase غير مهيأ');

    let query = client
      .from('inventory')
      .select('id, product_name, selling_price, stock_quantity');
    const tenantId = resolveTenantId();
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query.order('product_name', { ascending: true });
    if (error) return fail('PRODUCTS_FETCH_ERROR', error.message);

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

  async function addProduct(item) {
    const client = getClient();
    if (!client) return fail('NO_CLIENT', 'Supabase غير مهيأ');

    const productName = normalizeProductName(item?.product_name);
    if (!productName) return fail('MISSING_PRODUCT_NAME', 'اسم المنتج مطلوب');

    const row = {
      product_name: productName,
      selling_price: roundMoney(item?.price),
      stock_quantity: Math.max(0, parseInt(item?.stock_quantity, 10) || 0),
      tenant_id: item?.tenant_id || resolveTenantId() || undefined,
      last_updated: new Date().toISOString(),
    };
    if (!row.tenant_id) delete row.tenant_id;

    const { data, error } = await client
      .from('inventory')
      .insert(row)
      .select('id, product_name, selling_price, stock_quantity')
      .single();

    if (error) return fail('PRODUCT_INSERT_ERROR', error.message);
    return { ok: true, data };
  }

  async function saveSale(sale) {
    const client = getClient();
    if (!client) return fail('NO_CLIENT', 'Supabase غير مهيأ');

    const productName = normalizeProductName(sale?.product_name);
    const quantity = Math.max(1, parseInt(sale?.quantity, 10) || 1);
    const price = roundMoney(sale?.price);
    if (!productName) return fail('MISSING_PRODUCT_NAME', 'اسم المنتج مطلوب');

    const tenantId = sale?.tenant_id || resolveTenantId();
    if (!tenantId) return fail('MISSING_TENANT_ID', 'tenant_id غير مضبوط');

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
      customer_name: sale?.customer_name || 'POS Guest',
      customer: sale?.customer_name || 'POS Guest',
      created_by: sale?.created_by || 'pos',
      status: 'completed',
    };

    const { data, error } = await client.rpc('insert_sale_with_inventory', { p_sale: payload });
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

  /**
   * تهيئة النظام — اتصال Supabase + سلامة الجداول
   */
  async function initializeSystem(options = {}) {
    if (_initPromise && !options.force) return _initPromise;

    _initPromise = (async () => {
      loadEnvConfig();
      const cfg = getConfig();
      const report = {
        ok: false,
        ready: false,
        version: '1.0.0',
        configured: isConfigured(),
        tables: [],
        errors: [],
      };

      if (!report.configured) {
        report.errors.push('Supabase URL/anonKey missing — set __PRESTIGE_ENV__ or supabase.config.js');
        console.warn('[PrestigeCore] Not configured');
        return report;
      }

      const client = getClient();
      if (!client) {
        report.errors.push('Failed to create Supabase client');
        return report;
      }

      for (const table of CORE_TABLES) {
        const optional = CORE_TABLES_OPTIONAL.includes(table);
        const available = await probeTable(table);
        report.tables.push({
          table,
          ok: available,
          optional,
          skipped: !available && optional,
          error: available ? null : 'table not deployed',
        });
        if (!available && !optional) {
          report.errors.push(`${table}: not found or inaccessible`);
        }
      }

      await Promise.all(CORE_TABLES_OPTIONAL.map((t) => probeTable(t)));

      const requiredOk = CORE_TABLES_REQUIRED.every((t) => _tableAvailability[t] === true);
      report.ok = requiredOk;
      report.ready = requiredOk;

      if (requiredOk) {
        console.log(
          '%cSystem Ready',
          'color:#059669;font-weight:700;font-size:14px',
          '— Prestige Abaya Core Engine',
          cfg.url ? new URL(cfg.url).hostname : ''
        );
      } else {
        console.warn('[PrestigeCore] System partial — check tables:', report.tables);
      }

      return report;
    })();

    return _initPromise;
  }

  /**
   * ملخص شامل للوحة التحكم.
   */
  async function getDashboardSnapshot(options = {}) {
    try {
      const [revenue, profit, inventory, profile, stockLevels] = await Promise.all([
        getTotalRevenue(options),
        getNetProfit(options),
        getInventoryStatus(options),
        getProfileContext(),
        checkStockLevels(options),
      ]);

      const country = options.countryCode || getConfig().defaultCountryCode || 'AU';
      const tax = await getTaxSummary(country, options);

      const inventoryMerged =
        inventory && inventory.ok
          ? {
              ...inventory,
              alertFlag: !!(stockLevels?.alertFlag || stockLevels?.alert_flag || inventory.alertFlag),
              alert_flag: !!(stockLevels?.alert_flag || stockLevels?.alertFlag || inventory.alertFlag),
              stockAlertCount:
                stockLevels?.alertCount != null
                  ? stockLevels.alertCount
                  : inventory.stockAlertCount,
              stockAlerts: stockLevels?.alerts || inventory.thresholdAlerts || [],
            }
          : inventory;

      return {
        ok: true,
        profile,
        revenue,
        profit,
        inventory: inventoryMerged,
        stockLevels,
        tax,
      };
    } catch (err) {
      return fail('SNAPSHOT_EXCEPTION', err.message || String(err));
    }
  }

  const FX_TO_AUD = { SAR: 0.405, AED: 0.405, USD: 1.52, AUD: 1, EUR: 1.65 };

  const BRANCH_NORMALIZE = {
    دبي: 'dubai',
    dubai: 'dubai',
    الرياض: 'riyadh',
    riyadh: 'riyadh',
    جدة: 'jeddah',
    jeddah: 'jeddah',
    مكة: 'makkah',
    mecca: 'makkah',
    القصيم: 'qassim',
    الدمام: 'dammam',
    abu: 'abu_dhabi',
    'أبوظبي': 'abu_dhabi',
    'ابوظبي': 'abu_dhabi',
  };

  function normalizeBranchKey(name) {
    if (!name) return null;
    const trimmed = String(name).trim().toLowerCase().replace(/\s+/g, ' ');
    const ar = String(name).trim();
    return BRANCH_NORMALIZE[ar] || BRANCH_NORMALIZE[trimmed] || trimmed;
  }

  function applyBranchFromName(branchName) {
    if (!branchName) return resolveBranchId();
    const key = normalizeBranchKey(branchName);
    const cfg = getConfig();
    const aliases = cfg.branchAliases || {};
    const mapped =
      aliases[key] || aliases[branchName] || aliases[String(branchName).trim()];
    if (mapped) {
      try {
        global.localStorage?.setItem(BRANCH_STORAGE_KEY, String(mapped).trim());
      } catch (_) { /* ignore */ }
      return String(mapped).trim();
    }
    try {
      global.localStorage?.setItem('current_branch_label', String(branchName).trim());
    } catch (_) { /* ignore */ }
    return resolveBranchId();
  }

  function parseNumberToken(token) {
    if (token == null) return null;
    const cleaned = String(token).replace(/,/g, '').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function detectCurrency(text, explicit) {
    if (explicit) return String(explicit).toUpperCase();
    const t = String(text).toLowerCase();
    if (/ريال|ر\.س|sar\b/.test(t)) return 'SAR';
    if (/درهم|aed\b|د\.إ/.test(t)) return 'AED';
    if (/aud\b|د\.أ/.test(t)) return 'AUD';
    if (/\$|usd|دولار/.test(t)) return 'USD';
    return 'SAR';
  }

  function convertToAud(amount, currency) {
    const code = String(currency || 'AUD').toUpperCase();
    const rate = FX_TO_AUD[code] != null ? FX_TO_AUD[code] : 1;
    return roundMoney(Number(amount) * rate);
  }

  function slugifyProduct(name) {
    const t = String(name || '').toLowerCase();
    const parts = [];
    if (/حرير|silk/.test(t)) parts.push('silk');
    if (/مخمل|velvet/.test(t)) parts.push('velvet');
    if (/شيفون|chiffon/.test(t)) parts.push('chiffon');
    if (/عباء|abaya/.test(t)) parts.push('abaya');
    if (parts.length) return parts.join('_');
    return (
      t
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_\u0600-\u06FF]/g, '')
        .slice(0, 48) || 'product'
    );
  }

  function resolveEntryUserId() {
    if (global.SupabaseBridge?.userId) {
      const id = global.SupabaseBridge.userId();
      if (id) return String(id);
    }
    const cfg = getConfig();
    if (cfg.smartEntryUserId) return String(cfg.smartEntryUserId).trim();
    return null;
  }

  function resolveCreatedBy(userId) {
    if (userId) return `user:${userId}`;
    return 'smart-entry';
  }

  const ENTRY_INTENTS = {
    sale: 'sale_update',
    inventory: 'inventory_update',
    expense: 'expense_update',
  };

  function normalizeEntryType(entryTypeOrIntent) {
    const t = String(entryTypeOrIntent || 'sale')
      .trim()
      .toLowerCase();
    if (t === 'inventory_update' || t === 'inventory') return 'inventory';
    if (t === 'expense_update' || t === 'expense') return 'expense';
    if (t === 'sale_update' || t === 'sale') return 'sale';
    return 'sale';
  }

  function intentFromEntryType(entryType) {
    return ENTRY_INTENTS[normalizeEntryType(entryType)] || 'sale_update';
  }

  /**
   * تصنيف ذكي لأمر AI Command Bar — يميّز مبيعات عن مخزون.
   * @param {string} text
   * @returns {{ intent: string, entryType: string, label: string, confidence: number }}
   */
  function classifyCommandIntent(text) {
    const raw = String(text || '').trim();
    if (!raw) {
      return { intent: null, entryType: null, label: 'اكتب أمراً', confidence: 0 };
    }

    if (/مصروف|مصاريف|expense|تكلفة تشغيلية/i.test(raw)) {
      return {
        intent: 'expense_update',
        entryType: 'expense',
        label: 'مصروف · expense_update',
        confidence: 0.92,
      };
    }

    if (
      /^(?:إضافة|add)\s+\d+/i.test(raw) ||
      (/^(?:إضافة|add)\s+/i.test(raw) &&
        !/بعنا|بيعنا|بيع|مبيع|sale|sold/i.test(raw)) ||
      (/مخزون|inventory|stock|زيادة مخزون|إدخال مخزون/i.test(raw) &&
        !/بعنا|بيعنا|بيع|مبيع|sale|sold/i.test(raw))
    ) {
      return {
        intent: 'inventory_update',
        entryType: 'inventory',
        label: 'مخزون · inventory_update',
        confidence: /^(?:إضافة|add)\s+\d+/i.test(raw) ? 0.96 : 0.88,
      };
    }

    if (/بعنا|بيعنا|بيع|مبيع|مبيعة|sale|sold/i.test(raw)) {
      return {
        intent: 'sale_update',
        entryType: 'sale',
        label: 'مبيعات · sale_update',
        confidence: 0.94,
      };
    }

    return {
      intent: 'sale_update',
      entryType: 'sale',
      label: 'مبيعات · sale_update',
      confidence: 0.55,
    };
  }

  function toCommandJson(parsed) {
    const entryType = normalizeEntryType(parsed.entryType || parsed.intent);
    const intent = parsed.intent || intentFromEntryType(entryType);
    return {
      action: intent,
      type: intent,
      entry_type: entryType,
      product: parsed.productSlug || slugifyProduct(parsed.productName),
      product_display: parsed.productName,
      price: parsed.amount,
      currency: parsed.currency,
      quantity: parsed.quantity,
      branch: parsed.branchName || parsed.branchKey || null,
      branch_id: parsed.branchId || null,
      amount_aud: parsed.amountAud,
      timestamp: parsed.recordedAt || null,
      user_id: parsed.userId || null,
    };
  }

  /**
   * رسالة تأكيد بلغة طبيعية للمعاينة الذكية.
   */
  function buildConfirmationMessage(parsed) {
    const entryType = normalizeEntryType(parsed.entryType || parsed.intent);
    const verbs = {
      sale: 'تسجيل مبيعات (sale_update)',
      expense: 'تسجيل مصروف (expense_update)',
      inventory: 'إضافة مخزون (inventory_update)',
    };
    const verb = verbs[entryType] || 'تنفيذ عملية';
    const product = parsed.productName || String(parsed.productSlug || '').replace(/_/g, ' ');
    const curLabel =
      parsed.currency === 'SAR'
        ? 'ريال'
        : parsed.currency === 'AED'
          ? 'درهم'
          : parsed.currency || '';
    const branchPart = parsed.branchName ? ` لفرع ${parsed.branchName}` : '';
    const qtyPart =
      parsed.quantity > 1 ? ` (${parsed.quantity} قطعة)` : '';
    return `النظام فهم أنك تريد ${verb} ${product} بـ ${parsed.amount} ${curLabel}${qtyPart}${branchPart}. هل هذا صحيح؟`;
  }

  function enrichParsedForSave(parsed) {
    const next = { ...parsed };
    if (next.branchName) applyBranchFromName(next.branchName);
    next.branchId = resolveBranchId(next.branchId);
    next.recordedAt = next.recordedAt || new Date().toISOString();
    next.userId = next.userId || resolveEntryUserId();
    if (next.amount != null && (next.amountAud == null || !Number.isFinite(Number(next.amountAud)))) {
      next.amountAud = convertToAud(next.amount, next.currency);
    }
    if (!next.productSlug && next.productName) {
      next.productSlug = slugifyProduct(next.productName);
    }
    return next;
  }

  function aiJsonToParsed(json, rawText) {
    const type = String(json.action || json.type || json.entryType || json.entry_type || 'sale')
      .trim()
      .toLowerCase();
    const entryType = normalizeEntryType(type);
    const intent = ENTRY_INTENTS[entryType] || intentFromEntryType(entryType);
    const productDisplay =
      json.product_display || json.productDisplay || json.product_name || json.product || '';
    const productName = String(productDisplay)
      .replace(/_/g, ' ')
      .trim();
    const amount = parseNumberToken(json.price ?? json.amount);
    const currency = detectCurrency(rawText || '', json.currency);
    const quantity = Math.max(1, parseInt(json.quantity, 10) || 1);
    const branchRaw = json.branch || json.branchName || json.branch_name || null;
    const branchName = branchRaw ? String(branchRaw).trim() : null;

    if (!productName && entryType !== 'expense') {
      return fail('AI_NO_PRODUCT', 'الذكاء الاصطناعي لم يحدد المنتج');
    }
    if (amount == null) {
      return fail('AI_NO_PRICE', 'الذكاء الاصطناعي لم يحدد السعر');
    }

    const parsed = {
      entryType,
      intent,
      productName: productName || String(json.product || 'مصروف').replace(/_/g, ' '),
      productSlug: String(json.product || slugifyProduct(productName)),
      amount,
      amountAud: convertToAud(amount, currency),
      currency,
      quantity,
      branchName,
      branchKey: branchName ? normalizeBranchKey(branchName) : null,
      rawText: rawText || '',
      confidence: json.confidence != null ? Number(json.confidence) : null,
    };
    return { ok: true, parsed };
  }

  function extractJsonFromAiContent(content) {
    const raw = String(content || '').trim();
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) { /* continue */ }
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch (_) { /* ignore */ }
    }
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch (_) { /* ignore */ }
    }
    return null;
  }

  async function callOpenAIParse(text) {
    const cfg = getConfig();
    const apiKey = cfg.openaiApiKey || cfg.openAiApiKey;
    if (!apiKey || String(apiKey).includes('YOUR_')) return null;

    const model = cfg.openaiModel || 'gpt-4o-mini';
    const systemPrompt = [
      'You convert retail ERP voice/text commands into strict JSON only.',
      'Schema: {"type":"sale_update|expense_update|inventory_update","product":"snake_case_slug","product_display":"human label",',
      '"price":number,"currency":"SAR|AED|AUD|USD","quantity":integer,"branch":"city","confidence":0-1}',
      'Examples:',
      '- "بعنا عباءة حرير بـ 800 في الرياض" -> sale, silk_abaya, 800, SAR, Riyadh',
      '- "مصروف شحن 200 دبي" -> expense, shipping, 200, AED, Dubai',
      'No markdown. JSON object only.',
    ].join(' ');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.15,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`OpenAI ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return extractJsonFromAiContent(content);
  }

  /**
   * محاكاة ذكية — تحويل الجملة إلى JSON منظم (بدون API).
   */
  function simulateCommandParse(text) {
    const res = parseNaturalLanguageHeuristic(text);
    if (res.ok && res.parsed) {
      res.message = res.message || buildConfirmationMessage(res.parsed);
      res.source = res.source || 'heuristic';
    }
    return res;
  }

  /**
   * تحليل أمر بلغة طبيعية — OpenAI عند التوفر، وإلا محاكاة ذكية.
   * @param {string} text
   */
  async function parseCommandWithAI(text) {
    const raw = String(text || '').trim();
    if (!raw) return fail('EMPTY_INPUT', 'اكتب الأمر أولاً');

    const cfg = getConfig();
    const preferAi = cfg.openaiApiKey || cfg.openAiApiKey;
    const useAi = cfg.useOpenAIParsing !== false && preferAi;

    if (useAi) {
      try {
        const aiJson = await callOpenAIParse(raw);
        if (aiJson) {
          const built = aiJsonToParsed(aiJson, raw);
          if (built.ok) {
            built.parsed.productSlug =
              built.parsed.productSlug || slugifyProduct(built.parsed.productName);
            return {
              ok: true,
              parsed: built.parsed,
              json: toCommandJson(built.parsed),
              message: buildConfirmationMessage(built.parsed),
              source: 'openai',
            };
          }
        }
      } catch (err) {
        console.warn('[DashboardService] OpenAI fallback to simulation:', err.message || err);
      }
    }

    return simulateCommandParse(raw);
  }

  /**
   * بناء كائن parsed من حقول قابلة للتعديل (Smart Preview).
   */
  function parsedFromEditableFields(fields) {
    const entryType = normalizeEntryType(
      fields.entryType || fields.type || fields.action || 'sale'
    );
    const intent = intentFromEntryType(entryType);
    let amount = parseNumberToken(fields.amount ?? fields.price);
    if (amount == null && entryType === 'inventory') amount = 0;
    if (amount == null) return fail('NO_AMOUNT', 'المبلغ مطلوب');
    const currency = detectCurrency('', fields.currency || 'SAR');
    const productName = String(fields.productName || fields.product_display || fields.product || '')
      .replace(/_/g, ' ')
      .trim();
    const parsed = {
      entryType,
      intent,
      productName: productName || '—',
      productSlug: slugifyProduct(productName || fields.product),
      amount,
      amountAud: convertToAud(amount, currency),
      currency,
      quantity: Math.max(1, parseInt(fields.quantity, 10) || 1),
      branchName: fields.branchName || fields.branch ? String(fields.branchName || fields.branch).trim() : null,
      branchKey: null,
      rawText: fields.rawText || 'edited',
    };
    if (parsed.branchName) parsed.branchKey = normalizeBranchKey(parsed.branchName);
    return {
      ok: true,
      parsed,
      json: toCommandJson(parsed),
      message: buildConfirmationMessage(parsed),
    };
  }

  /**
   * تحليل إدخال بلغة طبيعية (عربي/إنجليزي) — خوارزمية محلية.
   * @param {string} text
   */
  function parseNaturalLanguageHeuristic(text) {
    try {
      const raw = String(text || '').trim();
      if (!raw) return fail('EMPTY_INPUT', 'اكتب وصف العملية أولاً');

      const classified = classifyCommandIntent(raw);
      let entryType = classified.entryType || 'sale';
      const intent = classified.intent || intentFromEntryType(entryType);

      let amount = null;
      let currency = detectCurrency(raw);
      const explicitPrice = raw.match(/بسعر\s*([\d.,]+)\s*(ريال|ر\.س|sar|aud|درهم|aed|usd)?/i);
      if (explicitPrice) {
        amount = parseNumberToken(explicitPrice[1]);
        if (explicitPrice[2]) currency = detectCurrency(raw, explicitPrice[2]);
      }
      if (amount == null) {
        const pricePatterns = [
          /(?:بـ|بمبلغ|مبلغ|سعر|for|at)\s*([\d.,]+)\s*(ريال|ر\.س|sar|aud|درهم|aed|usd|\$)?/i,
          /([\d.,]+)\s*(ريال|ر\.س|sar|aud|درهم|aed|usd)/i,
          /([\d.,]+)\s*(?:\$)/,
        ];
        for (const re of pricePatterns) {
          const m = raw.match(re);
          if (m) {
            amount = parseNumberToken(m[1]);
            if (m[2]) currency = detectCurrency(raw, m[2]);
            if (amount != null) break;
          }
        }
      }

      let quantity = 1;
      const qtyMatch =
        raw.match(/^(?:إضافة|add)\s+(\d+)\s/i) ||
        raw.match(/(?:بعنا|بيعنا|بيع)\s+(\d+)\s*(?:عباء|عباءات|abayas?)/i) ||
        raw.match(/(\d+)\s*(?:عباء|عباءات|abayas?)/i) ||
        raw.match(/(\d+)\s*(?:قطعة|قطع|وحدة|وحدات|x)/i) ||
        raw.match(/(?:كمية|qty|quantity)\s*[:=]?\s*(\d+)/i);
      if (qtyMatch) {
        const q = parseInt(qtyMatch[1], 10);
        if (Number.isFinite(q) && q > 0) quantity = q;
      }

      let branchName = null;
      const branchMatch =
        raw.match(/لفرع\s+([^\d,.]+?)(?=\s+بسعر|\s+بـ|\s+ب\s*\d|$)/i) ||
        raw.match(/(?:في\s+)?فرع\s+([^\d,.]+?)(?=\s+(?:بـ|ب\s*\d|بسعر)|$)/i) ||
        raw.match(/(?:في|in)\s+(الرياض|الدمام|جدة|مكة|دبي|أبوظبي|ابوظبي|القصيم|riyadh|dubai|jeddah)/i) ||
        raw.match(/branch\s+([a-zA-Z\u0600-\u06FF\s]+?)(?=\s|$)/i);
      if (branchMatch) branchName = branchMatch[1].trim();

      let productName = '';
      if (entryType === 'expense') {
        const expMatch = raw.match(/(?:مصروف|مصاريف|expense)\s+(.+?)(?:\s+بـ|\s+ب\s*\d|$)/i);
        productName = (expMatch ? expMatch[1] : raw)
          .replace(/(?:مصروف|مصاريف).*/i, '')
          .trim();
      } else {
        const patterns = [
          /^(?:إضافة|add)\s+\d+\s+(.+?)(?=\s+لفرع|\s+فرع|\s+بسعر|\s+بـ|\s+في\s+فرع|$)/i,
          /(?:بعنا|بيعنا|بيع)\s+(?:\d+\s+)?(.+?)(?:\s+بـ|\s+ب\s*[\d.,]+|\s+فرع|$)/i,
          /(?:إضافة\s+)?(?:مبيعة|مبيعات|بيع|sale)\s+(.+?)(?:\s+بـ|\s+ب\s*\d|\s+في\s+فرع|$)/i,
          /(?:إضافة|add)\s+(.+?)(?:\s+بـ|\s+ب\s*\d|\s+في\s+فرع|$)/i,
          /(?:منتج|مخزون|product)\s+(.+?)(?:\s+بـ|\s+ب\s*\d|\s+في\s+فرع|$)/i,
        ];
        for (const re of patterns) {
          const m = raw.match(re);
          if (m && m[1]) {
            productName = m[1].trim();
            break;
          }
        }
        if (!productName && entryType === 'inventory') {
          const simpleInv = raw.match(/^(?:إضافة|add)\s+\d+\s+(.+?)$/i);
          if (simpleInv) productName = simpleInv[1].trim();
        }
        if (!productName) {
          productName = raw
            .replace(/(?:في\s+)?فرع\s+[^\d,.]+/gi, '')
            .replace(/(?:بـ|بسعر|بمبلغ)\s*[\d.,]+.*/i, '')
            .trim();
        }
      }
      productName = productName
        .replace(/^\d+\s+/, '')
        .replace(/\s+لفرع.*/i, '')
        .replace(/\s+في\s+فرع.*/i, '')
        .replace(/\s+بسعر\s*[\d.,]+.*/i, '')
        .replace(/\s+بـ\s*[\d.,]+.*/i, '')
        .replace(/^(?:مخزون|منتج)\s+/i, '')
        .trim();

      if (!productName && entryType !== 'expense') {
        return fail('NO_PRODUCT', 'لم أتعرف على اسم المنتج — حدّد المنتج بوضوح');
      }
      if (amount == null && entryType === 'inventory') {
        amount = 0;
        currency = currency || 'SAR';
      }
      if (amount == null) {
        return fail('NO_AMOUNT', 'لم أتعرف على المبلغ — أضف السعر (مثال: بـ 500 ريال)');
      }

      const amountAud = convertToAud(amount, currency);
      const branchKey = branchName ? normalizeBranchKey(branchName) : null;

      const parsed = {
        entryType,
        intent,
        productName: productName || 'مصروف',
        productSlug: slugifyProduct(productName),
        amount,
        amountAud,
        currency,
        quantity,
        branchName,
        branchKey,
        rawText: raw,
      };

      return {
        ok: true,
        parsed,
        json: toCommandJson(parsed),
        message: buildConfirmationMessage(parsed),
        intent,
        classification: classified,
      };
    } catch (err) {
      return fail('PARSE_EXCEPTION', err.message || String(err));
    }
  }

  /**
   * تحليل إدخال بلغة طبيعية — OpenAI عند التوفر، وإلا الخوارزمية المحلية.
   * @param {string} text
   * @returns {Promise<{ok:boolean, parsed?:object, json?:object, message?:string, source?:string, error?:string}>}
   */
  async function parseNaturalLanguageEntry(text) {
    return parseCommandWithAI(text);
  }

  async function insertSaleRecord(parsed) {
    const bridge = global.SupabaseBridge;
    const qty = Math.max(1, parseInt(parsed.quantity, 10) || 1);
    const lineTotalAud = roundMoney(parsed.amountAud);
    const price = roundMoney(lineTotalAud / qty);
    const tenantId = resolveTenantId();
    const branchId = parsed.branchId || applyBranchFromName(parsed.branchName) || resolveBranchId();
    const ts = parsed.recordedAt || new Date().toISOString();
    const userId = parsed.userId || resolveEntryUserId();
    const createdBy = resolveCreatedBy(userId);

    const sale = {
      product_name: parsed.productName,
      productName: parsed.productName,
      price,
      quantity: qty,
      line_total_aud: lineTotalAud,
      lineTotalAud: lineTotalAud,
      customer_name: 'Smart Entry',
      customerName: 'Smart Entry',
      status: 'completed',
      created_by: createdBy,
      createdBy,
      user_id: userId || undefined,
      userId: userId || undefined,
      created_at: ts,
      createdAt: ts,
      updated_at: ts,
      invoice_number: parsed.branchName ? `BR:${parsed.branchName}` : '',
      tenant_id: tenantId,
      tenantId,
    };

    if (bridge?.insertSale) {
      const res = await bridge.insertSale(sale);
      if (res?.ok && typeof bridge.notifySalesDashboardRefresh === 'function') {
        bridge.notifySalesDashboardRefresh();
      }
      return res?.ok
        ? { ok: true, table: 'sales', id: res.id, data: res }
        : fail('SALE_INSERT_ERROR', res?.error || 'فشل حفظ المبيعة');
    }

    const client = getClient();
    if (!client) return fail('NO_CLIENT', 'Supabase غير مهيأ');

    const id = Date.now() + Math.floor(Math.random() * 1000);
    const row = {
      id,
      created_at: ts,
      updated_at: ts,
      customer_name: sale.customer_name,
      customer: sale.customer_name,
      product_name: sale.product_name,
      price: sale.price,
      quantity: qty,
      created_by: createdBy,
      line_total_aud: lineTotalAud,
      status: 'completed',
      tenant_id: tenantId,
    };
    if (parsed.branchName) row.invoice_number = sale.invoice_number;

    try {
      const inserted = await writeRowWithFallback('sales', row, 'id');
      if (!inserted.ok) return fail('SALE_INSERT_ERROR', inserted.error);
      return { ok: true, table: 'sales', id: inserted.data?.id };
    } catch (err) {
      return fail('SALE_INSERT_EXCEPTION', err.message || String(err));
    }
  }

  async function insertExpenseRecord(parsed) {
    const client = getClient();
    if (!client) return fail('NO_CLIENT', 'Supabase غير مهيأ');

    const amountAud = roundMoney(parsed.amountAud);
    const rate =
      parsed.currency === 'AUD'
        ? 1
        : roundMoney(amountAud / Math.max(parsed.amount, 1));

    const userId = parsed.userId || resolveEntryUserId();
    const createdBy = resolveCreatedBy(userId);
    const cfg = getConfig();
    const skipAuth = cfg.skipAuth === true;

    const row = {
      id: `exp-${Date.now()}`,
      name: parsed.productName || 'مصروف',
      category: 'general',
      currency: parsed.currency || 'SAR',
      amount_original: roundMoney(parsed.amount),
      exchange_rate: rate,
      financials: {
        audTotal: amountAud,
        recordedAt: parsed.recordedAt,
        userId: userId || null,
      },
      created_at: parsed.recordedAt || new Date().toISOString(),
      created_by: createdBy,
    };
    if (userId && !skipAuth) row.user_id = userId;

    try {
      const inserted = await writeRowWithFallback('expenses', row, 'id');
      if (!inserted.ok) return fail('EXPENSE_INSERT_ERROR', inserted.error);
      return { ok: true, table: 'expenses', id: inserted.data?.id };
    } catch (err) {
      return fail('EXPENSE_INSERT_EXCEPTION', err.message || String(err));
    }
  }

  /**
   * إضافة صنف إلى جدول inventory (إدارة المخزون والمنتجات).
   * @param {string} productName
   * @param {number|string} quantity
   * @param {string} [branch] — اسم الفرع
   * @param {number|string} price
   */
  async function addInventoryItem(productName, quantity, branch, price) {
    const name = String(productName || '').trim();
    if (!name) return fail('NO_PRODUCT', 'اسم المنتج مطلوب');

    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    const amount = parseNumberToken(price);
    if (amount == null) return fail('NO_PRICE', 'سعر البيع مطلوب');

    const parsed = enrichParsedForSave({
      entryType: 'inventory',
      intent: 'inventory_update',
      productName: name,
      productSlug: slugifyProduct(name),
      quantity: qty,
      branchName: branch ? String(branch).trim() : null,
      amount,
      currency: detectCurrency(String(price || ''), 'SAR'),
      amountAud: convertToAud(amount, detectCurrency(String(price || ''), 'SAR')),
      rawText: 'addInventoryItem',
    });

    const saved = await insertInventoryRecord(parsed);
    if (!saved.ok) return saved;

    const stock = await checkStockLevels({ branchId: parsed.branchId });
    return {
      ok: true,
      parsed,
      saved,
      stockLevels: stock,
      json: toCommandJson(parsed),
    };
  }

  async function insertInventoryRecord(parsed) {
    const bridge = global.SupabaseBridge;
    const product = {
      name: parsed.productName,
      price: roundMoney(parsed.amount),
      cost: 0,
      quantity: Math.max(0, parseInt(parsed.quantity, 10) || 0),
      tenantId: resolveTenantId(),
    };

    if (bridge?.upsertInventory) {
      const res = await bridge.upsertInventory(product);
      return res?.ok
        ? { ok: true, table: 'inventory', id: res.id }
        : fail('INVENTORY_UPSERT_ERROR', res?.error || 'فشل حفظ المخزون');
    }

    const client = getClient();
    if (!client) return fail('NO_CLIENT', 'Supabase غير مهيأ');

    const userId = parsed.userId || resolveEntryUserId();
    const createdBy = resolveCreatedBy(userId);
    const tenantId = resolveTenantId();
    const row = {
      product_name: product.name,
      selling_price: product.price,
      cost_price: 0,
      stock_quantity: product.quantity,
      tenant_id: tenantId || undefined,
      last_updated: parsed.recordedAt || new Date().toISOString(),
    };

    try {
      const inserted = await writeRowWithFallback('inventory', row, 'id', { upsert: true });
      if (!inserted.ok) return fail('INVENTORY_UPSERT_ERROR', inserted.error);
      return { ok: true, table: 'inventory', id: inserted.data?.id };
    } catch (err) {
      return fail('INVENTORY_UPSERT_EXCEPTION', err.message || String(err));
    }
  }

  async function saveParsedEntry(parsed) {
    if (!parsed || (!parsed.entryType && !parsed.intent)) {
      return fail('INVALID_PARSED', 'بيانات غير صالحة');
    }
    const enriched = enrichParsedForSave({
      ...parsed,
      entryType: normalizeEntryType(parsed.entryType || parsed.intent),
      intent: parsed.intent || intentFromEntryType(parsed.entryType),
    });

    if (enriched.entryType === 'sale') return insertSaleRecord(enriched);
    if (enriched.entryType === 'expense') return insertExpenseRecord(enriched);
    if (enriched.entryType === 'inventory') return insertInventoryRecord(enriched);
    return fail('UNKNOWN_TYPE', 'نوع العملية غير معروف');
  }

  /**
   * حفظ إدخال مؤكّد — يُستدعى من data-entry بعد Smart Preview.
   * @param {object} entry — parsed object أو JSON { action, product, price, branch, ... }
   */
  async function saveEntry(entry) {
    try {
      let parsed = entry;
      if (!parsed || typeof parsed !== 'object') {
        return fail('INVALID_ENTRY', 'بيانات الإدخال غير صالحة');
      }

      if (parsed.action || (parsed.type && !parsed.entryType)) {
        const built = aiJsonToParsed(parsed, parsed.rawText || '');
        if (!built.ok) return built;
        parsed = built.parsed;
      } else if (!parsed.entryType) {
        return fail('INVALID_ENTRY', 'نوع العملية (action) مطلوب');
      }

      const saved = await saveParsedEntry(parsed);
      if (!saved.ok) return saved;

      const enriched = enrichParsedForSave(parsed);
      let stockLevels = null;
      if (enriched.entryType === 'inventory') {
        stockLevels = await checkStockLevels({ branchId: enriched.branchId });
      }
      return {
        ok: true,
        parsed: enriched,
        saved,
        json: toCommandJson(enriched),
        message: buildConfirmationMessage(enriched),
        recordedAt: enriched.recordedAt,
        branchId: enriched.branchId,
        stockLevels,
      };
    } catch (err) {
      return fail('SAVE_ENTRY_EXCEPTION', err.message || String(err));
    }
  }

  /**
   * حفظ أمر مُحلَّل مسبقاً (بعد Smart Preview أو التعديل السريع).
   */
  async function submitParsedCommand(parsed) {
    return saveEntry(parsed);
  }

  /**
   * تحليل ثم حفظ — نص خام أو كائن parsed مُعدَّل.
   */
  async function submitNaturalLanguageEntry(textOrParsed) {
    if (textOrParsed && typeof textOrParsed === 'object') {
      return submitParsedCommand(textOrParsed);
    }
    const parsedRes = await parseCommandWithAI(textOrParsed);
    if (!parsedRes.ok) return parsedRes;
    const saved = await saveParsedEntry(parsedRes.parsed);
    if (!saved.ok) return saved;
    return {
      ok: true,
      parsed: parsedRes.parsed,
      saved,
      json: parsedRes.json,
      source: parsedRes.source,
    };
  }

  /**
   * حفظ إدخال يدوي من النموذج التقليدي.
   */
  async function saveManualEntry(fields) {
    const entryType = String(fields?.entryType || 'sale').trim();
    const amount = parseNumberToken(fields?.amount);
    if (amount == null) return fail('NO_AMOUNT', 'المبلغ مطلوب');
    const currency = detectCurrency('', fields?.currency || 'SAR');
    const parsed = {
      entryType,
      productName: String(fields?.productName || '').trim() || '—',
      amount,
      amountAud: convertToAud(amount, currency),
      currency,
      quantity: Math.max(1, parseInt(fields?.quantity, 10) || 1),
      branchName: fields?.branchName ? String(fields.branchName).trim() : null,
      rawText: 'manual',
    };
    const saved = await saveParsedEntry(parsed);
    if (!saved.ok) return saved;
    return { ok: true, parsed, saved };
  }

  function getDefaultCountryCode() {
    const code = getConfig().defaultCountryCode;
    return code && String(code).trim() ? String(code).trim().toUpperCase() : 'AU';
  }

  /** واجهة index.html — KPIs التنفيذية (بدون سكربت مضمّن في HTML) */
  const ExecutiveUI = (function () {
    const KPI_CARD_IDS = [
      'exec-kpi-revenue',
      'exec-kpi-profit',
      'exec-kpi-tax',
      'exec-kpi-inventory',
    ];
    let refreshInFlight = false;

    function formatAud(amount) {
      const n = Number(amount);
      if (!Number.isFinite(n)) return '—';
      return n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    function setKpiCard(cardId, payload) {
      const card = global.document?.getElementById(cardId);
      if (!card) return;
      card.classList.remove('exec-kpi-card--loading');
      card.removeAttribute('aria-busy');
      const val = card.querySelector('.exec-kpi-card__value');
      const delta = card.querySelector('.exec-kpi-card__delta');
      const spinner = card.querySelector('.exec-kpi-spinner');
      if (spinner) spinner.hidden = true;
      if (val) {
        val.hidden = false;
        val.textContent = payload.value != null ? String(payload.value) : '—';
      }
      if (delta) {
        delta.textContent = payload.delta != null ? String(payload.delta) : '';
        delta.classList.toggle('exec-kpi-card__delta--up', !!payload.deltaUp);
        delta.classList.toggle('exec-kpi-card__delta--down', !!payload.deltaDown);
      }
      card.classList.toggle('exec-kpi-card--alert', !!payload.alertFlag);
      card.classList.toggle('exec-kpi-card--error', !!payload.error);
    }

    async function refreshUI() {
      if (refreshInFlight) return;
      refreshInFlight = true;
      const countryCode = getDefaultCountryCode();
      try {
        const snapshot = await getDashboardSnapshot({ countryCode });
        if (!snapshot?.ok) throw new Error(snapshot?.error || 'فشل جلب الملخص');
        const rev = snapshot.revenue;
        const profit = snapshot.profit;
        const tax = snapshot.tax;
        const inv = snapshot.inventory;

        if (rev?.ok) {
          setKpiCard('exec-kpi-revenue', {
            value: formatAud(rev.totalRevenue),
            delta: (rev.salesCount || 0) + ' عملية بيع',
            deltaUp: true,
          });
        }
        if (profit?.ok) {
          setKpiCard('exec-kpi-profit', {
            value: formatAud(profit.netProfit),
            delta: 'مصروفات ' + formatAud(profit.totalExpenses),
            deltaUp: profit.netProfit >= 0,
            deltaDown: profit.netProfit < 0,
          });
        }
        if (tax?.ok) {
          setKpiCard('exec-kpi-tax', {
            value: formatAud(tax.taxAmount),
            delta: tax.taxRatePercent + '% · ' + countryCode,
          });
        }
        if (inv?.ok) {
          const alertCount = Math.max(
            inv.stockAlertCount || 0,
            (inv.lowCount || 0) + (inv.outOfStockCount || 0)
          );
          const hasAlert = !!(inv.alert_flag || inv.alertFlag || alertCount > 0);
          setKpiCard('exec-kpi-inventory', {
            value: String(alertCount),
            unit: 'تنبيه',
            delta: hasAlert ? '⚠ مخزون منخفض' : 'مخزون مستقر',
            alertFlag: hasAlert,
            deltaDown: hasAlert,
          });
        }
        const live = global.document?.getElementById('exec-overview-dashboard-live');
        if (live) live.textContent = '● Live · Supabase';
      } catch (err) {
        KPI_CARD_IDS.forEach((id) =>
          setKpiCard(id, { value: '—', delta: err.message || String(err), error: true })
        );
      } finally {
        refreshInFlight = false;
      }
    }

    function boot() {
      if (global.document?.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', refreshUI);
      } else {
        refreshUI();
      }
    }

    return { refreshUI, boot, KPI_CARD_IDS };
  })();

  /** تصنيف AI Command Bar — data-entry.html */
  const DataEntryClassifier = (function () {
    let classifyTimer = null;

    function applyIntentBadge(result) {
      const badge = global.document?.getElementById('ai-intent-badge');
      const bar = global.document?.getElementById('data-entry-command-bar');
      if (!badge) return;
      badge.textContent = result.label || '—';
      badge.dataset.intent = result.intent || '';
      badge.classList.remove(
        'data-entry-ai-classify__badge--sale',
        'data-entry-ai-classify__badge--inventory',
        'data-entry-ai-classify__badge--expense'
      );
      if (result.intent === 'inventory_update') badge.classList.add('data-entry-ai-classify__badge--inventory');
      else if (result.intent === 'sale_update') badge.classList.add('data-entry-ai-classify__badge--sale');
      else if (result.intent === 'expense_update') badge.classList.add('data-entry-ai-classify__badge--expense');
      if (bar) bar.setAttribute('data-detected-intent', result.intent || '');
    }

    function classify(text) {
      const result = classifyCommandIntent(text);
      applyIntentBadge(result);
      return result;
    }

    function bind() {
      const input = global.document?.getElementById('ai-command-input');
      if (!input) return;
      const schedule = function () {
        clearTimeout(classifyTimer);
        const t = input.value.trim();
        if (!t) return applyIntentBadge({ label: '—', intent: '' });
        classifyTimer = setTimeout(function () {
          classify(t);
        }, 280);
      };
      input.addEventListener('input', schedule);
      input.addEventListener('focus', schedule);
      global.document?.querySelectorAll('.data-entry-mode-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          applyIntentBadge({
            intent: btn.getAttribute('data-intent') || '',
            label: btn.textContent.trim() + ' · ' + (btn.getAttribute('data-intent') || ''),
          });
        });
      });
    }

    function boot() {
      if (global.document?.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', bind);
      } else {
        bind();
      }
    }

    return { classify, bind, boot, applyIntentBadge };
  })();

  const SalesLogic = {
    getProducts,
    addProduct,
    saveSale,
    insertSaleRecord,
    INSUFFICIENT_STOCK_MSG,
  };

  const InventoryManagerAPI = {
    checkStockLevels,
    triggerReorderAlert,
    scanAndAlert,
    addInventoryItem,
    getRecentInventoryEntries,
    STOCK_ALERT_THRESHOLD,
  };

  const DashboardService = {
    initializeSystem,
    loadEnvConfig,
    isConfigured,
    probeTable,
    isTableAvailable,
    isRelationMissingError,
    isSchemaMismatchError,
    getClient,
    resolveBranchId,
    resolveTenantId,
    getProfileContext,
    getTotalRevenue,
    getNetProfit,
    getInventoryStatus,
    checkStockLevels,
    getRecentInventoryEntries,
    addInventoryItem,
    STOCK_ALERT_THRESHOLD,
    getTaxSummary,
    getDashboardSnapshot,
    getDefaultCountryCode,
    parseNaturalLanguageEntry,
    parseNaturalLanguageHeuristic,
    classifyCommandIntent,
    normalizeEntryType,
    intentFromEntryType,
    parseCommandWithAI,
    simulateCommandParse,
    resolveEntryUserId,
    parsedFromEditableFields,
    buildConfirmationMessage,
    enrichParsedForSave,
    saveEntry,
    submitParsedCommand,
    submitNaturalLanguageEntry,
    saveManualEntry,
    saveParsedEntry,
    applyBranchFromName,
    convertToAud,
    slugifyProduct,
    toCommandJson,
    TAX_BY_COUNTRY,
    getProducts,
    addProduct,
    saveSale,
    triggerReorderAlert,
    scanAndAlert,
    ExecutiveUI,
    DataEntryClassifier,
    SalesLogic,
    InventoryManagerAPI,
  };

  const PrestigeCore = {
    ...DashboardService,
    Dashboard: DashboardService,
    Sales: SalesLogic,
    Inventory: InventoryManagerAPI,
  };

  global.PrestigeCore = PrestigeCore;
  global.prestigeCore = PrestigeCore;
  global.DashboardService = DashboardService;
  global.dashboardService = DashboardService;
  global.InventoryManager = InventoryManagerAPI;
  global.SalesLogic = SalesLogic;
  global.DbHelper = {
    getClient,
    getProducts,
    addProduct,
    saveSale,
    resolveTenantId,
    isConfigured: isConfigured,
  };
  global.getProducts = getProducts;
  global.addProduct = addProduct;
  global.saveSale = saveSale;
  global.refreshUI = ExecutiveUI.refreshUI;
  global.updateDashboard = ExecutiveUI.refreshUI;
  global.DataEntryClassifier = DataEntryClassifier;

  loadEnvConfig();
  initializeSystem().catch(function (err) {
    console.warn('[PrestigeCore] initializeSystem:', err.message || err);
  });

  if (global.document) {
    const path = global.location?.pathname || '';
    if (path.includes('index.html') || path.endsWith('/') || path === '') {
      ExecutiveUI.boot();
    }
    if (path.includes('data-entry')) {
      DataEntryClassifier.boot();
    }
  }
})(typeof window !== 'undefined' ? window : global);
