/**
 * Prestige Abaya — AuthGuard (page protection via Supabase Auth)
 * Requires: @supabase/supabase-js, supabase.config.js, DbHelper or SupabaseBridge
 */
(function (global) {
  'use strict';

  const LOGIN_PAGE = 'login.html';
  const CLIENT_PORTAL_PAGE = 'client-portal.html';
  const ADMIN_ROLES = new Set(['admin', 'super_admin', 'superadmin']);

  function getConfig() {
    return global.SUPABASE_CONFIG || {};
  }

  function shouldBypassGuard() {
    const cfg = getConfig();
    if (cfg.skipAuthGuard === true) return true;
    if (cfg.skipAuth === true && cfg.enforceAuthGuard !== true) return true;
    if (!cfg.url || !cfg.anonKey) return true;
    return false;
  }

  function getClient() {
    if (global.DbHelper?.getClient) return global.DbHelper.getClient();
    if (global.SupabaseBridge?.getClient) return global.SupabaseBridge.getClient();
    const cfg = getConfig();
    if (!cfg.url || !cfg.anonKey || typeof global.supabase === 'undefined') return null;
    return global.supabase.createClient(cfg.url, cfg.anonKey);
  }

  function currentPageName() {
    const parts = String(global.location.pathname || '').split('/');
    return (parts[parts.length - 1] || 'index.html').toLowerCase();
  }

  function isLoginPage() {
    return currentPageName() === LOGIN_PAGE;
  }

  function isClientPortalPage() {
    return currentPageName() === CLIENT_PORTAL_PAGE;
  }

  function isAuthFlowPage() {
    return isLoginPage() || isClientPortalPage();
  }

  function redirectTo(page) {
    if (currentPageName() === page.toLowerCase()) return;
    const base = global.location.href.replace(/[^/]+$/, '');
    global.location.replace(base + page);
  }

  function setPending(pending) {
    const root = document.documentElement;
    if (!root) return;
    if (pending) {
      root.classList.add('auth-guard-pending');
      root.classList.remove('auth-guard-ready');
    } else {
      root.classList.remove('auth-guard-pending');
      root.classList.add('auth-guard-ready');
    }
  }

  function normalizeRole(raw) {
    const s = String(raw || '').toLowerCase().trim();
    if (!s) return null;
    if (ADMIN_ROLES.has(s)) return 'admin';
    if (s === 'client' || s === 'user' || s === 'customer' || s === 'staff') return 'client';
    return s;
  }

  function roleFromMetadata(user) {
    if (!user) return null;
    const meta = user.user_metadata || {};
    const app = user.app_metadata || {};
    const candidates = [
      meta.user_role,
      meta.role,
      app.user_role,
      app.role,
    ];
    for (let i = 0; i < candidates.length; i++) {
      const normalized = normalizeRole(candidates[i]);
      if (normalized) return normalized;
    }
    return null;
  }

  async function roleFromProfiles(client, userId) {
    if (!client || !userId) return null;

    const { data, error } = await client
      .from('profiles')
      .select('user_role, role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      if (/user_role|column/i.test(error.message || '')) {
        const fallback = await client
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
        if (!fallback.error && fallback.data) {
          return normalizeRole(fallback.data.role);
        }
      }
      console.warn('[AuthGuard] profiles', error.message);
      return null;
    }

    return normalizeRole(data?.user_role || data?.role);
  }

  async function resolveUserRole(user) {
    console.log('[AuthGuard] 1. Checking role for user ID:', user?.id);
    
    const fromMeta = roleFromMetadata(user);
    console.log('[AuthGuard] 2. Metadata role:', fromMeta);
    if (fromMeta) return fromMeta;

    const client = getClient();
    const fromProfile = await roleFromProfiles(client, user?.id);
    console.log('[AuthGuard] 3. Profile role found:', fromProfile);
    
    if (fromProfile) return fromProfile;

    console.log('[AuthGuard] 4. No role found, defaulting to: client');
    return 'client';
  }

  async function getSession() {
    const client = getClient();
    if (!client) return null;

    if (global.SupabaseBridge?.getSession) {
      return global.SupabaseBridge.getSession();
    }

    const { data, error } = await client.auth.getSession();
    if (error) {
      console.warn('[AuthGuard] getSession', error.message);
      return null;
    }
    return data?.session ?? null;
  }

  /**
   * @param {'admin'|string|null|undefined} [requiredRole]
   * @returns {Promise<{ ok: boolean, role?: string, user?: object, bypassed?: boolean, reason?: string }>}
   */
  async function checkAccess(requiredRole) {
    if (shouldBypassGuard()) {
      setPending(false);
      return { ok: true, bypassed: true };
    }

    setPending(true);

    try {
      const session = await getSession();
      const user = session?.user;

      if (isLoginPage()) {
        if (user) {
          const role = await resolveUserRole(user);
          if (role === 'admin') redirectTo('index.html');
          else redirectTo(CLIENT_PORTAL_PAGE);
          return { ok: false, reason: 'already_authenticated' };
        }
        setPending(false);
        return { ok: true, role: null };
      }

      if (!user) {
        redirectTo(LOGIN_PAGE);
        return { ok: false, reason: 'unauthenticated' };
      }

      const role = await resolveUserRole(user);

      if (requiredRole === 'admin' && role !== 'admin') {
        redirectTo(CLIENT_PORTAL_PAGE);
        return { ok: false, reason: 'forbidden', role };
      }

      if (isClientPortalPage() && role === 'admin' && getConfig().adminUsesClientPortal !== true) {
        /* admins may view client portal; no redirect */
      }

      setPending(false);
      return { ok: true, role, user };
    } catch (err) {
      console.warn('[AuthGuard]', err);
      setPending(false);
      redirectTo(LOGIN_PAGE);
      return { ok: false, reason: 'error', error: err };
    }
  }

  function readAutoGuardRole() {
    const root = document.documentElement;
    const body = document.body;
    return root?.getAttribute('data-auth-guard')
      || body?.getAttribute('data-auth-guard')
      || null;
  }

  function bootAutoGuard() {
    if (shouldBypassGuard()) {
      setPending(false);
      return;
    }

    const required = readAutoGuardRole();
    if (!required && !isAuthFlowPage()) {
      setPending(false);
      return;
    }

    if (isLoginPage()) {
      void checkAccess();
      return;
    }

    if (required) {
      void checkAccess(required === 'authenticated' ? null : required);
    }
  }

  const AuthGuard = {
    checkAccess,
    resolveUserRole,
    getSession,
    shouldBypassGuard,
    LOGIN_PAGE,
    CLIENT_PORTAL_PAGE,
  };

  global.AuthGuard = AuthGuard;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAutoGuard);
  } else {
    bootAutoGuard();
  }
})(typeof window !== 'undefined' ? window : global);
