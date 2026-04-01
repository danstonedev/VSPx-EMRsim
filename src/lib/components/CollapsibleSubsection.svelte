<!--
  CollapsibleSubsection — shared collapsible panel used across all SOAP section components.
  Encapsulates the header/chevron/body/inner grid-row animation pattern.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { autogrowTextareas } from '$lib/actions/autogrowTextareas';

  interface Props {
    title: string;
    open: boolean;
    onToggle: () => void;
    dataSubsection?: string;
    titleExtra?: Snippet;
    children: Snippet;
  }

  let { title, open, onToggle, dataSubsection, titleExtra, children }: Props = $props();
</script>

<div class="collapsible-subsection" data-subsection={dataSubsection}>
  <button
    class="collapsible-header"
    class:collapsible-header--open={open}
    type="button"
    onclick={onToggle}
  >
    <span class="collapsible-chevron" class:collapsible-chevron--open={open} aria-hidden="true"
      >▸</span
    >
    <span class="collapsible-title"
      >{title}{#if titleExtra}{@render titleExtra()}{/if}</span
    >
  </button>
  <div class="collapsible-body" class:collapsible-body--hidden={!open} use:autogrowTextareas>
    <div class="collapsible-inner">
      {@render children()}
    </div>
  </div>
</div>

<style>
  .collapsible-subsection {
    border: 1px solid color-mix(in srgb, var(--color-brand-gray, #aeaeae) 62%, white);
    border-radius: 6px;
    overflow: hidden;
    margin-top: 0.75rem;
    scroll-margin-top: 4.75rem;
    background: var(--color-surface, #ffffff);
  }

  .collapsible-subsection:first-child {
    margin-top: 0;
  }

  .collapsible-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--color-brand-gray, #aeaeae) 84%, #999999) 0%,
      var(--color-brand-gray, #aeaeae) 100%
    );
    color: var(--color-neutral-900, #1a1a1a);
    border: none;
    cursor: pointer;
    font: inherit;
    font-size: 0.95rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    text-align: left;
    transition: background 0.12s;
  }

  .collapsible-header:not(.collapsible-header--open):hover {
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--color-brand-gray, #aeaeae) 90%, #999999) 0%,
      color-mix(in srgb, var(--color-brand-gray, #aeaeae) 92%, white) 100%
    );
  }

  .collapsible-chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    order: 2;
    width: 1.5rem;
    height: 1.5rem;
    margin-left: auto;
    border-radius: 999px;
    background: color-mix(in srgb, currentColor 12%, transparent);
    font-size: 0;
    line-height: 0;
    transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
    transform: rotate(0deg);
    flex-shrink: 0;
    overflow: hidden;
  }

  .collapsible-chevron::before {
    content: '';
    width: 0.42rem;
    height: 0.42rem;
    border-right: 2.25px solid currentColor;
    border-bottom: 2.25px solid currentColor;
    transform: rotate(45deg) translate(-8%, -8%);
  }

  .collapsible-chevron--open {
    transform: rotate(90deg);
  }

  .collapsible-title {
    order: 1;
    flex: 1;
    font-weight: inherit;
  }

  .collapsible-body {
    display: grid;
    grid-template-rows: 1fr;
    transition: grid-template-rows 0.24s cubic-bezier(0.22, 1, 0.36, 1);
    padding: 1rem 1.25rem;
  }

  .collapsible-body--hidden {
    grid-template-rows: 0fr;
    padding: 0 1.25rem;
    overflow: hidden;
  }

  .collapsible-body--hidden > * {
    min-height: 0;
    overflow: hidden;
    opacity: 0;
    transform: translateY(-0.35rem);
    transition:
      opacity 0.16s ease,
      transform 0.2s ease;
  }

  .collapsible-body:not(.collapsible-body--hidden) > * {
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity 0.2s ease 0.04s,
      transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .collapsible-inner {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
