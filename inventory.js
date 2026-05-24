/**
 * Prestige Abaya ERP — Inventory Management
 * Uses public.products in Supabase (quantity = available stock; decremented on sales in main app).
 */
(function () {
  'use strict';

  const CURRENT_TENANT_KEY = 'current_tenant_id';
  const LOW_STOCK_THRESHOLD = 5;
  const INVENTORY_TABLE = 'products';

  let supabase = null;
  let inventoryRows = [];
  let editingProduct = null;

  const $ = (id) => document.getElementById(id);

  function getConfig() {
    return typeof window !== 'undefined' ? window.SUPABASE_CONFIG || {} : {};
  }

  function getTenantId() {
    try {
      const stored = localStorage.getItem(CURRENT_TENANT_KEY);
      if (stored && String(stored).trim()) return String(stored).trim();
    } catch (_) { /* ignore */ }
    const cfg = getConfig();
    return cfg.defaultTenantId ? String(cfg.defaultTenantId).trim() : null;
  }

  function initSupabase() {
    const cfg = getConfig();
    if (!cfg.url || !cfg.anonKey) {
      throw new Error('أكمل إعداد supabase.config.js (url و anonKey)');
    }
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      throw new Error('مكتبة supabase-js غير محمّلة');
    }
    return window.supabase.createClient(cfg.url, cfg.anonKey);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatAud(n) {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(n) || 0);
  }

  function formatDateTime(d) {
    return new Intl.DateTimeFormat('ar-AE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  }

  function alertStatus(qty) {
    const q = Math.max(0, parseInt(qty, 10) || 0);
    if (q === 0) {
      return { label: 'نفد المخزون', className: 'inv-alert-pill--out', isLow: true };
    }
    if (q < LOW_STOCK_THRESHOLD) {
      return { label: 'تنبيه — مخزون منخفض', className: 'inv-alert-pill--low', isLow: true };
    }
    return { label: 'طبيعي', className: 'inv-alert-pill--ok', isLow: false };
  }

  function mapProductRow(row) {
    const qty = Math.max(0, parseInt(row.quantity, 10) || 0);
    return {
      id: row.id,
      code: row.code,
      name: row.name || row.code || '—',
      quantity: qty,
      cost: Number(row.cost) || 0,
      price: Number(row.price) || 0,
      tenant_id: row.tenant_id,
    };
  }

  /**
   * Fetch inventory from Supabase `products` (ERP stock table).
   * Falls back to computing available qty from sales only if products query fails entirely.
   */
  async function fetchInventory() {
    let query = supabase
      .from(INVENTORY_TABLE)
      .select('id, code, name, cost, price, quantity, tenant_id, updated_at')
      .order('name', { ascending: true });

    const tenantId = getTenantId();
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (!error) {
      return (data || []).map(mapProductRow);
    }

    console.warn('[Inventory] products fetch failed, trying sales aggregation:', error.message);
    return fetchInventoryFromSalesFallback(tenantId);
  }

  /** Optional fallback: estimate stock when products table is unreachable */
  async function fetchInventoryFromSalesFallback(tenantId) {
    let salesQuery = supabase
      .from('sales')
      .select('product_name, quantity, status')
      .limit(2000);

    if (tenantId) salesQuery = salesQuery.eq('tenant_id', tenantId);

    const { data: sales, error } = await salesQuery;
    if (error) throw new Error(error.message);

    const soldByProduct = new Map();
    (sales || []).forEach((s) => {
      if (s.status === 'returned') return;
      const name = String(s.product_name || '').trim();
      if (!name) return;
      const qty = parseInt(s.quantity, 10) || 1;
      soldByProduct.set(name, (soldByProduct.get(name) || 0) + qty);
    });

    return [...soldByProduct.entries()].map(([name, sold]) => ({
      id: `est-${name.slice(0, 40)}`,
      code: name,
      name,
      quantity: 0,
      cost: 0,
      price: 0,
      tenant_id: tenantId,
      _estimated: true,
      _soldNote: sold,
    }));
  }

  async function updateProductQuantity(productId, newQuantity) {
    const qty = Math.max(0, Math.trunc(Number(newQuantity)));
    const payload = {
      quantity: qty,
      updated_at: new Date().toISOString(),
    };

    let query = supabase.from(INVENTORY_TABLE).update(payload).eq('id', productId);
    const tenantId = getTenantId();
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { error } = await query;
    if (error) throw new Error(error.message);
    return qty;
  }

  function updateKpis(rows) {
    const total = rows.length;
    const units = rows.reduce((s, r) => s + r.quantity, 0);
    const low = rows.filter((r) => r.quantity < LOW_STOCK_THRESHOLD).length;

    if ($('inv-kpi-total')) $('inv-kpi-total').textContent = String(total);
    if ($('inv-kpi-units')) $('inv-kpi-units').textContent = String(units);
    if ($('inv-kpi-low')) $('inv-kpi-low').textContent = String(low);
  }

  function renderTable(rows) {
    const tbody = $('inventory-tbody');
    const empty = $('inventory-empty');
    if (!tbody) return;

    inventoryRows = rows;

    if (!rows.length) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    tbody.innerHTML = rows
      .map((row) => {
        const status = alertStatus(row.quantity);
        const rowClass = status.isLow ? 'inv-row--low' : '';
        const estNote = row._estimated
          ? ` <span class="text-xs font-normal">(تقدير — ${row._soldNote} مباع)</span>`
          : '';
        return `
          <tr class="${rowClass}" data-id="${escapeHtml(row.id)}">
            <td>${escapeHtml(row.name)}${estNote}</td>
            <td class="tabular-nums font-bold">${row.quantity}</td>
            <td class="tabular-nums">${escapeHtml(formatAud(row.cost))}</td>
            <td class="tabular-nums">${escapeHtml(formatAud(row.price))}</td>
            <td><span class="inv-alert-pill ${status.className}">${escapeHtml(status.label)}</span></td>
            <td>
              <button type="button" class="inv-btn-update" data-update-qty="${escapeHtml(row.id)}">
                تحديث الكمية
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('[data-update-qty]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-update-qty');
        const product = inventoryRows.find((r) => String(r.id) === String(id));
        if (product) openQtyModal(product);
      });
    });

    const updated = $('inv-updated');
    if (updated) updated.textContent = `آخر تحديث: ${formatDateTime(new Date())}`;
  }

  function showBanner(message, title) {
    const el = $('status-banner');
    const msgEl = $('status-banner-message');
    const titleEl = $('status-banner-title');
    if (!el) return;
    el.classList.add('alert-banner--error');
    if (titleEl) titleEl.textContent = title || 'تعذّر الاتصال';
    if (msgEl) msgEl.textContent = message;
    el.classList.remove('hidden');
  }

  function hideBanner() {
    $('status-banner')?.classList.add('hidden');
  }

  function setConnectionState(online) {
    const badge = $('connection-badge');
    const text = $('connection-badge-text');
    if (!badge) return;
    badge.classList.add('is-visible');
    badge.classList.toggle('conn-badge--online', online);
    badge.classList.toggle('conn-badge--offline', !online);
    if (text) text.textContent = online ? 'متصل' : 'غير متصل';
  }

  function openQtyModal(product) {
    if (product._estimated) {
      showBanner('لا يمكن التحديث من وضع التقدير. أضف المنتج في جدول products أولاً.', 'تنبيه');
      return;
    }
    editingProduct = product;
    $('qty-modal-product').textContent = product.name;
    $('qty-modal-current').textContent = String(product.quantity);
    $('qty-modal-delta').value = '';
    $('qty-modal-absolute').value = '';
    $('qty-modal-error').classList.add('hidden');
    updateQtyPreview();
    $('qty-modal').classList.remove('hidden');
  }

  function closeQtyModal() {
    editingProduct = null;
    $('qty-modal').classList.add('hidden');
  }

  function resolveNewQuantity() {
    const absRaw = $('qty-modal-absolute')?.value?.trim();
    if (absRaw !== '' && absRaw != null) {
      const abs = parseInt(absRaw, 10);
      if (!Number.isFinite(abs) || abs < 0) return { error: 'أدخل كمية صحيحة (0 أو أكثر)' };
      return { qty: abs };
    }
    const deltaRaw = $('qty-modal-delta')?.value?.trim();
    if (deltaRaw !== '' && deltaRaw != null) {
      const delta = parseInt(deltaRaw, 10);
      if (!Number.isFinite(delta)) return { error: 'أدخل رقماً صحيحاً للتعديل (+ أو −)' };
      return { qty: Math.max(0, (editingProduct?.quantity ?? 0) + delta) };
    }
    return { error: 'أدخل تعديلاً أو كمية جديدة' };
  }

  function updateQtyPreview() {
    const preview = $('qty-modal-preview');
    const resolved = resolveNewQuantity();
    if (!preview) return;
    if (resolved.error) {
      preview.textContent = '';
      return;
    }
    preview.textContent = `الكمية بعد الحفظ: ${resolved.qty}`;
  }

  async function saveQtyModal() {
    const errEl = $('qty-modal-error');
    const resolved = resolveNewQuantity();
    if (resolved.error) {
      errEl.textContent = resolved.error;
      errEl.classList.remove('hidden');
      return;
    }
    if (!editingProduct) return;

    const btn = $('qty-modal-save');
    if (btn) btn.disabled = true;

    try {
      const newQty = await updateProductQuantity(editingProduct.id, resolved.qty);
      closeQtyModal();
      await loadInventory();
    } catch (err) {
      console.error('[Inventory] update quantity:', err);
      errEl.textContent = err.message || 'فشل حفظ الكمية';
      errEl.classList.remove('hidden');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function loadInventory() {
    const tbody = $('inventory-tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" class="dash-empty text-slate-600">جاري تحميل المخزون…</td></tr>`;
    }

    const refreshBtn = $('refresh-btn');
    if (refreshBtn) refreshBtn.disabled = true;

    try {
      if (!supabase) supabase = initSupabase();
      const rows = await fetchInventory();
      hideBanner();
      updateKpis(rows);
      renderTable(rows);
      setConnectionState(true);
    } catch (err) {
      console.error('[Inventory]', err);
      setConnectionState(false);
      showBanner(
        `${err.message || err}. تحقق من supabase.config.js وسياسات RLS لجدول products.`,
        'خطأ في الاتصال بقاعدة البيانات'
      );
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="dash-empty text-red-600">تعذّر تحميل المخزون</td></tr>`;
      }
    } finally {
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }

  function initSidebar() {
    const sidebar = $('sidebar');
    const overlay = $('sidebar-overlay');
    const toggle = $('sidebar-toggle');

    function open() {
      sidebar?.classList.remove('-translate-x-full', 'rtl:translate-x-full');
      overlay?.classList.remove('hidden');
    }
    function close() {
      sidebar?.classList.add('-translate-x-full', 'rtl:translate-x-full');
      overlay?.classList.add('hidden');
    }

    toggle?.addEventListener('click', open);
    overlay?.addEventListener('click', close);
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) close();
    });
  }

  function initModal() {
    document.querySelectorAll('[data-close-modal]').forEach((el) => {
      el.addEventListener('click', closeQtyModal);
    });
    $('qty-modal-delta')?.addEventListener('input', updateQtyPreview);
    $('qty-modal-absolute')?.addEventListener('input', updateQtyPreview);
    $('qty-modal-save')?.addEventListener('click', saveQtyModal);
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('footer-year').textContent = String(new Date().getFullYear());
    initSidebar();
    initModal();
    $('refresh-btn')?.addEventListener('click', loadInventory);
    $('status-banner-close')?.addEventListener('click', hideBanner);
    loadInventory();
  });
})();
