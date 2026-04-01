<script lang="ts">
  import type { PresentationFieldBlock, PresentationSection } from '$lib/services/notePresentation';

  interface Props {
    sections: PresentationSection[];
    variant?: 'preview' | 'document';
    onFieldChange?: (sectionKey: string, path: string, value: string) => void;
  }

  let { sections, variant = 'document', onFieldChange }: Props = $props();

  function handleFieldInput(field: PresentationFieldBlock, value: string): void {
    onFieldChange?.(field.sectionKey, field.path, value);
  }
</script>

<div class={`note-renderer note-renderer--${variant}`}>
  {#each sections as section}
    <section class="note-renderer__section">
      <h3 class="note-renderer__section-title">{section.title}</h3>
      <div class="note-renderer__blocks">
        {#each section.blocks as block}
          {#if block.kind === 'grid'}
            <section class="note-renderer__block">
              {#if block.title}
                <div class="note-renderer__block-title">{block.title}</div>
              {/if}
              <div
                class="note-renderer__metric-grid"
                style={`grid-template-columns: repeat(${Math.min(block.columns ?? 3, 3)}, minmax(0, 1fr));`}
              >
                {#each block.items as item}
                  <div class="note-renderer__metric">
                    <div class="note-renderer__label">{item.label}</div>
                    <div class="note-renderer__value">{item.value}</div>
                  </div>
                {/each}
              </div>
            </section>
          {:else if block.kind === 'table'}
            <section class="note-renderer__block">
              {#if block.title}
                <div class="note-renderer__block-title">{block.title}</div>
              {/if}
              <div class="note-renderer__table-wrap">
                <table class="note-renderer__table">
                  <thead>
                    <tr>
                      {#each block.columns as column}
                        <th>{column}</th>
                      {/each}
                    </tr>
                  </thead>
                  <tbody>
                    {#each block.rows as row}
                      <tr>
                        {#each row as cell}
                          <td>{cell || '-'}</td>
                        {/each}
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </section>
          {:else}
            {@const field = block as PresentationFieldBlock}
            <section class="note-renderer__field">
              <div class="note-renderer__label">{field.label}</div>
              {#if field.editable && onFieldChange}
                {#if field.input === 'textarea'}
                  <textarea
                    class="note-renderer__textarea"
                    rows="4"
                    value={field.value}
                    oninput={(event) =>
                      handleFieldInput(field, (event.currentTarget as HTMLTextAreaElement).value)}
                  ></textarea>
                {:else}
                  <input
                    class="note-renderer__input"
                    type="text"
                    value={field.value}
                    oninput={(event) =>
                      handleFieldInput(field, (event.currentTarget as HTMLInputElement).value)}
                  />
                {/if}
              {:else}
                <pre class="note-renderer__field-value">{field.value}</pre>
              {/if}
            </section>
          {/if}
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .note-renderer {
    display: grid;
    gap: 1rem;
  }

  .note-renderer__section-title {
    margin: 0 0 0.8rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .note-renderer__blocks {
    display: grid;
    gap: 0.8rem;
  }

  .note-renderer__block,
  .note-renderer__field {
    display: grid;
    gap: 0.28rem;
  }

  .note-renderer__block-title {
    margin-bottom: 0.5rem;
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--note-ink-muted);
  }

  .note-renderer__label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--note-muted-soft);
  }

  .note-renderer__value {
    font-size: 0.96rem;
    color: var(--note-ink);
  }

  .note-renderer__metric-grid {
    display: grid;
    gap: 0.85rem;
  }

  .note-renderer__metric {
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
    padding: 0.8rem 0.9rem;
    border: 1px solid var(--note-border-strong);
    border-radius: var(--note-radius-block);
    background: var(--note-metric-bg);
  }

  .note-renderer__table-wrap {
    overflow-x: auto;
    border: 1px solid var(--note-border-strong);
    border-radius: var(--note-radius-table);
  }

  .note-renderer__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.92rem;
    line-height: 1.45;
    background: var(--note-white);
  }

  .note-renderer__table th,
  .note-renderer__table td {
    padding: 0.72rem 0.8rem;
    border: 1px solid var(--note-border-table);
    text-align: left;
    vertical-align: top;
    white-space: pre-wrap;
  }

  .note-renderer__table th {
    background: var(--note-table-header);
    color: var(--note-white);
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .note-renderer__table tbody tr:nth-child(even) td {
    background: var(--note-table-stripe);
  }

  .note-renderer__field-value {
    margin: 0;
    white-space: pre-wrap;
    font-family: inherit;
    font-size: 1rem;
    line-height: 1.68;
    color: var(--note-ink-soft);
  }

  .note-renderer__input,
  .note-renderer__textarea {
    width: 100%;
    border-radius: 10px;
    border: 1px solid var(--note-border-input);
    padding: 0.72rem 0.8rem;
    font: inherit;
    font-size: 0.92rem;
    line-height: 1.5;
    color: var(--note-ink);
    background: var(--note-white);
  }

  .note-renderer__textarea {
    resize: vertical;
    min-height: 7rem;
  }

  .note-renderer--preview .note-renderer__section + .note-renderer__section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--note-border-soft);
  }

  .note-renderer--preview .note-renderer__section-title {
    font-size: 0.95rem;
    color: var(--note-ink);
  }

  .note-renderer--preview .note-renderer__block,
  .note-renderer--preview .note-renderer__field {
    border: 1px solid var(--note-border-soft);
    border-radius: var(--note-radius-block);
    padding: 0.8rem 0.9rem;
    background: var(--note-block-bg);
  }

  .note-renderer--preview .note-renderer__metric {
    border: 1px solid var(--note-border-soft);
  }

  .note-renderer--preview .note-renderer__field-value {
    font-size: 0.92rem;
    line-height: 1.5;
    color: var(--note-ink);
  }

  .note-renderer--document .note-renderer__section-title {
    padding-left: 0.8rem;
    border-left: 4px solid var(--note-accent);
    font-size: 1rem;
    color: var(--note-accent);
  }

  @media (max-width: 840px) {
    .note-renderer__metric-grid {
      grid-template-columns: 1fr !important;
    }
  }
</style>
