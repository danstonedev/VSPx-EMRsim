/**
 * Typed interfaces for the grading and competency rubric system.
 *
 * Rubric templates define per-discipline, per-encounter scoring criteria.
 * NoteGrade records capture faculty evaluation of student notes.
 * CompetencyRecord aggregates grades for longitudinal tracking.
 */

// ─── Rubric Definitions ─────────────────────────────────────────────────────

export interface RubricCriterion {
  id: string;
  label: string;
  description: string;
  maxPoints: number;
  /** Which SOAP/ADIME section this criterion evaluates */
  sectionId: string;
  /** Optional subsection for finer-grained mapping */
  subsectionId?: string;
  /** Grouping category for display (e.g., "Documentation Quality", "Clinical Reasoning") */
  category: string;
}

export interface RubricTemplate {
  id: string;
  name: string;
  discipline: 'pt' | 'dietetics';
  encounterType: string;
  criteria: RubricCriterion[];
  /** Maximum total score (sum of all criteria maxPoints) */
  maxScore: number;
  createdBy: string;
  createdAt: string;
}

// ─── Grading Records ────────────────────────────────────────────────────────

export interface GradeEntry {
  criterionId: string;
  score: number;
  feedback: string;
}

export type GradeStatus = 'draft' | 'submitted' | 'returned';

export interface NoteGrade {
  id: string;
  rubricTemplateId: string;
  noteId: string;
  caseId: string;
  encounterId: string;
  studentId: string;
  grades: GradeEntry[];
  totalScore: number;
  maxScore: number;
  overallFeedback: string;
  gradedBy: string;
  gradedAt: string;
  status: GradeStatus;
}

// ─── Competency Aggregation ─────────────────────────────────────────────────

export interface CompetencyRecord {
  studentId: string;
  discipline: string;
  grades: NoteGrade[];
  averageByCategory: Record<string, number>;
  averageBySection: Record<string, number>;
  overallAverage: number;
  noteCount: number;
}
