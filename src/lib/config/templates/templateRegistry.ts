/**
 * Template registry — stores all NoteTemplates and resolves inheritance chains.
 *
 * Usage:
 *   import { findTemplate } from '$lib/config/templates/templateRegistry';
 *   const template = findTemplate('pt', 'outpatient', 'initial-eval');
 */

import type { DisciplineId } from '$lib/stores/auth';
import type { NoteTemplate, ResolvedNoteTemplate, SettingId, VisitTypeId } from './templateTypes';
import { mergeTemplates } from './templateInheritance';

// ─── Internal store ─────────────────────────────────────────────────────────

const TEMPLATE_MAP = new Map<string, NoteTemplate>();
const RESOLVED_CACHE = new Map<string, ResolvedNoteTemplate>();

// ─── Registration ───────────────────────────────────────────────────────────

/** Register a single template. */
export function registerTemplate(template: NoteTemplate): void {
  TEMPLATE_MAP.set(template.id, template);
  RESOLVED_CACHE.clear(); // invalidate cache on any registration
}

/** Register multiple templates at once. */
export function registerTemplates(templates: NoteTemplate[]): void {
  for (const t of templates) {
    TEMPLATE_MAP.set(t.id, t);
  }
  RESOLVED_CACHE.clear();
}

// ─── Resolution ─────────────────────────────────────────────────────────────

/** Resolve a template by walking the `extends` chain and deep-merging. */
export function resolveTemplate(templateId: string): ResolvedNoteTemplate | null {
  if (RESOLVED_CACHE.has(templateId)) return RESOLVED_CACHE.get(templateId)!;

  const raw = TEMPLATE_MAP.get(templateId);
  if (!raw) return null;

  if (!raw.extends) {
    const resolved = { ...raw } as ResolvedNoteTemplate;
    RESOLVED_CACHE.set(templateId, resolved);
    return resolved;
  }

  const parent = resolveTemplate(raw.extends);
  if (!parent) {
    // Parent not found — treat raw as standalone
    const resolved = { ...raw } as ResolvedNoteTemplate;
    RESOLVED_CACHE.set(templateId, resolved);
    return resolved;
  }

  const resolved = mergeTemplates(parent, raw);
  RESOLVED_CACHE.set(templateId, resolved);
  return resolved;
}

// ─── Lookup helpers ─────────────────────────────────────────────────────────

/**
 * Primary lookup: discipline + optional setting + optional visitType.
 * Falls back through the chain: exact → setting-base → discipline-base.
 */
export function findTemplate(
  discipline: DisciplineId,
  setting?: SettingId | null,
  visitType?: VisitTypeId | null,
): ResolvedNoteTemplate | null {
  // Try exact match
  if (setting && visitType) {
    const exact = findByCombo(discipline, setting, visitType);
    if (exact) return exact;
  }
  // Fall back to setting base
  if (setting) {
    const settingBase = findByCombo(discipline, setting, null);
    if (settingBase) return settingBase;
  }
  // Fall back to discipline base
  return findByCombo(discipline, null, null);
}

/** Find a template matching a specific discipline/setting/visitType combo. */
function findByCombo(
  discipline: DisciplineId,
  setting: SettingId | null,
  visitType: VisitTypeId | null,
): ResolvedNoteTemplate | null {
  for (const [id, template] of TEMPLATE_MAP) {
    if (
      template.discipline === discipline &&
      template.setting === setting &&
      template.visitType === visitType
    ) {
      return resolveTemplate(id);
    }
  }
  return null;
}

/** List all resolved templates, optionally filtered by discipline and/or setting. */
export function listTemplates(
  discipline?: DisciplineId,
  setting?: SettingId,
): ResolvedNoteTemplate[] {
  const results: ResolvedNoteTemplate[] = [];
  for (const [id, template] of TEMPLATE_MAP) {
    if (discipline && template.discipline !== discipline) continue;
    if (setting && template.setting !== setting) continue;
    const resolved = resolveTemplate(id);
    if (resolved) results.push(resolved);
  }
  return results;
}

/** Get a resolved template by its exact ID. */
export function getTemplate(templateId: string): ResolvedNoteTemplate | null {
  return resolveTemplate(templateId);
}
