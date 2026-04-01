/**
 * Deep-merge logic for template inheritance.
 *
 * Merge rules:
 * - Scalars: child wins if present.
 * - sections: merged key-by-key (child can override or hide parent sections).
 * - sections.*.subsections: merged key-by-key (child can override individual fields).
 * - Arrays (defaultAssessments, prominentInterventionCategories): child replaces parent.
 * - settingFlags: shallow merge, child wins per key.
 */

import type {
  NoteTemplate,
  ResolvedNoteTemplate,
  SectionTemplateConfig,
  SubsectionConfig,
} from './templateTypes';

/** Merge two SubsectionConfig objects. Child fields override parent fields. */
function mergeSubsection(parent: SubsectionConfig, child: SubsectionConfig): SubsectionConfig {
  return {
    visible: child.visible ?? parent.visible,
    defaultOpen: child.defaultOpen ?? parent.defaultOpen,
    required: child.required ?? parent.required,
    contextHint: child.contextHint ?? parent.contextHint,
  };
}

/** Merge two SectionTemplateConfig objects. */
function mergeSection(
  parent: SectionTemplateConfig,
  child: SectionTemplateConfig,
): SectionTemplateConfig {
  const merged: SectionTemplateConfig = {
    visible: child.visible ?? parent.visible,
  };

  // Merge subsections if either side has them
  if (parent.subsections || child.subsections) {
    const parentSubs = parent.subsections ?? {};
    const childSubs = child.subsections ?? {};
    const allKeys = new Set([...Object.keys(parentSubs), ...Object.keys(childSubs)]);

    merged.subsections = {};
    for (const key of allKeys) {
      const p = parentSubs[key];
      const c = childSubs[key];
      if (p && c) {
        merged.subsections[key] = mergeSubsection(p, c);
      } else {
        merged.subsections[key] = c ?? p;
      }
    }
  }

  return merged;
}

/** Merge sections records from parent and child templates. */
function mergeSections(
  parent: Record<string, SectionTemplateConfig>,
  child: Record<string, SectionTemplateConfig>,
): Record<string, SectionTemplateConfig> {
  const allKeys = new Set([...Object.keys(parent), ...Object.keys(child)]);
  const merged: Record<string, SectionTemplateConfig> = {};

  for (const key of allKeys) {
    const p = parent[key];
    const c = child[key];
    if (p && c) {
      merged[key] = mergeSection(p, c);
    } else {
      merged[key] = c ?? p;
    }
  }

  return merged;
}

/**
 * Deep-merge a parent (already resolved) with a child template.
 * Returns a fully resolved template.
 */
export function mergeTemplates(
  parent: ResolvedNoteTemplate,
  child: NoteTemplate,
): ResolvedNoteTemplate {
  return {
    id: child.id,
    discipline: child.discipline,
    setting: child.setting,
    visitType: child.visitType,
    label: child.label || parent.label,
    description: child.description || parent.description,
    noteFormat: child.noteFormat || parent.noteFormat,

    // Deep-merge sections
    sections: mergeSections(parent.sections, child.sections),

    // Arrays: child replaces parent entirely if present
    defaultAssessments: child.defaultAssessments ?? parent.defaultAssessments,
    prominentInterventionCategories:
      child.prominentInterventionCategories ?? parent.prominentInterventionCategories,

    // Object merges
    defaultVisitParams: child.defaultVisitParams
      ? { ...parent.defaultVisitParams, ...child.defaultVisitParams }
      : parent.defaultVisitParams,
    settingFlags: child.settingFlags
      ? { ...parent.settingFlags, ...child.settingFlags }
      : parent.settingFlags,
  };
}
