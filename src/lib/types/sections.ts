/**
 * Typed section interfaces for PT SOAP note drafts.
 *
 * These replace `Record<string, unknown>` throughout the draft pipeline,
 * giving compile-time safety to components, stores, services, and tests.
 *
 * Each interface mirrors exactly what the corresponding SOAP section
 * component reads and writes via `updateField()` / `updateSection()`.
 */

// ─── Subjective ─────────────────────────────────────────────────────────────

export interface QAPair {
  question: string;
  response: string;
}

export type RedFlagStatus = 'not-screened' | 'denied' | 'present';

export interface RedFlagItem {
  id: string;
  item: string;
  status: RedFlagStatus;
  note: string;
}

import type { AlertCategory } from '$lib/config/medicationDb';
import type { AssessmentInstance } from '$lib/config/standardizedAssessments';

export interface MedicationRecord {
  name: string;
  dose: string;
  frequency: string;
  class: string;
  alerts: AlertCategory[];
  custom?: boolean;
}

export interface SubjectiveData {
  // Patient profile / demographics
  patientName?: string;
  patientBirthday?: string;
  patientAge?: string;
  patientGender?: string;
  patientGenderIdentityPronouns?: string;
  patientPreferredLanguage?: string;
  patientInterpreterNeeded?: string;
  patientHeightFt?: string;
  patientHeightIn?: string;
  patientHeightCm?: string;
  patientWeight?: string;
  patientWeightKg?: string;
  patientBmi?: string;
  patientMeasurementUnit?: 'imperial' | 'metric';
  patientWorkStatusOccupation?: string;
  patientLivingSituationHomeEnvironment?: string;
  patientSocialSupport?: string;
  patientDemographics?: string;

  // History
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  functionalLimitations?: string;
  priorLevel?: string;
  patientGoals?: string;
  additionalHistory?: string;

  // Pain assessment
  painLocation?: string;
  painScale?: number | string;
  painQuality?: string;
  painPattern?: string;
  aggravatingFactors?: string;
  easingFactors?: string;

  // Red flags & screening
  redFlags?: string;
  redFlagScreening?: RedFlagItem[];

  // Question & answer pairs
  qaItems?: QAPair[];

  // Medications
  medications?: MedicationRecord[];
}

// ─── Objective ──────────────────────────────────────────────────────────────

export interface VitalsData {
  bp?: string;
  hr?: string;
  rr?: string;
  temp?: string;
  o2sat?: string;
  pain?: string;
  heightFt?: string;
  heightIn?: string;
  weightLbs?: string;
  bmi?: string;
}

/** Individual vital-sign fields for a single measurement point. */
export interface VitalsRecord {
  bpSystolic?: string;
  bpDiastolic?: string;
  hr?: string;
  rr?: string;
  spo2?: string;
  temperature?: string;
  pain?: string;
}

/** A single time-stamped set of vitals (one column in the flowsheet). */
export interface VitalsEntry {
  id: string;
  label: string;
  time: string;
  vitals: VitalsRecord;
}

export interface SpecialTest {
  left: string;
  right: string;
  notes: string;
}

export interface CustomMmtRow {
  id: string;
  name: string;
}

export interface RegionalAssessments {
  selectedRegions?: string[];
  arom?: Record<string, string>;
  prom?: Record<string, string>;
  rims?: Record<string, string>;
  mmt?: Record<string, string>;
  specialTests?: Record<string, string>;
  /** User-added MMT muscle rows per region */
  mmtCustomRows?: Record<string, CustomMmtRow[]>;
}

import type { SystemsReviewData } from '$lib/config/systemsReview';

export interface ObjectiveData {
  vitals?: VitalsData;

  // Multi-measurement vitals flowsheet
  vitalsSeries?: VitalsEntry[];
  vitalsActiveId?: string;

  // Systems Review (APTA cascade)
  systemsReview?: SystemsReviewData;

  // General observation / systems review (legacy + detail fields)
  text?: string;
  inspection?: { visual?: string };
  palpation?: { findings?: string };

  // Communication / cognition
  orientation?: string;
  memoryAttention?: string;
  safetyAwareness?: string;
  visionPerception?: string;

  // Cardiovascular / pulmonary
  auscultation?: string;
  edema?: string;
  endurance?: string;

