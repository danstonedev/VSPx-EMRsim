/**
 * Authentication utilities for Azure Static Web Apps
 * Uses built-in Azure AD / Microsoft Entra ID authentication
 */

// Cache user info to avoid repeated API calls
let cachedUser = null;
let userPromise = null;

/**
 * Get the current authenticated user
 * @returns {Promise<Object|null>} User object or null if not logged in
 */
export async function getCurrentUser() {
  // Return cached user if available
  if (cachedUser !== null) {
    return cachedUser;
  }

  // If a request is already in flight, wait for it
  if (userPromise) {
    return userPromise;
  }

  userPromise = (async () => {
    try {
      const res = await fetch('/.auth/me');
      if (!res.ok) {
        cachedUser = null;
        return null;
      }

      const data = await res.json();
      if (data.clientPrincipal) {
        cachedUser = {
          userId: data.clientPrincipal.userId,
          name: data.clientPrincipal.userDetails, // typically email
          displayName:
            data.clientPrincipal.claims?.find((c) => c.typ === 'name')?.val ||
            data.clientPrincipal.userDetails,
          email:
            data.clientPrincipal.claims?.find((c) => c.typ === 'preferred_username')?.val ||
            data.clientPrincipal.userDetails,
          roles: data.clientPrincipal.userRoles || [],
          provider: data.clientPrincipal.identityProvider,
        };
        return cachedUser;
      }

      cachedUser = null;
      return null;
    } catch (e) {
      console.warn('Auth check failed:', e);
      cachedUser = null;
      return null;
    } finally {
      userPromise = null;
    }
  })();

  return userPromise;
}

/**
 * Check if user has a specific role
 * @param {string} role - Role to check (e.g., 'faculty', 'admin', 'student')
 * @returns {Promise<boolean>}
 */
export async function hasRole(role) {
  const user = await getCurrentUser();
  return user?.roles?.includes(role) || false;
}

/**
 * Check if user is logged in
 * @returns {Promise<boolean>}
 */
export async function isLoggedIn() {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Check if user can edit/delete a case
 * @param {Object} caseData - The case object with createdBy field
 * @returns {Promise<boolean>}
 */
export async function canEditCase(caseData) {
  const user = await getCurrentUser();
  if (!user) return false;

  // Admins can edit anything
  if (user.roles.includes('admin')) return true;

  // Faculty can edit their own cases
  if (user.roles.includes('faculty') && caseData.createdBy === user.userId) return true;

  return false;
}

/**
 * Check if user can delete a case
 * @param {Object} caseData - The case object with createdBy field
 * @returns {Promise<boolean>}
 */
export async function canDeleteCase(caseData) {
  // Same logic as edit for now
  return canEditCase(caseData);
}

/**
 * Check if user can create new cases
 * @returns {Promise<boolean>}
 */
export async function canCreateCase() {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.roles.includes('faculty') || user.roles.includes('admin');
}

/**
 * Clear cached user (call on logout or when auth state may have changed)
 */
export function clearUserCache() {
  cachedUser = null;
  userPromise = null;
}

/**
 * Get login URL
 * @param {string} [returnUrl] - URL to redirect to after login
 * @returns {string}
 */
export function getLoginUrl(returnUrl = '/') {
  return `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(returnUrl)}`;
}

/**
 * Get logout URL
 * @param {string} [returnUrl] - URL to redirect to after logout
 * @returns {string}
 */
export function getLogoutUrl(returnUrl = '/') {
  return `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(returnUrl)}`;
}

/**
 * Redirect to login page
 * @param {string} [returnUrl] - URL to redirect to after login
 */
export function redirectToLogin(returnUrl = window.location.href) {
  window.location.href = getLoginUrl(returnUrl);
}

/**
 * Redirect to logout
 * @param {string} [returnUrl] - URL to redirect to after logout
 */
export function logout(returnUrl = '/') {
  clearUserCache();
  window.location.href = getLogoutUrl(returnUrl);
}

// Role constants
export const ROLES = {
  ANONYMOUS: 'anonymous',
  AUTHENTICATED: 'authenticated',
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin',
};
