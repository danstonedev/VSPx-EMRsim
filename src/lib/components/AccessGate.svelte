<!--
  AccessGate — session-storage-based access code gate.
  Port of app/js/ui/AccessGate.js. Shows overlay until verified.
-->
<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    onGranted?: (role: string, capability: string) => void;
  }

  let { onGranted }: Props = $props();

  const SESSION_ROLE_KEY = 'pt_emr_access_role';
  const SESSION_CAP_KEY = 'pt_emr_access_capability';

  let verified = $state(false);
  let loading = $state(false);
  let error = $state('');
  let codeInput = $state('');

  function isAccessGranted(): boolean {
    return !!sessionStorage.getItem(SESSION_ROLE_KEY);
  }

  function getAccessRole(): string {
    return sessionStorage.getItem(SESSION_ROLE_KEY) ?? '';
  }

  function getAccessCapability(): string {
    return sessionStorage.getItem(SESSION_CAP_KEY) ?? '';
  }

  function setAccess(role: string, capability: string) {
    sessionStorage.setItem(SESSION_ROLE_KEY, role);
    sessionStorage.setItem(SESSION_CAP_KEY, capability);
  }

  onMount(() => {
    // Localhost bypass — grant faculty access
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setAccess('faculty', 'full');
      verified = true;
      onGranted?.('faculty', 'full');
      return;
    }

    if (isAccessGranted()) {
      verified = true;
      onGranted?.(getAccessRole(), getAccessCapability());
    }
  });

  async function verify() {
    if (!codeInput.trim()) return;
    loading = true;
    error = '';

    try {
      const res = await fetch('/api/verify-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput.trim() }),
      });

      if (!res.ok) {
        error = 'Invalid access code.';
        loading = false;
        return;
      }

      const data = await res.json();
      const role = data.role ?? 'student';
      const capability = data.capability ?? 'basic';

      setAccess(role, capability);
      verified = true;
      onGranted?.(role, capability);
    } catch {
      error = 'Unable to verify. Please try again.';
    } finally {
      loading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') verify();
  }
</script>

{#if !verified}
  <div class="access-gate" role="dialog" aria-modal="true" aria-label="Access Gate">
    <div class="access-gate__card">
      <h1 class="access-gate__title">PT EMR Simulator</h1>
      <p class="access-gate__subtitle">Enter your access code to continue</p>

      <div class="access-gate__field">
        <input
          type="text"
          class="access-gate__input"
          bind:value={codeInput}
          onkeydown={handleKeydown}
          placeholder="Access code"
          disabled={loading}
          autofocus
        />
        <button
          type="button"
          class="access-gate__btn"
          onclick={verify}
          disabled={loading || !codeInput.trim()}
        >
          {loading ? 'Verifying...' : 'Enter'}
        </button>
      </div>

      {#if error}
        <p class="access-gate__error" role="alert">{error}</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .access-gate {
    position: fixed;
    inset: 0;
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  }

  .access-gate__card {
    background: var(--color-surface, #ffffff);
    border-radius: 16px;
    padding: 2.5rem;
    max-width: 400px;
    width: 90vw;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    text-align: center;
  }

  .access-gate__title {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-neutral-800, #424242);
  }

  .access-gate__subtitle {
    font-size: 0.875rem;
    color: var(--color-neutral-500, #9e9e9e);
    margin: 0 0 1.5rem;
  }

  .access-gate__field {
    display: flex;
    gap: 0.5rem;
  }

  .access-gate__input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 8px;
    font-size: 1rem;
  }

  .access-gate__input:focus {
    outline: 2px solid var(--color-brand-green, #009a44);
    outline-offset: 1px;
  }

  .access-gate__btn {
    padding: 0.75rem 1.5rem;
    background: var(--color-brand-green, #009a44);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .access-gate__btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .access-gate__btn:hover:not(:disabled) {
    background: #007a35;
  }

  .access-gate__error {
    margin: 1rem 0 0;
    font-size: 0.875rem;
    color: #dc2626;
  }
</style>
