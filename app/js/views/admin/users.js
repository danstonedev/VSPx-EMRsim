/**
 * Admin Users View
 * Simple interface for admins to manage user roles
 */

import { route } from '../../core/router.js';
import { el } from '../../ui/utils.js';
import { getCurrentUser, ROLES } from '../../core/auth.js';

route('#/admin/users', async (appEl) => {
  const user = await getCurrentUser();

  // Check admin access
  if (!user || !user.roles.includes(ROLES.ADMIN)) {
    appEl.replaceChildren(
      el('div', { class: 'admin-denied' }, [
        el('h1', {}, '🚫 Access Denied'),
        el('p', {}, 'You need admin privileges to access this page.'),
        el('a', { href: '#/', class: 'btn btn--primary' }, 'Go Home'),
      ]),
    );
    return;
  }

  // Build admin UI
  const container = el('div', { class: 'admin-users' });

  container.appendChild(el('h1', { class: 'admin-users__title' }, '👑 User Management'));

  // Tabs
  const tabs = el('div', { class: 'admin-users__tabs' });
  const pendingTab = el(
    'button',
    { class: 'admin-tab active', 'data-tab': 'pending' },
    '⏳ Pending Requests',
  );
  const allTab = el('button', { class: 'admin-tab', 'data-tab': 'all' }, '👥 All Users');
  tabs.appendChild(pendingTab);
  tabs.appendChild(allTab);
  container.appendChild(tabs);

  // Content area
  const content = el('div', { class: 'admin-users__content' });
  container.appendChild(content);

  // Tab switching
  let currentTab = 'pending';
  const loadTab = async (tab) => {
    currentTab = tab;
    pendingTab.classList.toggle('active', tab === 'pending');
    allTab.classList.toggle('active', tab === 'all');
    content.innerHTML = '<p class="loading">Loading...</p>';

    try {
      const filter = tab === 'pending' ? '?filter=pending' : '';
      const res = await fetch(`/api/admin/users${filter}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load users');
      }
      const data = await res.json();
      renderUsers(data.users, tab === 'pending');
    } catch (e) {
      content.innerHTML = `<p class="error">Error: ${e.message}</p>`;
    }
  };

  pendingTab.addEventListener('click', () => loadTab('pending'));
  allTab.addEventListener('click', () => loadTab('all'));

  // Render users table
  const renderUsers = (users, showActions) => {
    content.innerHTML = '';

    if (users.length === 0) {
      content.appendChild(
        el(
          'p',
          { class: 'admin-users__empty' },
          showActions ? 'No pending requests 🎉' : 'No users found',
        ),
      );
      return;
    }

    const table = el('table', { class: 'admin-users__table' });

    // Header
    const thead = el('thead');
    const headerRow = el('tr');
    ['Name', 'Email', 'Role', 'Requested', showActions ? 'Actions' : 'Last Login'].forEach((h) => {
      headerRow.appendChild(el('th', {}, h));
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = el('tbody');
    users.forEach((u) => {
      const row = el('tr');

      row.appendChild(el('td', {}, u.displayName || 'Unknown'));
      row.appendChild(el('td', {}, u.email || '-'));
      row.appendChild(el('td', {}, getRoleBadgeHTML(u.role)));

      if (showActions) {
        row.appendChild(el('td', {}, formatDate(u.roleRequestedAt)));

        const actionsCell = el('td', { class: 'admin-users__actions' });
        const approveBtn = el('button', { class: 'btn btn--small btn--success' }, '✅ Approve');
        const denyBtn = el('button', { class: 'btn btn--small btn--danger' }, '❌ Deny');

        approveBtn.addEventListener('click', () => handleAction(u.id, 'approve', row));
        denyBtn.addEventListener('click', () => handleAction(u.id, 'deny', row));

        actionsCell.appendChild(approveBtn);
        actionsCell.appendChild(denyBtn);
        row.appendChild(actionsCell);
      } else {
        row.appendChild(el('td', {}, formatDate(u.lastLoginAt)));
      }

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    content.appendChild(table);
  };

  // Handle approve/deny actions
  const handleAction = async (userId, action, row) => {
    try {
      row.style.opacity = '0.5';
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Action failed');
      }

      // Reload the current tab
      await loadTab(currentTab);
    } catch (e) {
      row.style.opacity = '1';
      // eslint-disable-next-line no-alert
      alert('Error: ' + e.message);
    }
  };

  appEl.replaceChildren(container);

  // Load initial tab
  loadTab('pending');
});

function getRoleBadgeHTML(role) {
  const badges = {
    admin: '👑 Admin',
    faculty: '🎓 Faculty',
    student: '📚 Student',
  };
  return badges[role] || role;
}

function formatDate(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return (
      d.toLocaleDateString() +
      ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return isoString;
  }
}
