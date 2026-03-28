/**
 * Default Dietetics NCP rubric — criteria mapped to dieteticsDisciplineConfig section/subsection IDs.
 *
 * Follows the Academy of Nutrition and Dietetics' Nutrition Care Process (NCP) model.
 * Criteria cover ADIME documentation quality, PES statement accuracy, and MNT billing.
 */
import type { RubricCriterion, RubricTemplate } from '$lib/types/grading';

const dieteticsNcpCriteria: RubricCriterion[] = [
  // ─── Nutrition Assessment ───────────────────────────────────────────────
  {
    id: 'diet-assess-domains',
    label: 'Assessment Domain Completeness',
    description:
      'All five ADIME assessment domains addressed: food/nutrition history, anthropometric, biochemical, nutrition-focused PE, client history.',
    maxPoints: 5,
    sectionId: 'nutrition-assessment',
    subsectionId: 'assessment-domains',
    category: 'Documentation Completeness',
  },
  {
    id: 'diet-assess-screening',
    label: 'Malnutrition Risk Screening',
    description:
      'Malnutrition risk level assigned with supporting evidence. Estimated energy and protein needs calculated.',
    maxPoints: 4,
    sectionId: 'nutrition-assessment',
    subsectionId: 'assessment-screening',
    category: 'Clinical Reasoning',
  },

  // ─── Nutrition Diagnosis ────────────────────────────────────────────────
  {
    id: 'diet-dx-pes',
    label: 'PES Statement Quality',
    description:
      'PES statements follow correct Problem-Etiology-Signs/Symptoms format. IDNT terminology used accurately.',
    maxPoints: 5,
    sectionId: 'nutrition-diagnosis',
    subsectionId: 'pes-statements',
    category: 'Clinical Reasoning',
  },
  {
    id: 'diet-dx-priority',
    label: 'Priority Diagnosis Identification',
    description:
      'Primary nutrition diagnosis clearly identified and justified based on assessment data.',
    maxPoints: 3,
    sectionId: 'nutrition-diagnosis',
    subsectionId: 'priority-dx',
    category: 'Clinical Reasoning',
  },
  {
    id: 'diet-dx-etiology',
    label: 'Etiology Specificity',
    description:
      'Etiological factors are specific, modifiable, and linked to intervention targets.',
    maxPoints: 4,
    sectionId: 'nutrition-diagnosis',
    subsectionId: 'pes-statements',
    category: 'Clinical Reasoning',
  },

  // ─── Nutrition Intervention ─────────────────────────────────────────────
  {
    id: 'diet-int-strategy',
    label: 'Intervention Strategy',
    description:
      'Intervention strategy aligns with nutrition diagnosis. IDNT intervention categories used correctly.',
    maxPoints: 4,
    sectionId: 'nutrition-intervention',
    subsectionId: 'intervention-plan',
    category: 'Plan of Care',
  },
  {
    id: 'diet-int-goals',
    label: 'Nutrition Goals',
    description:
      'Goals are measurable, time-bound, and address the identified nutrition diagnosis.',
    maxPoints: 4,
    sectionId: 'nutrition-intervention',
    subsectionId: 'intervention-plan',
    category: 'Plan of Care',
  },
  {
    id: 'diet-int-education',
    label: 'Education & Counseling',
    description:
      'Education topics are specific and appropriate. Counseling approach documented (e.g., motivational interviewing).',
    maxPoints: 3,
    sectionId: 'nutrition-intervention',
    subsectionId: 'intervention-education',
    category: 'Plan of Care',
  },
  {
    id: 'diet-int-coordination',
    label: 'Care Coordination',
    description: 'Interdisciplinary communication and referrals documented when appropriate.',
    maxPoints: 2,
    sectionId: 'nutrition-intervention',
    subsectionId: 'intervention-coordination',
    category: 'Documentation Completeness',
  },

  // ─── Nutrition Monitoring ───────────────────────────────────────────────
  {
    id: 'diet-mon-indicators',
    label: 'Monitoring Indicators',
    description:
      'Measurable indicators selected using IDNT codes. Evaluation criteria/benchmarks clearly stated.',
    maxPoints: 4,
    sectionId: 'nutrition-monitoring',
    subsectionId: 'monitoring-indicators',
    category: 'Evidence-Based Practice',
  },
  {
    id: 'diet-mon-outcomes',
    label: 'Outcome Documentation',
    description:
      'Outcomes compared to baseline. Progress toward intervention goals clearly documented.',
    maxPoints: 3,
    sectionId: 'nutrition-monitoring',
    subsectionId: 'monitoring-outcomes',
    category: 'Documentation Completeness',
  },
  {
    id: 'diet-mon-followup',
    label: 'Follow-Up Plan',
    description: 'Reassessment timeline, continued monitoring, and discharge criteria documented.',
    maxPoints: 3,
    sectionId: 'nutrition-monitoring',
    subsectionId: 'monitoring-followup',
    category: 'Plan of Care',
  },

  // ─── Billing ────────────────────────────────────────────────────────────
  {
    id: 'diet-bill-codes',
    label: 'MNT Billing Codes',
    description:
      'CPT codes, units, and time are accurate for MNT services. Diagnosis codes support medical necessity.',
    maxPoints: 3,
    sectionId: 'billing',
    subsectionId: 'billing-codes',
    category: 'Billing & Compliance',
  },
  {
    id: 'diet-bill-justification',
    label: 'Medical Necessity Justification',
    description: 'Clinical justification clearly links nutrition diagnosis to billable services.',
    maxPoints: 3,
    sectionId: 'billing',
    subsectionId: 'billing-justification',
    category: 'Billing & Compliance',
  },
];

const totalMaxScore = dieteticsNcpCriteria.reduce((sum, c) => sum + c.maxPoints, 0);

export const dieteticsNcpRubric: RubricTemplate = {
  id: 'dietetics-ncp-default-v1',
  name: 'Dietetics Nutrition Care Process — Default Rubric',
  discipline: 'dietetics',
  encounterType: 'nutrition',
  criteria: dieteticsNcpCriteria,
  maxScore: totalMaxScore,
  createdBy: 'system',
  createdAt: '2026-01-01T00:00:00.000Z',
};

/** All built-in Dietetics rubric templates. */
export const dieteticsRubricTemplates: RubricTemplate[] = [dieteticsNcpRubric];

/** Look up a Dietetics rubric by encounter type. */
export function getDieteticsRubric(encounterType: string): RubricTemplate | null {
  return dieteticsRubricTemplates.find((r) => r.encounterType === encounterType) ?? null;
}
