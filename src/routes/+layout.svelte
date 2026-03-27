<script lang="ts">
  import '../app.css';

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
    <a href="/workspace">Workspace</a>
    <a href="/legal">Terms</a>
  </nav>
</header>

<main id="app" tabindex="-1">
  {@render children()}
</main>

<footer class="edu-ribbon" role="note" aria-label="Educational Use Only">
  <span>Educational Use Only</span>
  <span><a href="/legal">Terms &amp; Privacy</a></span>
</footer>

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
