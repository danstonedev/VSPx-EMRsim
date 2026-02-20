// Debug mode and console silencer (uses storage seam)
// Use ?debug=1 to enable logs (persists in storage); ?debug=0 to disable again
import { storage } from '../../core/index.js';

try {
  const url = new URL(window.location.href);
  const debugParam = url.searchParams.get('debug');
  if (debugParam === '1') storage.setItem('debug', '1');
  if (debugParam === '0') storage.removeItem('debug');
} catch {
  /* safe fallback */
}
const isDebug = storage.getItem('debug') === '1';
window.DEBUG = isDebug;
if (!isDebug) {
  const noop = () => {};
  try {
    // use window.console indirection to satisfy lint rules
    if (window && window.console && typeof window.console.log === 'function') {
      window.console.log = noop;
    }
  } catch {
    /* safe fallback */
  }
  try {
    if (window && window.console && typeof window.console.debug === 'function') {
      window.console.debug = noop;
    }
  } catch {
    /* safe fallback */
  }
}
