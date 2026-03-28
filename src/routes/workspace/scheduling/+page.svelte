<svelte:head><title>Scheduling | UND EMR-Sim</title></svelte:head>

<div class="coming-soon-page">
  <div class="coming-soon-card">
    <span class="material-symbols-outlined coming-soon-icon" aria-hidden="true">calendar_month</span
    >
    <h1 class="coming-soon-title">Scheduling</h1>
    <span class="coming-soon-badge">Coming Soon</span>
    <p class="coming-soon-description">
      Appointment scheduling and session management will be available in a future update.
    </p>
    <a href="/workspace" class="coming-soon-back">Back to Workspace</a>
  </div>
</div>

<style>
  .coming-soon-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 2rem;
  }
  .coming-soon-card {
    background: var(--color-neutral-50, #fafafa);
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 12px;
    padding: 2.5rem;
    max-width: 420px;
    text-align: center;
  }
  .coming-soon-icon {
    font-size: 2.5rem;
    color: var(--color-neutral-400, #9e9e9e);
    margin-bottom: 0.75rem;
  }
  .coming-soon-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 0.75rem;
    color: var(--color-neutral-800, #262626);
  }
  .coming-soon-badge {
    display: inline-block;
    padding: 0.2rem 0.75rem;
    background: var(--color-neutral-200, #e5e5e5);
    color: var(--color-neutral-600, #525252);
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .coming-soon-description {
    color: var(--color-neutral-500, #737373);
    font-size: 0.875rem;
    margin: 1rem 0 1.5rem;
    line-height: 1.5;
  }
  .coming-soon-back {
    display: inline-block;
    padding: 0.5rem 1.25rem;
    background: var(--color-brand-green, #009a44);
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
  }
  .coming-soon-back:hover {
    background: #007a35;
  }
</style>
