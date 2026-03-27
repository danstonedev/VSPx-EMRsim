import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { storage } from '$lib/storage';
import { createCase, saveDraft } from '$lib/store';
import { resetManifestCache } from '$lib/manifest';
import {
  cases,
  manifestCases,
  isLoading,
  activeCase,
  loadAllCases,
  loadActiveCase,
  saveActiveDraft,
  clearActiveCase,
  scanAllDrafts,
  getDraftStatusMap,
} from '$lib/stores/cases';

describe('cases reactive store', () => {
  beforeEach(() => {
    storage.clear();
    resetManifestCache();
    // Reset stores to defaults
    cases.set([]);
    manifestCases.set([]);
    isLoading.set(false);
    clearActiveCase();
    vi.restoreAllMocks();
  });

  describe('loadAllCases', () => {
    it('sets isLoading during load', async () => {
      // Mock fetch so manifest loads
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            categories: [
              {
                id: 'test',
                name: 'Test',
                cases: [{ id: 'c1', title: 'Case 1', file: 'test.json' }],
              },
            ],
          }),
          { status: 200 },
        ),
      );

      const promise = loadAllCases();
      // isLoading should be true while awaiting
      expect(get(isLoading)).toBe(true);
      await promise;
      expect(get(isLoading)).toBe(false);
    });

    it('populates manifestCases from manifest.json', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            categories: [
              {
                id: 'shoulder',
                name: 'Shoulder',
                cases: [
                  { id: 'imp_001', title: 'Impingement', file: 'shoulder/imp.json' },
                  { id: 'frozen_001', title: 'Frozen', file: 'shoulder/frozen.json' },
                ],
              },
            ],
          }),
          { status: 200 },
        ),
      );

      await loadAllCases();
      const mc = get(manifestCases);
      expect(mc).toHaveLength(2);
      expect(mc[0].id).toBe('imp_001');
      expect(mc[0].category).toBe('shoulder');
    });

    it('loads stored cases into cases store', async () => {
      // Pre-populate storage
      createCase({ patientName: 'Alice' });
      createCase({ patientName: 'Bob' });

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ categories: [] }), { status: 200 }),
      );

      await loadAllCases();
      expect(get(cases)).toHaveLength(2);
    });
  });

  describe('active case', () => {
    it('starts with null active case', () => {
      const state = get(activeCase);
      expect(state.caseId).toBeNull();
      expect(state.caseWrapper).toBeNull();
    });

    it('loads a case by ID', () => {
      const wrapper = createCase({ patientName: 'Test Patient', diagnosis: 'ACL tear' });
      loadActiveCase(wrapper.id, 'eval');
      const state = get(activeCase);
      expect(state.caseId).toBe(wrapper.id);
      expect(state.caseWrapper?.caseObj.patientName).toBe('Test Patient');
      expect(state.encounter).toBe('eval');
    });

    it('loads existing draft when loading active case', () => {
      const wrapper = createCase({ patientName: 'Draft Patient' });
      saveDraft(wrapper.id, 'eval', { subjective: 'shoulder pain' });

      loadActiveCase(wrapper.id, 'eval');
      const state = get(activeCase);
      expect(state.draft).toEqual({ subjective: 'shoulder pain' });
    });

    it('saves draft and updates store', () => {
      const wrapper = createCase({ patientName: 'Saver' });
      loadActiveCase(wrapper.id, 'eval');

      saveActiveDraft({ objective: 'ROM limited' });
      const state = get(activeCase);
      expect(state.draft).toEqual({ objective: 'ROM limited' });
    });

    it('clears active case', () => {
      const wrapper = createCase({ patientName: 'Clear Me' });
      loadActiveCase(wrapper.id, 'eval');
      clearActiveCase();
      const state = get(activeCase);
      expect(state.caseId).toBeNull();
      expect(state.caseWrapper).toBeNull();
    });
  });

  describe('draft scanning', () => {
    it('scans all drafts', () => {
      const w1 = createCase({ patientName: 'A' });
      const w2 = createCase({ patientName: 'B' });
      saveDraft(w1.id, 'eval', { subjective: 'test' });
      saveDraft(w2.id, 'followup', {});

      const drafts = scanAllDrafts();
      expect(drafts).toHaveLength(2);
    });

    it('returns draft status map', () => {
      const w1 = createCase({ patientName: 'A' });
      saveDraft(w1.id, 'eval', { subjective: 'pain' });

      const map = getDraftStatusMap();
      expect(map.has(w1.id)).toBe(true);
      expect(map.get(w1.id)?.hasContent).toBe(true);
    });
  });
});
