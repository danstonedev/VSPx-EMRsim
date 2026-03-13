/**
 * Access Gate – blocks the app until a valid access code is entered.
 * The code is validated server-side via /api/verify-access.
 * A successful entry is stored in sessionStorage so the user
 * only needs to enter it once per browser session.
 *
 * Supports tiered access: student vs faculty codes grant different roles.
 */

const STORAGE_KEY = 'pt_emr_access_granted';
const ROLE_KEY = 'pt_emr_access_role';

/** Check whether this session has already been granted access */
export function isAccessGranted() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Get the current session role ('student' | 'faculty'). Defaults to 'student'. */
export function getAccessRole() {
  try {
    return sessionStorage.getItem(ROLE_KEY) || 'student';
  } catch {
    return 'student';
  }
}

/** Mark the current session as granted with a role */
function grantAccess(role) {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
    sessionStorage.setItem(ROLE_KEY, role || 'student');
  } catch {
    // sessionStorage unavailable – gate will re-show on reload
  }
}

/**
 * Show the access gate overlay. Returns a Promise that resolves
 * once the user enters a valid code (or immediately if already granted).
 */
export function showAccessGate() {
  // Skip the gate on localhost (dev environment) — grant full faculty access
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    grantAccess('faculty');
    return Promise.resolve();
  }

  if (isAccessGranted()) return Promise.resolve();

  // Dismiss the init overlay — the access gate IS the loading screen now
  try {
    const initOverlay = document.getElementById('appInitOverlay');
    if (initOverlay) initOverlay.remove();
    document.body.classList.remove('app-initializing');
  } catch {
    /* overlay may not exist */
  }

  // Fire a warm-up ping so the API function is ready when the user submits
  fetch('/api/verify-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: '' }),
  }).catch(() => {});

  // Preload critical app modules in the background while user types the code
  Promise.all([
    import('../views/home.js'),
    import('../core/store.js'),
    import('./UserMenu.js'),
  ]).catch(() => {});

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'access-gate-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Access code required');

    overlay.innerHTML = `
      <div class="access-gate-card">
        <img class="access-gate-logo" src="/img/EMRsim-green.png" alt="EMR-Sim" />
        <form class="access-gate-form" autocomplete="off">
          <label for="access-code-input" class="sr-only">Access code</label>
          <input
            id="access-code-input"
            class="access-gate-input"
            type="password"
            placeholder="Access code"
            autocomplete="off"
            required
          />
          <button type="submit" class="access-gate-btn">Enter</button>
        </form>
        <p class="access-gate-error" aria-live="polite"></p>
        <h2 class="access-gate-title">University of North Dakota</h2>
        <p class="access-gate-line2">School of Medicine &amp; Health Sciences</p>
        <p class="access-gate-line3">Department of Physical Therapy</p>
      </div>
    `;

    document.body.appendChild(overlay);

    const form = overlay.querySelector('.access-gate-form');
    const input = overlay.querySelector('.access-gate-input');
    const errorEl = overlay.querySelector('.access-gate-error');
    const btn = overlay.querySelector('.access-gate-btn');

    input.focus();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = input.value.trim();
      if (!code) return;

      btn.disabled = true;
      btn.textContent = 'Checking…';
      errorEl.textContent = '';

      try {
        const res = await fetch('/api/verify-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.valid) {
            grantAccess(data.role);
            overlay.classList.add('access-gate-fade-out');
            overlay.addEventListener('animationend', () => {
              overlay.remove();
              resolve();
            });
            return;
          }
        }

        errorEl.textContent = 'Invalid access code. Please try again.';
        input.value = '';
        input.focus();
      } catch {
        errorEl.textContent = 'Unable to verify. Check your connection and try again.';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Enter';
      }
    });
  });
}
