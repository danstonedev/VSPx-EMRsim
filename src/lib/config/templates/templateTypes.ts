/**
 * Note template type system.
 *
 * Templates define which sections/subsections are visible, their defaults,
 * and behavioral hints for a given discipline + setting + visit-type combo.
 *
 * Three-level inheritance:
 *   discipline-base  →  setting-base  →  visit-type
 *
 * Each child template only declares what differs from its parent.
 */

import type { DisciplineId } from '$lib/stores/auth';

// ─── Enums ──────────────────────────────────────────────────────────────────

/** Clinical settings where documentation occurs. */
export type SettingId =
  | 'outpatient'
  | 'inpatient-acute'
  | 'inpatient-rehab'
  | 'snf'
  | 'home-health'
  | 'pediatric'
  | 'acute-care';

/** Visit types within any setting. */
export type VisitTypeId =
  | 'initial-eval'
  | 'follow-up'
  | 'daily-note'
  | 'progress-note'
  | 'discharge-summary'
  | 'recertification'
  | 'team-conference'
  | 'start-of-care';

/** Top-level note format — determines which section component set renders. */
export type NoteFormat = 'soap' | 'adime' | 'dap' | 'narrative';

// ─── Subsection-Level Configuration ─────────────────────────────────────────

export interface SubsectionConfig {
  /** Whether this subsection appears at all. */
  visible: boolean;
  /** Whether the CollapsibleSubsection starts open. */
  defaultOpen?: boolean;
  /** Whether this subsection is required for completeness tracking. */
  required?: boolean;
  /** Hint text or placeholder override for this context. */
  contextHint?: string;
}

// ─── Section-Level Configuration ────────────────────────────────────────────

export interface SectionTemplateConfig {
  /** Whether this entire section is visible. */
  visible: boolean;
  /** Per-subsection overrides. Missing keys inherit from parent template. */
  subsections?: Record<string, SubsectionConfig>;
}

// ─── Standardized Assessment Defaults ───────────────────────────────────────

export interface AssessmentDefault {
  /** Key matching an AssessmentDefinition in standardizedAssessments.ts */
  instrumentKey: string;
  /** If true, auto-added to the assessment panel when the note is created. */
  autoAdd?: boolean;
}

// ─── The Core Template ──────────────────────────────────────────────────────

export interface NoteTemplate {
  /** Unique template identifier (e.g., 'pt-outpatient-initial-eval'). */
  id: string;
  discipline: DisciplineId;
  /** null = discipline base template. */
  setting: SettingId | null;
  /** null = setting base template (or discipline base if setting is also null). */
  visitType: VisitTypeId | null;
  label: string;
  description: string;

  /** Drives which section component set renders in the editor. */
  noteFormat: NoteFormat;

  /** Section-level config. Keys are section IDs (e.g., 'subjective', 'objective'). */
  sections: Record<string, SectionTemplateConfig>;

  /** Standardized assessments to show by default in this context. */
  defaultAssessments?: AssessmentDefault[];

  /** Intervention categories to surface prominently. */
  prominentInterventionCategories?: string[];

  /** Default visit parameters for the plan section. */
  defaultVisitParams?: {
    frequency?: string;
    duration?: string;
  };

  /**
   * Setting-specific behavioral flags.
   * Examples: 'requireMDS' (SNF), 'requireOASIS' (Home Health), 'showICUVitals' (Acute care).
   */
  settingFlags?: Record<string, boolean | string>;

  /** Parent template ID for inheritance chain. */
  extends?: string;
}

// ─── Resolved Template ──────────────────────────────────────────────────────

/** A fully resolved template with all inherited values merged. */
export type ResolvedNoteTemplate = Omit<NoteTemplate, 'extends'>;
