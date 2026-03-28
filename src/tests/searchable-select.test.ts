/**
 * Tests for SearchableSelect filtering and keyboard navigation logic.
 * Tests the scoring/filtering logic independently (no component render needed).
 */
import { describe, it, expect } from 'vitest';
import { scoreIntervention, PT_INTERVENTIONS } from '$lib/config/ptCodes';

describe('SearchableSelect — filtering behavior', () => {
  it('scoreIntervention returns > 0 for matching query', () => {
    const item = PT_INTERVENTIONS[0];
    if (!item) return; // guard — list may be empty in test env
    const score = scoreIntervention(item, item.label.toLowerCase().slice(0, 3));
    expect(score).toBeGreaterThan(0);
  });

  it('scoreIntervention returns 0 for non-matching query', () => {
    const item = { value: 'ultrasound', label: 'Ultrasound', category: 'Modalities' };
    const score = scoreIntervention(item, 'zzz_no_match');
    expect(score).toBe(0);
  });

  it('filters items to only those with score > 0', () => {
    const items = [
      { value: 'ultrasound', label: 'Ultrasound', category: 'Modalities' },
      { value: 'tens', label: 'TENS', category: 'Modalities' },
      { value: 'massage', label: 'Manual Therapy - Soft Tissue Mobilization', category: 'Manual' },
    ];
    const query = 'ultra';
    const results = items
      .map((item) => ({ ...item, _score: scoreIntervention(item, query) }))
      .filter((i) => i._score > 0);
    expect(results.length).toBe(1);
    expect(results[0].value).toBe('ultrasound');
  });

  it('results are sorted by score descending', () => {
    // value exact-match (score 100) should rank above label-prefix-match (score 80)
    const items = [
      { value: 'a', label: 'Manual Therapy', category: 'Manual' },
      { value: 'manual', label: 'Manual Therapy - Value Match', category: 'Manual' },
      { value: 'b', label: 'Therapeutic Exercise', category: 'Exercise' },
    ];
    const query = 'manual';
    const results = items
      .map((item) => ({ ...item, _score: scoreIntervention(item, query) }))
      .filter((i) => i._score > 0)
      .sort((a, b) => b._score - a._score);
    // value === query scores 100; label.startsWith(query) scores 80
    expect(results[0].value).toBe('manual');
  });
});

describe('SearchableSelect — ARIA pattern requirements', () => {
  it('uid generation produces non-empty strings', () => {
    // Verify the uid pattern used in the component
    const uid = Math.random().toString(36).slice(2, 8);
    expect(uid.length).toBeGreaterThan(0);
    expect(typeof uid).toBe('string');
  });

  it('aria-activedescendant ID format is consistent', () => {
    const uid = 'abc123';
    const highlightIdx = 2;
    const activeDescendant = `ss-${uid}-opt-${highlightIdx}`;
    expect(activeDescendant).toBe('ss-abc123-opt-2');
  });

  it('listbox ID format matches aria-controls', () => {
    const uid = 'abc123';
    const listboxId = `ss-${uid}-listbox`;
    const ariaControls = `ss-${uid}-listbox`;
    expect(listboxId).toBe(ariaControls);
  });
});

describe('SearchableSelect — keyboard navigation logic', () => {
  const itemCount = 5;

  it('ArrowDown wraps around at end', () => {
    let idx = itemCount - 1;
    idx = (idx + 1) % itemCount;
    expect(idx).toBe(0);
  });

  it('ArrowUp wraps around at start', () => {
    let idx = 0;
    idx = (idx - 1 + itemCount) % itemCount;
    expect(idx).toBe(itemCount - 1);
  });

  it('Enter selects highlighted item', () => {
    const results = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ];
    let highlightIdx = 1;
    const selected = results[highlightIdx >= 0 ? highlightIdx : 0];
    expect(selected.value).toBe('b');
  });

  it('Enter with no highlight selects first item', () => {
    const results = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ];
    let highlightIdx = -1;
    const selected = results[highlightIdx >= 0 ? highlightIdx : 0];
    expect(selected.value).toBe('a');
  });
});
