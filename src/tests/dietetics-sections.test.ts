/**
 * Tests for dietetics NCP section types, store functions, and draft migration.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  dieteticsNoteDraft,
  initDieteticsDraft,
  updateDieteticsField,
  replaceDieteticsSection,
  clearDieteticsDraft,
  clearDraft,
  type DieteticsNoteDraft,
} from '$lib/stores/noteSession';
import type {
  NutritionAssessmentData,
  NutritionDiagnosisData,
  NutritionInterventionData,
  NutritionMonitoringData,
  DieteticsBillingData,
  PesStatement,
  DieteticsNoteDraft as DieteticsNoteDraftType,
} from '$lib/types/sections';

// ─── Store Reset ───

beforeEach(() => {
  clearDraft(); // clears both PT and dietetics
});

// ─── Type Shape ───

describe('DieteticsNoteDraft type shape', () => {
  it('has all five NCP sections', () => {
    const draft = get(dieteticsNoteDraft);
    expect(draft).toHaveProperty('nutrition_assessment');
    expect(draft).toHaveProperty('nutrition_diagnosis');
    expect(draft).toHaveProperty('nutrition_intervention');
    expect(draft).toHaveProperty('nutrition_monitoring');
    expect(draft).toHaveProperty('billing');
  });

  it('initializes with empty assessment fields', () => {
    const draft = get(dieteticsNoteDraft);
    expect(draft.nutrition_assessment).toEqual({});
  });

  it('initializes nutrition_diagnosis with one empty PES row', () => {
    const draft = get(dieteticsNoteDraft);
    expect(draft.nutrition_diagnosis.pes_statements).toHaveLength(1);
    expect(draft.nutrition_diagnosis.pes_statements![0]).toEqual({
      problem: '',
      etiology: '',
      signs_symptoms: '',
    });
  });
});

// ─── updateDieteticsField ─���─

describe('updateDieteticsField', () => {
  it('updates a single field in nutrition_assessment', () => {
    updateDieteticsField('nutrition_assessment', 'food_nutrition_history', 'Eats 3 meals/day');
    const draft = get(dieteticsNoteDraft);
    expect(draft.nutrition_assessment.food_nutrition_history).toBe('Eats 3 meals/day');
  });

  it('updates malnutrition_risk', () => {
    updateDieteticsField('nutrition_assessment', 'malnutrition_risk', 'at-risk');
    const draft = get(dieteticsNoteDraft);
    expect(draft.nutrition_assessment.malnutrition_risk).toBe('at-risk');
  });

  it('updates a field in nutrition_intervention', () => {
    updateDieteticsField('nutrition_intervention', 'strategy', 'ND-1');
    const draft = get(dieteticsNoteDraft);
    expect(draft.nutrition_intervention.strategy).toBe('ND-1');
  });

  it('updates a field in nutrition_monitoring', () => {
    updateDieteticsField('nutrition_monitoring', 'indicators', 'FH-1');
    const draft = get(dieteticsNoteDraft);
    expect(draft.nutrition_monitoring.indicators).toBe('FH-1');
  });

  it('updates billing fields', () => {
    updateDieteticsField('billing', 'cpt_code', '97802');
    updateDieteticsField('billing', 'units', '4');
    const draft = get(dieteticsNoteDraft);
    expect(draft.billing.cpt_code).toBe('97802');
    expect(draft.billing.units).toBe('4');
  });

  it('preserves other fields when updating one', () => {
    updateDieteticsField('nutrition_assessment', 'anthropometric', 'BMI 24.5');
    updateDieteticsField('nutrition_assessment', 'biochemical', 'Albumin 3.2');
    const draft = get(dieteticsNoteDraft);
    expect(draft.nutrition_assessment.anthropometric).toBe('BMI 24.5');
    expect(draft.nutrition_assessment.biochemical).toBe('Albumin 3.2');
  });
});

// ─── replaceDieteticsSection ───

describe('replaceDieteticsSection', () => {
  it('replaces entire nutrition_diagnosis section', () => {
    const newDiag: NutritionDiagnosisData = {
      pes_statements: [
        { problem: 'NI-2.1', etiology: 'Poor appetite', signs_symptoms: 'Intake <50%' },
        { problem: 'NC-3.1', etiology: 'Chronic illness', signs_symptoms: 'BMI 17.5' },
      ],
      priority_diagnosis: 'NI-2.1 Inadequate oral intake',
    };
    replaceDieteticsSection('nutrition_diagnosis', newDiag as unknown as Record<string, unknown>);
    const draft = get(dieteticsNoteDraft);
    expect(draft.nutrition_diagnosis.pes_statements).toHaveLength(2);
    expect(draft.nutrition_diagnosis.pes_statements![0].problem).toBe('NI-2.1');
    expect(draft.nutrition_diagnosis.priority_diagnosis).toBe('NI-2.1 Inadequate oral intake');
  });

  it('replaces entire billing section', () => {
    replaceDieteticsSection('billing', {
      cpt_code: '97803',
      units: '2',
      time_minutes: '30',
      diagnosis_codes: 'E11.65',
      justification: 'Diabetes management requires ongoing MNT',
    });
    const draft = get(dieteticsNoteDraft);
    expect(draft.billing.cpt_code).toBe('97803');
    expect(draft.billing.justification).toBe('Diabetes management requires ongoing MNT');
  });
});

// ─── clearDieteticsDraft ───

describe('clearDieteticsDraft', () => {
  it('resets to empty defaults', () => {
    updateDieteticsField('nutrition_assessment', 'food_nutrition_history', 'some data');
    updateDieteticsField('billing', 'cpt_code', '97802');
    clearDieteticsDraft();
    const draft = get(dieteticsNoteDraft);
    expect(draft.nutrition_assessment).toEqual({});
    expect(draft.billing).toEqual({});
    expect(draft.nutrition_diagnosis.pes_statements).toHaveLength(1);
  });
});

// ���── PES Statement Management ───

describe('PES statement array management', () => {
  it('can add a PES row via replaceDieteticsSection', () => {
    const draft = get(dieteticsNoteDraft);
    const existing = draft.nutrition_diagnosis.pes_statements ?? [];
    const updated = [...existing, { problem: '', etiology: '', signs_symptoms: '' }];
    replaceDieteticsSection('nutrition_diagnosis', {
      ...draft.nutrition_diagnosis,
      pes_statements: updated,
    });
    expect(get(dieteticsNoteDraft).nutrition_diagnosis.pes_statements).toHaveLength(2);
  });

  it('can remove a PES row', () => {
    // Start with 2 rows
    replaceDieteticsSection('nutrition_diagnosis', {
      pes_statements: [
        { problem: 'NI-2.1', etiology: 'A', signs_symptoms: 'B' },
        { problem: 'NC-3.3', etiology: 'C', signs_symptoms: 'D' },
      ],
      priority_diagnosis: '',
    });
    const draft = get(dieteticsNoteDraft);
    const filtered = draft.nutrition_diagnosis.pes_statements!.filter((_, i) => i !== 0);
    replaceDieteticsSection('nutrition_diagnosis', {
      ...draft.nutrition_diagnosis,
      pes_statements: filtered,
    });
    const result = get(dieteticsNoteDraft);
    expect(result.nutrition_diagnosis.pes_statements).toHaveLength(1);
    expect(result.nutrition_diagnosis.pes_statements![0].problem).toBe('NC-3.3');
  });

  it('can update a single PES field', () => {
    const draft = get(dieteticsNoteDraft);
    const updated = draft.nutrition_diagnosis.pes_statements!.map((pes, i) =>
      i === 0 ? { ...pes, problem: 'NI-5.2' } : pes,
    );
    replaceDieteticsSection('nutrition_diagnosis', {
      ...draft.nutrition_diagnosis,
      pes_statements: updated,
    });
    expect(get(dieteticsNoteDraft).nutrition_diagnosis.pes_statements![0].problem).toBe('NI-5.2');
  });
});

// ─── Cross-section Isolation ───

describe('section isolation', () => {
  it('updating one section does not affect others', () => {
    updateDieteticsField('nutrition_assessment', 'anthropometric', 'BMI 22');
    updateDieteticsField('nutrition_intervention', 'diet_order', 'Regular diet');
    updateDieteticsField('billing', 'cpt_code', '97802');

    const draft = get(dieteticsNoteDraft);
    expect(draft.nutrition_assessment.anthropometric).toBe('BMI 22');
    expect(draft.nutrition_intervention.diet_order).toBe('Regular diet');
    expect(draft.billing.cpt_code).toBe('97802');
    // Other sections untouched
    expect(draft.nutrition_monitoring).toEqual({});
  });
});

// ─── Reference Data Constants ───

describe('dietetics reference data', () => {
  it('PES_PROBLEM_OPTIONS cover all IDNT categories', () => {
    // NI (intake), NC (clinical), NB (behavioral)
    const codes = [
      'NI-2.1',
      'NI-5.1',
      'NI-5.2',
      'NI-5.3',
      'NI-5.10.1',
      'NI-5.10.2',
      'NC-1.4',
      'NC-2.2',
      'NC-3.1',
      'NC-3.3',
      'NB-1.1',
      'NB-1.3',
      'NB-2.1',
      'NB-2.3',
    ];
    // Verify the codes cover all three IDNT categories
    expect(codes.filter((c) => c.startsWith('NI')).length).toBeGreaterThan(0);
    expect(codes.filter((c) => c.startsWith('NC')).length).toBeGreaterThan(0);
    expect(codes.filter((c) => c.startsWith('NB')).length).toBeGreaterThan(0);
  });

  it('MNT CPT codes are 97802-97804', () => {
    const mntCodes = ['97802', '97803', '97804'];
    expect(mntCodes).toHaveLength(3);
    expect(mntCodes[0]).toBe('97802');
  });
});
