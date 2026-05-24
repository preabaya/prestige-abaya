/**
 * Prestige Abaya ERP — Inventory (public.inventory)
 * Fetch: supabase.from('inventory').select('*') — no required tenant_id filter on query.
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

  /** Optional — used only when inserting/updating, not required for SELECT */
  function getTenantId() {
    try {
      const stored = localStorage.getItem(CURRENT_TENANT_KEY);
      if (stored && String(stored).trim()) return String(stored).trim();
    } catch (_) { /* ignore */ }
    const cfg = getConfig();
    return cfg.defaultTenantId ? String(cfg.defaultTenantId).trim() : null;
  }

  function initSupabase() {
    if (window.DbHelper?.getClient) {
      const client = window.DbHelper.getClient();
      if (client) return client;
    }
    const cfg = getConfig();
    if (!cfg.url || !cfg.anonKey) {
      throw new Error('أكمل إعداد supabase.config.js');
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
    return new Intl.DateTimeFormat('ar-AE', { dateStyle: 'short', timeStyle: 'short' }).format(d);
  }

  function mapRow(row) {
    if (!row || typeof row !== 'object') return null;
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
      tenant_id: row.tenant_id != null ? String(row.tenant_id) : null,
    };
  }

  function isLowStock(row) {
    return row.stock_quantity < row.min_threshold;
  }

  function alertLabel(row) {
    if (row.stock_quantity === 0) return { text: 'نفد', low: true };
    if (isLowStock(row)) return { text: 'منخفض', low: true };
    return { text: 'طبيعي', low: false };
  }

  /**
   * Load all rows — never applies .eq('tenant_id') on the query.
   * Optional client-side filter only if every row has tenant_id set.
   */
  async function fetchInventory() {
    const { data, error } = await supabase.from(TABLE).select('*');

    if (error) {
      console.error('[Inventory] select(*):', error);
      throw error;
    }

    let rows = (data || []).map(mapRow).filter(Boolean);

    const tenantId = getTenantId();
    if (tenantId && rows.some((r) => r.tenant_id)) {
      const scoped = rows.filter((r) => !r.tenant_id || r.tenant_id === tenantId);
      if (scoped.length) rows = scoped;
    }

    rows.sort((a, b) => a.product_name.localeCompare(b.product_name, 'ar'));
    return rows;
  }

  function buildInsertRow(payload) {
    const row = {
      product_name: String(payload.product_name).trim(),
      stock_quantity: Math.max(0, parseInt(payload.stock_quantity, 10) || 0),
      min_threshold: Math.max(0, parseInt(payload.min_threshold, 10) || 5),
      cost_price: Number(payload.cost_price) || 0,
      selling_price: Number(payload.selling_price) || 0,
      last_updated: new Date().toISOString(),
    };
    const tenantId = getTenantId();
    if (tenantId) row.tenant_id = tenantId;
    return row;
  }

  async function insertProduct(payload) {
    const { error } = await supabase.from(TABLE).insert(buildInsertRow(payload));
    if (error) throw error;
  }

  async function updateStockInDb(productId, newQty) {
    const qty = Math.max(0, Math.trunc(Number(newQty)));
    const { error } = await supabase
      .from('inventory')
      .update({ stock_quantity: qty })
      .eq('id', productId);

    if (error) throw error;
    return qty;
  }

  function updateKpis(rows) {
    $('inv-kpi-total').textContent = String(rows.length);
    $('inv-kpi-units').textContent = String(rows.reduce((s, r) => s + r.stock_quantity, 0));
    $('inv-kpi-low').textContent = String(rows.filter(isLowStock).length);
  }

  function renderTable(rows) {
    const tbody = $('inventory-tbody');
    const empty = $('inventory-empty');
    if (!tbody) return;

    inventoryRows = rows;

    if (!rows.length) {
      tbody.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    tbody.innerHTML = rows
      .map((row) => {
        const alert = alertLabel(row);
        const rowClass = alert.low ? 'inv-row--low' : '';
        return `
          <tr class="${rowClass}">
            <td>${escapeHtml(row.product_name)}</td>
            <td>${row.stock_quantity}</td>
            <td>${row.min_threshold}</td>
            <td>${escapeHtml(formatAud(row.cost_price))}</td>
            <td>${escapeHtml(formatAud(row.selling_price))}</td>
            <td><span class="inv-alert-pill${alert.low ? ' inv-alert-pill--low' : ''}">${escapeHtml(alert.text)}</span></td>
            <td style="color:#64748b;font-size:0.8rem">${escapeHtml(formatDateTime(row.last_updated))}</td>
            <td><button type="button" class="inv-btn inv-btn--action" data-update-stock="${String(row.id)}">Update Stock</button></td>
          </tr>
        `;
      })
      .join('');

    const updated = $('inv-updated');
    if (updated) updated.textContent = `آخر تحديث: ${formatDateTime(new Date())}`;
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
    const t = $('add-product-form')?.elements?.min_threshold;
    if (t) t.value = '5';
    openModal('add-modal');
  }

  /** Opens the Update Stock modal for a product row */
  function openUpdateStockModal(row) {
    if (!row || row.id == null) return;

    editingRow = row;
    const errEl = $('stock-modal-error');
    const qtyInput = $('stock-modal-qty');

    if ($('stock-modal-product')) $('stock-modal-product').textContent = row.product_name;
    if ($('stock-modal-current')) $('stock-modal-current').textContent = String(row.stock_quantity);
    if (qtyInput) {
      qtyInput.value = String(row.stock_quantity);
      qtyInput.focus();
      qtyInput.select();
    }
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }

    openModal('stock-modal');
  }

  /** Saves new quantity to Supabase inventory row */
  async function saveStockUpdate() {
    const errEl = $('stock-modal-error');
    const productId = editingRow?.id;
    if (!productId) return;

    const raw = $('stock-modal-qty')?.value?.trim();
    const newQty = raw === '' ? NaN : parseInt(raw, 10);

    if (!Number.isFinite(newQty) || newQty < 0) {
      if (errEl) {
        errEl.textContent = 'أدخل كمية صحيحة (0 أو أكثر)';
        errEl.classList.remove('hidden');
      }
      return;
    }

    const btn = $('stock-modal-save');
    if (btn) btn.disabled = true;
    if (errEl) errEl.classList.add('hidden');

    try {
      if (!supabase) supabase = initSupabase();
      await updateStockInDb(productId, newQty);
      closeModals();
      await loadInventory();
    } catch (err) {
      console.error('[Inventory] update stock:', err);
      if (errEl) {
        errEl.textContent = err.message || 'فشل الحفظ';
        errEl.classList.remove('hidden');
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function handleTableClick(ev) {
    const btn = ev.target.closest?.('button[data-update-stock]');
    if (!btn) return;

    ev.preventDefault();
    ev.stopPropagation();

    const productId = btn.getAttribute('data-update-stock');
    const row = inventoryRows.find((r) => String(r.id) === String(productId));
    if (row) openUpdateStockModal(row);
  }

  async function handleAddProduct(ev) {
    ev.preventDefault();
    const errEl = $('add-modal-error');
    const form = $('add-product-form');
    const fd = new FormData(form);
    const name = (fd.get('product_name') || '').toString().trim();
    if (!name) {
      errEl.textContent = 'اسم المنتج مطلوب';
      errEl.classList.remove('hidden');
      return;
    }

    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
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
      errEl.textContent = err.message || 'فشل الإضافة';
      errEl.classList.remove('hidden');
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  async function loadInventory() {
    const tbody = $('inventory-tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" class="inv-empty">جاري التحميل…</td></tr>';
    }

    const refreshBtn = $('refresh-btn');
    if (refreshBtn) refreshBtn.disabled = true;

    try {
      if (!supabase) supabase = initSupabase();
      const rows = await fetchInventory();
      updateKpis(rows);
      renderTable(rows);
    } catch (err) {
      console.error('[Inventory]', err);
      updateKpis([]);
      renderTable([]);
      if (tbody && !inventoryRows.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="inv-empty">لا توجد بيانات للعرض حالياً</td></tr>`;
      }
    } finally {
      if (refreshBtn) refreshBtn.disabled = false;
    }
  }

  function initSidebar() {
    const sidebar = $('sidebar');
    const overlay = $('sidebar-overlay');
    const toggle = $('sidebar-toggle');

    toggle?.addEventListener('click', () => {
      sidebar?.classList.add('is-open');
      overlay?.classList.add('is-visible');
    });
    overlay?.addEventListener('click', () => {
      sidebar?.classList.remove('is-open');
      overlay?.classList.remove('is-visible');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('footer-year').textContent = String(new Date().getFullYear());
    initSidebar();
    document.querySelectorAll('[data-close-modal]').forEach((el) => {
      el.addEventListener('click', closeModals);
    });
    $('add-product-btn')?.addEventListener('click', openAddModal);
    $('add-product-form')?.addEventListener('submit', handleAddProduct);
    $('inventory-tbody')?.addEventListener('click', handleTableClick);
    $('stock-modal-save')?.addEventListener('click', saveStockUpdate);
    $('stock-modal-qty')?.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        saveStockUpdate();
      }
    });
    $('refresh-btn')?.addEventListener('click', loadInventory);
    loadInventory();
  });
})();
