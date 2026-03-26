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
const CAPABILITY_KEY = 'pt_emr_access_capability';

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

/** Set the current session role */
export function setAccessRole(role) {
  try {
    sessionStorage.setItem(ROLE_KEY, role || 'student');
  } catch {
    // sessionStorage unavailable
  }
}

/** Get the max capability tier for this session. Falls back to current role. */
export function getAccessCapability() {
  try {
    return sessionStorage.getItem(CAPABILITY_KEY) || getAccessRole();
  } catch {
    return 'student';
  }
}

/** Set the max capability tier for this session */
export function setAccessCapability(cap) {
  try {
    sessionStorage.setItem(CAPABILITY_KEY, cap || 'student');
  } catch {
    // sessionStorage unavailable
  }
}

/** Mark the current session as granted with a role */
function grantAccess(role) {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
    sessionStorage.setItem(ROLE_KEY, role || 'student');
    sessionStorage.setItem(CAPABILITY_KEY, role || 'student');
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

  // Fire warm-up pings so API functions are ready when the user submits
  fetch('/api/verify-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: '' }),
  }).catch(() => {});
  // Warm up the cases API (Cosmos DB cold start) so case lists load fast
  fetch('/api/cases', { method: 'GET' }).catch(() => {});

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
        <p class="access-gate-status" aria-live="polite" role="status"></p>
        <h2 class="access-gate-title">University of North Dakota</h2>
        <p class="access-gate-line2">School of Medicine &amp; Health Sciences</p>
        <p class="access-gate-line3">Department of Physical Therapy</p>
      </div>
    `;

    document.body.appendChild(overlay);

    const form = overlay.querySelector('.access-gate-form');
    const input = overlay.querySelector('.access-gate-input');
    const statusEl = overlay.querySelector('.access-gate-status');
    const btn = overlay.querySelector('.access-gate-btn');
    let isClosing = false;

    const setStatus = (message, kind = 'info') => {
      statusEl.textContent = message;
      statusEl.classList.remove('is-info', 'is-success', 'is-error');
      statusEl.classList.add(`is-${kind}`);
    };

    const closeGate = () => {
      if (isClosing) return;
      isClosing = true;

      const finish = () => {
        if (!overlay.isConnected) return;
        overlay.remove();
        resolve();
      };

      const prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        finish();
        return;
      }

      overlay.classList.add('access-gate-fade-out');
      const fallbackTimer = window.setTimeout(finish, 450);
      overlay.addEventListener(
        'animationend',
        () => {
          window.clearTimeout(fallbackTimer);
          finish();
        },
        { once: true },
      );
    };

    input.focus();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isClosing) return;

      const code = input.value.trim();
      if (!code) {
        setStatus('Enter an access code to continue.', 'error');
        input.focus();
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Checking…';
      input.disabled = true;
      setStatus('Verifying access code…', 'info');

      let timeoutId = null;

      try {
        const controller = new AbortController();
        timeoutId = window.setTimeout(() => controller.abort(), 10000);
        const res = await fetch('/api/verify-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
          signal: controller.signal,
        });

        let data = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (res.ok && data && data.valid) {
          grantAccess(data.role);
          setStatus('Access accepted. Loading…', 'success');
          closeGate();
          return;
        }

        setStatus(data?.error || 'Invalid access code. Please try again.', 'error');
        input.value = '';
        input.focus();
      } catch {
        setStatus('Unable to verify. Check your connection and try again.', 'error');
      } finally {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        if (!isClosing) {
          btn.disabled = false;
          btn.textContent = 'Enter';
          input.disabled = false;
        }
      }
    });
  });
}
