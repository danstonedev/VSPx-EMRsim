<!--
  SignatureModal — name/title capture for e-signing notes.
  Port of app/js/features/signature/SignatureModal.js.
  Persists last-used name/title to localStorage.
-->
<script module lang="ts">
  import { writable } from 'svelte/store';
  import type { Signature } from '$lib/services/noteLifecycle';

  interface SignatureConfig {
    existingSignature?: Signature | null;
    resolve: (sig: Signature | null) => void;
  }

  const config = writable<SignatureConfig | null>(null);

  /**
   * Open signature dialog. Resolves with Signature or null if cancelled.
   */
  export function openSignatureDialog(opts?: {
    existingSignature?: Signature | null;
  }): Promise<Signature | null> {
    return new Promise((resolve) => {
      config.set({ existingSignature: opts?.existingSignature, resolve });
    });
  }
</script>

<script lang="ts">
  import { SIGNATURE_STORAGE_NAME, SIGNATURE_STORAGE_TITLE } from '$lib/services/noteLifecycle';

  const cfg = $derived($config);

  let name = $state(localStorage.getItem(SIGNATURE_STORAGE_NAME) ?? '');
  let title = $state(localStorage.getItem(SIGNATURE_STORAGE_TITLE) ?? '');
  let attested = $state(false);
  let nameInputEl = $state<HTMLInputElement | undefined>(undefined);

  // Reset and focus when config opens
  $effect(() => {
    if (cfg) {
      name = cfg.existingSignature?.name ?? localStorage.getItem(SIGNATURE_STORAGE_NAME) ?? '';
      title = cfg.existingSignature?.title ?? localStorage.getItem(SIGNATURE_STORAGE_TITLE) ?? '';
      attested = false;
      nameInputEl?.focus();
    }
  });

  const canSign = $derived(name.trim().length > 0 && title.trim().length > 0 && attested);

  function sign() {
    if (!canSign || !cfg) return;
    // Persist for next time
    localStorage.setItem(SIGNATURE_STORAGE_NAME, name.trim());
    localStorage.setItem(SIGNATURE_STORAGE_TITLE, title.trim());

    const sig: Signature = {
      name: name.trim(),
      title: title.trim(),
      signedAt: new Date().toISOString(),
      version: 1,
    };
    cfg.resolve(sig);
    close();
  }

  function cancel() {
    cfg?.resolve(null);
    close();
  }

  function close() {
    config.set(null);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!cfg) return;
    if (e.key === 'Escape') cancel();
    if (e.key === 'Enter' && canSign) sign();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if cfg}
  <div class="sig-overlay" role="dialog" aria-modal="true" aria-label="Sign Note">
    <div class="sig-modal">
      <h2 class="sig-modal__title">Sign Note</h2>

      <label class="sig-label">
        Full Name
        <input
          type="text"
          bind:value={name}
          bind:this={nameInputEl}
          placeholder="e.g. Jane Doe, SPT"
        />
      </label>

      <label class="sig-label">
        Title / Credentials
        <input type="text" bind:value={title} placeholder="e.g. Student Physical Therapist" />
      </label>

      <label class="sig-attest">
        <input type="checkbox" bind:checked={attested} />
        <span
          >I attest that this documentation is accurate and complete to the best of my knowledge.</span
        >
      </label>

      <div class="sig-modal__actions">
        <button type="button" class="btn btn--cancel" onclick={cancel}>Cancel</button>
        <button type="button" class="btn btn--sign" disabled={!canSign} onclick={sign}>
          Sign &amp; Lock
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .sig-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
  }

  .sig-modal {
    background: var(--color-surface, #ffffff);
    border-radius: 12px;
    padding: 1.5rem;
    max-width: 440px;
    width: 90vw;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    animation: sig-enter 0.2s ease;
  }

  .sig-modal__title {
    margin: 0 0 1rem;
    font-size: 1.125rem;
    font-weight: 700;
  }

  .sig-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-neutral-600, #757575);
    margin-bottom: 0.75rem;
  }

  .sig-label input[type='text'] {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 400;
    color: var(--color-neutral-800, #424242);
  }

  .sig-label input[type='text']:focus {
    outline: 2px solid var(--color-brand-green, #009a44);
    outline-offset: 1px;
  }

  .sig-attest {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: var(--color-neutral-600, #757575);
    margin: 1rem 0;
    cursor: pointer;
  }

  .sig-attest input[type='checkbox'] {
    margin-top: 0.15rem;
  }

  .sig-modal__actions {
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

  .btn--sign {
    background: var(--color-brand-green, #009a44);
    color: white;
  }

  .btn--sign:hover:not(:disabled) {
    background: #007a35;
  }

  .btn--sign:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @keyframes sig-enter {
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
    .sig-modal {
      animation: none;
    }
  }
</style>
