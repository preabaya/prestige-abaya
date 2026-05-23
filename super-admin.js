/**
 * Super Admin Control Tower — Predictive tenant dashboard
 * Requires Supabase Auth user with app_metadata.role = 'super_admin'
 */
(function () {
  const STATUS_ACTIVE = 'active';
  const STATUS_SUSPENDED = 'suspended';
  const TIERS = ['basic', 'pro', 'vip'];

  let supabaseClient = null;
  let tenantsCache = [];

  const $ = (id) => document.getElementById(id);

  const els = {
    loginPanel: $('login-panel'),
    loginForm: $('sa-login-form'),
    email: $('sa-email'),
    password: $('sa-password'),
    loginStatus: $('sa-login-status'),
    dashboard: $('dashboard-panel'),
    globalStats: $('global-stats'),
    statActive: $('stat-active-count'),
    statAvgHealth: $('stat-avg-health'),
    sessionEmail: $('sa-session-email'),
    refresh: $('sa-refresh'),
    signOut: $('sa-sign-out'),
    loadStatus: $('sa-load-status'),
    cards: $('tenant-cards'),
    empty: $('tenant-empty'),
  };

  function cfg() {
    return window.SUPABASE_CONFIG || {};
  }

  function initClient() {
    const c = cfg();
    if (!c.url || !c.anonKey) {
      throw new Error('Copy supabase.config.example.js → supabase.config.js and add your project keys.');
    }
    if (typeof supabase === 'undefined') {
      throw new Error('Supabase JS failed to load.');
    }
    if (!supabaseClient) {
      supabaseClient = supabase.createClient(c.url, c.anonKey);
    }
    return supabaseClient;
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setLoginStatus(msg, isError) {
    if (!els.loginStatus) return;
    els.loginStatus.textContent = msg || '';
    els.loginStatus.className = 'status-msg' + (isError ? ' status-msg--err' : '');
  }

  function setLoadStatus(msg, isError) {
    if (!els.loadStatus) return;
    els.loadStatus.textContent = msg || '';
    els.loadStatus.className = 'status-msg' + (isError ? ' status-msg--err' : '');
  }

  function healthMeta(score) {
    const n = Math.max(0, Math.min(100, Number(score) || 0));
    if (n > 80) return { level: 'high', label: 'Healthy', className: 'health-bar__fill--high' };
    if (n >= 50) return { level: 'mid', label: 'Watch', className: 'health-bar__fill--mid' };
    return { level: 'low', label: 'At risk', className: 'health-bar__fill--low' };
  }

  function nextTier(current) {
    const t = (current || 'basic').toLowerCase();
    const idx = TIERS.indexOf(t);
    return TIERS[(idx + 1) % TIERS.length];
  }

  function toggleStatus(current) {
    return current === STATUS_ACTIVE ? STATUS_SUSPENDED : STATUS_ACTIVE;
  }

  function computeGlobalStats(rows) {
    const active = rows.filter((r) => r.status === STATUS_ACTIVE).length;
    const avg = rows.length
      ? Math.round(rows.reduce((sum, r) => sum + (Number(r.health_score) || 0), 0) / rows.length)
      : 0;
    return { active, avg };
  }

  function renderGlobalStats(rows) {
    const { active, avg } = computeGlobalStats(rows);
    if (els.statActive) els.statActive.textContent = String(active);
    if (els.statAvgHealth) els.statAvgHealth.textContent = String(avg);
    if (els.globalStats) els.globalStats.hidden = false;
  }

  function renderTenantCard(row) {
    const health = healthMeta(row.health_score);
    const tier = (row.subscription_tier || 'basic').toLowerCase();
    const isActive = row.status === STATUS_ACTIVE;
    const statusLabel = isActive ? 'Active' : 'Suspended';

    return `
      <article class="tenant-card" data-tenant-id="${escapeHtml(row.id)}">
        <div class="tenant-card__head">
          <h3 class="tenant-card__name">${escapeHtml(row.company_name)}</h3>
          <span class="tier tier--${tier}">${escapeHtml(tier)}</span>
        </div>
        <p class="tenant-card__status">Status: <strong>${statusLabel}</strong></p>
        <div class="health-row">
          <span>Health score · ${health.label}</span>
          <span>${Number(row.health_score) || 0}</span>
        </div>
        <div class="health-bar" role="progressbar" aria-valuenow="${Number(row.health_score) || 0}" aria-valuemin="0" aria-valuemax="100">
          <div class="health-bar__fill ${health.className}" style="width:${Number(row.health_score) || 0}%"></div>
        </div>
        <div class="tenant-card__actions">
          <button type="button" class="btn btn--tier" data-action="upgrade-tier" data-id="${escapeHtml(row.id)}">
            Upgrade Tier
          </button>
          <button type="button" class="btn btn--toggle" data-action="toggle-status" data-id="${escapeHtml(row.id)}">
            Toggle Status
          </button>
        </div>
      </article>
    `;
  }

  function renderDashboard(rows) {
    tenantsCache = rows;
    renderGlobalStats(rows);

    if (!els.cards) return;
    if (!rows.length) {
      els.cards.innerHTML = '';
      if (els.empty) els.empty.hidden = false;
      return;
    }
    if (els.empty) els.empty.hidden = true;
    els.cards.innerHTML = rows.map(renderTenantCard).join('');
  }

  async function fetchTenants() {
    const client = initClient();
    const { data, error } = await client
      .from('tenants')
      .select('id, company_name, subscription_tier, status, health_score, created_at')
      .order('company_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async function updateTenant(id, patch) {
    const client = initClient();
    const { data, error } = await client
      .from('tenants')
      .update(patch)
      .eq('id', id)
      .select('id, company_name, subscription_tier, status, health_score')
      .single();

    if (error) throw error;
    return data;
  }

  async function loadDashboard() {
    setLoadStatus('Syncing tenants…');
    try {
      const rows = await fetchTenants();
      renderDashboard(rows);
      setLoadStatus(`Live · ${rows.length} tenant(s)`);
    } catch (err) {
      console.error(err);
      renderDashboard([]);
      setLoadStatus(err.message || 'Failed to load tenants', true);
    }
  }

  function patchLocalTenant(id, patch) {
    const idx = tenantsCache.findIndex((t) => t.id === id);
    if (idx === -1) return;
    tenantsCache[idx] = { ...tenantsCache[idx], ...patch };
    renderDashboard([...tenantsCache]);
  }

  async function onUpgradeTier(tenantId) {
    const row = tenantsCache.find((t) => t.id === tenantId);
    if (!row) return;

    const newTier = nextTier(row.subscription_tier);
    setLoadStatus(`Upgrading to ${newTier}…`);

    try {
      const updated = await updateTenant(tenantId, { subscription_tier: newTier });
      patchLocalTenant(tenantId, updated);
      setLoadStatus(`${row.company_name} → ${newTier}`);
    } catch (err) {
      setLoadStatus(err.message || 'Tier update failed', true);
      await loadDashboard();
    }
  }

  async function onToggleStatus(tenantId) {
    const row = tenantsCache.find((t) => t.id === tenantId);
    if (!row) return;

    const newStatus = toggleStatus(row.status);
    setLoadStatus(`Setting ${newStatus}…`);

    try {
      const updated = await updateTenant(tenantId, { status: newStatus });
      patchLocalTenant(tenantId, updated);
      setLoadStatus(`${row.company_name} is now ${newStatus}`);
    } catch (err) {
      setLoadStatus(err.message || 'Status update failed', true);
      await loadDashboard();
    }
  }

  async function getSession() {
    const { data } = await initClient().auth.getSession();
    return data.session;
  }

  async function showDashboard(loggedIn) {
    if (els.loginPanel) els.loginPanel.hidden = loggedIn;
    if (els.dashboard) els.dashboard.hidden = !loggedIn;
    if (!loggedIn && els.globalStats) els.globalStats.hidden = true;
  }

  async function onLogin(e) {
    e.preventDefault();
    setLoginStatus('Authenticating…');
    try {
      const client = initClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: els.email.value.trim(),
        password: els.password.value,
      });
      if (error) throw error;

      setLoginStatus('');
      if (els.sessionEmail) els.sessionEmail.textContent = data.user?.email || 'admin';
      await showDashboard(true);
      await loadDashboard();
    } catch (err) {
      setLoginStatus(err.message || 'Login failed', true);
    }
  }

  async function onSignOut() {
    await initClient().auth.signOut();
    tenantsCache = [];
    renderDashboard([]);
    await showDashboard(false);
    setLoginStatus('Signed out');
    setLoadStatus('');
  }

  function onCardClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn || btn.disabled) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;
    btn.disabled = true;

    const done = () => { btn.disabled = false; };

    if (action === 'upgrade-tier') {
      onUpgradeTier(id).finally(done);
    } else if (action === 'toggle-status') {
      onToggleStatus(id).finally(done);
    } else {
      done();
    }
  }

  async function boot() {
    try {
      initClient();
    } catch (err) {
      setLoginStatus(err.message, true);
      return;
    }

    els.loginForm?.addEventListener('submit', onLogin);
    els.signOut?.addEventListener('click', onSignOut);
    els.refresh?.addEventListener('click', loadDashboard);
    els.cards?.addEventListener('click', onCardClick);

    const session = await getSession();
    if (session?.user) {
      if (els.sessionEmail) els.sessionEmail.textContent = session.user.email || session.user.id;
      await showDashboard(true);
      await loadDashboard();
    } else {
      await showDashboard(false);
      setLoginStatus('Sign in to access the Control Tower');
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
