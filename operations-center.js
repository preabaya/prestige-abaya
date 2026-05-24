/**
 * Prestige Abaya — Operations Center
 * Operational updates: sales status, inventory stock, branch transfers.
 * Requires: db-helper.js or supabase-bridge.js, supabase.config.js
 */
(function (global) {
  'use strict';

  const TENANT_STORAGE_KEY = 'current_tenant_id';

  const OPERATION_TYPES = {
    UPDATE_SALE_STATUS: 'UPDATE_SALE_STATUS',
    INSERT_INVENTORY: 'INSERT_INVENTORY',
    UPDATE_INVENTORY_STOCK: 'UPDATE_INVENTORY_STOCK',
    TRANSFER_INVENTORY: 'TRANSFER_INVENTORY',
  };

  function getClient() {
    if (global.DbHelper?.getClient) return global.DbHelper.getClient();
    if (global.SupabaseBridge?.getClient) return global.SupabaseBridge.getClient();
    return null;
  }

  function resolveTenantId(explicit) {
    if (explicit) return String(explicit).trim();
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

  async function summarizeInventoryForTenant(client, tenantId) {
    let query = client.from('inventory').select('id, stock_quantity');
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
    if (error) return { productCount: 0, totalStock: 0, error: error.message };

    const rows = data || [];
    const totalStock = rows.reduce(
      (sum, row) => sum + Math.max(0, parseInt(row.stock_quantity, 10) || 0),
      0
    );
    return { productCount: rows.length, totalStock, error: null };
  }

  /**
   * Branch status from public.tenants (+ inventory summary per branch).
   * @param {string} [tenantId] — optional; defaults to current tenant. Omit to list all visible tenants.
   */
  async function getBranchStatus(tenantId) {
    const client = getClient();
    if (!client) {
      return { ok: false, branches: [], error: 'Supabase غير مهيأ' };
    }

    const scopedTenant = tenantId ? resolveTenantId(tenantId) : resolveTenantId();

    let query = client
      .from('tenants')
      .select('id, company_name, status, subscription_tier, health_score, created_at')
      .order('company_name', { ascending: true });

    if (scopedTenant) query = query.eq('id', scopedTenant);

    const { data, error } = await query;
    if (error) return { ok: false, branches: [], error: error.message };

    const tenants = data || [];
    const branches = await Promise.all(
      tenants.map(async (tenant) => {
        const inv = await summarizeInventoryForTenant(client, tenant.id);
        return {
          id: tenant.id,
          company_name: tenant.company_name,
          status: tenant.status,
          subscription_tier: tenant.subscription_tier,
          health_score: tenant.health_score,
          created_at: tenant.created_at,
          productCount: inv.productCount,
          totalStock: inv.totalStock,
          inventoryError: inv.error,
        };
      })
    );

    return { ok: true, branches };
  }

  async function opUpdateSaleStatus(payload) {
    const client = getClient();
    if (!client) return { ok: false, error: 'No client' };

    const saleId = payload?.saleId ?? payload?.id;
    const status = String(payload?.status || '').trim();
    if (!saleId || !status) {
      return { ok: false, error: 'saleId و status مطلوبان' };
    }

    const tenantId = resolveTenantId(payload?.tenant_id ?? payload?.tenantId);
    let query = client
      .from('sales')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', saleId);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query.select('id, status').single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  }

  async function opInsertInventory(payload) {
    const client = getClient();
    if (!client) return { ok: false, error: 'No client' };

    const productName = normalizeProductName(payload?.product_name ?? payload?.productName);
    if (!productName) return { ok: false, error: 'product_name مطلوب' };

    const row = {
      product_name: productName,
      stock_quantity: Math.max(0, parseInt(payload?.stock_quantity ?? payload?.quantity, 10) || 0),
      selling_price: Number(payload?.selling_price ?? payload?.price) || 0,
      cost_price: Number(payload?.cost_price ?? payload?.cost) || 0,
      tenant_id: resolveTenantId(payload?.tenant_id ?? payload?.tenantId),
    };

    if (!row.tenant_id) {
      return { ok: false, error: 'tenant_id غير مضبوط' };
    }

    const { data, error } = await client
      .from('inventory')
      .insert(row)
      .select('id, product_name, stock_quantity, tenant_id')
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  }

  async function opUpdateInventoryStock(payload) {
    const client = getClient();
    if (!client) return { ok: false, error: 'No client' };

    const inventoryId = payload?.inventoryId ?? payload?.id;
    const stock = payload?.stock_quantity ?? payload?.quantity;
    if (!inventoryId || stock == null) {
      return { ok: false, error: 'inventoryId و stock_quantity مطلوبان' };
    }

    const tenantId = resolveTenantId(payload?.tenant_id ?? payload?.tenantId);
    let query = client
      .from('inventory')
      .update({ stock_quantity: Math.max(0, parseInt(stock, 10) || 0) })
      .eq('id', inventoryId);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query
      .select('id, product_name, stock_quantity, tenant_id')
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  }

  async function findInventoryByName(client, tenantId, productName) {
    let query = client
      .from('inventory')
      .select('id, product_name, stock_quantity, tenant_id')
      .ilike('product_name', productName);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query.limit(5);
    if (error) return { ok: false, error: error.message };

    const target = normalizeProductName(productName).toLowerCase();
    const row = (data || []).find(
      (r) => normalizeProductName(r.product_name).toLowerCase() === target
    );
    return { ok: true, row: row || null };
  }

  async function opTransferInventory(payload) {
    const client = getClient();
    if (!client) return { ok: false, error: 'No client' };

    const productName = normalizeProductName(payload?.product_name ?? payload?.productName);
    const qty = Math.max(1, parseInt(payload?.quantity, 10) || 0);
    const fromTenant = resolveTenantId(payload?.from_tenant_id ?? payload?.fromTenantId);
    const toTenant = resolveTenantId(payload?.to_tenant_id ?? payload?.toTenantId);

    if (!productName || !fromTenant || !toTenant) {
      return { ok: false, error: 'product_name و from_tenant_id و to_tenant_id مطلوبة' };
    }
    if (fromTenant === toTenant) {
      return { ok: false, error: 'لا يمكن النقل لنفس الفرع' };
    }

    const source = await findInventoryByName(client, fromTenant, productName);
    if (!source.ok) return { ok: false, error: source.error };
    if (!source.row) {
      return { ok: false, error: 'المنتج غير موجود في الفرع المصدر' };
    }

    const available = Math.max(0, parseInt(source.row.stock_quantity, 10) || 0);
    if (available < qty) {
      return { ok: false, error: 'الكمية غير كافية في الفرع المصدر', code: 'INSUFFICIENT_STOCK' };
    }

    const { error: deductError } = await client
      .from('inventory')
      .update({ stock_quantity: available - qty })
      .eq('id', source.row.id);

    if (deductError) return { ok: false, error: deductError.message };

    const dest = await findInventoryByName(client, toTenant, productName);
    if (!dest.ok) {
      await client
        .from('inventory')
        .update({ stock_quantity: available })
        .eq('id', source.row.id);
      return { ok: false, error: dest.error };
    }

    if (dest.row) {
      const destStock = Math.max(0, parseInt(dest.row.stock_quantity, 10) || 0);
      const { error: addError } = await client
        .from('inventory')
        .update({ stock_quantity: destStock + qty })
        .eq('id', dest.row.id);

      if (addError) {
        await client
          .from('inventory')
          .update({ stock_quantity: available })
          .eq('id', source.row.id);
        return { ok: false, error: addError.message };
      }

      return {
        ok: true,
        data: {
          product_name: productName,
          quantity: qty,
          from_tenant_id: fromTenant,
          to_tenant_id: toTenant,
          destination_inventory_id: dest.row.id,
        },
      };
    }

    const { data: inserted, error: insertError } = await client
      .from('inventory')
      .insert({
        product_name: productName,
        stock_quantity: qty,
        selling_price: 0,
        cost_price: 0,
        tenant_id: toTenant,
      })
      .select('id')
      .single();

    if (insertError) {
      await client
        .from('inventory')
        .update({ stock_quantity: available })
        .eq('id', source.row.id);
      return { ok: false, error: insertError.message };
    }

    return {
      ok: true,
      data: {
        product_name: productName,
        quantity: qty,
        from_tenant_id: fromTenant,
        to_tenant_id: toTenant,
        destination_inventory_id: inserted?.id,
        created: true,
      },
    };
  }

  /**
   * Execute an operational command against Supabase.
   * @param {string} type — OPERATION_TYPES value
   * @param {object} payload
   */
  async function performOperation(type, payload = {}) {
    const op = String(type || '').trim().toUpperCase();

    switch (op) {
      case OPERATION_TYPES.UPDATE_SALE_STATUS:
        return opUpdateSaleStatus(payload);
      case OPERATION_TYPES.INSERT_INVENTORY:
        return opInsertInventory(payload);
      case OPERATION_TYPES.UPDATE_INVENTORY_STOCK:
        return opUpdateInventoryStock(payload);
      case OPERATION_TYPES.TRANSFER_INVENTORY:
        return opTransferInventory(payload);
      default:
        return { ok: false, error: `عملية غير معروفة: ${type}` };
    }
  }

  const OperationsCenter = {
    OPERATION_TYPES,
    getBranchStatus,
    performOperation,
  };

  global.OperationsCenter = OperationsCenter;
  global.performOperation = performOperation;
  global.getBranchStatus = getBranchStatus;
})(typeof window !== 'undefined' ? window : global);
