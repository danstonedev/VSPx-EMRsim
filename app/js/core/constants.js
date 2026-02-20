// Application Constants
// Centralized configuration and constants for better maintainability

// Note: Unused constants removed for better tree shaking
// Add back individual constants only when actually needed

// Experimental flags (opt-in via URL or code). Keep defaults conservative (false).
export const EXPERIMENT_FLAGS = {
  NAV_SIMPLE_MODE: true,
};

/**
 * True when running on localhost / 127.0.0.1 (dev servers).
 * Use this instead of inline hostname checks throughout the codebase.
 */
export const IS_LOCAL_DEV =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
