<!--
  FormField — shared form field wrapper providing label, optional hint, and consistent styling.
  Replaces the repeated `<label class="field-label">` + `<span class="field-hint">` pattern.

  Usage:
    <FormField label="Blood Pressure" hint="Systolic/Diastolic in mmHg">
      <input type="text" value={bp} />
    </FormField>

  For non-label wrappers (e.g., containing multiple inputs), use tag="div":
    <FormField label="Edema" tag="div">
      <EdemaAssessment ... />
    </FormField>
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label: string;
    hint?: string;
    tag?: 'label' | 'div';
    compact?: boolean;
    fullWidth?: boolean;
    children: Snippet;
  }

  let {
    label,
    hint,
    tag = 'label',
    compact = false,
    fullWidth = false,
    children,
  }: Props = $props();
</script>

{#if tag === 'label'}
  <label class="ff" class:ff--compact={compact} class:ff--full={fullWidth}>
    <span class="ff__label">{label}</span>
    {#if hint}
      <span class="ff__hint">{hint}</span>
    {/if}
    {@render children()}
  </label>
{:else}
  <div class="ff" class:ff--compact={compact} class:ff--full={fullWidth}>
    <span class="ff__label">{label}</span>
    {#if hint}
      <span class="ff__hint">{hint}</span>
    {/if}
    {@render children()}
  </div>
{/if}

<style>
  .ff {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.78125rem;
    font-weight: 500;
    color: var(--color-neutral-600, #616161);
    flex: 1;
    min-width: 0;
    margin-top: 0.375rem;
  }

  .ff--compact {
    flex: 0 0 auto;
    min-width: 80px;
    margin-top: 0;
  }

  .ff--full {
    width: 100%;
    flex: none;
  }

  .ff__label {
    font-size: 0.78125rem;
    font-weight: 500;
    color: var(--color-neutral-600, #616161);
  }

  .ff__hint {
    font-size: 0.75rem;
    color: var(--color-neutral-400, #9e9e9e);
    font-weight: 400;
    font-style: italic;
  }
</style>
