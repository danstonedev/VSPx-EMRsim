import {
  getDraftProfessionId,
  getDraftTemplateId,
  getDraftTemplateLabel,
  getProfessionLabel,
} from './noteCatalog.js';

export const CASEFILE_CATEGORY_META = {
  'encounter-notes': { label: 'Encounter Notes', order: 1 },
  referral: { label: 'Referral & Intake', order: 2 },
  history: { label: 'History', order: 3 },
  results: { label: 'Results', order: 4 },
  medications: { label: 'Medications', order: 5 },
  other: { label: 'Other', order: 99 },
};

const LEGACY_CATEGORY_MAP = {
  referral: 'referral',
  pmh: 'history',
  'prior-notes': 'history',
  imaging: 'results',
  labs: 'results',
  vitals: 'results',
  meds: 'medications',
  other: 'other',
};

function cloneValue(value) {
  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }
  } catch {
    /* fall back to JSON clone */
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(value);
  }
}

export function getCaseFileCategory(entry) {
  const explicit = String(entry?.category || '')
    .toLowerCase()
    .trim();
  if (explicit && CASEFILE_CATEGORY_META[explicit]) {
    return explicit;
  }

  if (String(entry?.kind || '').toLowerCase() === 'signed-note') {
    return 'encounter-notes';
  }

  const legacy = String(entry?.type || '')
    .toLowerCase()
    .trim();
  return LEGACY_CATEGORY_MAP[legacy] || 'other';
}

export function getCaseFileCategoryLabel(categoryOrEntry) {
  const category =
    typeof categoryOrEntry === 'string' ? categoryOrEntry : getCaseFileCategory(categoryOrEntry);
  return CASEFILE_CATEGORY_META[category]?.label || CASEFILE_CATEGORY_META.other.label;
}

export function getCaseFileTypeLabel(entry) {
  if (String(entry?.kind || '').toLowerCase() === 'signed-note') {
    return entry?.status === 'amended' ? 'Amended Note' : 'Signed Note';
  }

  const type = String(entry?.type || 'other')
    .toLowerCase()
    .trim();
  const map = {
    referral: 'Referral',
    pmh: 'PMH',
    imaging: 'Imaging',
    labs: 'Labs',
    meds: 'Meds',
    vitals: 'Vitals',
    'prior-notes': 'Prior Notes',
    other: 'Other',
  };
  return map[type] || 'Other';
}

export function getCaseFileEntryMeta(entry) {
  const parts = [];
  if (entry?.discipline) {
    parts.push(getProfessionLabel(entry.discipline));
  }
  if (entry?.status) {
    const status = String(entry.status);
    parts.push(status.charAt(0).toUpperCase() + status.slice(1));
  }
  const primaryDate = entry?.signedAt || entry?.serviceDate || entry?.createdAt;
  const formattedDate = formatDate(primaryDate);
  if (formattedDate) {
    parts.push(formattedDate);
  }
  if (entry?.author) {
    parts.push(entry.author);
  }
  return parts;
}

export function groupCaseFileEntries(entries = []) {
  const grouped = new Map();

  for (const entry of entries) {
    const category = getCaseFileCategory(entry);
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category).push(entry);
  }

  return Array.from(grouped.entries())
    .sort(
      ([a], [b]) =>
        (CASEFILE_CATEGORY_META[a]?.order || 999) - (CASEFILE_CATEGORY_META[b]?.order || 999),
    )
    .map(([category, items]) => ({
      category,
      label: getCaseFileCategoryLabel(category),
      items: items.sort((left, right) => {
        const leftDate = left?.signedAt || left?.serviceDate || left?.createdAt || '';
        const rightDate = right?.signedAt || right?.serviceDate || right?.createdAt || '';
        return String(rightDate).localeCompare(String(leftDate));
      }),
    }));
}

export function buildSignedNoteCaseFileEntry({
  draft,
  caseId = '',
  professionId = '',
  encounterId = '',
  templateId = '',
  sourceKey = '',
}) {
  const resolvedProfessionId = professionId || getDraftProfessionId(draft);
  const resolvedEncounterId = encounterId || draft?.meta?.encounterId || '';
  const resolvedTemplateId = templateId || getDraftTemplateId(draft, resolvedEncounterId);
  const signature = draft?.meta?.signature || {};
  const templateLabel = getDraftTemplateLabel(draft, resolvedEncounterId);
  const recordId =
    sourceKey || `signed-note:${resolvedProfessionId}:${caseId}:${resolvedEncounterId}`;
  const status = Array.isArray(draft?.amendments) && draft.amendments.length ? 'amended' : 'signed';

  return {
    id: recordId,
    kind: 'signed-note',
    category: 'encounter-notes',
    type: 'signed-note',
    title: templateLabel,
    discipline: resolvedProfessionId,
    status,
    author: signature.name || '',
    serviceDate: signature.signedAt || '',
    signedAt: signature.signedAt || '',
    encounterId: resolvedEncounterId,
    templateId: resolvedTemplateId,
    sourceKey: recordId,
    caseId,
    createdAt: signature.signedAt || new Date().toISOString(),
    data: {
      note: cloneValue(draft),
      templateLabel,
      professionLabel: getProfessionLabel(resolvedProfessionId),
      signedBy: signature.name || '',
      signedAt: signature.signedAt || '',
      status,
      encounterId: resolvedEncounterId,
    },
  };
}

export function upsertCaseFileEntry(entries = [], nextEntry) {
  const list = Array.isArray(entries) ? [...entries] : [];
  const matchIndex = list.findIndex(
    (entry) =>
      entry?.id === nextEntry?.id ||
      (entry?.sourceKey && nextEntry?.sourceKey && entry.sourceKey === nextEntry.sourceKey),
  );

  if (matchIndex >= 0) {
    list[matchIndex] = {
      ...list[matchIndex],
      ...nextEntry,
      data: {
        ...(list[matchIndex]?.data || {}),
        ...(nextEntry?.data || {}),
      },
    };
    return list;
  }

  return [nextEntry, ...list];
}
