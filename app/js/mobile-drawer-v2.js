/**
 * Mobile Drawer v2 (Test Harness)
 *
 * This lightweight script exists to support standalone HTML tests such as
 * app/tests/mobile-drawer.test.html. It wires a simple hamburger toggle that:
 * - Adds/removes 'is-open' on '.chart-navigation'
 * - Adds/removes 'is-visible' on an overlay '.drawer-overlay'
 * - Updates aria-expanded on the '.hamburger-btn' button
 * - Closes when a '.mobile-close' button inside the drawer is clicked
 *
 * Note: The production app uses the modern MobileNav system in
 * app/js/features/navigation/MobileNav.js and does not include this file.
 */

(function () {
  function wire(btn, drawer) {
    if (!btn || !drawer || btn._mobileDrawerBound) return false;

    // Ensure starting state
    if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');

    // Overlay: create if not present
    let overlay =
      document.getElementById('drawerOverlay') || document.querySelector('.drawer-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'drawerOverlay';
      overlay.className = 'drawer-overlay';
      document.body.appendChild(overlay);
    }

    function open() {
      drawer.classList.add('is-open');
      document.body.classList.add('mobile-drawer-open');
      overlay.classList.add('is-visible');
      btn.setAttribute('aria-expanded', 'true');
      try {
        drawer.focus();
      } catch {
        /* element may not exist */
      }
    }

    function close() {
      drawer.classList.remove('is-open');
      document.body.classList.remove('mobile-drawer-open');
      overlay.classList.remove('is-visible');
      btn.setAttribute('aria-expanded', 'false');
      try {
        btn.focus();
      } catch {
        /* element may not exist */
      }
    }

    function toggle() {
      if (drawer.classList.contains('is-open')) {
        close();
      } else {
        open();
      }
    }

    // Bind events
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggle();
    });
    overlay.addEventListener('click', close);
    const closeBtn = drawer.querySelector('.mobile-close');
    if (closeBtn) closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
    });

    // Mark as bound so we don't double-bind
    btn._mobileDrawerBound = true;

    // Expose for tests if needed
    try {
      window.__MOBILE_DRAWER_V2 = {
        open,
        close,
        toggle,
        elements: { btn, drawer, overlay },
      };
    } catch {
      /* safe fallback */
    }
    return true;
  }

  function tryInit() {
    const btn = document.querySelector('.hamburger-btn');
    const drawer = document.querySelector('.chart-navigation');
    if (wire(btn, drawer)) return true;
    return false;
  }

  // Attempt immediately
  if (!tryInit()) {
    // Fallback on DOMContentLoaded and load
    document.addEventListener('DOMContentLoaded', tryInit, { once: true });
    window.addEventListener('load', tryInit, { once: true });
    // Last-resort short retry loop (250ms x 8 ≈ 2s)
    let attempts = 0;
    const t = setInterval(() => {
      if (tryInit() || ++attempts >= 8) clearInterval(t);
    }, 250);
  }
})();
