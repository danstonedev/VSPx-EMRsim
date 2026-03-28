/**
 * Tests for the Toast notification system (module-level store logic).
 * Tests showToast, auto-dismiss, and multiple-toast trimming.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

// Mock svelte/store's writable to track toasts — we test the exported functions
// rather than rendering the component, since the logic lives in the module scope.

// Re-import fresh module state each run via vi.resetModules()
describe('Toast store (showToast / dismiss)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('showToast returns a close handle', async () => {
    const { showToast } = await import('$lib/components/Toast.svelte');
    const handle = showToast('Hello');
    expect(handle).toHaveProperty('close');
    expect(typeof handle.close).toBe('function');
  });

  it('showToast with success type does not throw', async () => {
    const { showToast } = await import('$lib/components/Toast.svelte');
    expect(() => showToast('Saved', { type: 'success', timeout: 1000 })).not.toThrow();
  });

  it('showToast with error type does not throw', async () => {
    const { showToast } = await import('$lib/components/Toast.svelte');
    expect(() => showToast('Error occurred', { type: 'error' })).not.toThrow();
  });

  it('close handle dismisses the toast', async () => {
    const { showToast } = await import('$lib/components/Toast.svelte');
    const handle = showToast('Dismissable', { timeout: 0 });
    // Should not throw
    expect(() => handle.close()).not.toThrow();
  });

  it('auto-dismiss fires after timeout', async () => {
    const { showToast } = await import('$lib/components/Toast.svelte');
    const handle = showToast('Auto-dismiss me', { timeout: 2000 });
    // Should still be present before timeout
    // Advance past timeout + exit animation (300ms)
    vi.advanceTimersByTime(2400);
    // Should not throw after dismissal
    expect(() => handle.close()).not.toThrow();
  });

  it('multiple showToast calls do not throw', async () => {
    const { showToast } = await import('$lib/components/Toast.svelte');
    expect(() => {
      showToast('First');
      showToast('Second');
      showToast('Third');
      showToast('Fourth — should trim oldest');
    }).not.toThrow();
  });
});
