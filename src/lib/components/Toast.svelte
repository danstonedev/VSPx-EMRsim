<!--
  Toast — snackbar-style notifications. Port of app/js/ui/Toast.js.
  Mount once in root layout; call showToast() from anywhere.
-->
<script lang="ts" module>
  import { writable } from 'svelte/store';

  interface ToastItem {
    id: number;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    timeout: number;
    exiting?: boolean;
  }

  const toasts = writable<ToastItem[]>([]);
  let nextId = 1;
  const MAX_TOASTS = 3;

  export function showToast(
    message: string,
    opts: { type?: ToastItem['type']; timeout?: number } = {},
  ): { close: () => void } {
    const id = nextId++;
    const item: ToastItem = {
      id,
      message,
      type: opts.type ?? 'info',
      timeout: opts.timeout ?? 4000,
    };

    toasts.update((list) => {
      const next = [...list, item];
      // Trim oldest if over max
      while (next.length > MAX_TOASTS) next.shift();
      return next;
    });

    // Auto-dismiss
    if (item.timeout > 0) {
      setTimeout(() => dismiss(id), item.timeout);
    }

    return { close: () => dismiss(id) };
  }

  function dismiss(id: number) {
    toasts.update((list) => list.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    // Remove after exit animation
    setTimeout(() => {
      toasts.update((list) => list.filter((t) => t.id !== id));
    }, 300);
  }
</script>

<script lang="ts">
  // Reactively read store
  const items = $derived($toasts);
</script>

{#if items.length > 0}
  <div class="toast-container" aria-live="polite" aria-atomic="false">
    {#each items as toast (toast.id)}
      <div class="toast toast--{toast.type}" class:toast--exiting={toast.exiting} role="status">
        <span class="toast__message">{toast.message}</span>
        <button
          type="button"
          class="toast__close"
          aria-label="Dismiss"
          onclick={() => dismiss(toast.id)}>×</button
        >
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    pointer-events: none;
    max-width: 90vw;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    animation: toast-enter 0.3s ease;
    min-width: 280px;
    max-width: 500px;
  }

  .toast--info {
    background: #1e293b;
    color: white;
  }

  .toast--success {
    background: #15803d;
    color: white;
  }

  .toast--error {
    background: #dc2626;
    color: white;
  }

  .toast--warning {
    background: #d97706;
    color: white;
  }

  .toast--exiting {
    animation: toast-exit 0.3s ease forwards;
  }

  .toast__message {
    flex: 1;
  }

  .toast__close {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.125rem;
    cursor: pointer;
    padding: 0.25rem;
    line-height: 1;
    opacity: 0.7;
  }

  .toast__close:hover {
    opacity: 1;
  }

  @keyframes toast-enter {
    from {
      opacity: 0;
      transform: translateY(1rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes toast-exit {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(1rem);
    }
  }
</style>
