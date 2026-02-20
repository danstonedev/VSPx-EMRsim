// @ts-check
// async.js - Helpers for safe async handlers

/**
 * Wrap an async function to safely handle errors in UI event handlers.
 * Returns a function you can pass directly as an event listener.
 *
 * Contract:
 * - Input: a function (possibly async) receiving (...args)
 * - Output: function that invokes the handler and catches errors
 * - On error: logs to console and optionally calls onError(err)
 *
 * @template {any[]} A
 * @param {( ...args: A) => any | Promise<any>} handler
 * @param {{ onError?: (err: unknown) => void }} [opts]
 * @returns {( ...args: A) => void}
 */
export function safeAsync(handler, opts) {
  const onError = opts && opts.onError;
  return (...args) => {
    try {
      const res = handler(...args);
      if (res && typeof res.then === 'function') {
        res.catch((/** @type {unknown} */ err) => {
          console.error('Unhandled async error:', err);
          try {
            onError && onError(err);
          } catch {
            /* onError callback may throw */
          }
        });
      }
    } catch (err) {
      console.error('Unhandled error:', err);
      try {
        onError && onError(err);
      } catch {
        /* onError callback may throw */
      }
    }
  };
}
