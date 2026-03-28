import { describe, expect, it } from 'vitest';
import {
  finalizeDraftSignature,
  freezeNoteVersion,
  type NoteData,
} from '$lib/services/noteLifecycle';

describe('note lifecycle', () => {
  it('increments immutable version metadata when signing', () => {
    const note: NoteData = {
      subjective: { chiefComplaint: 'Shoulder pain' },
      meta: {
        version: 2,
        schemaVersion: 3,
      },
    };

    const signed = finalizeDraftSignature(note, {
      name: 'Casey PT',
      title: 'DPT',
      signedAt: '2026-03-26T12:00:00.000Z',
      version: 3,
    });

    expect(signed.meta?.version).toBe(3);
    expect(signed.meta?.signedVersion).toBe(3);
    expect(signed.meta?.immutableVersionAt).toBe('2026-03-26T12:00:00.000Z');
    expect(signed.meta?.schemaVersion).toBe(3);
  });

  it('freezes a signed note into an immutable exportable snapshot', () => {
    const note: NoteData = {
      subjective: { chiefComplaint: 'Neck pain' },
      meta: {
        version: 4,
        signedVersion: 4,
        schemaVersion: 2,
        signedAt: '2026-03-26T15:30:00.000Z',
        immutableVersionAt: '2026-03-26T15:30:00.000Z',
      },
    };

    const frozen = freezeNoteVersion(note);

    expect(frozen.version).toBe(4);
    expect(frozen.schemaVersion).toBe(2);
    expect(frozen.signedAt).toBe('2026-03-26T15:30:00.000Z');
    expect(frozen.content.subjective).toEqual({ chiefComplaint: 'Neck pain' });
  });
});
