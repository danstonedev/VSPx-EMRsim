import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '$lib/storage';
import {
  createGrade,
  saveGrade,
  updateGradeEntry,
  submitGrade,
  returnGrade,
  getGrade,
  getGradeForNote,
  listGradesForCase,
  listGradesForStudent,
  listGradesByRubric,
  listAllGrades,
  deleteGrade,
  buildCompetencyRecord,
} from '$lib/services/gradingRecords';
import { ptEvalRubric } from '$lib/config/ptRubricConfig';
import { dieteticsNcpRubric } from '$lib/config/dieteticsRubricConfig';
import {
  getEncounterTemplate,
  getEncounterTemplateByType,
  listEncounterTemplates,
} from '$lib/config/encounterTemplates';

beforeEach(() => {
  storage.removeItem('pt_emr_grading_v1');
  storage.removeItem('pt_emr_grading_counter_v1');
});

// ─── Rubric Configs ─────────────────────────────────────────────────────────

describe('PT rubric config', () => {
  it('has a valid rubric with 22 criteria', () => {
    expect(ptEvalRubric.criteria.length).toBe(22);
    expect(ptEvalRubric.discipline).toBe('pt');
    expect(ptEvalRubric.encounterType).toBe('eval');
  });

  it('maxScore equals sum of all criteria maxPoints', () => {
    const sum = ptEvalRubric.criteria.reduce((s, c) => s + c.maxPoints, 0);
    expect(ptEvalRubric.maxScore).toBe(sum);
  });

  it('every criterion has required fields', () => {
    for (const c of ptEvalRubric.criteria) {
      expect(c.id).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.maxPoints).toBeGreaterThan(0);
      expect(c.sectionId).toBeTruthy();
      expect(c.category).toBeTruthy();
    }
  });

  it('covers all PT SOAP sections', () => {
    const sections = new Set(ptEvalRubric.criteria.map((c) => c.sectionId));
    expect(sections).toContain('subjective');
    expect(sections).toContain('objective');
    expect(sections).toContain('assessment');
    expect(sections).toContain('plan');
    expect(sections).toContain('billing');
  });
});

describe('Dietetics rubric config', () => {
  it('has a valid rubric with 14 criteria', () => {
    expect(dieteticsNcpRubric.criteria.length).toBe(14);
    expect(dieteticsNcpRubric.discipline).toBe('dietetics');
    expect(dieteticsNcpRubric.encounterType).toBe('nutrition');
  });

  it('maxScore equals sum of all criteria maxPoints', () => {
    const sum = dieteticsNcpRubric.criteria.reduce((s, c) => s + c.maxPoints, 0);
    expect(dieteticsNcpRubric.maxScore).toBe(sum);
  });

  it('covers all ADIME sections', () => {
    const sections = new Set(dieteticsNcpRubric.criteria.map((c) => c.sectionId));
    expect(sections).toContain('nutrition-assessment');
    expect(sections).toContain('nutrition-diagnosis');
    expect(sections).toContain('nutrition-intervention');
    expect(sections).toContain('nutrition-monitoring');
    expect(sections).toContain('billing');
  });
});

// ─── Grading CRUD ───────────────────────────────────────────────────────────

