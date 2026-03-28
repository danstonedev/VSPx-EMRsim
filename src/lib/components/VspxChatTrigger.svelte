<!--
  VspxChatTrigger — "Call Patient" button injected in the patient header.
  Shows green pulse animation when a call session is active.
-->
<script lang="ts">
  interface Props {
    active: boolean;
    onclick: () => void;
  }

  let { active, onclick }: Props = $props();
</script>

<button
  class="vspx-trigger"
  class:vspx-trigger--active={active}
  type="button"
  aria-label="Call patient voice chat"
  title="Call Patient (Alt+Shift+C)"
  {onclick}
>
  <svg class="vspx-trigger__icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
  <span class="vspx-trigger__label">
    {active ? 'In Call' : 'Call Patient'}
  </span>
</button>

<style>
  .vspx-trigger {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 36px;
    border: 2px solid transparent;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    cursor: pointer;
    padding: 0 12px;
    flex-shrink: 0;
    margin-left: 8px;
    transition:
      background 150ms ease,
      border-color 300ms ease,
      box-shadow 300ms ease;
  }

  .vspx-trigger:hover {
    background: rgba(255, 255, 255, 0.28);
  }

  .vspx-trigger:active {
    background: rgba(255, 255, 255, 0.35);
  }

  .vspx-trigger:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }

  .vspx-trigger__icon {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .vspx-trigger__label {
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    white-space: nowrap;
  }

  /* Active conversation state — green pulse */
  .vspx-trigger--active {
    border-color: #22c55e;
    box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.25);
    animation: vspx-border-pulse 2.5s ease-in-out infinite;
  }

  .vspx-trigger--active:hover {
    background: rgba(34, 197, 94, 0.18);
  }

  @keyframes vspx-border-pulse {
    0%,
    100% {
      border-color: #22c55e;
      box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.25);
    }
    50% {
      border-color: rgba(34, 197, 94, 0.45);
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .vspx-trigger--active {
      animation: none;
    }
  }

  @media print {
    .vspx-trigger {
      display: none !important;
    }
  }
</style>
