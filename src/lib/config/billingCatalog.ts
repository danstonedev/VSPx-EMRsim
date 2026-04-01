/**
 * Discipline-keyed billing code registry.
 *
 * Wraps discipline-specific code lists (CPT, ICD-10) into a unified lookup
 * so BillingSection can be parameterized by discipline without hardcoding
 * which code list to use.
 *
 * New disciplines: add their code arrays and wire into the catalogs below.
 */

import type { DisciplineId } from '$lib/stores/auth';
import type { CPTCode, ICD10Code } from './ptCodes';
import { PT_CPT_CODES, PT_ICD10_CODES, scoreCPTCode, scoreICD10Code } from './ptCodes';
import { OT_CPT_CODES, OT_ICD10_CODES, scoreOTCPT, scoreOTICD10 } from './otCodes';
import { SLP_CPT_CODES, SLP_ICD10_CODES, scoreSLPCPT, scoreSLPICD10 } from './slpCodes';
import {
  NURSING_CPT_CODES,
  NURSING_ICD10_CODES,
  scoreNursingCPT,
  scoreNursingICD10,
} from './nursingCodes';
import {
  DIETETICS_CPT_CODES,
  DIETETICS_ICD10_CODES,
  scoreDieteticsCPT,
  scoreDieteticsICD10,
} from './dieteticsCodes';

export interface BillingCodeSet {
  cptCodes: CPTCode[];
  icd10Codes: ICD10Code[];
  scoreCPT: (item: CPTCode, query: string) => number;
  scoreICD10: (item: ICD10Code, query: string) => number;
}

/** Master billing code registry keyed by discipline. */
export const BILLING_CATALOG: Record<DisciplineId, BillingCodeSet> = {
  pt: {
    cptCodes: PT_CPT_CODES,
    icd10Codes: PT_ICD10_CODES,
    scoreCPT: scoreCPTCode,
    scoreICD10: scoreICD10Code,
  },
  ot: {
    cptCodes: OT_CPT_CODES,
    icd10Codes: OT_ICD10_CODES,
    scoreCPT: scoreOTCPT,
    scoreICD10: scoreOTICD10,
  },
  slp: {
    cptCodes: SLP_CPT_CODES,
    icd10Codes: SLP_ICD10_CODES,
    scoreCPT: scoreSLPCPT,
    scoreICD10: scoreSLPICD10,
  },
  nursing: {
    cptCodes: NURSING_CPT_CODES,
    icd10Codes: NURSING_ICD10_CODES,
    scoreCPT: scoreNursingCPT,
    scoreICD10: scoreNursingICD10,
  },
  dietetics: {
    cptCodes: DIETETICS_CPT_CODES,
    icd10Codes: DIETETICS_ICD10_CODES,
    scoreCPT: scoreDieteticsCPT,
    scoreICD10: scoreDieteticsICD10,
  },
};

/** Get billing code set for a discipline. */
export function getBillingCodes(discipline: DisciplineId): BillingCodeSet {
  return BILLING_CATALOG[discipline];
}
