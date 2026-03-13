/**
 * Access Gate – blocks the app until a valid access code is entered.
 * The code is validated server-side via /api/verify-access.
 * A successful entry is stored in sessionStorage so the user
 * only needs to enter it once per browser session.
 */

const STORAGE_KEY = 'pt_emr_access_granted';

/** Check whether this session has already been granted access */
export function isAccessGranted() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Mark the current session as granted */
function grantAccess() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // sessionStorage unavailable – gate will re-show on reload
  }
}

/**
 * Show the access gate overlay. Returns a Promise that resolves
 * once the user enters a valid code (or immediately if already granted).
 */
export function showAccessGate() {
  // Skip the gate on localhost (dev environment)
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return Promise.resolve();

  if (isAccessGranted()) return Promise.resolve();

  // Fire a warm-up ping so the API function is ready when the user submits
  fetch('/api/verify-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: '' }),
  }).catch(() => {});

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'access-gate-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Access code required');

    overlay.innerHTML = `
      <div class="access-gate-card">
        <img class="access-gate-logo" src="/img/EMRsim-green.png" alt="UND PT EMR-Sim" />
        <h1 class="access-gate-title">PT EMR Simulator</h1>
        <p class="access-gate-subtitle">Enter the access code provided by your instructor to continue.</p>
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
        <p class="access-gate-footer">University of North Dakota &mdash; Department of Physical Therapy</p>
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
            grantAccess();
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
