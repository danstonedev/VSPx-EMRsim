/**
 * Modern Mobile Navigation
 * Clean, accessible mobile navigation that matches the app's design system
 */

export class MobileNav {
  constructor() {
    this.isOpen = false;
    this.hamburgerBtn = null;
    this.overlay = null;
    this.drawer = null;
    this._ac = new AbortController(); // central teardown for all listeners
    this.init();
  }

  destroy() {
    this._ac.abort();
    this.close();
    try {
      window.__MOBILE_NAV_ACTIVE = false;
    } catch {
      /* safe fallback */
    }
  }

  init() {
    this.createElements();
    this.bindEvents();
    // Signal that MobileNav is handling hamburger interactions on mobile
    try {
      window.__MOBILE_NAV_ACTIVE = true;
    } catch {
      /* safe fallback */
    }
  }

  createElements() {
    // Create hamburger button if it doesn't exist
    this.hamburgerBtn = document.querySelector('.hamburger-btn');
    if (!this.hamburgerBtn) {
      console.warn('Hamburger button not found');
      return;
    }

    // Create overlay
    this.overlay = this.createOverlay();

    // Create drawer
    this.drawer = this.createDrawer();
  }

  createOverlay() {
    let overlay = document.getElementById('mobileNavOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'mobileNavOverlay';
      overlay.className = 'mobile-nav-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  createDrawer() {
    let drawer = document.getElementById('mobileNavDrawer');
    if (!drawer) {
      drawer = document.createElement('nav');
      drawer.id = 'mobileNavDrawer';
      drawer.className = 'mobile-nav-drawer';
      drawer.setAttribute('aria-label', 'Mobile navigation');
      drawer.setAttribute('aria-hidden', 'true');

      // Create drawer content
      drawer.innerHTML = this.getDrawerContent();
      document.body.appendChild(drawer);
    }
    return drawer;
  }

  getDrawerContent() {
    return `
      <div class="mobile-nav-header">
        <h2 class="mobile-nav-title">Navigation</h2>
        <button type="button" class="mobile-nav-close" aria-label="Close navigation">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="mobile-nav-content">
        <ul class="mobile-nav-list">
          <li><a href="#/" class="mobile-nav-link">Home</a></li>
          <li><a href="#/student/cases" class="mobile-nav-link">Student</a></li>
          <li><a href="#/instructor/cases" class="mobile-nav-link">Faculty</a></li>
          <li><a href="#" class="mobile-nav-link mobile-nav-feedback-link">Submit Feedback</a></li>
          <li><a href="#" class="mobile-nav-link mobile-nav-theme-link">Toggle Theme</a></li>
        </ul>
      </div>
    `;
  }

  bindEvents() {
    if (!this.hamburgerBtn) return;

    // Only bind events on mobile screens
    if (!this.isMobileScreen()) return;

    const sig = { signal: this._ac.signal };

    // Hamburger button click
    this.hamburgerBtn.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        this.toggle();
      },
      sig,
    );

    // Close button click
    const closeBtn = this.drawer?.querySelector('.mobile-nav-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close(), sig);
    }

    // Overlay click to close
    this.overlay?.addEventListener('click', () => this.close(), sig);

