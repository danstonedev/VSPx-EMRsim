/**
 * Grading records store — reactive wrapper around gradingRecords service.
 * Follows the same pattern as stores/chartRecords.ts.
 */
import { writable, derived } from 'svelte/store';
import {
  listAllGrades,
  getGradeForNote,
  listGradesForCase,
  listGradesForStudent,
  type NoteGrade,
} from '$lib/services/gradingRecords';

const gradingState = writable<NoteGrade[]>(listAllGrades());

export const allGrades = {
  subscribe: gradingState.subscribe,
};

export function refreshGrades(): NoteGrade[] {
  const next = listAllGrades();
  gradingState.set(next);
  return next;
}

export function gradeForNote(noteId: string): NoteGrade | null {
  return getGradeForNote(noteId);
}

export function gradesForCase(caseId: string): NoteGrade[] {
  return listGradesForCase(caseId);
}

export function gradesForStudent(studentId: string): NoteGrade[] {
  return listGradesForStudent(studentId);
}

/** Derived store that provides a quick lookup map from noteId → grade status */
export const gradeStatusMap = derived(gradingState, ($grades) => {
  const map = new Map<
    string,
    { status: NoteGrade['status']; totalScore: number; maxScore: number }
  >();
  for (const grade of $grades) {
    map.set(grade.noteId, {
      status: grade.status,
      totalScore: grade.totalScore,
      maxScore: grade.maxScore,
    });
  }
  return map;
});
