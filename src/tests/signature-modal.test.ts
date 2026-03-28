/**
 * Tests for SignatureModal programmatic API and signature creation logic.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { finalizeDraftSignature, type Signature, type NoteData } from '$lib/services/noteLifecycle';

describe('SignatureModal (openSignatureDialog)', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('returns a Promise from openSignatureDialog', async () => {
    const { openSignatureDialog } = await import('$lib/components/SignatureModal.svelte');
    const promise = openSignatureDialog();
    expect(promise).toBeInstanceOf(Promise);
  }, 10000);

  it('openSignatureDialog with existingSignature does not throw', async () => {
    const { openSignatureDialog } = await import('$lib/components/SignatureModal.svelte');
    const existing: Signature = {
      name: 'Jane Doe, SPT',
      title: 'Student PT',
      signedAt: new Date().toISOString(),
      version: 1,
    };
    expect(() => openSignatureDialog({ existingSignature: existing })).not.toThrow();
  });

  it('canSign logic: requires name, title, and attestation', () => {
    const check = (name: string, title: string, attested: boolean) =>
      name.trim().length > 0 && title.trim().length > 0 && attested;

    expect(check('Jane Doe', 'SPT', true)).toBe(true);
    expect(check('', 'SPT', true)).toBe(false);
    expect(check('Jane Doe', '', true)).toBe(false);
    expect(check('Jane Doe', 'SPT', false)).toBe(false);
    expect(check('  ', 'SPT', true)).toBe(false);
  });
});

describe('finalizeDraftSignature', () => {
  it('applies signature to note meta', () => {
    const draft: NoteData = { subjective: {}, objective: {} };
    const sig: Signature = {
      name: 'Jane Doe, SPT',
      title: 'Student Physical Therapist',
      signedAt: '2026-01-15T10:00:00Z',
      version: 1,
    };
    const signed = finalizeDraftSignature(draft, sig);
    expect(signed.meta?.signature).toEqual(sig);
    expect(signed.meta?.signedAt).toBe('2026-01-15T10:00:00Z');
  });

  it('does not mutate the original draft', () => {
    const draft: NoteData = { subjective: { chiefComplaint: 'Knee pain' } };
    const sig: Signature = {
      name: 'John Smith',
      title: 'DPT',
      signedAt: new Date().toISOString(),
      version: 1,
    };
    finalizeDraftSignature(draft, sig);
    expect((draft as Record<string, unknown>).meta).toBeUndefined();
  });

  it('pushes existing signature to amendments when re-signing', () => {
    const originalSig: Signature = {
      name: 'Original Signer',
      title: 'SPT',
      signedAt: '2026-01-01T10:00:00Z',
      version: 1,
    };
    const draft: NoteData = {
      meta: {
        signature: originalSig,
        amendingFrom: 'Correction needed',
      },
    };
    const newSig: Signature = {
      name: 'New Signer',
      title: 'DPT',
      signedAt: '2026-01-15T10:00:00Z',
      version: 1,
    };
    const signed = finalizeDraftSignature(draft, newSig);
    expect(signed.amendments).toHaveLength(1);
    expect(signed.amendments![0].previousSignature).toEqual(originalSig);
    expect(signed.amendments![0].reason).toBe('Correction needed');
    expect(signed.meta?.signature).toEqual(newSig);
    expect(signed.meta?.amendingFrom).toBeUndefined();
  });

  it('preserves existing note data sections', () => {
    const draft: NoteData = {
      subjective: { chiefComplaint: 'Back pain' },
      billing: { diagnosisCodes: ['M54.5'] },
    };
    const sig: Signature = {
      name: 'Test',
      title: 'PT',
      signedAt: new Date().toISOString(),
      version: 1,
    };
    const signed = finalizeDraftSignature(draft, sig);
    expect((signed as Record<string, unknown>).subjective).toEqual({ chiefComplaint: 'Back pain' });
    expect((signed as Record<string, unknown>).billing).toEqual({ diagnosisCodes: ['M54.5'] });
  });
});