describe('grading records CRUD', () => {
  it('createGrade returns a grade with all required fields', () => {
    const grade = createGrade(ptEvalRubric, 'note_1', 'case_1', 'enc_1', 'student_1', 'faculty_1');
    expect(grade.id).toBeTruthy();
    expect(grade.noteId).toBe('note_1');
    expect(grade.caseId).toBe('case_1');
    expect(grade.studentId).toBe('student_1');
    expect(grade.gradedBy).toBe('faculty_1');
    expect(grade.status).toBe('draft');
    expect(grade.totalScore).toBe(0);
    expect(grade.maxScore).toBe(ptEvalRubric.maxScore);
    expect(grade.grades.length).toBe(ptEvalRubric.criteria.length);
  });

  it('getGrade retrieves a saved grade', () => {
    const grade = createGrade(ptEvalRubric, 'note_1', 'case_1', 'enc_1', 'student_1', 'faculty_1');
    const fetched = getGrade(grade.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(grade.id);
  });

  it('getGrade returns null for nonexistent grade', () => {
    expect(getGrade('nonexistent')).toBeNull();
  });

  it('getGradeForNote finds grade by noteId', () => {
    createGrade(ptEvalRubric, 'note_42', 'case_1', 'enc_1', 'student_1', 'faculty_1');
    const found = getGradeForNote('note_42');
    expect(found).not.toBeNull();
    expect(found!.noteId).toBe('note_42');
  });

  it('getGradeForNote returns null when not found', () => {
    expect(getGradeForNote('nonexistent')).toBeNull();
  });

  it('saveGrade persists updates', () => {
    const grade = createGrade(ptEvalRubric, 'note_1', 'case_1', 'enc_1', 'student_1', 'faculty_1');
    grade.overallFeedback = 'Good work';
    grade.totalScore = 50;
    saveGrade(grade);
    const fetched = getGrade(grade.id);
    expect(fetched!.overallFeedback).toBe('Good work');
    expect(fetched!.totalScore).toBe(50);
  });

  it('updateGradeEntry updates a specific criterion score', () => {
    const grade = createGrade(ptEvalRubric, 'note_1', 'case_1', 'enc_1', 'student_1', 'faculty_1');
    const criterionId = ptEvalRubric.criteria[0].id;
    const updated = updateGradeEntry(grade.id, {
      criterionId,
      score: 3,
      feedback: 'Solid chief complaint',
    });
    expect(updated).not.toBeNull();
    const entry = updated!.grades.find((g) => g.criterionId === criterionId);
    expect(entry!.score).toBe(3);
    expect(entry!.feedback).toBe('Solid chief complaint');
    expect(updated!.totalScore).toBe(3);
  });

  it('updateGradeEntry returns null for nonexistent grade', () => {
    expect(
      updateGradeEntry('nonexistent', { criterionId: 'x', score: 1, feedback: '' }),
    ).toBeNull();
  });

  it('deleteGrade removes a grade', () => {
    const grade = createGrade(ptEvalRubric, 'note_1', 'case_1', 'enc_1', 'student_1', 'faculty_1');
    expect(deleteGrade(grade.id)).toBe(true);
    expect(getGrade(grade.id)).toBeNull();
  });

  it('deleteGrade returns false for nonexistent grade', () => {
    expect(deleteGrade('nonexistent')).toBe(false);
  });
});

// ─── Grade Lifecycle ────────────────────────────────────────────────────────

describe('grade lifecycle (draft → submitted → returned)', () => {
  it('submitGrade changes status to submitted', () => {
    const grade = createGrade(ptEvalRubric, 'note_1', 'case_1', 'enc_1', 'student_1', 'faculty_1');
    const submitted = submitGrade(grade.id);
    expect(submitted!.status).toBe('submitted');
  });

  it('returnGrade changes status to returned', () => {
    const grade = createGrade(ptEvalRubric, 'note_1', 'case_1', 'enc_1', 'student_1', 'faculty_1');
    submitGrade(grade.id);
    const returned = returnGrade(grade.id);
    expect(returned!.status).toBe('returned');
  });

  it('submitGrade returns null for nonexistent grade', () => {
    expect(submitGrade('nonexistent')).toBeNull();
  });
});

// ─── List / Filter ──────────────────────────────────────────────────────────

describe('grade listing and filtering', () => {
  it('listGradesForCase returns grades for a specific case', () => {
    createGrade(ptEvalRubric, 'note_1', 'case_A', 'enc_1', 'student_1', 'faculty_1');
    createGrade(ptEvalRubric, 'note_2', 'case_B', 'enc_2', 'student_1', 'faculty_1');
    createGrade(ptEvalRubric, 'note_3', 'case_A', 'enc_3', 'student_2', 'faculty_1');
    expect(listGradesForCase('case_A').length).toBe(2);
    expect(listGradesForCase('case_B').length).toBe(1);
  });

  it('listGradesForStudent returns grades for a specific student', () => {
    createGrade(ptEvalRubric, 'note_1', 'case_1', 'enc_1', 'student_X', 'faculty_1');
    createGrade(ptEvalRubric, 'note_2', 'case_2', 'enc_2', 'student_Y', 'faculty_1');
    expect(listGradesForStudent('student_X').length).toBe(1);
    expect(listGradesForStudent('student_Y').length).toBe(1);
  });

  it('listGradesByRubric returns grades for a specific rubric', () => {
    createGrade(ptEvalRubric, 'note_1', 'case_1', 'enc_1', 'student_1', 'faculty_1');
    createGrade(dieteticsNcpRubric, 'note_2', 'case_2', 'enc_2', 'student_1', 'faculty_1');
    expect(listGradesByRubric(ptEvalRubric.id).length).toBe(1);
    expect(listGradesByRubric(dieteticsNcpRubric.id).length).toBe(1);
  });

  it('listAllGrades returns all grades', () => {
    createGrade(ptEvalRubric, 'note_1', 'case_1', 'enc_1', 'student_1', 'faculty_1');
    createGrade(ptEvalRubric, 'note_2', 'case_2', 'enc_2', 'student_2', 'faculty_1');
    expect(listAllGrades().length).toBe(2);
  });

  it('listAllGrades returns empty array when no grades exist', () => {
    expect(listAllGrades().length).toBe(0);
  });
});

// ─── Competency Aggregation ─────────────────────────────────────────────────

describe('competency record building', () => {
  it('builds a competency record with correct averages', () => {
    const grade = createGrade(ptEvalRubric, 'note_1', 'case_1', 'enc_1', 'student_1', 'faculty_1');
    // Score all criteria at 50% of max
    for (const criterion of ptEvalRubric.criteria) {
      updateGradeEntry(grade.id, {
        criterionId: criterion.id,
        score: Math.floor(criterion.maxPoints / 2),
        feedback: '',
      });
    }
    submitGrade(grade.id);

    const record = buildCompetencyRecord('student_1', 'pt', ptEvalRubric);
    expect(record.noteCount).toBe(1);
    expect(record.overallAverage).toBeGreaterThan(0);
    expect(record.overallAverage).toBeLessThanOrEqual(1);
    expect(Object.keys(record.averageByCategory).length).toBeGreaterThan(0);
    expect(Object.keys(record.averageBySection).length).toBeGreaterThan(0);
  });

  it('returns zero averages for student with no grades', () => {
    const record = buildCompetencyRecord('nobody', 'pt', ptEvalRubric);
    expect(record.noteCount).toBe(0);
    expect(record.overallAverage).toBe(0);
    expect(Object.keys(record.averageByCategory).length).toBe(0);
  });

  it('excludes draft grades from competency aggregation', () => {
    createGrade(ptEvalRubric, 'note_1', 'case_1', 'enc_1', 'student_1', 'faculty_1');
    const record = buildCompetencyRecord('student_1', 'pt', ptEvalRubric);
    expect(record.noteCount).toBe(0);
  });
});

// ─── Encounter Templates ────────────────────────────────────────────────────

describe('encounter templates', () => {
  it('getEncounterTemplate finds PT eval template', () => {
    const tmpl = getEncounterTemplate('pt-eval');
    expect(tmpl).not.toBeNull();
    expect(tmpl!.discipline).toBe('pt');
    expect(tmpl!.encounterType).toBe('eval');
    expect(tmpl!.visibleSections.length).toBe(5);
  });

  it('getEncounterTemplate returns null for unknown template', () => {
    expect(getEncounterTemplate('nonexistent')).toBeNull();
  });

  it('getEncounterTemplateByType finds by discipline + encounter', () => {
    const tmpl = getEncounterTemplateByType('pt', 'followup');
    expect(tmpl).not.toBeNull();
    expect(tmpl!.id).toBe('pt-followup');
  });

  it('PT followup has fewer visible subsections than eval', () => {
    const evalTmpl = getEncounterTemplate('pt-eval')!;
    const followupTmpl = getEncounterTemplate('pt-followup')!;
    const evalSubCount = Object.values(evalTmpl.visibleSubsections).flat().length;
    const followupSubCount = Object.values(followupTmpl.visibleSubsections).flat().length;
    expect(followupSubCount).toBeLessThan(evalSubCount);
  });

  it('PT discharge template excludes billing', () => {
    const tmpl = getEncounterTemplate('pt-discharge')!;
    expect(tmpl.visibleSections).not.toContain('billing');
  });

  it('listEncounterTemplates returns all templates', () => {
    const all = listEncounterTemplates();
    expect(all.length).toBeGreaterThanOrEqual(5);
  });

  it('listEncounterTemplates filters by discipline', () => {
    const ptTemplates = listEncounterTemplates('pt');
    expect(ptTemplates.every((t) => t.discipline === 'pt')).toBe(true);
    expect(ptTemplates.length).toBeGreaterThanOrEqual(4);
  });

  it('Dietetics NCP template has all ADIME sections', () => {
    const tmpl = getEncounterTemplate('dietetics-ncp')!;
    expect(tmpl.visibleSections).toContain('nutrition-assessment');
    expect(tmpl.visibleSections).toContain('nutrition-diagnosis');
    expect(tmpl.visibleSections).toContain('nutrition-intervention');
    expect(tmpl.visibleSections).toContain('nutrition-monitoring');
  });
});
