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

  applyTimestampsToRow(row, entity, { includeUpdated = true } = {}) {
    const createdAt = timestamptzForWrite(entity?.createdAt ?? entity?.created_at);
    if (createdAt) row.created_at = createdAt;
    if (includeUpdated) {
      const updatedAt = timestamptzForWrite(
        entity?.updatedAt ?? entity?.updated_at ?? entity?.createdAt ?? new Date()
      );
      if (updatedAt) row.updated_at = updatedAt;
    }
    return row;
  },

  productToRow(product) {
    const userId = this.userId();
    const row = {
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
      user_id: userId,
      ...this.auditRowFields(product),
    };
    return this.applyTimestampsToRow(row, product, { includeUpdated: true });
  },

  /** Normalize sale for cloud insert — ensures totals exist before saleToRow */
  normalizeSaleForCloud(sale) {
    const qty = Math.max(1, parseInt(sale.quantity, 10) || 1);
    const unitPriceAud = Number(sale.unitPriceAud) || 0;
    const lineTotalAud = sale.lineTotalAud != null
      ? Number(sale.lineTotalAud)
      : roundAud(unitPriceAud * qty);
    const subtotalAud = sale.subtotalAud != null
      ? Number(sale.subtotalAud)
      : lineTotalAud;
    return {
      ...sale,
      quantity: qty,
      unitPriceAud,
      unitCostAud: Number(sale.unitCostAud) || 0,
      subtotalAud,
      lineTotalAud,
      discountType: sale.discountType || 'none',
      discountValue: Number(sale.discountValue) || 0,
      extraShipping: Number(sale.extraShipping) || 0,
    };
  },

  saleToRow(sale) {
    const s = this.normalizeSaleForCloud(sale);
    const row = {
      id: s.id,
      product_id: s.productId ?? null,
      product_name: s.productName ?? null,
      product_code: s.productCode ?? null,
      product_color: s.productColor ?? null,
      product_style: s.productStyle || 'classic',
      product_size: s.productSize ?? null,
      quantity: s.quantity,
      unit_price_aud: s.unitPriceAud,
      unit_cost_aud: s.unitCostAud,
      subtotal_aud: s.subtotalAud,
      line_total_aud: s.lineTotalAud,
      discount_type: s.discountType || 'none',
      discount_value: s.discountValue ?? 0,
      extra_shipping_aud: s.extraShipping ?? 0,
      customer: (s.customer != null && String(s.customer).trim())
        ? String(s.customer).trim()
        : 'POS Guest',
      payment: s.payment ?? '—',
      sale_source: s.saleSource || 'in_store',
      payment_method: s.paymentMethod || 'cash',
      invoice_number: (s.invoiceNumber != null && String(s.invoiceNumber).trim())
        ? String(s.invoiceNumber).trim()
        : null,
      batch_id: s.batchId ?? null,
      returned: !!s.returned,
      notes: s.notes || '',
      user_id: this.userId(),
      ...this.auditRowFields(s),
    };
    const returnedAt = timestamptzForWrite(s.returnedAt);
    if (returnedAt) row.returned_at = returnedAt;
    return this.applyTimestampsToRow(row, s, { includeUpdated: true });
  },

  rowToSale(row) {
    const qty = row.quantity ?? 1;
    const unitPrice = Number(row.unit_price_aud) || 0;
    const lineTotal = row.line_total_aud != null
      ? Number(row.line_total_aud)
      : unitPrice * qty;
    return {
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      productCode: row.product_code,
      productColor: row.product_color,
      productStyle: row.product_style,
      productSize: row.product_size,
      quantity: qty,
      unitPriceAud: unitPrice,
      unitCostAud: Number(row.unit_cost_aud) || 0,
      subtotalAud: row.subtotal_aud != null ? Number(row.subtotal_aud) : lineTotal,
      lineTotalAud: lineTotal,
      discountType: row.discount_type || 'none',
      discountValue: row.discount_value != null ? Number(row.discount_value) : 0,
      extraShipping: row.extra_shipping_aud != null ? Number(row.extra_shipping_aud) : 0,
      customer: row.customer,
      payment: row.payment,
      saleSource: row.sale_source,
      paymentMethod: row.payment_method,
      invoiceNumber: row.invoice_number,
      batchId: row.batch_id,
      returned: row.returned,
      returnedAt: timestamptzFromDb(row.returned_at),
      notes: row.notes,
      createdAt: timestamptzFromDb(row.created_at),
      updatedAt: timestamptzFromDb(row.updated_at),
      createdBy: row.created_by,
      createdByUserId: row.user_id,
    };
  },

  async fetchSales() {
    const client = this.getClient();
    if (!client) return { ok: false, data: [], error: 'No client' };

    const { data, error } = await client
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { ok: false, data: [], error: error.message };
    return { ok: true, data: (data || []).map((r) => this.rowToSale(r)) };
  },

  async insertSale(sale) {
    const client = this.getClient();
    if (!client) return { ok: false, error: 'No client' };

    const userId = this.userId();
    if (!userId) {
      return { ok: false, error: 'Not authenticated — enable Anonymous sign-in in Supabase Auth' };
    }

    const row = this.saleToRow(sale);
    const { data, error } = await client
      .from('sales')
      .insert(row)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, sale: this.rowToSale(data) };
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
