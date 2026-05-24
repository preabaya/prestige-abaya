/**
 * Prestige Abaya — صفحة المخزن المستقلة
 * يعتمد فقط على db-helper.js (getProducts, addProduct)
 */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatPrice(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '0.00';
    return n.toFixed(2);
  }

  function setStatus(message, type) {
    const el = $('status');
    if (!el) return;
    el.textContent = message || '';
    el.classList.remove('is-error', 'is-ok');
    if (type === 'error') el.classList.add('is-error');
    if (type === 'ok') el.classList.add('is-ok');
  }

  function renderRows(rows) {
    const body = $('inventory-body');
    if (!body) return;

    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="3" class="empty">لا توجد منتجات بعد</td></tr>';
      return;
    }

    body.innerHTML = rows
      .map(
        (row) => `<tr>
          <td>${escapeHtml(row.product_name)}</td>
          <td class="num">${escapeHtml(formatPrice(row.price))}</td>
          <td class="num">${escapeHtml(String(row.stock_quantity))}</td>
        </tr>`
      )
      .join('');
  }

  async function loadInventory() {
    setStatus('');

    if (typeof getProducts !== 'function') {
      setStatus('db-helper.js غير محمّل', 'error');
      renderRows([]);
      return;
    }

    const body = $('inventory-body');
    if (body) {
      body.innerHTML = '<tr><td colspan="3" class="empty">جاري التحميل…</td></tr>';
    }

    const result = await getProducts();

    if (!result.ok) {
      setStatus(result.error || 'فشل تحميل المخزون', 'error');
      renderRows([]);
      return;
    }

    renderRows(result.data || []);
  }

  async function handleAdd(event) {
    event.preventDefault();

    if (typeof addProduct !== 'function') {
      setStatus('db-helper.js غير محمّل', 'error');
      return;
    }

    const form = event.target;
    const nameInput = form.product_name;
    const priceInput = form.price;
    const qtyInput = form.stock_quantity;
    const submitBtn = $('submit-btn');

    const product_name = nameInput.value.trim();
    const price = parseFloat(priceInput.value, 10);
    const stock_quantity = parseInt(qtyInput.value, 10);

    if (!product_name) {
      setStatus('أدخل اسم المنتج', 'error');
      nameInput.focus();
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setStatus('أدخل سعراً صحيحاً', 'error');
      priceInput.focus();
      return;
    }

    if (!Number.isFinite(stock_quantity) || stock_quantity < 0) {
      setStatus('أدخل كمية صحيحة', 'error');
      qtyInput.focus();
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    setStatus('جاري الحفظ…');

    const result = await addProduct({ product_name, price, stock_quantity });

    if (submitBtn) submitBtn.disabled = false;

    if (!result.ok) {
      setStatus(result.error || 'فشل الإضافة', 'error');
      return;
    }

    setStatus('تمت الإضافة بنجاح', 'ok');
    form.reset();
    priceInput.value = '0';
    qtyInput.value = '0';
    await loadInventory();
  }

  function init() {
    if (!window.DbHelper?.isConfigured?.()) {
      setStatus('أكمل إعداد supabase.config.js (url و anonKey)', 'error');
    }

    $('add-form')?.addEventListener('submit', handleAdd);
    $('refresh-btn')?.addEventListener('click', loadInventory);
    loadInventory();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
