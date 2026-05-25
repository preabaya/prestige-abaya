/**
 * Prestige Abaya — Dashboard Service (Supabase data engine)
 * Tables: profiles, sales, inventory, expenses
 * Branch scope: branch_id when present, else tenant_id (multi-branch / multi-tenant)
 */
(function (global) {
  'use strict';

  const BRANCH_STORAGE_KEY = 'current_branch_id';
  const TENANT_STORAGE_KEY = 'current_tenant_id';

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

  function resolveTenantId() {
    if (global.DbHelper?.resolveTenantId) {
      return global.DbHelper.resolveTenantId();
    }
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
    if (global.DbHelper?.getClient) return global.DbHelper.getClient();
    if (global.SupabaseBridge?.getClient) return global.SupabaseBridge.getClient();
    const cfg = getConfig();
    if (!cfg.url || !cfg.anonKey || typeof global.supabase === 'undefined') return null;
    return global.supabase.createClient(cfg.url, cfg.anonKey);
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

  function isMissingColumnError(error) {
    const msg = String(error?.message || error || '').toLowerCase();
    return msg.includes('branch_id') && (msg.includes('does not exist') || msg.includes('column'));
  }

  function fail(code, message, extra = {}) {
    return { ok: false, code, error: message, ...extra };
  }

  /**
   * Apply branch_id filter; on missing column, retry with tenant_id.
   * @param {import('@supabase/supabase-js').PostgrestFilterBuilder} query
   */
  async function runScopedQuery(buildQuery, branchId) {
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
        .select('id, tenant_id, user_role, display_name')
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
        branchId
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
      let query = client.from('expenses').select('amount_original, exchange_rate, financials');
      let scope = 'none';

      if (branchId) {
        const branchTry = await query.eq('branch_id', branchId);
        if (!branchTry.error) {
          const rows = branchTry.data || [];
          const totalExpenses = roundMoney(rows.reduce((s, r) => s + expenseAmount(r), 0));
          return {
            ok: true,
            totalExpenses,
            expensesCount: rows.length,
            branchId,
            scope: 'branch_id',
          };
        }
        if (!isMissingColumnError(branchTry.error)) {
          return fail('EXPENSES_FETCH_ERROR', branchTry.error.message);
        }

        const tenantTry = await client
          .from('expenses')
          .select('amount_original, exchange_rate, financials')
          .eq('tenant_id', branchId);
        if (!tenantTry.error) {
          const rows = tenantTry.data || [];
          const totalExpenses = roundMoney(rows.reduce((s, r) => s + expenseAmount(r), 0));
          return {
            ok: true,
            totalExpenses,
            expensesCount: rows.length,
            branchId,
            scope: 'tenant_id',
          };
        }
        if (!isMissingColumnError(tenantTry.error)) {
          return fail('EXPENSES_FETCH_ERROR', tenantTry.error.message);
        }

        const allRes = await client.from('expenses').select('amount_original, exchange_rate, financials');
        if (allRes.error) {
          return fail('EXPENSES_FETCH_ERROR', allRes.error.message);
        }
        const rows = allRes.data || [];
        const totalExpenses = roundMoney(rows.reduce((s, r) => s + expenseAmount(r), 0));
        return {
          ok: true,
          totalExpenses,
          expensesCount: rows.length,
          branchId,
          scope: 'unscoped',
          warning: 'جدول expenses لا يحتوي branch_id/tenant_id — تم جمع كل السجلات',
        };
      }

      const { data, error } = await query;
      if (error) return fail('EXPENSES_FETCH_ERROR', error.message);
      const rows = data || [];
      return {
        ok: true,
        totalExpenses: roundMoney(rows.reduce((s, r) => s + expenseAmount(r), 0)),
        expensesCount: rows.length,
        branchId: null,
        scope,
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
        branchId
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
   * ملخص شامل للوحة التحكم.
   */
  async function getDashboardSnapshot(options = {}) {
    try {
      const [revenue, profit, inventory, profile] = await Promise.all([
        getTotalRevenue(options),
        getNetProfit(options),
        getInventoryStatus(options),
        getProfileContext(),
      ]);

      const country = options.countryCode || getConfig().defaultCountryCode || 'AU';
      const tax = await getTaxSummary(country, options);

      return {
        ok: true,
        profile,
        revenue,
        profit,
        inventory,
        tax,
      };
    } catch (err) {
      return fail('SNAPSHOT_EXCEPTION', err.message || String(err));
    }
  }

  function getDefaultCountryCode() {
    const code = getConfig().defaultCountryCode;
    return code && String(code).trim() ? String(code).trim().toUpperCase() : 'AU';
  }

  const DashboardService = {
    getClient,
    resolveBranchId,
    resolveTenantId,
    getProfileContext,
    getTotalRevenue,
    getNetProfit,
    getInventoryStatus,
    getTaxSummary,
    getDashboardSnapshot,
    getDefaultCountryCode,
    TAX_BY_COUNTRY,
  };

  global.DashboardService = DashboardService;
})(typeof window !== 'undefined' ? window : global);
