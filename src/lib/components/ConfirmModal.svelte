<!--
  ConfirmModal — text-verification confirmation dialog.
  Port of app/js/ui/ConfirmModal.js. Uses programmatic show/hide.
-->
<script module lang="ts">
  import { writable } from 'svelte/store';

  interface ConfirmConfig {
    title: string;
    message: string;
    confirmText: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    reasonMode?: boolean;
    reasonPlaceholder?: string;
    resolve: (result: boolean | string | null) => void;
  }

  const config = writable<ConfirmConfig | null>(null);

  /**
   * Show a confirmation dialog. Returns a promise that resolves
   * to true if confirmed, false if cancelled.
   */
  export function showConfirmModal(opts: {
    title: string;
    message: string;
    confirmText?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      config.set({
        ...opts,
        confirmText: opts.confirmText ?? '',
        resolve: (r) => resolve(r === true),
      });
    });
  }

  /**
   * Show a reason-collection dialog. Returns the typed reason string,
   * or null if cancelled. Used for amendment reasons, etc.
   */
  export function showReasonModal(opts: {
    title: string;
    message: string;
    reasonPlaceholder?: string;
    danger?: boolean;
  }): Promise<string | null> {
    return new Promise((resolve) => {
      config.set({
        ...opts,
        confirmText: '',
        reasonMode: true,
        resolve: (r) => resolve(typeof r === 'string' ? r : null),
      });
    });
  }
</script>

<script lang="ts">
  const cfg = $derived($config);
  let inputValue = $state('');
  let inputEl = $state<HTMLInputElement | HTMLTextAreaElement | undefined>(undefined);

  $effect(() => {
    if (cfg) inputEl?.focus();
  });

  const canConfirm = $derived.by(() => {
    if (!cfg) return false;
    if (cfg.reasonMode) return inputValue.trim().length > 0;
    if (!cfg.confirmText) return true; // Simple yes/no mode
    return inputValue.trim().toLowerCase() === cfg.confirmText.trim().toLowerCase();
  });

  function confirm() {
    if (!canConfirm || !cfg) return;
    cfg.resolve(cfg.reasonMode ? inputValue.trim() : true);
    close();
  }

  function cancel() {
    cfg?.resolve(cfg.reasonMode ? null : false);
    close();
  }

  function close() {
    inputValue = '';
    config.set(null);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!cfg) return;
    if (e.key === 'Escape') cancel();
    if (e.key === 'Enter' && canConfirm) confirm();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if cfg}
  <div class="confirm-overlay" role="dialog" aria-modal="true" aria-label={cfg.title}>
    <div class="confirm-modal" class:confirm-modal--danger={cfg.danger}>
      <h2 class="confirm-modal__title">{cfg.title}</h2>
      <p class="confirm-modal__message" style:white-space="pre-line">{cfg.message}</p>
      {#if cfg.reasonMode}
        <textarea
          class="confirm-modal__textarea"
          bind:value={inputValue}
          placeholder={cfg.reasonPlaceholder ?? 'Enter reason...'}
          rows="3"
          bind:this={inputEl}
        ></textarea>
      {:else if cfg.confirmText}
        <p class="confirm-modal__prompt">
          Type <strong>{cfg.confirmText}</strong> to confirm:
        </p>
        <input
          type="text"
          class="confirm-modal__input"
          bind:value={inputValue}
          placeholder={cfg.confirmText}
          bind:this={inputEl}
        />
      {/if}
      <div class="confirm-modal__actions">
        <button type="button" class="btn btn--cancel" onclick={cancel}
          >{cfg.cancelLabel ?? 'Cancel'}</button
        >
        <button
          type="button"
          class="btn btn--confirm"
          class:btn--danger={cfg.danger}
          disabled={!canConfirm}
          onclick={confirm}>{cfg.confirmLabel ?? 'Confirm'}</button
        >
      </div>
    </div>
  </div>
{/if}

<style>
  .confirm-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
  }

  .confirm-modal {
    background: var(--color-surface, #ffffff);
    border-radius: 12px;
    padding: 1.5rem;
    max-width: 420px;
    width: 90vw;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    animation: modal-enter 0.2s ease;
  }

  .confirm-modal__title {
    margin: 0 0 0.5rem;
    font-size: 1.125rem;
    font-weight: 700;
  }

  .confirm-modal--danger .confirm-modal__title {
    color: #dc2626;
  }

  .confirm-modal__message {
    font-size: 0.875rem;
    color: var(--color-neutral-600, #757575);
    margin: 0 0 1rem;
    line-height: 1.5;
    max-height: 40vh;
    overflow-y: auto;
  }

  .confirm-modal__prompt {
    font-size: 0.8125rem;
    margin: 0 0 0.5rem;
  }

  .confirm-modal__input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .confirm-modal__input:focus,
  .confirm-modal__textarea:focus {
    outline: 2px solid var(--color-brand-green, #009a44);
    outline-offset: 1px;
  }

  .confirm-modal__textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
    font-size: 0.875rem;
    font-family: inherit;
    margin-bottom: 1rem;
    resize: vertical;
  }

  .confirm-modal__actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .btn {
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
  }

  .btn--cancel {
    background: var(--color-neutral-100, #f0f0f0);
    color: var(--color-neutral-700, #616161);
  }

  .btn--cancel:hover {
    background: var(--color-neutral-200, #e0e0e0);
  }

  .btn--confirm {
    background: var(--color-brand-green, #009a44);
    color: white;
  }

  .btn--confirm:hover:not(:disabled) {
    background: #007a35;
  }

  .btn--confirm:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn--danger {
    background: #dc2626;
  }

  .btn--danger:hover:not(:disabled) {
    background: #b91c1c;
  }

  @keyframes modal-enter {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .confirm-modal {
      animation: none;
    }
  }
</style>
