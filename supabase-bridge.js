/**
 * Prestige Abaya — Supabase bridge (Auth + database)
 * Requires: @supabase/supabase-js loaded before this file
 * Config: supabase.config.js → window.SUPABASE_CONFIG
 *
 * Single shared Supabase client (singleton) — avoids multiple GoTrueClient instances.
 */
const PRESTIGE_SUPABASE_AUTH_STORAGE_KEY = 'prestige-abaya-supabase-auth';

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
   * One shared auth bootstrap: restore session or sign in anonymously once.
   */
  async ensureAuth() {
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
      user_id: this.userId(),
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
      sale.line_total_aud ?? sale.lineTotalAud ?? sale.total_amount ?? sale.totalAmount ?? 0
    );
    const qty = Math.max(1, Math.round(Number(sale.quantity) || 1));
    const price = roundAud(
      sale.price ?? sale.unitPriceAud ?? (qty ? lineTotal / qty : lineTotal)
    );
    const row = {
      id: sale.id,
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
      batch_id: sale.batch_id ?? sale.batchId ?? '',
      status: sale.status ?? (sale.returned ? 'returned' : 'completed'),
    };
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
    const lineTotal = Number(row.line_total_aud) || Number(row.total_amount) || 0;
    const qty = Math.max(1, Math.round(Number(row.quantity) || 1));
    const price = Number(row.price) || (qty ? lineTotal / qty : lineTotal);
    const createdAt = timestamptzFromDb(row.created_at);
    const customer = row.customer ?? row.customer_name;
    return {
      id: row.id,
      customer,
      customerName: row.customer_name ?? customer,
      productName: row.product_name,
      totalAmount: lineTotal,
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

  async insertSaleRow(row) {
    const client = this.getClient();
    if (!client) return { ok: false, error: 'No client' };

    const userId = this.userId();
    if (!userId) {
      return { ok: false, error: 'Not authenticated — enable Anonymous sign-in in Supabase Auth' };
    }

    const { data, error } = await client
      .from('sales')
      .insert(row)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, sale: this.rowToSale(data) };
  },

  async insertSale(sale) {
    const candidate = this.saleToCandidateRow(sale);
    const columnsRes = await this.getTableColumns('sales');
    if (!columnsRes.ok) return { ok: false, error: columnsRes.error };

    const row = this.filterRowToExistingColumns(candidate, columnsRes.columns);
    if (!Object.keys(row).length) {
      return { ok: false, error: 'No matching columns for sales insert' };
    }
    return this.insertSaleRow(row);
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

    const userId = this.userId();
    if (!userId) {
      return { ok: false, error: 'Not authenticated — enable Anonymous sign-in in Supabase Auth' };
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
