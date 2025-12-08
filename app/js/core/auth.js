/**
 * Authentication utilities for Azure Static Web Apps
 * Uses built-in Azure AD / Microsoft Entra ID authentication
 * Combined with our own user database for role management
 */

// Cache user info to avoid repeated API calls
let cachedUser = null;
let userPromise = null;

/**
 * Get the current authenticated user (combines Azure auth + our user DB)
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
      // First check Azure auth
      const authRes = await fetch('/.auth/me');
      if (!authRes.ok) {
        cachedUser = null;
        return null;
      }

      const authData = await authRes.json();
      if (!authData.clientPrincipal) {
        cachedUser = null;
        return null;
      }

      const azureUser = {
        userId: authData.clientPrincipal.userId,
        name: authData.clientPrincipal.userDetails,
        displayName:
          authData.clientPrincipal.claims?.find((c) => c.typ === 'name')?.val ||
          authData.clientPrincipal.userDetails,
        email:
          authData.clientPrincipal.claims?.find((c) => c.typ === 'preferred_username')?.val ||
          authData.clientPrincipal.userDetails,
        azureRoles: authData.clientPrincipal.userRoles || [],
        provider: authData.clientPrincipal.identityProvider,
      };

      // Now fetch/register user in our database to get their app-specific role
      let dbRole = 'student'; // Default
      let roleRequestedAt = null;
      try {
        const userRes = await fetch('/api/user');
        if (userRes.ok) {
          const userData = await userRes.json();
          dbRole = userData.role || 'student';
          roleRequestedAt = userData.roleRequestedAt;
          // Use DB display name if available
          if (userData.displayName) {
            azureUser.displayName = userData.displayName;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch user profile from API:', e);
      }

      // Combine Azure roles with our DB role
      const roles = [...new Set([...azureUser.azureRoles, dbRole])];

      cachedUser = {
        ...azureUser,
        role: dbRole, // Primary role from our DB
        roles: roles, // Combined roles
        roleRequestedAt: roleRequestedAt,
      };

      return cachedUser;
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
 * Request faculty access (for students)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function requestFacultyAccess() {
  try {
    const res = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request-faculty' }),
    });
    const data = await res.json();
    if (res.ok) {
      // Clear cache so next getCurrentUser() fetches fresh data
      clearUserCache();
      return { success: true, message: data.message };
    }
    return { success: false, message: data.error || 'Request failed' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Check if user has pending faculty request
 * @returns {Promise<boolean>}
 */
export async function hasPendingFacultyRequest() {
  const user = await getCurrentUser();
  return Boolean(user?.roleRequestedAt);
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
