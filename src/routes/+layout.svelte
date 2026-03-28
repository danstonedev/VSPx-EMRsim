<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import SignatureModal from '$lib/components/SignatureModal.svelte';
  import NoteExportPreviewModal from '$lib/components/NoteExportPreviewModal.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import AccessGate from '$lib/components/AccessGate.svelte';
  import DisciplinePicker from '$lib/components/DisciplinePicker.svelte';
  import DevDisciplineSwitcher from '$lib/components/DevDisciplineSwitcher.svelte';
  import { userDiscipline, setDiscipline, type DisciplineId } from '$lib/stores/auth';
  import { DISCIPLINE_DEFAULTS } from '$lib/config/disciplineDefaults';

  let showDisciplineMenu = $state(false);

  function pickDiscipline(id: DisciplineId) {
    setDiscipline(id);
    showDisciplineMenu = false;
  }
  import ArtifactFormModal from '$lib/components/ArtifactFormModal.svelte';
  import ArtifactViewerModal from '$lib/components/ArtifactViewerModal.svelte';

  let { children } = $props();
</script>

<header class="site-header">
  <div class="brand-row">
    <a class="brand" href="/" aria-label="EMRsim Home">
      <img
        class="und-logo"
        src="/img/EMRsim-white.png"
        alt="EMRsim"
        loading="eager"
        decoding="async"
      />
    </a>
  </div>
  <nav class="topnav" aria-label="Primary">
    <a
      href="/workspace"
      class:topnav-link--active={$page.url.pathname.startsWith('/workspace')}
      aria-current={$page.url.pathname.startsWith('/workspace') ? 'page' : undefined}>Workspace</a
    >
    <a
      href="/instructor"
      class:topnav-link--active={$page.url.pathname.startsWith('/instructor')}
      aria-current={$page.url.pathname.startsWith('/instructor') ? 'page' : undefined}>Instructor</a
    >
    <a
      href="/admin"
      class:topnav-link--active={$page.url.pathname.startsWith('/admin')}
      aria-current={$page.url.pathname.startsWith('/admin') ? 'page' : undefined}>Admin</a
    >
    <a
      href="/legal"
      class:topnav-link--active={$page.url.pathname === '/legal'}
      aria-current={$page.url.pathname === '/legal' ? 'page' : undefined}>Terms</a
    >
    <div class="discipline-switcher">
      <button
        type="button"
        class="discipline-switcher__btn"
        onclick={() => (showDisciplineMenu = !showDisciplineMenu)}
        aria-expanded={showDisciplineMenu}
        aria-haspopup="true"
      >
        {DISCIPLINE_DEFAULTS[$userDiscipline]?.abbreviation ?? 'PT'}
        <span class="discipline-switcher__caret">▾</span>
      </button>
      {#if showDisciplineMenu}
        <div class="discipline-switcher__menu" role="menu">
          {#each Object.entries(DISCIPLINE_DEFAULTS) as [id, def]}
            <button
              type="button"
              class="discipline-switcher__option"
              class:discipline-switcher__option--active={$userDiscipline === id}
              role="menuitem"
              onclick={() => pickDiscipline(id as DisciplineId)}
            >
              <span class="discipline-switcher__abbr">{def.abbreviation}</span>
              <span class="discipline-switcher__label">{def.label}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
    <ThemeToggle />
  </nav>
</header>

<main id="app" tabindex="-1">
  {@render children()}
</main>

<footer class="edu-ribbon" role="note" aria-label="Educational Use Only">
  <span>Educational Use Only</span>
  <span><a href="/legal">Terms &amp; Privacy</a></span>
</footer>

<Toast />
<SignatureModal />
<NoteExportPreviewModal />
<ConfirmModal />
<ArtifactFormModal />
<ArtifactViewerModal />
<AccessGate />
<DisciplinePicker />
<DevDisciplineSwitcher />

<style>
  .site-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.25rem;
    background: linear-gradient(
      180deg,
      var(--color-topbar-start, #000) 0%,
      var(--color-topbar-end, #1a1a1a) 100%
    );
    color: white;
    height: 72px;
    min-height: 72px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  }

  .brand {
    display: flex;
    align-items: center;
    text-decoration: none;
  }

  .und-logo {
    height: 2.25rem;
  }

  .topnav {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }

  .topnav a {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    transition:
      background 0.15s,
      color 0.15s;
  }

  .topnav a:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .topnav a.topnav-link--active {
    color: white;
    background: rgba(255, 255, 255, 0.15);
  }

  .discipline-switcher {
    position: relative;
  }

  .discipline-switcher__btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    background: rgba(0, 154, 68, 0.15);
    border: 1px solid rgba(0, 154, 68, 0.35);
    border-radius: 6px;
    color: #7dd3a8;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition:
      background 0.15s,
      border-color 0.15s;
  }

  .discipline-switcher__btn:hover {
    background: rgba(0, 154, 68, 0.25);
    border-color: rgba(0, 154, 68, 0.5);
    color: white;
  }

  .discipline-switcher__caret {
    font-size: 0.625rem;
    opacity: 0.7;
  }

  .discipline-switcher__menu {
    position: absolute;
    top: calc(100% + 0.375rem);
    right: 0;
    min-width: 180px;
    background: #1a1a1a;
    border: 1px solid #525252;
    border-radius: 8px;
    padding: 0.25rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 200;
  }

  .discipline-switcher__option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.5rem 0.625rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: #d4d4d4;
    font-size: 0.8125rem;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
  }

  .discipline-switcher__option:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }

  .discipline-switcher__option--active {
    background: rgba(0, 154, 68, 0.12);
    color: #7dd3a8;
  }

  .discipline-switcher__abbr {
    font-weight: 700;
    font-size: 0.75rem;
    min-width: 2rem;
    color: var(--color-brand-green, #009a44);
  }

  .discipline-switcher__label {
    font-weight: 400;
  }

  #app {
    flex: 1;
    min-height: 0;
  }

  .edu-ribbon {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 1.25rem;
    height: 28px;
    min-height: 28px;
    background: linear-gradient(180deg, #1a1a1a 0%, #111 100%);
    font-size: 0.6875rem;
    color: var(--color-neutral-500, #737373);
    border-top: 2px solid var(--color-brand-green, #009a44);
    position: sticky;
    bottom: 0;
    z-index: 100;
  }

  .edu-ribbon a {
    color: var(--color-neutral-400, #a3a3a3);
    text-decoration: none;
  }

  .edu-ribbon a:hover {
    color: var(--color-brand-green, #009a44);
    text-decoration: underline;
  }

  :global(body) {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-height: 100dvh;
    margin: 0;
  }
</style>
