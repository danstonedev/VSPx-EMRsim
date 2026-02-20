// @ts-check
// prefetch.js - tiny idle prefetch helper for lazy modules

const ric =
  typeof window !== 'undefined' && window.requestIdleCallback
    ? window.requestIdleCallback
    : /** @param {(deadline: { didTimeout: boolean; timeRemaining: () => number }) => void} cb */
      (cb) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 50);

/**
 * Schedule a dynamic import during idle time. Accepts a loader returning a promise (e.g., () => import(...)).
 * @template T
 * @param {() => Promise<T>} loader
 */
export function idleImport(loader) {
  try {
    ric(() => {
      try {
        loader();
      } catch {
        /* prefetch is best-effort */
      }
    });
  } catch {
    /* requestIdleCallback may not be available */
  }
}
