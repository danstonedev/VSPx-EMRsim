import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '$lib/storage';
import {
  listCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
  saveDraft,
  loadDraft,
  listDrafts,
} from '$lib/store';

describe('case store', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('starts with empty case list', () => {
    const cases = listCases();
    expect(Object.keys(cases)).toHaveLength(0);
  });

  it('creates a case with auto-incrementing ID', () => {
    const wrapper = createCase({ patientName: 'John Doe', diagnosis: 'Frozen Shoulder' });
    expect(wrapper.id).toBe('case_1');
    expect(wrapper.caseObj.patientName).toBe('John Doe');
    expect(wrapper.caseObj.diagnosis).toBe('Frozen Shoulder');
    expect(wrapper.caseObj.id).toBe('case_1');
  });

  it('retrieves a case by ID', () => {
    createCase({ patientName: 'Jane Smith' });
    const fetched = getCase('case_1');
    expect(fetched).not.toBeNull();
    expect(fetched!.caseObj.patientName).toBe('Jane Smith');
  });

  it('returns null for missing case ID', () => {
    expect(getCase('case_999')).toBeNull();
  });

  it('lists all cases', () => {
    createCase({ patientName: 'Patient A' });
    createCase({ patientName: 'Patient B' });
    const cases = listCases();
    expect(Object.keys(cases)).toHaveLength(2);
  });

  it('updates a case', () => {
    createCase({ patientName: 'Original' });
    const ok = updateCase('case_1', { patientName: 'Updated' });
    expect(ok).toBe(true);
    expect(getCase('case_1')!.caseObj.patientName).toBe('Updated');
  });

  it('returns false when updating non-existent case', () => {
    expect(updateCase('case_999', { patientName: 'X' })).toBe(false);
  });

  it('deletes a case', () => {
    createCase({ patientName: 'To Delete' });
    expect(deleteCase('case_1')).toBe(true);
    expect(getCase('case_1')).toBeNull();
  });

  it('returns false when deleting non-existent case', () => {
    expect(deleteCase('case_999')).toBe(false);
  });
});

describe('draft store', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('saves and loads a draft', () => {
    const draft = { subjective: 'Patient reports pain', objective: 'ROM limited' };
    saveDraft('case_1', 'initial_eval', draft);
    const loaded = loadDraft('case_1', 'initial_eval');
    expect(loaded).toEqual(draft);
  });

  it('returns null for missing draft', () => {
    expect(loadDraft('case_1', 'nonexistent')).toBeNull();
  });

  it('lists all drafts', () => {
    saveDraft('case_1', 'initial_eval', { s: 'test' });
    saveDraft('case_1', 'followup', { s: 'test2' });
    saveDraft('case_2', 'initial_eval', { s: 'test3' });
    const drafts = listDrafts();
    expect(drafts.length).toBeGreaterThanOrEqual(3);
  });
});
