/**
 * Prestige Abaya ERP — Inventory (public.inventory table)
 */
(function () {
  'use strict';

  const CURRENT_TENANT_KEY = 'current_tenant_id';
  const TABLE = 'inventory';

  let supabase = null;
  let inventoryRows = [];
  let editingRow = null;
  let activeModal = null;

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

  function formatDateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('ar-AE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  }

  function mapRow(row) {
    const stock = Math.max(0, parseInt(row.stock_quantity, 10) || 0);
    const minThreshold = Math.max(0, parseInt(row.min_threshold, 10) || 0);
    return {
      id: row.id,
      product_name: String(row.product_name || '').trim() || '—',
      stock_quantity: stock,
      min_threshold: minThreshold,
      cost_price: Number(row.cost_price) || 0,
      selling_price: Number(row.selling_price) || 0,
      last_updated: row.last_updated,
      tenant_id: row.tenant_id,
    };
  }

  function isLowStock(row) {
    return row.stock_quantity < row.min_threshold;
  }

  function alertStatus(row) {
    if (row.stock_quantity === 0) {
      return { label: 'نفد المخزون', className: 'inv-alert-pill--out', isLow: true };
    }
    if (isLowStock(row)) {
      return { label: 'تحت حد التنبيه', className: 'inv-alert-pill--low', isLow: true };
    }
    return { label: 'طبيعي', className: 'inv-alert-pill--ok', isLow: false };
  }

  async function fetchInventory() {
    let query = supabase
      .from(TABLE)
      .select('*')
      .order('product_name', { ascending: true });

    const tenantId = getTenantId();
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(mapRow);
  }

  async function insertProduct(payload) {
    const tenantId = getTenantId();
    if (!tenantId) {
      throw new Error('أضف defaultTenantId في supabase.config.js');
    }

    const row = {
      product_name: String(payload.product_name).trim(),
      stock_quantity: Math.max(0, parseInt(payload.stock_quantity, 10) || 0),
      min_threshold: Math.max(0, parseInt(payload.min_threshold, 10) || 5),
      cost_price: Number(payload.cost_price) || 0,
      selling_price: Number(payload.selling_price) || 0,
      tenant_id: tenantId,
      last_updated: new Date().toISOString(),
    };

    const { error } = await supabase.from(TABLE).insert(row);
    if (error) throw new Error(error.message);
  }

  async function updateStockQuantity(id, newQty) {
    const qty = Math.max(0, Math.trunc(Number(newQty)));
    const payload = {
      stock_quantity: qty,
      last_updated: new Date().toISOString(),
    };

    let query = supabase.from(TABLE).update(payload).eq('id', id);
    const tenantId = getTenantId();
    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { error } = await query;
    if (error) throw new Error(error.message);
    return qty;
  }

  function updateKpis(rows) {
    const total = rows.length;
    const units = rows.reduce((s, r) => s + r.stock_quantity, 0);
    const low = rows.filter(isLowStock).length;

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
        const status = alertStatus(row);
        const rowClass = status.isLow ? 'inv-row--low' : '';
        return `
          <tr class="${rowClass}" data-id="${escapeHtml(row.id)}">
            <td class="font-medium">${escapeHtml(row.product_name)}</td>
            <td class="tabular-nums font-bold">${row.stock_quantity}</td>
            <td class="tabular-nums text-slate-600">${row.min_threshold}</td>
            <td class="tabular-nums">${escapeHtml(formatAud(row.cost_price))}</td>
            <td class="tabular-nums">${escapeHtml(formatAud(row.selling_price))}</td>
            <td><span class="inv-alert-pill ${status.className}">${escapeHtml(status.label)}</span></td>
            <td class="dash-table__muted text-xs whitespace-nowrap">${escapeHtml(formatDateTime(row.last_updated))}</td>
            <td>
              <button type="button" class="inv-btn-update" data-update-stock="${escapeHtml(row.id)}">
                Update Stock
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('[data-update-stock]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-update-stock');
        const row = inventoryRows.find((r) => String(r.id) === String(id));
        if (row) openStockModal(row);
      });
    });

    const updated = $('inv-updated');
    if (updated) updated.textContent = `آخر تحديث: ${formatDateTime(new Date())}`;
  }

  function showBanner(message, title) {
    const el = $('status-banner');
    if (!el) return;
    el.classList.add('alert-banner--error');
    if ($('status-banner-title')) $('status-banner-title').textContent = title || 'تعذّر الاتصال';
    if ($('status-banner-message')) $('status-banner-message').textContent = message;
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

  function openModal(id) {
    closeModals();
    activeModal = id;
    $(id)?.classList.remove('hidden');
  }

  function closeModals() {
    if (activeModal) $(activeModal)?.classList.add('hidden');
    activeModal = null;
    editingRow = null;
  }

  function openAddModal() {
    $('add-product-form')?.reset();
    $('add-modal-error')?.classList.add('hidden');
    const threshold = $('add-product-form')?.elements?.min_threshold;
    if (threshold) threshold.value = '5';
    openModal('add-modal');
  }

  function openStockModal(row) {
    editingRow = row;
    $('stock-modal-product').textContent = row.product_name;
    $('stock-modal-current').textContent = String(row.stock_quantity);
    $('stock-modal-threshold').textContent = String(row.min_threshold);
    $('stock-modal-delta').value = '';
    $('stock-modal-absolute').value = '';
    $('stock-modal-error').classList.add('hidden');
    updateStockPreview();
    openModal('stock-modal');
  }

  function resolveNewStock() {
    const absRaw = $('stock-modal-absolute')?.value?.trim();
    if (absRaw !== '' && absRaw != null) {
      const abs = parseInt(absRaw, 10);
      if (!Number.isFinite(abs) || abs < 0) return { error: 'أدخل كمية صحيحة (0 أو أكثر)' };
      return { qty: abs };
    }
    const deltaRaw = $('stock-modal-delta')?.value?.trim();
    if (deltaRaw !== '' && deltaRaw != null) {
      const delta = parseInt(deltaRaw, 10);
      if (!Number.isFinite(delta)) return { error: 'أدخل رقماً صحيحاً (+ أو −)' };
      return { qty: Math.max(0, (editingRow?.stock_quantity ?? 0) + delta) };
    }
    return { error: 'أدخل تعديلاً أو كمية جديدة' };
  }

  function updateStockPreview() {
    const preview = $('stock-modal-preview');
    const resolved = resolveNewStock();
    if (!preview) return;
    preview.textContent = resolved.error ? '' : `بعد الحفظ: ${resolved.qty} قطعة`;
  }

  async function saveStockModal() {
    const errEl = $('stock-modal-error');
    const resolved = resolveNewStock();
    if (resolved.error) {
      errEl.textContent = resolved.error;
      errEl.classList.remove('hidden');
      return;
    }
    if (!editingRow) return;

    const btn = $('stock-modal-save');
    if (btn) btn.disabled = true;
    try {
      await updateStockQuantity(editingRow.id, resolved.qty);
      closeModals();
      await loadInventory();
    } catch (err) {
      errEl.textContent = err.message || 'فشل التحديث';
      errEl.classList.remove('hidden');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function handleAddProduct(ev) {
    ev.preventDefault();
    const errEl = $('add-modal-error');
    const form = $('add-product-form');
    if (!form) return;

    const fd = new FormData(form);
    const name = (fd.get('product_name') || '').toString().trim();
    if (!name) {
      errEl.textContent = 'اسم المنتج مطلوب';
      errEl.classList.remove('hidden');
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      await insertProduct({
        product_name: name,
        stock_quantity: fd.get('stock_quantity'),
        min_threshold: fd.get('min_threshold'),
        cost_price: fd.get('cost_price'),
        selling_price: fd.get('selling_price'),
      });
      closeModals();
      await loadInventory();
    } catch (err) {
      errEl.textContent = err.message || 'فشل إضافة المنتج';
      errEl.classList.remove('hidden');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  async function loadInventory() {
    const tbody = $('inventory-tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" class="dash-empty text-slate-600">جاري تحميل المخزون…</td></tr>';
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
        `${err.message || err}. نفّذ supabase/migrate-inventory-table.sql وتأكد من RLS و defaultTenantId.`,
        'خطأ في الاتصال بقاعدة البيانات'
      );
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="dash-empty text-red-600">تعذّر تحميل المخزون</td></tr>';
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

  function initModals() {
    document.querySelectorAll('[data-close-modal]').forEach((el) => {
      el.addEventListener('click', closeModals);
    });
    $('add-product-btn')?.addEventListener('click', openAddModal);
    $('add-product-form')?.addEventListener('submit', handleAddProduct);
    $('stock-modal-delta')?.addEventListener('input', updateStockPreview);
    $('stock-modal-absolute')?.addEventListener('input', updateStockPreview);
    $('stock-modal-save')?.addEventListener('click', saveStockModal);
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('footer-year').textContent = String(new Date().getFullYear());
    initSidebar();
    initModals();
    $('refresh-btn')?.addEventListener('click', loadInventory);
    $('status-banner-close')?.addEventListener('click', hideBanner);
    loadInventory();
  });
})();