    // Escape key to close
    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      },
      sig,
    );

    // Close on route change
    window.addEventListener('hashchange', () => this.close(), sig);

    // Handle screen resize
    window.addEventListener(
      'resize',
      () => {
        if (!this.isMobileScreen() && this.isOpen) {
          this.close();
        }
      },
      sig,
    );

    // Wire theme + feedback links in the list
    const themeLink = this.drawer?.querySelector('.mobile-nav-theme-link');
    if (themeLink) {
      themeLink.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          const t = document.getElementById('themeToggle');
          if (t) t.click();
        },
        sig,
      );
    }
    const feedbackLink = this.drawer?.querySelector('.mobile-nav-feedback-link');
    if (feedbackLink) {
      feedbackLink.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          const f = document.getElementById('feedbackBtn');
          if (f) f.click();
          this.close();
        },
        sig,
      );
    }
  }

  isMobileScreen() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  toggle() {
    if (!this.isMobileScreen()) return;

    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (!this.isMobileScreen() || this.isOpen) return;

    this.isOpen = true;
    document.body.classList.add('mobile-nav-open');

    // Show elements (ensure NOT aria-hidden before moving focus)
    this.overlay.classList.add('visible');
    this.drawer.classList.add('open');
    this.drawer.removeAttribute('aria-hidden');
    this.drawer.removeAttribute('inert');
    this.overlay.removeAttribute('aria-hidden');
    this.overlay.removeAttribute('inert');
    this.hamburgerBtn.setAttribute('aria-expanded', 'true');

    // Focus management (after visibility change)
    this.trapFocus();
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    document.body.classList.remove('mobile-nav-open');

    // Before hiding, move focus back to hamburger to avoid hiding focused descendant
    try {
      this.hamburgerBtn.focus();
    } catch {
      /* element may not exist */
    }

    // Hide elements / accessibility state
    this.overlay.classList.remove('visible');
    this.drawer.classList.remove('open');
    this.hamburgerBtn.setAttribute('aria-expanded', 'false');
    this.drawer.setAttribute('aria-hidden', 'true');
    this.overlay.setAttribute('aria-hidden', 'true');
    // Use inert so elements are removed from sequential navigation (safer than aria-hidden alone)
    this.drawer.setAttribute('inert', '');
    this.overlay.setAttribute('inert', '');
  }

  trapFocus() {
    // Simple focus trap - focus first focusable element in drawer
    if (!this.drawer || this.drawer.getAttribute('aria-hidden') === 'true') return;
    const firstFocusable = this.drawer.querySelector('button, a, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();
  }
}

// Auto-initialize on mobile screens
export function initMobileNav(opts = {}) {
  // Relaxed logic: initialize when width <= 768px (regardless of pointer) OR force flag provided.
  // Rationale: Some modern phones/tablets (especially with stylus support) report a 'fine' pointer, causing
  // the previous coarse-pointer gate to skip initialization, leaving the hamburger inert.
  const force = !!opts.force;
  const isMobileWidth = window.matchMedia('(max-width: 768px)').matches;
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (!force && !isMobileWidth) return null; // Outside mobile width and not forced.

  // Prevent duplicate construction if already active
  if (window.__MOBILE_NAV_ACTIVE) return null;

  try {
    const nav = new MobileNav();
    // Flag if we initialized under a fine pointer so future tweaks (like hit target adjustments) are possible
    if (!hasCoarsePointer) {
      try {
        window.__MOBILE_NAV_FINE_POINTER = true;
      } catch {
        /* safe fallback */
      }
    }
    // Debug aid: enable via ?debug=1
    if (location.search.includes('debug=1')) {
      console.warn('[MobileNav] initialized', { isMobileWidth, hasCoarsePointer, forced: force });
    }
    return nav;
  } catch (e) {
    console.warn('MobileNav initialization failed', e);
    return null;
  }
}

// Late opportunistic init if user resizes/rotates into mobile width after load.
// (Lightweight guard to avoid adding listeners if already initialized.)
if (typeof window !== 'undefined' && !window.__MOBILE_NAV_RESIZE_WATCH) {
  try {
    window.__MOBILE_NAV_RESIZE_WATCH = true;
    const _resizeAc = new AbortController();
    window.addEventListener(
      'resize',
      () => {
        if (!window.__MOBILE_NAV_ACTIVE && window.matchMedia('(max-width: 768px)').matches) {
          initMobileNav();
          // Stop watching once initialized
          _resizeAc.abort();
        }
      },
      { signal: _resizeAc.signal },
    );
  } catch (e) {
    console.warn('MobileNav resize watch setup failed:', e);
  }
}
