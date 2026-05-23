/**
 * Prestige Abaya — Super Admin Dashboard
 * Requires Supabase user with app_metadata.role = 'super_admin'
 */
(function () {
  const STATUS_ACTIVE = 'active';
  const STATUS_SUSPENDED = 'suspended';

  let supabaseClient = null;

  const els = {
    loginForm: document.getElementById('admin-login-form'),
    email: document.getElementById('admin-email'),
    password: document.getElementById('admin-password'),
    loginStatus: document.getElementById('admin-login-status'),
    sessionBar: document.getElementById('admin-session'),
    sessionEmail: document.getElementById('admin-session-email'),
    signOut: document.getElementById('admin-sign-out'),
    refresh: document.getElementById('admin-refresh'),
    loadStatus: document.getElementById('admin-load-status'),
    tbody: document.getElementById('tenants-tbody'),
    empty: document.getElementById('tenants-empty'),
  };

  function cfg() {
    return window.SUPABASE_CONFIG || {};
  }

  function initClient() {
    const c = cfg();
    if (!c.url || !c.anonKey) {
      throw new Error('Missing supabase.config.js — copy from supabase.config.example.js');
    }
    if (typeof supabase === 'undefined') {
      throw new Error('Supabase JS library not loaded');
    }
    if (!supabaseClient) {
      supabaseClient = supabase.createClient(c.url, c.anonKey);
    }
    return supabaseClient;
  }

  function setLoginStatus(msg, isError) {
    if (!els.loginStatus) return;
    els.loginStatus.textContent = msg || '';
    els.loginStatus.className = 'admin-status' + (isError ? ' admin-status--error' : ' admin-status--ok');
  }

  function setLoadStatus(msg, isError) {
    if (!els.loadStatus) return;
    els.loadStatus.textContent = msg || '';
    els.loadStatus.className = 'admin-status' + (isError ? ' admin-status--error' : '');
  }

  function tierBadge(tier) {
    const t = (tier || 'basic').toLowerCase();
    return `<span class="badge badge--${t}">${escapeHtml(t)}</span>`;
  }

  function statusBadge(status) {
    const s = (status || 'active').toLowerCase();
    return `<span class="badge badge--${s}">${escapeHtml(s)}</span>`;
  }

  function healthClass(score) {
    const n = Number(score) || 0;
    if (n < 50) return 'health--low';
    if (n < 80) return 'health--mid';
    return 'health--high';
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function getSession() {
    const client = initClient();
    const { data } = await client.auth.getSession();
    return data.session;
  }

  async function updateSessionUI() {
    const session = await getSession();
    const loggedIn = !!session?.user;
    if (els.sessionBar) els.sessionBar.hidden = !loggedIn;
    if (els.loginForm) els.loginForm.hidden = loggedIn;
    if (els.sessionEmail && session?.user) {
      els.sessionEmail.textContent = session.user.email || session.user.id;
    }
    return loggedIn;
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

  function renderTenants(rows) {
    if (!els.tbody) return;
    if (!rows.length) {
      els.tbody.innerHTML = '';
      if (els.empty) els.empty.hidden = false;
      return;
    }
    if (els.empty) els.empty.hidden = true;

    els.tbody.innerHTML = rows.map((row) => {
      const isActive = row.status === STATUS_ACTIVE;
      const isSuspended = row.status === STATUS_SUSPENDED;
      return `
        <tr data-tenant-id="${escapeHtml(row.id)}">
          <td><strong>${escapeHtml(row.company_name)}</strong></td>
          <td>${tierBadge(row.subscription_tier)}</td>
          <td>${statusBadge(row.status)}</td>
          <td><span class="health ${healthClass(row.health_score)}">${Number(row.health_score) || 0}</span></td>
          <td>
            <div class="control-group">
              <button type="button" class="btn btn--success btn--sm" data-action="activate"
                data-id="${escapeHtml(row.id)}" ${isActive ? 'disabled' : ''}>Activate</button>
              <button type="button" class="btn btn--danger btn--sm" data-action="suspend"
                data-id="${escapeHtml(row.id)}" ${isSuspended ? 'disabled' : ''}>Suspend</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function setTenantStatus(tenantId, status) {
    const client = initClient();
    const { error } = await client
      .from('tenants')
      .update({ status })
      .eq('id', tenantId);

    if (error) throw error;
  }

  async function loadTenants() {
    setLoadStatus('Loading tenants…');
    try {
      const rows = await fetchTenants();
      renderTenants(rows);
      setLoadStatus(`${rows.length} tenant(s) loaded`);
    } catch (err) {
      console.error(err);
      renderTenants([]);
      setLoadStatus(err.message || 'Failed to load tenants', true);
    }
  }

  async function onLoginSubmit(e) {
    e.preventDefault();
    setLoginStatus('Signing in…');
    try {
      const client = initClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: els.email.value.trim(),
        password: els.password.value,
      });
      if (error) throw error;
      setLoginStatus(`Signed in as ${data.user?.email || 'admin'}`);
      await updateSessionUI();
      await loadTenants();
    } catch (err) {
      setLoginStatus(err.message || 'Login failed', true);
    }
  }

  async function onSignOut() {
    const client = initClient();
    await client.auth.signOut();
    renderTenants([]);
    setLoadStatus('');
    await updateSessionUI();
    setLoginStatus('Signed out');
  }

  async function onTableClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn || btn.disabled) return;

    const tenantId = btn.dataset.id;
    const action = btn.dataset.action;
    const status = action === 'activate' ? STATUS_ACTIVE : STATUS_SUSPENDED;

    btn.disabled = true;
    setLoadStatus(`Updating ${action}…`);
    try {
      await setTenantStatus(tenantId, status);
      await loadTenants();
    } catch (err) {
      setLoadStatus(err.message || 'Update failed', true);
      btn.disabled = false;
    }
  }

  async function boot() {
    try {
      initClient();
    } catch (err) {
      setLoginStatus(err.message, true);
      return;
    }

    els.loginForm?.addEventListener('submit', onLoginSubmit);
    els.signOut?.addEventListener('click', onSignOut);
    els.refresh?.addEventListener('click', loadTenants);
    els.tbody?.addEventListener('click', onTableClick);

    const loggedIn = await updateSessionUI();
    if (loggedIn) {
      await loadTenants();
    } else {
      setLoginStatus('Sign in with a Super Admin account (role: super_admin in JWT)');
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
