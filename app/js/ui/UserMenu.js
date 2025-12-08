/**
 * User Menu Component
 * Displays login button or user dropdown based on auth state
 */

import {
  getCurrentUser,
  getLoginUrl,
  logout,
  requestFacultyAccess,
  clearUserCache,
  ROLES,
} from '../core/auth.js';
import { el } from './utils.js';

/**
 * Create the user menu element
 * @returns {HTMLElement}
 */
export function createUserMenu() {
  const container = el('div', { class: 'user-menu' });

  // Initial loading state
  container.innerHTML = '<span class="user-menu__loading">...</span>';

  // Load user and update UI
  updateUserMenu(container);

  return container;
}

/**
 * Update the user menu based on current auth state
 * @param {HTMLElement} container
 */
export async function updateUserMenu(container) {
  const user = await getCurrentUser();

  container.innerHTML = '';

  if (user) {
    // Logged in - show user dropdown
    const dropdown = createUserDropdown(user);
    container.appendChild(dropdown);
  } else {
    // Not logged in - show login button
    const loginBtn = el(
      'a',
      {
        href: getLoginUrl(window.location.href),
        class: 'user-menu__login-btn',
      },
      'Sign In',
    );
    container.appendChild(loginBtn);
  }
}

/**
 * Create user dropdown for logged-in users
 * @param {Object} user
 * @returns {HTMLElement}
 */
function createUserDropdown(user) {
  const wrapper = el('div', { class: 'user-menu__dropdown' });

  // Trigger button
  const trigger = el('button', {
    type: 'button',
    class: 'user-menu__trigger',
    'aria-expanded': 'false',
    'aria-haspopup': 'true',
  });

  // Avatar or initials
  const initials = getInitials(user.displayName || user.name || 'U');
  const avatar = el('span', { class: 'user-menu__avatar' }, initials);

  // Name (truncated)
  const displayName = user.displayName || user.name || 'User';
  const nameSpan = el('span', { class: 'user-menu__name' }, truncate(displayName, 20));

  // Chevron
  const chevron = el('span', { class: 'user-menu__chevron', 'aria-hidden': 'true' }, '▼');

  trigger.appendChild(avatar);
  trigger.appendChild(nameSpan);
  trigger.appendChild(chevron);

  // Dropdown menu
  const menu = el('div', {
    class: 'user-menu__menu',
    role: 'menu',
    hidden: true,
  });

  // User info header
  const userInfo = el('div', { class: 'user-menu__info' });
  userInfo.appendChild(el('div', { class: 'user-menu__info-name' }, displayName));
  if (user.email && user.email !== displayName) {
    userInfo.appendChild(el('div', { class: 'user-menu__info-email' }, user.email));
  }

  // Role badge
  const roleBadge = getRoleBadge(user.roles);
  if (roleBadge) {
    userInfo.appendChild(roleBadge);
  }

  menu.appendChild(userInfo);

  // Divider
  menu.appendChild(el('hr', { class: 'user-menu__divider' }));

  // Menu items
  const menuItems = el('div', { class: 'user-menu__items' });

  // My Cases link (for faculty)
  if (user.roles.includes(ROLES.FACULTY) || user.roles.includes(ROLES.ADMIN)) {
    const myCasesLink = el(
      'a',
      {
        href: '#/instructor/cases?filter=mine',
        class: 'user-menu__item',
        role: 'menuitem',
      },
      '📁 My Cases',
    );
    menuItems.appendChild(myCasesLink);
  }

  // Request Faculty Access (for students only)
  if (user.role === ROLES.STUDENT && !user.roleRequestedAt) {
    const requestBtn = el(
      'button',
      {
        type: 'button',
        class: 'user-menu__item',
        role: 'menuitem',
      },
      '🎓 Request Faculty Access',
    );
    requestBtn.addEventListener('click', async () => {
      requestBtn.textContent = '⏳ Requesting...';
      requestBtn.disabled = true;
      const result = await requestFacultyAccess();
      if (result.success) {
        requestBtn.textContent = '✅ Request Submitted';
        // Update the menu after a short delay
        setTimeout(() => {
          clearUserCache();
          updateUserMenu(wrapper.closest('.user-menu'));
        }, 1500);
      } else {
        requestBtn.textContent = '❌ ' + result.message;
        setTimeout(() => {
          requestBtn.textContent = '🎓 Request Faculty Access';
          requestBtn.disabled = false;
        }, 2000);
      }
    });
    menuItems.appendChild(requestBtn);
  }

  // Show pending request status
  if (user.role === ROLES.STUDENT && user.roleRequestedAt) {
    const pendingItem = el(
      'div',
      { class: 'user-menu__item user-menu__item--muted' },
      '⏳ Faculty request pending',
    );
    menuItems.appendChild(pendingItem);
  }

  // Admin link (for admins)
  if (user.roles.includes(ROLES.ADMIN)) {
    const adminLink = el(
      'a',
      {
        href: '#/admin/users',
        class: 'user-menu__item',
        role: 'menuitem',
      },
      '👑 Manage Users',
    );
    menuItems.appendChild(adminLink);
  }

  // Logout button
  const logoutBtn = el(
    'button',
    {
      type: 'button',
      class: 'user-menu__item user-menu__item--danger',
      role: 'menuitem',
    },
    '🚪 Sign Out',
  );
  logoutBtn.addEventListener('click', () => {
    logout('/');
  });
  menuItems.appendChild(logoutBtn);

  menu.appendChild(menuItems);
  wrapper.appendChild(trigger);
  wrapper.appendChild(menu);

  // Toggle dropdown on click
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menu.hidden === false;
    menu.hidden = isOpen;
    trigger.setAttribute('aria-expanded', !isOpen);
  });

  // Close on outside click
  document.addEventListener('click', () => {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  });

  // Close on escape
  wrapper.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  });

  return wrapper;
}

/**
 * Get initials from a name
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name[0] || 'U').toUpperCase();
}

/**
 * Truncate string to max length
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
function truncate(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

/**
 * Get role badge element
 * @param {string[]} roles
 * @returns {HTMLElement|null}
 */
function getRoleBadge(roles) {
  let label = '';
  let badgeClass = '';

  if (roles.includes(ROLES.ADMIN)) {
    label = '👑 Admin';
    badgeClass = 'user-menu__role--admin';
  } else if (roles.includes(ROLES.FACULTY)) {
    label = '🎓 Faculty';
    badgeClass = 'user-menu__role--faculty';
  } else if (roles.includes(ROLES.STUDENT)) {
    label = '📚 Student';
    badgeClass = 'user-menu__role--student';
  } else {
    return null;
  }

  return el('span', { class: `user-menu__role ${badgeClass}` }, label);
}

/**
 * Initialize user menu in the header
 * Call this on app startup
 */
export function initUserMenu() {
  const nav = document.getElementById('primaryNav');
  if (!nav) {
    console.warn('Could not find primaryNav to insert user menu');
    return;
  }

  // Check if already initialized
  if (nav.querySelector('.user-menu')) {
    return;
  }

  // Insert before theme toggle
  const themeToggle = document.getElementById('themeToggle');
  const userMenu = createUserMenu();

  if (themeToggle) {
    nav.insertBefore(userMenu, themeToggle);
  } else {
    nav.appendChild(userMenu);
  }
}
