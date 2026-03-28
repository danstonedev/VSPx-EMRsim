<!--
  CollapsibleSubsection — shared collapsible panel used across all SOAP section components.
  Encapsulates the header/chevron/body/inner grid-row animation pattern.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

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
  <button class="collapsible-header" type="button" onclick={onToggle}>
    <span class="collapsible-chevron" class:collapsible-chevron--open={open} aria-hidden="true"
      >▸</span
    >
    <span class="collapsible-title"
      >{title}{#if titleExtra}{@render titleExtra()}{/if}</span
    >
  </button>
  <div class="collapsible-body" class:collapsible-body--hidden={!open}>
    <div class="collapsible-inner">
      {@render children()}
    </div>
  </div>
</div>

<style>
  .collapsible-subsection {
    border: 1px solid #444;
    border-radius: 6px;
    overflow: hidden;
    margin-top: 0.75rem;
  }

  .collapsible-subsection:first-child {
    margin-top: 0;
  }

  .collapsible-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(180deg, #3a3a3a 0%, #4a4a4a 100%);
    color: #e0e0e0;
    border: none;
    cursor: pointer;
    font: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    text-align: left;
    transition: background 0.12s;
  }

  .collapsible-header:hover {
    background: linear-gradient(180deg, #4a4a4a 0%, #5a5a5a 100%);
  }

  .collapsible-chevron {
    font-size: 0.75rem;
    transition: transform 0.2s ease;
    transform: rotate(0deg);
    flex-shrink: 0;
  }

  .collapsible-chevron--open {
    transform: rotate(90deg);
  }

  .collapsible-title {
    flex: 1;
  }

  .collapsible-body {
    display: grid;
    grid-template-rows: 1fr;
    transition: grid-template-rows 0.25s ease;
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
    transition: opacity 0.15s ease;
  }

  .collapsible-body:not(.collapsible-body--hidden) > * {
    opacity: 1;
    transition: opacity 0.2s ease 0.1s;
  }

  .collapsible-inner {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
