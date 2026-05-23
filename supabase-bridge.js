/**
 * Prestige Abaya — Supabase bridge (Auth + database)
 * Requires: @supabase/supabase-js loaded before this file
 * Config: supabase.config.js → window.SUPABASE_CONFIG
 */
const SupabaseBridge = {
  client: null,
  user: null,

  isConfigured() {
    const cfg = window.SUPABASE_CONFIG || {};
    return !!(cfg.url && cfg.anonKey && cfg.enabled !== false);
  },

  init() {
    if (typeof supabase === 'undefined') {
      console.warn('[Supabase] Load https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      return false;
    }
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg?.url || !cfg?.anonKey) return false;

    this.client = supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return true;
  },

  async getSession() {
    if (!this.client) return null;
    const { data } = await this.client.auth.getSession();
    this.user = data.session?.user ?? null;
    return data.session;
  },

  /**
   * تسجيل الدخول — Supabase Auth يستخدم البريد الإلكتروني.
   * يمكنك استخدام: louay@prestige-abaya.com كبريد للمستخدم Louay
   */
  async signIn(email, password) {
    if (!this.client) return { ok: false, error: 'Supabase not initialized' };

    const { data, error } = await this.client.auth.signInWithPassword({
      email: (email || '').trim(),
      password: password || '',
    });

    if (error) return { ok: false, error: error.message };

    this.user = data.user;
    return { ok: true, user: data.user, session: data.session };
  },

  async signUp(email, password, metadata = {}) {
    if (!this.client) return { ok: false, error: 'Supabase not initialized' };

    const { data, error } = await this.client.auth.signUp({
      email: (email || '').trim(),
      password: password || '',
      options: { data: metadata },
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, user: data.user, session: data.session };
  },

  async signInAnonymously() {
    if (!this.client) return { ok: false, error: 'No client' };
    const { data, error } = await this.client.auth.signInAnonymously();
    if (error) return { ok: false, error: error.message };
    this.user = data.user;
    return { ok: true, user: data.user, session: data.session };
  },

  async signOut() {
    if (!this.client) return;
    await this.client.auth.signOut();
    this.user = null;
  },

  userId() {
    return this.user?.id ?? null;
  },

  /** تحويل كائن بيع من التطبيق إلى صف Supabase */
  saleToRow(sale) {
    return {
      id: sale.id,
      product_id: sale.productId,
      product_name: sale.productName,
      product_code: sale.productCode,
      product_color: sale.productColor,
      product_style: sale.productStyle || 'classic',
      quantity: sale.quantity,
      unit_price_aud: sale.unitPriceAud,
      unit_cost_aud: sale.unitCostAud,
      line_total_aud: sale.lineTotalAud ?? sale.unitPriceAud * sale.quantity,
      customer: sale.customer,
      payment: sale.payment,
      sale_source: sale.saleSource || 'in_store',
      payment_method: sale.paymentMethod || 'cash',
      invoice_number: sale.invoiceNumber,
      returned: !!sale.returned,
      notes: sale.notes || '',
      created_at: sale.createdAt || new Date().toISOString(),
      created_by: sale.createdBy,
      user_id: this.userId(),
    };
  },

  rowToSale(row) {
    return {
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      productCode: row.product_code,
      productColor: row.product_color,
      productStyle: row.product_style,
      quantity: row.quantity,
      unitPriceAud: Number(row.unit_price_aud),
      unitCostAud: Number(row.unit_cost_aud),
      lineTotalAud: row.line_total_aud != null ? Number(row.line_total_aud) : undefined,
      customer: row.customer,
      payment: row.payment,
      saleSource: row.sale_source,
      paymentMethod: row.payment_method,
      invoiceNumber: row.invoice_number,
      returned: row.returned,
      notes: row.notes,
      createdAt: row.created_at,
      createdBy: row.created_by,
      createdByUserId: row.user_id,
    };
  },

  /** جلب كل المبيعات للمستخدم الحالي (RLS يفلتر تلقائياً) */
  async fetchSales() {
    if (!this.client) return { ok: false, data: [], error: 'No client' };

    const { data, error } = await this.client
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { ok: false, data: [], error: error.message };
    return { ok: true, data: (data || []).map((r) => this.rowToSale(r)) };
  },

  /** حفظ عملية بيع واحدة في قاعدة البيانات */
  async insertSale(sale) {
    if (!this.client) return { ok: false, error: 'No client' };

    const row = this.saleToRow(sale);
    const { data, error } = await this.client
      .from('sales')
      .insert(row)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, sale: this.rowToSale(data) };
  },

  async fetchProducts() {
    const { data, error } = await this.client
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
        createdAt: r.created_at,
        createdBy: r.created_by,
      })),
    };
  },

  async upsertProduct(product) {
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
      updated_at: new Date().toISOString(),
      created_by: product.createdBy,
      user_id: this.userId(),
    };
    const { error } = await this.client.from('products').upsert(row);
    return { ok: !error, error: error?.message };
  },
};
