/**
 * Prestige Abaya — Supabase bridge (Auth + database)
 * Requires: @supabase/supabase-js loaded before this file
 * Config: supabase.config.js → window.SUPABASE_CONFIG
 *
 * Single shared Supabase client (singleton) — avoids multiple GoTrueClient instances.
 */
const PRESTIGE_SUPABASE_AUTH_STORAGE_KEY = 'prestige-abaya-supabase-auth';
const CURRENT_TENANT_STORAGE_KEY = 'current_tenant_id';

const SECURE_INSERT_TABLES = new Set(['sales', 'products']);
const SALES_ANOMALY_AVG_MULTIPLIER = 3;
const SALES_ANOMALY_RECENT_COUNT = 10;
const SALES_ANOMALY_MIN_SAMPLES = 3;
/** Fixed high-value threshold (AUD) — logs HIGH_VALUE_TRANSACTION to ai_alerts */
const SALES_HIGH_VALUE_THRESHOLD_AUD = 5000;
const INSUFFICIENT_STOCK_MSG = 'عفواً، الكمية غير كافية!';
const ERP_SALES_CHANNEL = 'prestige-erp-sales';

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let _sharedClient = null;
let _sharedConfigKey = null;
/** @type {Promise<{ ok: boolean, user?: object, session?: object, error?: string }> | null} */
let _authReadyPromise = null;

/** Verified public.sales columns — fallback when get_table_columns RPC is unavailable */
const SALES_DB_COLUMNS_FALLBACK = [
  'id',
  'created_at',
  'customer_name',
  'product_name',
  'price',
  'quantity',
  'created_by',
  'updated_at',
  'customer',
  'invoice_number',
  'line_total_aud',
  'batch_id',
  'status',
  'tenant_id',
];

/** @type {Map<string, { columns: string[], fetchedAt: number }>} */
const _tableColumnsCache = new Map();
const TABLE_COLUMNS_CACHE_MS = 5 * 60 * 1000;

const PRODUCTS_DB_COLUMNS = [
  'id',
  'code',
  'name',
  'size',
  'color',
  'style',
  'cost',
  'price',
  'quantity',
  'image',
  'created_at',
  'updated_at',
  'created_by',
  'user_id',
  'tenant_id',
];

function pickDbColumns(row, allowlist) {
  const out = {};
  allowlist.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== undefined) {
      out[key] = row[key];
    }
  });
  return out;
}

function normalizeColumnList(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => (typeof r === 'string' ? r : r?.column_name))
    .filter(Boolean);
}

/**
 * Normalize DB timestamptz (ISO string, Date, epoch ms) for app use.
 * @returns {string|null} ISO 8601 UTC or null
 */
