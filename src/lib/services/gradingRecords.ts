/**
 * Grading records persistence — localStorage CRUD for faculty evaluation of student notes.
 * Follows the same pattern as chartRecords.ts.
 */
import { storage } from '$lib/storage';
import type {
  NoteGrade,
  GradeEntry,
  GradeStatus,
  RubricTemplate,
  CompetencyRecord,
} from '$lib/types/grading';

export type { NoteGrade, GradeEntry, GradeStatus, RubricTemplate, CompetencyRecord };

const GRADING_KEY = 'pt_emr_grading_v1';
const COUNTER_KEY = 'pt_emr_grading_counter_v1';

// ─── Internal storage shape ─────────────────────────────────────────────────

interface GradingStore {
  version: 1;
  grades: Record<string, NoteGrade>;
}

function getStore(): GradingStore {
  const raw = storage.getItem(GRADING_KEY);
  if (!raw) return { version: 1, grades: {} };
  try {
    const parsed = JSON.parse(raw) as GradingStore;
    return parsed?.version === 1 ? parsed : { version: 1, grades: {} };
  } catch {
    return { version: 1, grades: {} };
  }
}

function saveStore(store: GradingStore): void {
  storage.setItem(GRADING_KEY, JSON.stringify(store));
}

function nextId(): string {
  const raw = storage.getItem(COUNTER_KEY);
  const counter = raw ? parseInt(raw, 10) + 1 : 1;
  storage.setItem(COUNTER_KEY, String(counter));
  return `grade_${counter}`;
}

// ─── CRUD ───────────────────────────────────────────────────────────────────

export function createGrade(
  rubric: RubricTemplate,
  noteId: string,
  caseId: string,
  encounterId: string,
  studentId: string,
  gradedBy: string,
): NoteGrade {
  const grade: NoteGrade = {
    id: nextId(),
    rubricTemplateId: rubric.id,
    noteId,
    caseId,
    encounterId,
    studentId,
    grades: rubric.criteria.map((c) => ({ criterionId: c.id, score: 0, feedback: '' })),
    totalScore: 0,
    maxScore: rubric.maxScore,
    overallFeedback: '',
    gradedBy,
    gradedAt: new Date().toISOString(),
    status: 'draft',
  };
  const store = getStore();
  store.grades[grade.id] = grade;
  saveStore(store);
  return grade;
}

export function saveGrade(grade: NoteGrade): void {
  const store = getStore();
  store.grades[grade.id] = { ...grade, gradedAt: new Date().toISOString() };
  saveStore(store);
}

export function updateGradeEntry(gradeId: string, entry: GradeEntry): NoteGrade | null {
  const store = getStore();
  const grade = store.grades[gradeId];
  if (!grade) return null;
  const idx = grade.grades.findIndex((g) => g.criterionId === entry.criterionId);
  if (idx >= 0) {
    grade.grades[idx] = entry;
  } else {
    grade.grades.push(entry);
  }
  grade.totalScore = grade.grades.reduce((sum, g) => sum + g.score, 0);
  grade.gradedAt = new Date().toISOString();
  store.grades[gradeId] = grade;
  saveStore(store);
  return grade;
}

export function submitGrade(gradeId: string): NoteGrade | null {
  return updateGradeStatus(gradeId, 'submitted');
}

export function returnGrade(gradeId: string): NoteGrade | null {
  return updateGradeStatus(gradeId, 'returned');
}

function updateGradeStatus(gradeId: string, status: GradeStatus): NoteGrade | null {
  const store = getStore();
  const grade = store.grades[gradeId];
  if (!grade) return null;
  grade.status = status;
  grade.gradedAt = new Date().toISOString();
  store.grades[gradeId] = grade;
  saveStore(store);
  return grade;
}

export function getGrade(gradeId: string): NoteGrade | null {
  return getStore().grades[gradeId] ?? null;
}

export function getGradeForNote(noteId: string): NoteGrade | null {
  const store = getStore();
  return Object.values(store.grades).find((g) => g.noteId === noteId) ?? null;
}

export function listGradesForCase(caseId: string): NoteGrade[] {
  const store = getStore();
  return Object.values(store.grades)
    .filter((g) => g.caseId === caseId)
    .sort((a, b) => b.gradedAt.localeCompare(a.gradedAt));
}

export function listGradesForStudent(studentId: string): NoteGrade[] {
  const store = getStore();
  return Object.values(store.grades)
    .filter((g) => g.studentId === studentId)
    .sort((a, b) => b.gradedAt.localeCompare(a.gradedAt));
}

export function listGradesByRubric(rubricTemplateId: string): NoteGrade[] {
  const store = getStore();
  return Object.values(store.grades)
    .filter((g) => g.rubricTemplateId === rubricTemplateId)
    .sort((a, b) => b.gradedAt.localeCompare(a.gradedAt));
}

export function listAllGrades(): NoteGrade[] {
  const store = getStore();
  return Object.values(store.grades).sort((a, b) => b.gradedAt.localeCompare(a.gradedAt));
}

export function deleteGrade(gradeId: string): boolean {
  const store = getStore();
  if (!store.grades[gradeId]) return false;
  delete store.grades[gradeId];
  saveStore(store);
  return true;
}

// ─── Competency Aggregation ─────────────────────────────────────────────────

export function buildCompetencyRecord(
  studentId: string,
  discipline: string,
  rubric: RubricTemplate,
): CompetencyRecord {
  const grades = listGradesForStudent(studentId).filter(
    (g) => g.rubricTemplateId === rubric.id && g.status !== 'draft',
  );

  const categoryTotals: Record<string, { sum: number; count: number }> = {};
  const sectionTotals: Record<string, { sum: number; count: number }> = {};

  for (const grade of grades) {
    for (const entry of grade.grades) {
      const criterion = rubric.criteria.find((c) => c.id === entry.criterionId);
      if (!criterion) continue;
      const pct = criterion.maxPoints > 0 ? entry.score / criterion.maxPoints : 0;

      if (!categoryTotals[criterion.category]) {
        categoryTotals[criterion.category] = { sum: 0, count: 0 };
      }
      categoryTotals[criterion.category].sum += pct;
      categoryTotals[criterion.category].count += 1;

      if (!sectionTotals[criterion.sectionId]) {
        sectionTotals[criterion.sectionId] = { sum: 0, count: 0 };
      }
      sectionTotals[criterion.sectionId].sum += pct;
      sectionTotals[criterion.sectionId].count += 1;
    }
  }

  const averageByCategory: Record<string, number> = {};
  for (const [key, val] of Object.entries(categoryTotals)) {
    averageByCategory[key] = val.count > 0 ? val.sum / val.count : 0;
  }

  const averageBySection: Record<string, number> = {};
  for (const [key, val] of Object.entries(sectionTotals)) {
    averageBySection[key] = val.count > 0 ? val.sum / val.count : 0;
  }

  const overallAverage =
    grades.length > 0
      ? grades.reduce((sum, g) => sum + (g.maxScore > 0 ? g.totalScore / g.maxScore : 0), 0) /
        grades.length
      : 0;

  return {
    studentId,
    discipline,
    grades,
    averageByCategory,
    averageBySection,
    overallAverage,
    noteCount: grades.length,
  };
}
