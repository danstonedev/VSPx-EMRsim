/**
 * Simple discipline → defaults lookup.
 * Centralizes the discipline metadata that was previously scattered
 * across if/else checks in editor and case pages.
 */
import type { DisciplineId } from '$lib/stores/auth';

export interface DisciplineDefaults {
  label: string;
  abbreviation: string;
  defaultEncounter: string;
  noteFormat: string;
}

export const DISCIPLINE_DEFAULTS: Record<DisciplineId, DisciplineDefaults> = {
  pt: {
    label: 'Physical Therapy',
    abbreviation: 'PT',
    defaultEncounter: 'eval',
    noteFormat: 'SOAP',
  },
  dietetics: {
    label: 'Dietetics',
    abbreviation: 'RDN',
    defaultEncounter: 'nutrition',
    noteFormat: 'ADIME',
  },
};

/** Get defaults for a discipline, falling back to PT if unknown. */
export function getDisciplineDefaults(discipline: DisciplineId): DisciplineDefaults {
  return DISCIPLINE_DEFAULTS[discipline] ?? DISCIPLINE_DEFAULTS.pt;
}

/** All known discipline IDs. */
export const ALL_DISCIPLINES: DisciplineId[] = Object.keys(DISCIPLINE_DEFAULTS) as DisciplineId[];