function timestamptzFromDb(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const s = String(value).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Value for Postgres timestamptz columns — ISO 8601 only, or omit (undefined).
 * Never sends locale-specific date strings.
 * @returns {string|undefined}
 */
function roundAud(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function timestamptzForWrite(value) {
  if (value == null || value === '') return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }
  const s = String(value).trim();
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

const SupabaseBridge = {
  timestamptzFromDb,
  timestamptzForWrite,
  get client() {
    return _sharedClient;
  },

  set client(_) {
    /* read-only; use getClient() / init() */
  },

  user: null,

  isConfigured() {
    const cfg = window.SUPABASE_CONFIG || {};
    return !!(cfg.url && cfg.anonKey && cfg.enabled !== false);
  },

  /**
   * Anon-key mode: no getSession / ensureAuth before reads or writes (default: true).
   * Set skipAuth: false in supabase.config.js to re-enable session checks.
   */
  isSkipAuth() {
    const cfg = typeof window !== 'undefined' ? window.SUPABASE_CONFIG || {} : {};
    if (cfg.skipAuth === false) return false;
    if (cfg.skipAuthForSales === false) return false;
    return true;
  },

  isSkipAuthForSales() {
    return this.isSkipAuth();
  },

  /** Client + anon key only — does not call auth.getSession() */
  ensureClientReady() {
    if (!this.isConfigured()) {
      return { ok: false, error: 'Supabase not configured' };
    }
    if (!this.getClient()) {
      return { ok: false, error: 'Supabase client unavailable' };
    }
    return { ok: true, authSkipped: true };
  },

  _configKey() {
    const cfg = window.SUPABASE_CONFIG || {};
    return `${cfg.url || ''}|${cfg.anonKey || ''}`;
  },

  /**
   * Returns the singleton client, creating it once if configured.
   * @returns {import('@supabase/supabase-js').SupabaseClient | null}
   */
  getClient() {
    if (_sharedClient && _sharedConfigKey === this._configKey()) {
      return _sharedClient;
    }
    return this.init() ? _sharedClient : null;
  },

  /**
   * Idempotent init — never calls createClient more than once per config.
   */
  init() {
    if (typeof supabase === 'undefined') {
      console.warn('[Supabase] Load https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      return false;
    }
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg?.url || !cfg?.anonKey) return false;

    const configKey = this._configKey();
    if (_sharedClient && _sharedConfigKey === configKey) {
      return true;
    }

    if (_sharedClient && _sharedConfigKey !== configKey) {
      _authReadyPromise = null;
      _sharedClient = null;
    }

    _sharedClient = supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: PRESTIGE_SUPABASE_AUTH_STORAGE_KEY,
      },
    });
    _sharedConfigKey = configKey;
    return true;
  },

  /**
   * Auth bootstrap — bypassed when isSkipAuth() (anon key only).
   */
  async ensureAuth() {
    if (this.isSkipAuth()) {
      return this.ensureClientReady();
    }
    if (!this.isConfigured()) {
      return { ok: false, error: 'Supabase not configured' };
    }
    if (!this.getClient()) {
      return { ok: false, error: 'Supabase client unavailable' };
    }
    if (this.user?.id) {
      return { ok: true, user: this.user };
    }
    if (_authReadyPromise) {
      return _authReadyPromise;
    }

    _authReadyPromise = this._establishAuth();
    try {
      return await _authReadyPromise;
    } catch (err) {
      _authReadyPromise = null;
      return { ok: false, error: err?.message || String(err) };
    }
  },

  async _establishAuth() {
    const session = await this.getSession();
    if (session?.user) {
      return { ok: true, user: this.user, session };
    }

    const anon = await this.signInAnonymously();
    if (!anon.ok) {
      _authReadyPromise = null;
      return anon;
    }
    await this.getSession();
    return { ok: true, user: this.user, session: anon.session };
  },

  resetAuthState() {
    this.user = null;
    _authReadyPromise = null;
  },

  async getSession() {
    const client = this.getClient();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    this.user = data.session?.user ?? null;
    return data.session;
  },

  /**
   * تسجيل الدخول — Supabase Auth يستخدم البريد الإلكتروني.
   */
  async signIn(email, password) {
    const client = this.getClient();
    if (!client) return { ok: false, error: 'Supabase not initialized' };

    _authReadyPromise = null;
    const { data, error } = await client.auth.signInWithPassword({
      email: (email || '').trim(),
      password: password || '',
    });

    if (error) return { ok: false, error: error.message };

    this.user = data.user;
    _authReadyPromise = Promise.resolve({ ok: true, user: data.user, session: data.session });
    return { ok: true, user: data.user, session: data.session };
  },

  async signUp(email, password, metadata = {}) {
    const client = this.getClient();
    if (!client) return { ok: false, error: 'Supabase not initialized' };

    const { data, error } = await client.auth.signUp({
      email: (email || '').trim(),
      password: password || '',
      options: { data: metadata },
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, user: data.user, session: data.session };
  },

  async signInAnonymously() {
    const client = this.getClient();
    if (!client) return { ok: false, error: 'No client' };

    const { data, error } = await client.auth.signInAnonymously();
    if (error) return { ok: false, error: error.message };
    this.user = data.user;
    return { ok: true, user: data.user, session: data.session };
  },

  async signOut() {
    const client = this.getClient();
    if (!client) return;
    await client.auth.signOut();
    this.resetAuthState();
  },

  userId() {
    return this.user?.id ?? null;
  },

  /** Tenant from JWT metadata or synced profile (see syncTenantProfile) */
  tenantId() {
    const u = this.user;
    if (u?.app_metadata?.tenant_id) return String(u.app_metadata.tenant_id);
    if (u?.user_metadata?.tenant_id) return String(u.user_metadata.tenant_id);
    return null;
  },

  /**
   * Read tenant_id from public.profiles for the signed-in user.
   * @returns {Promise<{ ok: boolean, tenantId?: string, error?: string }>}
   */
  async fetchProfileTenantId() {
    const userId = this.userId();
    if (!userId) return { ok: false, error: 'Not authenticated' };

    const client = this.getClient();
    if (!client) return { ok: false, error: 'No client' };

    const { data, error } = await client
      .from('profiles')
      .select('tenant_id')
      .eq('id', userId)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data?.tenant_id) {
      return { ok: false, error: 'No tenant_id on user profile' };
    }
    return { ok: true, tenantId: String(data.tenant_id) };
  },

  /**
   * Persist tenant on profiles so current_tenant_id() matches session for RLS.
   * @param {string} tenantId
   */
  async syncTenantProfile(tenantId) {
    const userId = this.userId();
    if (!userId || !tenantId) return { ok: true, skipped: true };

    const client = this.getClient();
    if (!client) return { ok: false, error: 'No client' };

    const { error } = await client.from('profiles').upsert(
      {
        id: userId,
        tenant_id: tenantId,
        display_name: this.user?.user_metadata?.username
          || this.user?.email?.split('@')[0]
          || 'user',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  /** Map app audit fields → Supabase column names */
  auditRowFields(entity, fallbackCreatedBy = 'guest') {
    const createdBy = entity?.createdBy ?? entity?.created_by ?? fallbackCreatedBy;
    return { created_by: String(createdBy || fallbackCreatedBy) };
  },

  applyTimestampsToRow(row, entity, allowlist, { includeUpdated = true } = {}) {
    const createdAt = timestamptzForWrite(entity?.createdAt ?? entity?.created_at);
    if (createdAt && allowlist.includes('created_at')) row.created_at = createdAt;
    if (includeUpdated && allowlist.includes('updated_at')) {
      const updatedAt = timestamptzForWrite(
        entity?.updatedAt ?? entity?.updated_at ?? entity?.createdAt ?? new Date()
      );
      if (updatedAt) row.updated_at = updatedAt;
    }
    return row;
  },

  productToRow(product) {
    const draft = {
      id: product.id,
      code: product.code,
      name: product.name,
      size: product.size,
      color: product.color,
      style: product.style || 'classic',
      cost: product.cost,
      price: product.price,
      quantity: product.quantity,
      image: product.image || null,
      user_id: this.isSkipAuth() ? undefined : this.userId(),
      tenant_id: product.tenant_id ?? product.tenantId ?? this.tenantId(),
      ...this.auditRowFields(product),
    };
    this.applyTimestampsToRow(draft, product, PRODUCTS_DB_COLUMNS, { includeUpdated: true });
    return pickDbColumns(draft, PRODUCTS_DB_COLUMNS);
  },

  /** Build sales insert row using verified public.sales column names only */
  saleToCandidateRow(sale) {
    const createdAt = timestamptzForWrite(sale.created_at ?? sale.createdAt) || new Date().toISOString();
    const customer = (sale.customer_name ?? sale.customerName ?? sale.customer ?? 'POS Guest');
    const customerStr = String(customer).trim() || 'POS Guest';
    const lineTotal = roundAud(
      sale.line_total_aud ?? sale.lineTotalAud ?? 0
    );
    const qtyRaw = sale.quantity ?? sale.qty;
    const qtyParsed = parseInt(qtyRaw, 10);
    const qty = Math.max(1, Number.isFinite(qtyParsed) ? qtyParsed : 1);
    const price = roundAud(
      sale.price ?? sale.unitPriceAud ?? (qty ? lineTotal / qty : lineTotal)
    );
    const idParsed = parseInt(sale.id, 10);
    const id = Number.isFinite(idParsed) && /^\d+$/.test(String(sale.id).trim())
      ? idParsed
      : Date.now() + Math.floor(Math.random() * 1000);
    const row = {
      id,
      created_at: createdAt,
      updated_at: timestamptzForWrite(sale.updated_at ?? sale.updatedAt) || createdAt,
      customer_name: customerStr,
      customer: customerStr,
      product_name: sale.product_name ?? sale.productName ?? '',
      price,
      quantity: qty,
      created_by: String(sale.created_by ?? sale.createdBy ?? 'guest'),
      invoice_number: sale.invoice_number ?? sale.invoiceNumber ?? '',
      line_total_aud: lineTotal,
      status: sale.status ?? (sale.returned ? 'returned' : 'completed'),
      tenant_id: sale.tenant_id ?? sale.tenantId ?? this.tenantId(),
    };
    const batchRaw = sale.batch_id ?? sale.batchId;
    const batchParsed = parseInt(batchRaw, 10);
    if (Number.isFinite(batchParsed) && /^\d+$/.test(String(batchRaw).trim())) {
      row.batch_id = batchParsed;
    }
    return pickDbColumns(row, SALES_DB_COLUMNS_FALLBACK);
  },

  filterRowToExistingColumns(row, columns) {
    const allowed = new Set(
      Array.isArray(columns) ? columns : normalizeColumnList(columns)
    );
    const out = {};
    Object.keys(row || {}).forEach((key) => {
      if (allowed.has(key) && row[key] !== undefined) {
        out[key] = row[key];
      }
    });
    return out;
  },

  /**
   * Query information_schema.columns (via RPC) for a public table.
   * @returns {Promise<{ ok: boolean, columns?: string[], error?: string }>}
   */
  async getTableColumns(tableName) {
    const name = String(tableName || '').trim().toLowerCase();
    if (!name) return { ok: false, error: 'Table name required' };

    const cached = _tableColumnsCache.get(name);
    if (cached && Date.now() - cached.fetchedAt < TABLE_COLUMNS_CACHE_MS) {
      return { ok: true, columns: cached.columns };
    }

    const client = this.getClient();
    if (!client) return { ok: false, error: 'No client' };

    const { data, error } = await client.rpc('get_table_columns', {
      p_table_name: name,
    });

    if (error) {
      console.warn('[Supabase] get_table_columns RPC failed, using fallback:', error.message);
      const fallback = name === 'sales' ? SALES_DB_COLUMNS_FALLBACK : [];
      if (fallback.length) {
        _tableColumnsCache.set(name, { columns: fallback, fetchedAt: Date.now() });
        return { ok: true, columns: fallback, fallback: true };
      }
      return { ok: false, error: error.message };
    }

    const columns = normalizeColumnList(data);
    if (!columns.length) {
      return {
        ok: false,
        error: `No columns returned for public.${name} — run get_table_columns in Supabase SQL Editor`,
      };
    }

    _tableColumnsCache.set(name, { columns, fetchedAt: Date.now() });
    return { ok: true, columns };
  },

  rowToSale(row) {
    const lineTotal = Number(row.line_total_aud) || 0;
    const qty = Math.max(1, Math.round(Number(row.quantity) || 1));
    const price = Number(row.price) || (qty ? lineTotal / qty : lineTotal);
    const createdAt = timestamptzFromDb(row.created_at);
    const customer = row.customer ?? row.customer_name;
    return {
      id: row.id,
      customer,
      customerName: row.customer_name ?? customer,
      productName: row.product_name,
      lineTotalAud: lineTotal,
      createdAt,
      saleDate: createdAt,
      quantity: qty,
      unitPriceAud: price,
      unitCostAud: 0,
      invoiceNumber: row.invoice_number,
      batchId: row.batch_id,
      status: row.status,
      createdBy: row.created_by,
      returned: row.status === 'returned',
    };
  },

  async fetchSales() {
    const client = this.getClient();
    if (!client) return { ok: false, data: [], error: 'No client' };

    const { data, error } = await client
      .from('sales')
      .select('*')
      .order('id', { ascending: false });

    if (error) return { ok: false, data: [], error: error.message };
    return { ok: true, data: (data || []).map((r) => this.rowToSale(r)) };
  },

  getStoredTenantId() {
    try {
      const tid = localStorage.getItem(CURRENT_TENANT_STORAGE_KEY);
      return tid && String(tid).trim() ? String(tid).trim() : null;
    } catch {
      return null;
    }
  },

  saleAmountFromRow(row) {
    return roundAud(
      row?.line_total_aud ?? row?.lineTotalAud ?? 0
    );
  },

  async fetchRecentSaleAmounts(tenantId, limit = SALES_ANOMALY_RECENT_COUNT) {
    const client = this.getClient();
    if (!client || !tenantId) return [];

    const { data, error } = await client
      .from('sales')
      .select('line_total_aud')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[secureInsert] Recent sales lookup:', error.message);
      return [];
    }

    return (data || [])
      .map((r) => this.saleAmountFromRow(r))
      .filter((n) => Number.isFinite(n) && n > 0);
  },

  async logAiAlert({ tenantId, alertType, message, tableName, recordId, severity, metadata }) {
    const client = this.getClient();
    if (!client || !tenantId) return { ok: false, error: 'No client or tenant' };

    const { error } = await client.from('ai_alerts').insert({
      tenant_id: tenantId,
      alert_type: alertType,
      severity: severity || 'warning',
      table_name: tableName || null,
      record_id: recordId != null ? String(recordId) : null,
      message,
      metadata: metadata || {},
    });

    if (error) {
      console.warn('[secureInsert] ai_alerts insert:', error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  },

  /**
   * Pre-save AI hook for sales:
   * - HIGH_VALUE_TRANSACTION if amount > SALES_HIGH_VALUE_THRESHOLD_AUD
   * - sales_amount_anomaly if amount > 3× recent tenant average
   */
  async preSaveHookSales(payload, tenantId) {
    const amount = this.saleAmountFromRow(payload);
    if (!Number.isFinite(amount) || amount <= 0) return { ok: true };

    let anomaly = false;

    if (amount > SALES_HIGH_VALUE_THRESHOLD_AUD) {
      const details = `Transaction of ${amount} AUD detected.`;
      console.warn('AI Alert: Unusual high value transaction detected!');
      await this.logAiAlert({
        tenantId,
        alertType: 'HIGH_VALUE_TRANSACTION',
        message: details,
        tableName: 'sales',
        recordId: payload.id,
        severity: 'warning',
        metadata: { details, amount, threshold: SALES_HIGH_VALUE_THRESHOLD_AUD },
      });
      anomaly = true;
    }

    const recent = await this.fetchRecentSaleAmounts(tenantId);
    if (recent.length >= SALES_ANOMALY_MIN_SAMPLES) {
      const average = recent.reduce((sum, n) => sum + n, 0) / recent.length;
      const threshold = average * SALES_ANOMALY_AVG_MULTIPLIER;

      if (amount > threshold) {
        const message = `Anomaly Alert: sale amount ${amount} AUD exceeds ${SALES_ANOMALY_AVG_MULTIPLIER}× recent average (${roundAud(average)} AUD, last ${recent.length} sales)`;
        console.warn('[AI]', message);
        await this.logAiAlert({
          tenantId,
          alertType: 'sales_amount_anomaly',
          message,
          tableName: 'sales',
          recordId: payload.id,
          severity: 'warning',
          metadata: {
            details: message,
            amount,
            average: roundAud(average),
            threshold: roundAud(threshold),
            multiplier: SALES_ANOMALY_AVG_MULTIPLIER,
            sampleSize: recent.length,
          },
        });
        anomaly = true;
      }
    }

    return { ok: true, anomaly };
  },

  async runPreSaveHooks(table, payload, tenantId) {
    if (table === 'sales') {
      return this.preSaveHookSales(payload, tenantId);
    }
    return { ok: true };
  },

  /**
   * Global Secure Insert with AI Hook
   * 1. Tenant isolation (appends tenant_id from localStorage)
   * 2. AI anomaly detection pre-save hook (sales → ai_alerts)
   * 3. Persist row to Supabase
   * @param {string} table
   * @param {object} data
   * @returns {Promise<{ ok: boolean, data?: object|null, error?: string, anomaly?: boolean, sale?: object }>}
   */
  async secureInsert(table, data) {
    const tableName = String(table || '').trim();
    if (!SECURE_INSERT_TABLES.has(tableName)) {
      return { ok: false, data: null, error: `secureInsert not allowed for table: ${tableName}` };
    }

    const client = this.getClient();
    if (!client) return { ok: false, data: null, error: 'No client' };

    if (!this.isSkipAuth()) {
      const userId = this.userId();
      if (!userId) {
        return { ok: false, data: null, error: 'Database connection error: not authenticated' };
      }
    }

    const cfg = typeof window !== 'undefined' ? window.SUPABASE_CONFIG || {} : {};
    const tenantId = localStorage.getItem(CURRENT_TENANT_STORAGE_KEY)
      || this.getStoredTenantId()
      || cfg.defaultTenantId;

    if (!tenantId || !String(tenantId).trim()) {
      const dbErr = 'Database configuration error: missing tenant_id in supabase.config.js';
      console.error('[Supabase]', dbErr);
      return { ok: false, data: null, error: dbErr };
    }

    const tenantIdStr = String(tenantId).trim();
    const payload = { ...data, tenant_id: tenantIdStr };

    const hookResult = await this.runPreSaveHooks(tableName, payload, tenantIdStr);

    const { data: inserted, error } = await client
      .from(tableName)
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      return { ok: false, data: null, error: error.message };
    }

    const result = { ok: true, data: inserted };
    if (tableName === 'sales') {
      result.sale = this.rowToSale(inserted);
    }
    if (hookResult.anomaly) result.anomaly = true;
    return result;
  },

  normalizeProductName(name) {
    return String(name || '').trim().toLowerCase();
  },

  isInsufficientStockMessage(message) {
    const msg = String(message || '');
    return msg.includes('غير كافية') || msg.includes('INSUFFICIENT_STOCK');
  },

  isRpcMissingError(error) {
    const msg = String(error?.message || error || '').toLowerCase();
    return (
      msg.includes('insert_sale_with_inventory')
      && (msg.includes('does not exist') || msg.includes('could not find'))
    ) || msg.includes('42883');
  },

  resolveTenantIdForInventory(row) {
    const cfg = typeof window !== 'undefined' ? window.SUPABASE_CONFIG || {} : {};
    return (
      row?.tenant_id
      || this.getStoredTenantId()
      || cfg.defaultTenantId
      || null
    );
  },

  matchInventoryRow(rows, productName, tenantId) {
    const target = this.normalizeProductName(productName);
    if (!target) return null;
    const tid = tenantId ? String(tenantId).trim() : null;
    return (rows || []).find((r) => {
      if (this.normalizeProductName(r.product_name) !== target) return false;
      if (!tid) return true;
      const rowTid = r.tenant_id != null ? String(r.tenant_id) : null;
      return !rowTid || rowTid === tid;
    }) || null;
  },

  /**
   * Pre-check stock in public.inventory (client-side; RPC enforces again).
   */
  async validateInventoryStock(productName, quantity) {
    const client = this.getClient();
    if (!client) return { ok: false, error: 'No client' };

    const name = String(productName || '').trim();
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    if (!name) return { ok: false, error: 'اسم المنتج مطلوب' };

    const tenantId = this.resolveTenantIdForInventory({});
    let query = client.from('inventory').select('id, product_name, stock_quantity, tenant_id');

    if (tenantId) {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
    }

    const { data, error } = await query;
    if (error) return { ok: false, error: error.message };

    const row = this.matchInventoryRow(data, name, tenantId);
    if (!row) {
      return { ok: false, error: 'المنتج غير موجود في المخزون' };
    }

    const available = Math.max(0, parseInt(row.stock_quantity, 10) || 0);
    if (qty > available) {
      return {
        ok: false,
        error: INSUFFICIENT_STOCK_MSG,
        code: 'INSUFFICIENT_STOCK',
        available,
      };
    }

    return { ok: true, available, inventoryId: row.id };
  },

  async validateInventoryBatch(items) {
    const totals = new Map();
    for (const item of items || []) {
      const name = String(item.productName || '').trim();
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (!name) return { ok: false, error: 'اسم المنتج مطلوب' };
      const key = this.normalizeProductName(name);
      totals.set(key, {
        productName: name,
        quantity: (totals.get(key)?.quantity || 0) + qty,
      });
    }

    for (const { productName, quantity } of totals.values()) {
      const check = await this.validateInventoryStock(productName, quantity);
      if (!check.ok) return check;
    }
    return { ok: true };
  },

  async deductInventoryFallback(productName, quantity, tenantId) {
    const client = this.getClient();
    const name = String(productName || '').trim();
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const check = await this.validateInventoryStock(name, qty);
    if (!check.ok) return check;

    const { error } = await client
      .from('inventory')
      .update({ stock_quantity: check.available - qty })
      .eq('id', check.inventoryId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  /**
   * Fallback when RPC is not deployed: check → insert sale → deduct inventory (compensate on failure).
   */
  async insertSaleWithInventoryFallback(row) {
    const client = this.getClient();
    if (!client) return { ok: false, error: 'No client' };

    const productName = row.product_name;
    const qty = Math.max(1, parseInt(row.quantity, 10) || 1);
    const tenantId = this.resolveTenantIdForInventory(row);

    const check = await this.validateInventoryStock(productName, qty);
    if (!check.ok) {
      return {
        ok: false,
        error: check.error,
        code: check.code || (this.isInsufficientStockMessage(check.error) ? 'INSUFFICIENT_STOCK' : undefined),
      };
    }

    const tenantIdStr = tenantId ? String(tenantId).trim() : '';
    if (!tenantIdStr) {
      return { ok: false, error: 'Database configuration error: missing tenant_id in supabase.config.js' };
    }

    const payload = { ...row, tenant_id: tenantIdStr };
    const hookResult = await this.runPreSaveHooks('sales', payload, tenantIdStr);

    const { data: inserted, error: insertError } = await client
      .from('sales')
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      return { ok: false, error: insertError.message };
    }

    const deductRes = await this.deductInventoryFallback(productName, qty, tenantId);
    if (!deductRes.ok) {
      if (row.id != null) {
        await client.from('sales').delete().eq('id', row.id);
      }
      return {
        ok: false,
        error: deductRes.error || INSUFFICIENT_STOCK_MSG,
        code: deductRes.code || 'INSUFFICIENT_STOCK',
      };
    }

    const result = { ok: true, data: inserted, sale: this.rowToSale(inserted) };
    if (hookResult.anomaly) result.anomaly = true;
    return result;
  },

  /**
   * Atomic sale + inventory deduction via Postgres RPC (preferred).
   */
  async insertSaleWithInventory(row) {
    const client = this.getClient();
    if (!client) return { ok: false, error: 'No client' };

    const tenantId = this.resolveTenantIdForInventory(row);
    const payload = tenantId && !row.tenant_id
      ? { ...row, tenant_id: String(tenantId) }
      : row;

    const hookResult = await this.runPreSaveHooks('sales', payload, tenantId);

    const { data, error } = await client.rpc('insert_sale_with_inventory', {
      p_sale: payload,
    });

    if (error) {
      if (this.isRpcMissingError(error)) {
        return this.insertSaleWithInventoryFallback(payload);
      }
      const msg = error.message || 'Database error';
      return {
        ok: false,
        error: this.isInsufficientStockMessage(msg) ? INSUFFICIENT_STOCK_MSG : msg,
        code: this.isInsufficientStockMessage(msg) ? 'INSUFFICIENT_STOCK' : undefined,
      };
    }

    const inserted = typeof data === 'string' ? JSON.parse(data) : data;
    const result = {
      ok: true,
      data: inserted,
      sale: this.rowToSale(inserted),
    };
    if (hookResult.anomaly) result.anomaly = true;
    return result;
  },

  notifySalesDashboardRefresh() {
    try {
      const ch = new BroadcastChannel(ERP_SALES_CHANNEL);
      ch.postMessage({ type: 'sale-recorded', at: Date.now() });
      ch.close();
    } catch (_) { /* ignore */ }
  },

  /**
   * Direct sales insert — sale row + inventory deduction.
   */
  async insertSaleDirect(row) {
    return this.insertSaleWithInventory(row);
  },

  async insertSaleRow(row) {
    return this.insertSaleDirect(row);
  },

  async insertSale(sale) {
    const row = this.saleToCandidateRow(sale);
    return this.insertSaleDirect(row);
  },

  inventoryRowToProduct(row) {
    const name = String(row?.product_name || '').trim() || '—';
    const shortCode = name.length > 14 ? `${name.slice(0, 12)}…` : name;
    return {
      id: row.id,
      code: shortCode,
      name,
      size: '—',
      color: '—',
      style: 'classic',
      cost: Number(row.cost_price) || 0,
      price: Number(row.selling_price) || 0,
      quantity: Math.max(0, parseInt(row.stock_quantity, 10) || 0),
      minThreshold: Math.max(0, parseInt(row.min_threshold, 10) || 0),
      fromInventory: true,
      lastUpdated: timestamptzFromDb(row.last_updated),
      tenantId: row.tenant_id != null ? String(row.tenant_id) : null,
    };
  },

  /**
   * Sales catalog — public.inventory (product_name, stock, cost_price, selling_price).
   */
  async fetchInventory() {
    const client = this.getClient();
    if (!client) return { ok: false, data: [], error: 'No client' };

    const { data, error } = await client
      .from('inventory')
      .select('id, product_name, stock_quantity, cost_price, selling_price, min_threshold, last_updated, tenant_id')
      .order('product_name', { ascending: true });

    if (error) return { ok: false, data: [], error: error.message };

    let rows = (data || []).map((r) => this.inventoryRowToProduct(r));
    const tenantId = this.resolveTenantIdForInventory({});
    if (tenantId && rows.some((r) => r.tenantId)) {
      const scoped = rows.filter((r) => !r.tenantId || r.tenantId === String(tenantId));
      if (scoped.length) rows = scoped;
    }
    rows.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    return { ok: true, data: rows };
  },

  async fetchProducts() {
    const client = this.getClient();
    if (!client) return { ok: false, data: [], error: 'No client' };

    const { data, error } = await client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { ok: false, data: [], error: error.message };
    return {
      ok: true,
      data: (data || []).map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        size: r.size,
        color: r.color,
        style: r.style,
        cost: Number(r.cost),
        price: Number(r.price),
        quantity: r.quantity,
        image: r.image,
        createdAt: timestamptzFromDb(r.created_at),
        updatedAt: timestamptzFromDb(r.updated_at),
        createdBy: r.created_by,
      })),
    };
  },

  async upsertProduct(product) {
    const client = this.getClient();
    if (!client) return { ok: false, error: 'No client' };

    if (!this.isSkipAuth()) {
      const userId = this.userId();
      if (!userId) {
        return { ok: false, error: 'Database connection error: not authenticated' };
      }
    }

    const row = this.productToRow(product);

    const { data, error } = await client.from('products').upsert(row).select('id').single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  },
};

if (typeof window !== 'undefined') {
  window.SupabaseBridge = SupabaseBridge;
}
