/**
 * Svelte context helpers for note templates.
 *
 * The editor page sets a getter function into context during init.
 * Section components call useNoteTemplate() to read the current value.
 */

import { getContext } from 'svelte';
import type { ResolvedNoteTemplate, SubsectionConfig } from './templateTypes';

const TEMPLATE_KEY = 'noteTemplate';

const DEFAULT_SUBSECTION: SubsectionConfig = { visible: true };

// ─── Context getter ─────────────────────────────────────────────────────────

/**
 * Read the resolved template from Svelte context.
 * The editor page stores a getter function via setContext('noteTemplate', () => resolvedTemplate).
 */
export function useNoteTemplate(): ResolvedNoteTemplate | null {
  try {
    const getter = getContext<(() => ResolvedNoteTemplate | null) | undefined>(TEMPLATE_KEY);
    return typeof getter === 'function' ? getter() : null;
  } catch {
    // Context not set — component rendered outside editor (e.g., tests)
    return null;
  }
}

// ─── Visibility helpers ─────────────────────────────────────────────────────

/** Get the full SubsectionConfig for a given section + subsection. */
export function getSubsectionConfig(
  template: ResolvedNoteTemplate | null,
  sectionId: string,
  subsectionId: string,
): SubsectionConfig {
  if (!template) return DEFAULT_SUBSECTION;
  return template.sections[sectionId]?.subsections?.[subsectionId] ?? DEFAULT_SUBSECTION;
}

/** Whether a specific subsection should be rendered. */
export function isSubsectionVisible(
  template: ResolvedNoteTemplate | null,
  sectionId: string,
  subsectionId: string,
): boolean {
  return getSubsectionConfig(template, sectionId, subsectionId).visible !== false;
}

/** Whether a specific section should be rendered at all. */
export function isSectionVisible(
  template: ResolvedNoteTemplate | null,
  sectionId: string,
): boolean {
  if (!template) return true;
  return template.sections[sectionId]?.visible !== false;
}

/** Whether a subsection should start in the open (expanded) state. */
export function isSubsectionDefaultOpen(
  template: ResolvedNoteTemplate | null,
  sectionId: string,
  subsectionId: string,
): boolean {
  return getSubsectionConfig(template, sectionId, subsectionId).defaultOpen ?? false;
}
