/**
 * Tests for the note export preview modal programmatic API.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import type { Signature } from '$lib/services/noteLifecycle';

describe('NoteExportPreviewModal (openNoteExportPreview)', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('returns a Promise from openNoteExportPreview', async () => {
    const { openNoteExportPreview } = await import('$lib/components/NoteExportPreviewModal.svelte');
    const promise = openNoteExportPreview({
      note: { subjective: { chiefComplaint: 'Neck pain' } },
      patient: { name: 'Michael Chen', caseId: 'neck_radic_v2' },
    });
    expect(promise).toBeInstanceOf(Promise);
  }, 10000);

  it('accepts an existing signature in export mode without throwing', async () => {
    const { openNoteExportPreview } = await import('$lib/components/NoteExportPreviewModal.svelte');
    const existing: Signature = {
      name: 'Jane Doe, SPT',
      title: 'Student Physical Therapist',
      signedAt: '2026-03-27T14:30:00Z',
      version: 1,
    };

    expect(() =>
      openNoteExportPreview({
        note: {
          subjective: { chiefComplaint: 'Neck pain' },
          meta: { signature: existing, signedAt: existing.signedAt },
        },
        patient: { name: 'Michael Chen' },
        mode: 'export',
        existingSignature: existing,
      }),
    ).not.toThrow();
  });
});
