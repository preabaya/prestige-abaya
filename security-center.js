/**
 * Prestige Abaya — Security Center (smart firewall for sales)
 * Requires: security_logs table — run supabase/migrate-security-logs.sql
 */
(function (global) {
  'use strict';

  const TENANT_STORAGE_KEY = 'current_tenant_id';
  const MAX_DISCOUNT_PERCENT = 50;
  const OFF_HOURS_START = 23;
  const OFF_HOURS_END = 6;

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

  function parseSaleTimestamp(sale) {
    const raw = sale?.created_at ?? sale?.createdAt ?? sale?.timestamp;
    if (!raw) return new Date();
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }

  function impliedDiscountPercent(sale) {
    if (sale?.discountPercent != null && Number.isFinite(Number(sale.discountPercent))) {
      return Math.max(0, Number(sale.discountPercent));
    }

    if (sale?.discountType === 'percent' && sale?.discountValue != null) {
      return Math.min(100, Math.max(0, Number(sale.discountValue) || 0));
    }

    const qty = Math.max(1, parseInt(sale?.quantity ?? sale?.qty, 10) || 1);
    const unitPrice = Number(sale?.price ?? sale?.unitPriceAud ?? 0);
    const gross = unitPrice * qty;
    if (gross <= 0) return 0;

    const lineTotal = Number(
      sale?.line_total_aud ?? sale?.lineTotalAud ?? sale?.lineTotal ?? gross
    );
    const discountAud = gross - lineTotal;
    if (discountAud <= 0) return 0;
    return Math.round((discountAud / gross) * 10000) / 100;
  }

  function isOffHours(date) {
    const hour = date.getHours();
    if (OFF_HOURS_START > OFF_HOURS_END) {
      return hour >= OFF_HOURS_START || hour < OFF_HOURS_END;
    }
    return hour >= OFF_HOURS_START && hour < OFF_HOURS_END;
  }

  function buildChecks(saleData) {
    const reasons = [];
    const discountPct = impliedDiscountPercent(saleData);

    if (discountPct > MAX_DISCOUNT_PERCENT) {
      reasons.push({
        alert_type: 'HIGH_DISCOUNT',
        severity: discountPct > 70 ? 'critical' : 'warning',
        message: `خصم غير طبيعي: ${discountPct.toFixed(1)}% (الحد ${MAX_DISCOUNT_PERCENT}%)`,
        metadata: { discount_percent: discountPct },
      });
    }

    const when = parseSaleTimestamp(saleData);
    if (isOffHours(when)) {
      reasons.push({
        alert_type: 'OFF_HOURS_SALE',
        severity: 'warning',
        message: `عملية بيع في وقت غير منطقي (${when.toLocaleString('ar-SA')})`,
        metadata: { hour: when.getHours(), local_time: when.toISOString() },
      });
    }

    return reasons;
  }

  async function logSecurityEvent(saleData, reason) {
    const client = getClient();
    if (!client) return { ok: false, error: 'Supabase غير مهيأ' };

    const tenantId = resolveTenantId(saleData?.tenant_id ?? saleData?.tenantId);
    if (!tenantId) return { ok: false, error: 'tenant_id غير مضبوط' };

    const row = {
      tenant_id: tenantId,
      sale_id: saleData?.id != null ? String(saleData.id) : null,
      alert_type: reason.alert_type,
      severity: reason.severity,
      message: reason.message,
      sale_snapshot: {
        product_name: saleData?.product_name ?? saleData?.productName ?? null,
        quantity: saleData?.quantity ?? null,
        price: saleData?.price ?? saleData?.unitPriceAud ?? null,
        line_total_aud: saleData?.line_total_aud ?? saleData?.lineTotalAud ?? null,
        discount_percent: impliedDiscountPercent(saleData),
        ...reason.metadata,
      },
      reviewed: false,
    };

    const { data, error } = await client
      .from('security_logs')
      .insert(row)
      .select('id, alert_type, severity, message, created_at, reviewed')
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  }

  /**
   * Inspect a new sale; log to security_logs when suspicious.
   * @returns {Promise<{ suspicious: boolean, reasons: object[], logs: object[] }>}
   */
  async function detectSuspiciousActivity(saleData) {
    const reasons = buildChecks(saleData || {});
    if (!reasons.length) {
      return { suspicious: false, reasons: [], logs: [] };
    }

    const logs = [];
    for (const reason of reasons) {
      const logged = await logSecurityEvent(saleData, reason);
      logs.push({ reason, logged });
    }

    try {
      global.dispatchEvent(
        new CustomEvent('security-alert', {
          detail: { sale: saleData, reasons, logs },
        })
      );
    } catch (_) { /* ignore */ }

    console.warn('[SecurityCenter] Suspicious sale detected:', reasons.map((r) => r.message));

    return { suspicious: true, reasons, logs };
  }

  /**
   * Unreviewed suspicious activity for managers.
   */
  async function getSecuritySummary() {
    const client = getClient();
    if (!client) {
      return { ok: false, items: [], error: 'Supabase غير مهيأ' };
    }

    const tenantId = resolveTenantId();
    let query = client
      .from('security_logs')
      .select('id, sale_id, alert_type, severity, message, sale_snapshot, reviewed, created_at')
      .eq('reviewed', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
    if (error) return { ok: false, items: [], error: error.message };

    const items = data || [];
    return {
      ok: true,
      count: items.length,
      items,
      criticalCount: items.filter((i) => i.severity === 'critical').length,
      warningCount: items.filter((i) => i.severity === 'warning').length,
    };
  }

  /**
   * Mark a security log as reviewed by manager.
   */
  async function markReviewed(logId, reviewedBy) {
    const client = getClient();
    if (!client) return { ok: false, error: 'No client' };

    const tenantId = resolveTenantId();
    let query = client
      .from('security_logs')
      .update({
        reviewed: true,
        reviewed_at: new Date().toISOString(),
        reviewed_by: String(reviewedBy || 'manager').trim(),
      })
      .eq('id', logId);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query.select('id, reviewed').single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  }

  const SecurityCenter = {
    detectSuspiciousActivity,
    getSecuritySummary,
    markReviewed,
    MAX_DISCOUNT_PERCENT,
  };

  global.SecurityCenter = SecurityCenter;
})(typeof window !== 'undefined' ? window : global);