  // Integumentary
  skinIntegrity?: string;
  colorTemp?: string;

  // Musculoskeletal (regional picker)
  regionalAssessments?: RegionalAssessments;

  // Neuromuscular
  neuro?: { screening?: string };
  neuroscreenData?: {
    selectedRegions?: string[];
    dermatome?: Record<string, string>;
    myotome?: Record<string, string>;
    reflex?: Record<string, string>;
  };
  tone?: string;
  coordination?: string;
  balance?: string;
  functional?: { assessment?: string };

  // Standardized functional assessments
  standardizedAssessments?: AssessmentInstance[];

  // Treatment performed
  treatmentPerformed?: string;
}

// ─── Assessment ─────────────────────────────────────────────────────────────

export interface AssessmentData {
  primaryImpairments?: string;
  bodyFunctions?: string;
  activityLimitations?: string;
  participationRestrictions?: string;
  ptDiagnosis?: string;
  prognosis?: string;
  prognosticFactors?: string;
  clinicalReasoning?: string;
}

// ─── Plan ───────────────────────────────────────────────────────────────────

export interface PlanGoal {
  goal: string;
  timeframe: string;
  icfDomain: string;
}

export interface PlanIntervention {
  intervention: string;
  dosage: string;
}

export interface PlanData {
  frequency?: string;
  duration?: string;
  goals?: PlanGoal[];
  inClinicInterventions?: PlanIntervention[];
  hepInterventions?: PlanIntervention[];
  patientEducation?: string;

  // Treatment narrative fields
  treatmentPlan?: string;
  exerciseFocus?: string;
  exercisePrescription?: string;
  manualTherapy?: string;
  modalities?: string[];
}

// ─── Billing ────────────────────────────────────────────────────────────────

export interface DiagnosisCode {
  code: string;
  description: string;
  label: string;
  isPrimary: boolean;
}

export interface BillingCode {
  code: string;
  description: string;
  label: string;
  units: number;
  timeSpent: string;
  linkedDiagnosisCode: string;
}

export interface OrderEntry {
  type: 'Order' | 'Referral' | 'Imaging' | 'Lab' | 'Other';
  description: string;
  linkedDiagnosisCode: string;
}

export interface BillingData {
  diagnosisCodes?: DiagnosisCode[];
  billingCodes?: BillingCode[];
  /** May be an array of OrderEntry or a legacy plain string. */
  ordersReferrals?: OrderEntry[] | string;
}

// ─── Dietetics — Nutrition Care Process (NCP / ADIME) ───────────────────────

export interface NutritionAssessmentData {
  food_nutrition_history?: string;
  anthropometric?: string;
  biochemical?: string;
  nutrition_focused_pe?: string;
  client_history?: string;
  malnutrition_risk?: string;
  estimated_needs?: string;
}

export interface PesStatement {
  problem: string;
  etiology: string;
  signs_symptoms: string;
}

export interface NutritionDiagnosisData {
  pes_statements?: PesStatement[];
  priority_diagnosis?: string;
}

export interface NutritionInterventionData {
  strategy?: string;
  diet_order?: string;
  goals?: string;
  education_topics?: string;
  counseling_notes?: string;
  coordination?: string;
}

export interface NutritionMonitoringData {
  indicators?: string;
  criteria?: string;
  outcomes?: string;
  follow_up_plan?: string;
}

export interface DieteticsBillingData {
  cpt_code?: string;
  units?: string;
  time_minutes?: string;
  diagnosis_codes?: string;
  justification?: string;
}

export interface DieteticsNoteDraft {
  nutrition_assessment: NutritionAssessmentData;
  nutrition_diagnosis: NutritionDiagnosisData;
  nutrition_intervention: NutritionInterventionData;
  nutrition_monitoring: NutritionMonitoringData;
  billing: DieteticsBillingData;
}

// ─── Aggregate ──────────────────────────────────────────────────────────────

/**
 * Fully typed note draft, replacing the old
 * `{ subjective: Record<string, unknown>; ... }` shape.
 */
export interface TypedNoteDraft {
  subjective: SubjectiveData;
  objective: ObjectiveData;
  assessment: AssessmentData;
  plan: PlanData;
  billing: BillingData;
}
