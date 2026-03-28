/**
 * Combined Neuroscreen data: Dermatome, Myotome, Reflex tables
 * for Lower Extremity, Upper Extremity, and Cranial Nerves.
 */

export interface NeuroscreenItem {
  level: string;
  reflex: string | null;
}

export interface NeuroscreenRegion {
  name: string;
  items: NeuroscreenItem[];
}

export const DERMATOME_OPTIONS = [
  { value: '', label: '—' },
  { value: 'intact', label: 'Intact' },
  { value: 'impaired', label: 'Impaired' },
  { value: 'absent', label: 'Absent' },
];

export const MYOTOME_OPTIONS = [
  { value: '', label: '—' },
  { value: '5/5', label: '5/5' },
  { value: '4/5', label: '4/5' },
  { value: '3/5', label: '3/5' },
  { value: '2/5', label: '2/5' },
  { value: '1/5', label: '1/5' },
  { value: '0/5', label: '0/5' },
];

export const REFLEX_OPTIONS = [
  { value: '', label: '—' },
  { value: '4+', label: '4+ (Hyperactive)' },
  { value: '3+', label: '3+ (Brisk)' },
  { value: '2+', label: '2+ (Normal)' },
  { value: '1+', label: '1+ (Diminished)' },
  { value: '0', label: '0 (Absent)' },
];

export const NEURO_REGIONS: Record<string, NeuroscreenRegion> = {
  'lower-extremity': {
    name: 'Lower Extremity',
    items: [
      { level: 'L1', reflex: null },
      { level: 'L2', reflex: null },
      { level: 'L3', reflex: 'Patellar' },
      { level: 'L4', reflex: 'Patellar' },
      { level: 'L5', reflex: null },
      { level: 'S1', reflex: 'Achilles' },
      { level: 'S2', reflex: null },
    ],
  },
  'upper-extremity': {
    name: 'Upper Extremity',
    items: [
      { level: 'C1–C4', reflex: null },
      { level: 'C5', reflex: 'Biceps' },
      { level: 'C6', reflex: 'Brachioradialis' },
      { level: 'C7', reflex: 'Triceps' },
      { level: 'C8–T1', reflex: null },
    ],
  },
  'cranial-nerves': {
    name: 'Cranial Nerves',
    items: [
      { level: 'CN I', reflex: null },
      { level: 'CN II, III', reflex: 'Pupillary' },
      { level: 'CN IV, VI', reflex: null },
      { level: 'CN V', reflex: 'Corneal' },
      { level: 'CN VII, VIII', reflex: null },
      { level: 'CN IX, X', reflex: 'Gag' },
      { level: 'CN XI, XII', reflex: null },
    ],
  },
};

export function neuroKey(region: string, level: string, side: string, type: string): string {
  return `${region}:${level}-${side}-${type}`;
}

export function getNeuroscreenRegionList(): { value: string; label: string }[] {
  return Object.entries(NEURO_REGIONS).map(([value, r]) => ({ value, label: r.name }));
}
