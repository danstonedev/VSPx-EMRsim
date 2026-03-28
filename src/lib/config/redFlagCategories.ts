/**
 * PT Red Flag Screening categories and items.
 * Organized by pathology category for systematic clinical screening.
 */

export type RedFlagStatus = 'not-screened' | 'denied' | 'present';

export interface RedFlagCategoryDef {
  id: string;
  label: string;
  items: { id: string; label: string }[];
}

export interface RedFlagEntry {
  id: string;
  item: string;
  status: RedFlagStatus;
  note: string;
}

export const RED_FLAG_CATEGORIES: RedFlagCategoryDef[] = [
  {
    id: 'cauda-equina',
    label: 'Cauda Equina / Cord Compression',
    items: [
      { id: 'saddle-anesthesia', label: 'Saddle anesthesia' },
      { id: 'bowel-bladder', label: 'Bowel / bladder dysfunction' },
      { id: 'bilateral-neuro', label: 'Bilateral neurological symptoms' },
      { id: 'progressive-weakness', label: 'Progressive lower extremity weakness' },
    ],
  },
  {
    id: 'cancer',
    label: 'Cancer / Malignancy',
    items: [
      { id: 'unexplained-weight-loss', label: 'Unexplained weight loss' },
      { id: 'cancer-history', label: 'History of cancer' },
      { id: 'constant-night-pain', label: 'Constant night pain unrelieved by position' },
      { id: 'age-new-onset', label: 'Age > 50 with new onset pain' },
    ],
  },
  {
    id: 'fracture',
    label: 'Fracture',
    items: [
      { id: 'major-trauma', label: 'Major trauma / mechanism' },
      { id: 'osteoporosis', label: 'Osteoporosis / steroid use' },
    ],
  },
  {
    id: 'infection',
    label: 'Infection',
    items: [
      { id: 'fever-chills', label: 'Fever / chills / malaise' },
      { id: 'recent-infection', label: 'Recent infection or surgery' },
      { id: 'immunosuppression', label: 'Immunosuppression / IV drug use' },
    ],
  },
  {
    id: 'vascular',
    label: 'Vascular',
    items: [
      { id: 'dvt-signs', label: 'DVT signs (unilateral swelling, redness, warmth)' },
      { id: 'vbi-signs', label: 'VBI signs (dizziness, diplopia, dysarthria, drop attacks)' },
    ],
  },
  {
    id: 'cardiac',
    label: 'Cardiac / Systemic',
    items: [
      { id: 'chest-pain', label: 'Chest pain / shortness of breath at rest' },
      { id: 'unexplained-diaphoresis', label: 'Unexplained diaphoresis' },
    ],
  },
  {
    id: 'mental-health',
    label: 'Mental Health',
    items: [
      { id: 'phq2-little-interest', label: 'Little interest or pleasure in doing things (PHQ-2)' },
      { id: 'phq2-feeling-down', label: 'Feeling down, depressed, or hopeless (PHQ-2)' },
      { id: 'suicidal-ideation', label: 'Thoughts of self-harm or suicide' },
      {
        id: 'anxiety-excessive-worry',
        label: 'Excessive worry or anxiety affecting daily function',
      },
    ],
  },
  {
    id: 'tobacco',
    label: 'Tobacco Use',
    items: [
      { id: 'tobacco-current', label: 'Current tobacco / nicotine use' },
      { id: 'tobacco-former', label: 'Former tobacco use' },
      { id: 'tobacco-never', label: 'Never used tobacco' },
    ],
  },
  {
    id: 'alcohol',
    label: 'Alcohol Use',
    items: [
      { id: 'alcohol-current', label: 'Current alcohol use' },
      { id: 'alcohol-heavy', label: 'Heavy or binge drinking (≥ 4-5 drinks/occasion)' },
      { id: 'alcohol-cage-positive', label: 'CAGE screen positive (≥ 2 yes)' },
    ],
  },
];

/** Get all item IDs across all categories */
export function getAllRedFlagIds(): string[] {
  return RED_FLAG_CATEGORIES.flatMap((c) => c.items.map((i) => i.id));
}

/** Initialize a fresh screening array */
export function createDefaultScreening(): RedFlagEntry[] {
  return RED_FLAG_CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => ({
      id: item.id,
      item: item.label,
      status: 'not-screened' as const,
      note: '',
    })),
  );
}

/** Cycle to next status */
export function nextRedFlagStatus(current: RedFlagStatus): RedFlagStatus {
  if (current === 'denied') return 'present';
  if (current === 'present') return 'not-screened';
  return 'denied';
}

/** Build a summary string from structured screening data */
export function buildRedFlagSummary(entries: RedFlagEntry[]): string {
  const denied: string[] = [];
  const present: string[] = [];

  for (const cat of RED_FLAG_CATEGORIES) {
    for (const item of cat.items) {
      const entry = entries.find((e) => e.id === item.id);
      if (!entry) continue;
      if (entry.status === 'denied') denied.push(item.label);
      else if (entry.status === 'present') {
        const detail = entry.note ? ` (${entry.note})` : '';
        present.push(`${item.label}${detail}`);
      }
    }
  }

  const parts: string[] = [];
  if (present.length) parts.push(`PRESENT: ${present.join('; ')}`);
  if (denied.length) parts.push(`Denied: ${denied.join(', ')}`);
  return parts.join('. ');
}
