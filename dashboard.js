/**
 * Prestige Abaya ERP — Sales dashboard (Supabase + Chart.js)
 */
(function () {
  'use strict';

  const CURRENT_TENANT_KEY = 'current_tenant_id';
  const CHART_DAYS = 7;
  const TABLE_LIMIT = 10;

  let supabase = null;
  let salesChart = null;

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

  function saleAmount(row) {
    const v = row.line_total_aud ?? row.total_amount ?? row.totalAmount;
    if (v != null && Number.isFinite(Number(v))) return Number(v);
    const price = Number(row.price) || 0;
    const qty = Math.max(1, parseInt(row.quantity, 10) || 1);
    return Math.round(price * qty * 100) / 100;
  }

  function parseDate(row) {
    const raw = row.created_at ?? row.createdAt ?? row.sale_date;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatAud(n) {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n || 0);
  }

  function formatDateTime(d) {
    if (!d) return '—';
    return new Intl.DateTimeFormat('ar-AE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  }

  function formatShortDate(d) {
    return new Intl.DateTimeFormat('ar-AE', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
  }

  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function dayKey(d) {
    return startOfDay(d).toISOString().slice(0, 10);
  }

  function buildLast7DayBuckets() {
    const buckets = [];
    const today = startOfDay(new Date());
    for (let i = CHART_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets.push({ date: d, key: dayKey(d), total: 0 });
    }
    return buckets;
  }

  function aggregateByDay(rows) {
    const buckets = buildLast7DayBuckets();
    const map = Object.fromEntries(buckets.map((b) => [b.key, b]));

    rows.forEach((row) => {
      const d = parseDate(row);
      if (!d) return;
      const key = dayKey(d);
      if (!map[key]) return;
      map[key].total += saleAmount(row);
    });

    return buckets.map((b) => ({
      label: formatShortDate(b.date),
      total: Math.round(b.total * 100) / 100,
    }));
  }

  function statusBadge(status) {
    const s = (status || 'completed').toLowerCase();
    const map = {
      completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      returned: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    };
    const labels = { completed: 'مكتمل', returned: 'مرتجع', pending: 'قيد الانتظار' };
    const cls = map[s] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    const label = labels[s] || status || '—';
    return `<span class="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}">${escapeHtml(label)}</span>`;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showBanner(type, message) {
    const el = $('status-banner');
    if (!el) return;
    el.classList.remove('hidden', 'border-rose-500/40', 'bg-rose-500/10', 'text-rose-300', 'border-amber-500/40', 'bg-amber-500/10', 'text-amber-200');
    if (type === 'error') {
      el.classList.add('border-rose-500/40', 'bg-rose-500/10', 'text-rose-300');
    } else {
      el.classList.add('border-amber-500/40', 'bg-amber-500/10', 'text-amber-200');
    }
    el.textContent = message;
    el.classList.remove('hidden');
  }

  function hideBanner() {
    const el = $('status-banner');
    if (el) el.classList.add('hidden');
  }

  async function fetchSales() {
    let query = supabase
      .from('sales')
      .select('id, created_at, customer_name, customer, product_name, price, quantity, line_total_aud, total_amount, invoice_number, status, tenant_id')
      .order('id', { ascending: false });

    const tenantId = getTenantId();
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query.limit(500);
    if (error) throw new Error(error.message);
    return data || [];
  }

  function updateKpis(rows) {
    const amounts = rows.map(saleAmount);
    const totalRevenue = amounts.reduce((s, n) => s + n, 0);
    const count = rows.length;
    const avg = count ? totalRevenue / count : 0;

    const weekStart = startOfDay(new Date());
    weekStart.setDate(weekStart.getDate() - (CHART_DAYS - 1));
    const weekRevenue = rows.reduce((sum, row) => {
      const d = parseDate(row);
      if (!d || d < weekStart) return sum;
      return sum + saleAmount(row);
    }, 0);

    $('kpi-revenue').textContent = formatAud(totalRevenue);
    $('kpi-count').textContent = String(count);
    $('kpi-week-revenue').textContent = formatAud(weekRevenue);
    $('kpi-avg').textContent = formatAud(avg);
  }

  function renderChart(rows) {
    const series = aggregateByDay(rows);
    const labels = series.map((s) => s.label);
    const values = series.map((s) => s.total);

    const ctx = $('sales-chart');
    if (!ctx) return;

    if (salesChart) {
      salesChart.destroy();
      salesChart = null;
    }

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(196, 134, 46, 0.35)');
    gradient.addColorStop(1, 'rgba(196, 134, 46, 0)');

    salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'الإيرادات (AUD)',
          data: values,
          borderColor: '#d9a045',
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#c4862e',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            rtl: true,
            backgroundColor: '#1c2430',
            titleColor: '#f1f5f9',
            bodyColor: '#cbd5e1',
            borderColor: '#243040',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label(ctx) {
                return ` ${formatAud(ctx.parsed.y)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(36, 48, 64, 0.6)' },
            ticks: { color: '#94a3b8', font: { family: 'Tajawal' } },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(36, 48, 64, 0.6)' },
            ticks: {
              color: '#94a3b8',
              font: { family: 'Tajawal' },
              callback: (v) => `$${v}`,
            },
          },
        },
      },
    });

    const legend = $('chart-legend');
    if (legend) {
      const peak = Math.max(...values, 0);
      legend.innerHTML = `<span>أعلى يوم: <strong class="text-brand-300">${formatAud(peak)}</strong></span>`;
    }
  }

  function renderTable(rows) {
    const tbody = $('sales-tbody');
    const empty = $('table-empty');
    if (!tbody) return;

    const latest = rows.slice(0, TABLE_LIMIT);

    if (!latest.length) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    tbody.innerHTML = latest
      .map((row) => {
        const d = parseDate(row);
        const customer = row.customer_name ?? row.customer ?? '—';
        const product = row.product_name ?? '—';
        const qty = parseInt(row.quantity, 10) || 1;
        const total = saleAmount(row);
        return `
          <tr class="border-b border-surface-700/40 hover:bg-surface-800/40 transition-colors">
            <td class="px-4 py-3.5 sm:px-6 font-mono text-xs text-slate-400">${escapeHtml(row.id)}</td>
            <td class="px-4 py-3.5 sm:px-6 text-slate-300 whitespace-nowrap">${escapeHtml(formatDateTime(d))}</td>
            <td class="px-4 py-3.5 sm:px-6 text-white">${escapeHtml(customer)}</td>
            <td class="px-4 py-3.5 sm:px-6 text-slate-300 max-w-[180px] truncate">${escapeHtml(product)}</td>
            <td class="px-4 py-3.5 sm:px-6 tabular-nums">${qty}</td>
            <td class="px-4 py-3.5 sm:px-6 font-semibold text-brand-300 tabular-nums">${escapeHtml(formatAud(total))}</td>
            <td class="px-4 py-3.5 sm:px-6">${statusBadge(row.status)}</td>
          </tr>
        `;
      })
      .join('');

    const updated = $('table-updated');
    if (updated) {
      updated.textContent = `آخر تحديث: ${formatDateTime(new Date())}`;
    }
  }

  function setLoadingTable() {
    const tbody = $('sales-tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-12 text-center text-slate-500">جاري تحميل البيانات…</td></tr>`;
    }
  }

  async function loadDashboard() {
    hideBanner();
    setLoadingTable();
    const btn = $('refresh-btn');
    if (btn) btn.disabled = true;

    try {
      if (!supabase) supabase = initSupabase();
      const rows = await fetchSales();

      const sorted = [...rows].sort((a, b) => {
        const da = parseDate(a)?.getTime() ?? 0;
        const db = parseDate(b)?.getTime() ?? 0;
        return db - da;
      });

      updateKpis(sorted);
      renderChart(sorted);
      renderTable(sorted);

      const badge = $('connection-badge');
      if (badge) badge.classList.remove('hidden');
    } catch (err) {
      console.error('[Dashboard]', err);
      showBanner('error', `خطأ في الاتصال بقاعدة البيانات: ${err.message || err}`);
      const tbody = $('sales-tbody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-12 text-center text-rose-400/90">تعذّر تحميل البيانات</td></tr>`;
      }
    } finally {
      if (btn) btn.disabled = false;
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

  document.addEventListener('DOMContentLoaded', () => {
    $('footer-year').textContent = String(new Date().getFullYear());
    initSidebar();
    $('refresh-btn')?.addEventListener('click', () => loadDashboard());
    loadDashboard();
  });
})();
