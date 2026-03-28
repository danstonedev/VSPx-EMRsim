/**
 * Auth store — wraps Azure Static Web Apps /.auth/me + /api/user
 * role checking. Port of app/js/core/auth.js.
 */
import { writable, derived, get } from 'svelte/store';

// ─── Types ───

export type DisciplineId = 'pt' | 'dietetics';

export interface AuthUser {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
}

export interface DbUser {
  email: string;
  role: string;
  name?: string;
  /** Primary discipline for students (PT, dietetics, etc.) */
  discipline?: DisciplineId;
  /** Faculty may be associated with multiple disciplines (e.g., IPE instructors) */
  disciplines?: DisciplineId[];
}

export interface AuthState {
  user: AuthUser | null;
  dbUser: DbUser | null;
  loading: boolean;
  error: string | null;
}

export const ROLES = {
  ADMIN: 'admin',
  FACULTY: 'faculty',
  STUDENT: 'student',
  ANONYMOUS: 'anonymous',
} as const;

// ─── Store ───

const initialState: AuthState = {
  user: null,
  dbUser: null,
  loading: true,
  error: null,
};

const store = writable<AuthState>(initialState);

export const auth = { subscribe: store.subscribe };

// ─── Derived helpers ───

export const currentUser = derived(store, ($s) => $s.user);
export const isLoggedIn = derived(store, ($s) => !!$s.user);
export const isLoading = derived(store, ($s) => $s.loading);
export const userRole = derived(store, ($s) => $s.dbUser?.role ?? ROLES.ANONYMOUS);

export const hasRole = (role: string): boolean => {
  const s = get(store);
  if (!s.dbUser) return false;
  return s.dbUser.role === role || s.dbUser.role === ROLES.ADMIN;
};

export const canEditCase = derived(store, ($s) => {
  const role = $s.dbUser?.role;
  return role === ROLES.ADMIN || role === ROLES.FACULTY;
});

export const canDeleteCase = derived(store, ($s) => {
  return $s.dbUser?.role === ROLES.ADMIN;
});

export const canCreateCase = derived(store, ($s) => {
  const role = $s.dbUser?.role;
  return role === ROLES.ADMIN || role === ROLES.FACULTY;
});

/** User's primary discipline — resolves from discipline field, defaults to 'pt'. */
export const userDiscipline = derived(store, ($s): DisciplineId => {
  return $s.dbUser?.discipline ?? 'pt';
});

/** All disciplines a user is associated with (faculty may have multiple). */
export const userDisciplines = derived(store, ($s): DisciplineId[] => {
  if ($s.dbUser?.disciplines?.length) return $s.dbUser.disciplines;
  if ($s.dbUser?.discipline) return [$s.dbUser.discipline];
  return ['pt'];
});

// ─── Cache ───

let userCache: { user: AuthUser; dbUser: DbUser | null } | null = null;

// ─── Actions ───

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  if (userCache) {
    store.update((s) => ({
      ...s,
      user: userCache!.user,
      dbUser: userCache!.dbUser,
      loading: false,
    }));
    return userCache.user;
  }

  store.update((s) => ({ ...s, loading: true, error: null }));

  try {
    const res = await fetch('/.auth/me');
    if (!res.ok) {
      store.update((s) => ({ ...s, user: null, loading: false }));
      return null;
    }
    const data = await res.json();
    const principal = data?.clientPrincipal;
    if (!principal) {
      store.update((s) => ({ ...s, user: null, loading: false }));
      return null;
    }

    const user: AuthUser = principal;

    // Fetch DB role
    let dbUser: DbUser | null = null;
    try {
      const dbRes = await fetch('/api/user');
      if (dbRes.ok) {
        dbUser = await dbRes.json();
      }
    } catch {
      // DB role lookup failed — continue with base auth
    }

    userCache = { user, dbUser };
    store.update((s) => ({ ...s, user, dbUser, loading: false }));
    return user;
  } catch (err) {
    store.update((s) => ({
      ...s,
      user: null,
      loading: false,
      error: err instanceof Error ? err.message : 'Auth failed',
    }));
    return null;
  }
}

export function clearUserCache(): void {
  userCache = null;
  store.set(initialState);
}

export async function requestFacultyAccess(): Promise<boolean> {
  try {
    const res = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'requestFaculty' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function hasPendingFacultyRequest(): boolean {
  const s = get(store);
  return s.dbUser?.role === 'pending_faculty';
}

// ─── Discipline ───

/** Whether the user still needs to pick a discipline (null = not yet set). */
export const needsDisciplinePick = derived(store, ($s): boolean => {
  if ($s.loading || !$s.user) return false;
  return !$s.dbUser?.discipline;
});

/**
 * Set the user's discipline. In production, persists via API.
 * On localhost or when API is unavailable, updates the store in-memory only.
 */
export async function setDiscipline(discipline: DisciplineId): Promise<boolean> {
  // Update store immediately for instant UI response
  store.update((s) => ({
    ...s,
    dbUser: s.dbUser ? { ...s.dbUser, discipline } : { email: '', role: 'student', discipline },
  }));
  if (userCache?.dbUser) {
    userCache.dbUser = { ...userCache.dbUser, discipline };
  }

  // Persist via API (skip on localhost — no API available)
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-discipline', discipline }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  return true;
}

// ─── URL helpers ───

export function getLoginUrl(provider = 'aad'): string {
  return `/.auth/login/${provider}`;
}

export function getLogoutUrl(): string {
  return '/.auth/logout';
}

export function redirectToLogin(provider = 'aad'): void {
  window.location.href = getLoginUrl(provider);
}

export function logout(): void {
  clearUserCache();
  window.location.href = getLogoutUrl();
}
