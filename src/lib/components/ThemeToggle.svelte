<!--
  ThemeToggle — dark/light mode toggle.
  Persists preference to localStorage('emr_theme').
  Sets data-theme attribute on <html>.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let theme = $state<'light' | 'dark'>('light');

  onMount(() => {
    // Read stored preference, falling back to system preference
    const stored = localStorage.getItem('emr_theme');
    if (stored === 'dark' || stored === 'light') {
      theme = stored;
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    }
    applyTheme(theme);
  });

  function applyTheme(t: 'light' | 'dark') {
    if (!browser) return;
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('emr_theme', t);
  }

  function toggle() {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
  }
</script>

<button
  type="button"
  class="theme-toggle"
  onclick={toggle}
  aria-label="Toggle {theme === 'dark' ? 'light' : 'dark'} mode"
  title="Toggle {theme === 'dark' ? 'light' : 'dark'} mode"
>
  <span class="material-symbols-outlined" aria-hidden="true">
    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
  </span>
</button>

<style>
  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition:
      background 0.15s,
      color 0.15s;
  }

  .theme-toggle:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .theme-toggle .material-symbols-outlined {
    font-size: 1.25rem;
  }
</style>
