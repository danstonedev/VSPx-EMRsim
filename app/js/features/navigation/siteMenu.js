// Module-level AbortController for global listeners; prevents stacking on re-init
let _menuAc = null;

/**
 * Site Menu (mobile/compact) controller
 * - Ties .hamburger-btn to #siteMenu
 * - Adds overlay, focus trap, ESC + route-close, aria-expanded/hidden
 */
// eslint-disable-next-line complexity
export function initSiteMenu() {
  if (window.__SITE_MENU_INIT__) return false;
  const hamburger = document.querySelector('.hamburger-btn');
  const menu = document.getElementById('siteMenu');
  if (!hamburger || !menu) return false;

  window.__SITE_MENU_INIT__ = true;

  // Abort any previous listeners and create a fresh controller
  if (_menuAc) _menuAc.abort();
  _menuAc = new AbortController();
  const sig = { signal: _menuAc.signal };

  function ensureOverlay() {
    let ov = document.getElementById('siteMenuOverlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'siteMenuOverlay';
      ov.className = 'site-menu-overlay';
      document.body.appendChild(ov);
    }
    return ov;
  }
  const overlay = ensureOverlay();
  const closeBtn = menu.querySelector('.site-menu-close');

  function getFocusables(root) {
    return Array.from(
      root.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
  }

  let lastTrigger = null;

  function openMenu() {
    lastTrigger = document.activeElement;
    menu.classList.add('is-open');
    overlay.classList.add('is-visible');
    menu.removeAttribute('inert');
    menu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('mobile-drawer-open');
    hamburger.setAttribute('aria-expanded', 'true');
    const f = getFocusables(menu);
    setTimeout(() => (f[0] ? f[0].focus() : menu.focus && menu.focus()), 0);
  }

  function closeMenu() {
    // Determine focus target before hiding
    const target = lastTrigger && typeof lastTrigger.focus === 'function' ? lastTrigger : hamburger;
    // Visually close first
    menu.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    document.body.classList.remove('mobile-drawer-open');
    hamburger.setAttribute('aria-expanded', 'false');
    // Move focus out immediately to avoid aria-hidden on focused ancestor warnings
    if (target) {
      try {
        target.focus();
      } catch {
        /* element may not exist */
      }
    }
    // Now hide from assistive tech and prevent stray focus while hidden
    menu.setAttribute('aria-hidden', 'true');
    menu.setAttribute('inert', '');
  }

  function onKeydownTrap(e) {
    if (!menu.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      return;
    }
    if (e.key === 'Tab') {
      const f = getFocusables(menu);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  if (!hamburger._siteMenuBound) {
    hamburger.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        menu.classList.contains('is-open') ? closeMenu() : openMenu();
      },
      sig,
    );
    hamburger._siteMenuBound = true;
  }
  if (!overlay._siteMenuBound) {
    overlay.addEventListener('click', closeMenu, sig);
    overlay._siteMenuBound = true;
  }
  if (closeBtn && !closeBtn._siteMenuBound) {
    closeBtn.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        closeMenu();
      },
      sig,
    );
    closeBtn._siteMenuBound = true;
  }

  document.addEventListener('keydown', onKeydownTrap, sig);
  window.addEventListener('hashchange', closeMenu, sig);

  // Wire theme + feedback buttons inside the menu (delegated where possible)
  const themeBtn = document.getElementById('siteMenuThemeToggle');
  const feedbackBtn = document.getElementById('siteMenuFeedback');
  if (themeBtn && !themeBtn._siteMenuBound) {
    themeBtn.addEventListener(
      'click',
      () => {
        const t = document.getElementById('themeToggle');
        if (t) t.click();
      },
      sig,
    );
    themeBtn._siteMenuBound = true;
  }
  if (feedbackBtn && !feedbackBtn._siteMenuBound) {
    feedbackBtn.addEventListener(
      'click',
      () => {
        const f = document.getElementById('feedbackBtn');
        if (f) f.click();
        closeMenu();
      },
      sig,
    );
    feedbackBtn._siteMenuBound = true;
  }

  // Ensure hidden state is non-focusable initially
  if (!menu.classList.contains('is-open')) {
    menu.setAttribute('aria-hidden', 'true');
    menu.setAttribute('inert', '');
  }

  return true;
}
