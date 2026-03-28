/**
 * Note lifecycle utilities — draft ↔ encounter copy, signature finalization.
 */

/** Fields that carry lifecycle/signature state on a note */
export const LIFECYCLE_FIELDS = ['meta', 'amendments'] as const;

export interface Cosignature {
  name: string;
  title: string;
  licenseType: string;
  licenseNumber: string;
  signedAt: string;
}

export interface Signature {
  name: string;
  title: string;
  signedAt: string;
  version: number;
  /** Professional license type, e.g., 'PT', 'PTA', 'SPT', 'RD', 'RDN', 'DTR' */
  licenseType?: string;
  /** License or credential number */
  licenseNumber?: string;
  /** Post-nominal credentials, e.g., 'DPT, OCS' or 'RDN, LD' */
  credentials?: string;
  /** Supervising clinician co-signature (required for student notes) */
  cosignature?: Cosignature;
}

/** localStorage keys for persisting last-used signature fields */
export const SIGNATURE_STORAGE_NAME = 'pt_emr_signature_name';
export const SIGNATURE_STORAGE_TITLE = 'pt_emr_signature_title';

export interface NoteMeta {
  signature?: Signature;
  signedAt?: string;
  amendedAt?: string;
  amendingFrom?: string;
  version?: number;
  schemaVersion?: number;
  signedVersion?: number;
  immutableVersionAt?: string;
  [key: string]: unknown;
}

export interface NoteData {
  meta?: NoteMeta;
  amendments?: Amendment[];
  [key: string]: unknown;
}

export interface FrozenNoteVersion {
  version: number;
  schemaVersion: number;
  frozenAt: string;
  signedAt?: string;
  content: Record<string, unknown>;
}

export interface Amendment {
  reason: string;
  previousSignature: Signature;
  amendedAt: string;
}

/**
 * Copy lifecycle fields from a draft onto an encounter object.
 */
export function copyDraftLifecycleToEncounter(
  draft: NoteData,
  encounter: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...encounter };
  for (const field of LIFECYCLE_FIELDS) {
    if (draft[field] !== undefined) {
      result[field] = structuredClone(draft[field]);
    }
  }
  return result;
}

/**
 * Apply encounter lifecycle fields back onto a draft.
 */
export function applyEncounterLifecycleToDraft(
  encounter: Record<string, unknown>,
  draft: NoteData,
): NoteData {
  const result = { ...draft };
  for (const field of LIFECYCLE_FIELDS) {
    if (encounter[field] !== undefined) {
      (result as Record<string, unknown>)[field] = structuredClone(encounter[field]);
    }
  }
  return result;
}

/**
 * Finalize a draft signature. Handles amendment chain when re-signing.
 */
export function finalizeDraftSignature(draft: NoteData, signature: Signature): NoteData {
  const result = { ...draft };
  const meta: NoteMeta = { ...(result.meta ?? {}) };
  const nextVersion = Number(meta.version ?? 0) + 1;
  const signedAt = signature.signedAt;

  // If amending, push previous signature to amendments chain
  if (meta.amendingFrom && meta.signature) {
    const amendments: Amendment[] = [...(result.amendments ?? [])];
    amendments.push({
      reason: meta.amendingFrom,
      previousSignature: { ...meta.signature },
      amendedAt: new Date().toISOString(),
    });
    result.amendments = amendments;
    delete meta.amendingFrom;
  }

  meta.signature = signature;
  meta.signedAt = signedAt;
  meta.version = nextVersion;
  meta.signedVersion = nextVersion;
  meta.immutableVersionAt = signedAt;
  meta.schemaVersion = Number(meta.schemaVersion ?? 1);
  result.meta = meta;

  return result;
}

/**
 * Apply an immutable version snapshot to a note before persisting or exporting.
 */
export function freezeNoteVersion(draft: NoteData): FrozenNoteVersion {
  const meta: NoteMeta = { ...(draft.meta ?? {}) };
  return {
    version: Number(meta.signedVersion ?? meta.version ?? 1),
    schemaVersion: Number(meta.schemaVersion ?? 1),
    frozenAt: String(meta.immutableVersionAt ?? meta.signedAt ?? new Date().toISOString()),
    signedAt: typeof meta.signedAt === 'string' ? meta.signedAt : undefined,
    content: structuredClone(draft as Record<string, unknown>),
  };
}
