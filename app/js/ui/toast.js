// ui/toast.js
// Minimal, dependency-free toast/snackbar utility with tiny injected CSS.
// Usage: showToast('Message text');

let container = null;
let styleInjected = false;

function ensureStyles() {
  if (styleInjected) return;
  styleInjected = true;
  const css = `
  .toast-container{position:fixed;left:0;right:0;bottom:16px;display:flex;flex-direction:column;align-items:center;gap:8px;z-index:9998;pointer-events:none}
  .toast{pointer-events:auto;max-width:min(92vw,560px);background:rgba(0,0,0,.9);color:var(--white, #fff);padding:10px 14px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.18);font:14px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Arial,sans-serif;display:flex;align-items:center;gap:8px;opacity:0;transform:translateY(8px);transition:opacity .22s ease,transform .22s ease}
  .toast.is-open{opacity:1;transform:translateY(0)}
  .toast .toast-icon{width:18px;height:18px;flex:0 0 18px;opacity:.9}
  @media (prefers-reduced-motion: reduce){.toast{transition:none}}
  `;
  const style = document.createElement('style');
  style.setAttribute('data-module', 'toast');
  style.textContent = css;
  document.head.appendChild(style);
}

function ensureContainer() {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.className = 'toast-container';
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-atomic', 'true');
  document.body.appendChild(container);
  return container;
}

/**
 * Show a toast message that auto-dismisses.
 * @param {string|Node} message
 * @param {{ timeoutMs?: number, iconSVG?: string }} [opts]
 */
export function showToast(message, opts = {}) {
  ensureStyles();
  const root = ensureContainer();
  const timeoutMs = typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 3200;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');

  if (opts.iconSVG) {
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    // Only accept known static SVG strings from internal callers
    if (typeof opts.iconSVG === 'string' && opts.iconSVG.startsWith('<svg')) {
      icon.innerHTML = opts.iconSVG;
    }
    icon.setAttribute('aria-hidden', 'true');
    toast.appendChild(icon);
  }

  if (typeof message === 'string') {
    toast.appendChild(document.createTextNode(message));
  } else if (message instanceof Node) {
    toast.appendChild(message);
  }

  // Dismiss on click
  toast.addEventListener('click', () => dismiss());

  // Limit to 3 toasts; remove oldest if needed
  while (root.children.length >= 3) {
    root.removeChild(root.firstElementChild);
  }
  root.appendChild(toast);
  // Enter animation next frame
  requestAnimationFrame(() => toast.classList.add('is-open'));

  let timer = null;
  const dismiss = () => {
    if (!toast.parentElement) return;
    toast.classList.remove('is-open');
    // After transition ends, remove
    const cleanup = () => toast.parentElement && toast.parentElement.removeChild(toast);
    toast.addEventListener('transitionend', cleanup, { once: true });
    // Fallback remove in case transitionend not fired
    setTimeout(cleanup, 400);
  };
  timer = setTimeout(dismiss, timeoutMs);

  return {
    close: () => {
      if (timer) clearTimeout(timer);
      dismiss();
    },
    el: toast,
  };
}
