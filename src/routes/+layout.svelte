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
    padding: 0.5rem 1rem;
    background: var(--color-brand-700, #15803d);
    color: white;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .brand {
    display: flex;
    align-items: center;
    text-decoration: none;
  }

  .und-logo {
    height: 2rem;
  }

  .topnav {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .topnav a {
    color: white;
    text-decoration: none;
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }

  .topnav a:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  #app {
    flex: 1;
    min-height: 0;
  }

  .edu-ribbon {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 1rem;
    background: var(--color-neutral-100, #f5f5f5);
    font-size: 0.75rem;
    color: var(--color-neutral-600, #525252);
    border-top: 1px solid var(--color-neutral-200, #e5e5e5);
  }

  .edu-ribbon a {
    color: var(--color-brand-700, #15803d);
    text-decoration: none;
  }

  .edu-ribbon a:hover {
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
