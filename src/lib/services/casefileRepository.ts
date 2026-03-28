/**
 * Case file repository — category constants, grouping, entry management.
 * Port of app/js/core/casefile-repository.js.
 */

// ─── Category constants ───

export const CASEFILE_CATEGORIES = {
  SIGNED_NOTE: 'Signed Notes',
  IMAGING: 'Imaging & Reports',
  LAB: 'Lab Results',
  REFERRAL: 'Referrals',
  PHYSICIAN_NOTE: 'Physician Notes',
  HISTORY: 'Medical History',
  INSURANCE: 'Insurance / Auth',
  OTHER: 'Other Documents',
} as const;

export type CaseFileCategory = (typeof CASEFILE_CATEGORIES)[keyof typeof CASEFILE_CATEGORIES];

export interface CaseFileEntry {
  id: string;
  category: CaseFileCategory;
  title: string;
  date: string;
  content: string;
  /** HTML content for signed notes */
  html?: string;
  /** For signed notes — who signed */
  signedBy?: string;
  /** Encounter number */
  encounter?: number;
  /** Note type (e.g., 'Initial Evaluation', 'Follow-up') */
  noteType?: string;
}

// ─── Helpers ───

export function getCategoryLabel(category: string): string {
  return Object.values(CASEFILE_CATEGORIES).find((c) => c === category) ?? category;
}

export function groupByCategory(entries: CaseFileEntry[]): Map<CaseFileCategory, CaseFileEntry[]> {
  const groups = new Map<CaseFileCategory, CaseFileEntry[]>();
  for (const entry of entries) {
    const cat = entry.category;
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(entry);
  }
  // Sort entries within each group by date descending
  for (const [, items] of groups) {
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  return groups;
}

/**
 * Build a case file entry from a signed note.
 */
export function buildSignedNoteCaseFileEntry(note: {
  encounterLabel?: string;
  meta?: { signature?: { name: string; signedAt: string } };
  encounter?: number;
  html?: string;
}): CaseFileEntry {
  const sig = note.meta?.signature;
  return {
    id: `signed-${note.encounter ?? Date.now()}-${Date.now()}`,
    category: CASEFILE_CATEGORIES.SIGNED_NOTE,
    title: note.encounterLabel ?? 'Signed Note',
    date: sig?.signedAt ?? new Date().toISOString(),
    content: '',
    html: note.html,
    signedBy: sig?.name,
    encounter: note.encounter,
    noteType: note.encounterLabel,
  };
}

/**
 * Upsert a case file entry into an array (by id).
 */
export function upsertCaseFileEntry(
  entries: CaseFileEntry[],
  entry: CaseFileEntry,
): CaseFileEntry[] {
  const idx = entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) {
    const updated = [...entries];
    updated[idx] = entry;
    return updated;
  }
  return [...entries, entry];
}
