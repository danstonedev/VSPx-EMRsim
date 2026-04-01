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
  patientAllergies?: string;
  __vspId?: string;

  // History
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  onset?: string;
  mechanism?: string;
  functionalLimitations?: string;
  functionalLimitationChecklist?: string[];
  priorLevel?: string;
  patientGoals?: string;
  additionalHistory?: string; // legacy combined field
  pastMedicalHistory?: string;
  surgicalHistory?: string;
  socialHistory?: string;

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
  bpPosition?: string;
  hr?: string;
  rr?: string;
  spo2?: string;
  o2Source?: string;
  o2Rate?: string;
  temperature?: string;
  pain?: string;
  rpe?: string;
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
  endFeel?: Record<string, string>;
  mmt?: Record<string, string>;
  specialTests?: Record<string, string>;
  /** User-added MMT muscle rows per region */
  mmtCustomRows?: Record<string, CustomMmtRow[]>;
}

import type { SystemsReviewData } from '$lib/config/systemsReview';

export type OrientationStatus = '' | 'intact' | 'impaired' | 'unable';

export interface OrientationData {
  person: OrientationStatus;
  place: OrientationStatus;
  time: OrientationStatus;
  situation: OrientationStatus;
  notes: string;
}

export interface EdemaEntry {
  id: string;
  location: string;
  locationOther: string;
  grade: string;
  type: string;
  circumference: string;
  landmark: string;
  notes: string;
}

export interface InterventionEntry {
  id: string;
  category: string;
  type: string;
  description: string;
  sets: string;
  reps: string;
  duration: string;
  intensity: string;
  timeMinutes: string;
  patientResponse: string;
  notes: string;
}

export interface LungAuscultationData {
  rightUpper?: string;
  rightLower?: string;
  leftUpper?: string;
  leftLower?: string;
  notes?: string;
}

export interface RespiratoryPatternData {
  pattern?: string;
  accessoryMuscleUse?: string;
  coughStrength?: string;
  coughProductivity?: string;
  notes?: string;
}

export interface PostureFinding {
  present: boolean;
  severity: '' | 'mild' | 'moderate' | 'marked';
  notes: string;
}

export interface PostureData {
  anterior?: Record<string, PostureFinding>;
  posterior?: Record<string, PostureFinding>;
  lateral?: Record<string, PostureFinding>;
  notes?: string;
}

export interface ToneEntry {
  id: string;
  muscleGroup: string;
  side: string;
  masGrade: string;
  notes: string;
}

export interface GaitDeviationFinding {
  present: boolean;
  side: '' | 'L' | 'R' | 'bilateral';
}

export interface GaitAssessmentData {
  assistiveDevice?: string;
  assistanceLevel?: string;
  surface?: string;
  distance?: string;
  distanceUnit?: string;
  duration?: string;
  gaitSpeed?: string;
  deviations?: Record<string, GaitDeviationFinding>;
  notes?: string;
}

export interface FunctionalMobilityEntry {
  id: string;
  activity: string;
  assistanceLevel: string;
  cues: string;
  device: string;
  notes: string;
}

export interface WoundEntry {
  id: string;
  location: string;
  type: string;
  stage: string;
  length: string;
  width: string;
  depth: string;
  undermining: string;
  tunneling: string;
  woundBedGranulation: string;
  woundBedSlough: string;
  woundBedEschar: string;
  woundBedEpithelial: string;
  exudateAmount: string;
  exudateType: string;
  odor: string;
  periwound: string;
  woundEdges: string;
  notes: string;
}

export interface PalpationFinding {
  id: string;
  location: string;
  finding: string;
  notes: string;
}

export interface ProprioceptionEntry {
  id: string;
  joint: string;
  side: string;
  status: string;
  method: string;
}

export interface SensationEntry {
  id: string;
  modality: string;
  location: string;
  status: string;
  notes: string;
}

export interface CircumferentialEntry {
  id: string;
  location: string;
  locationOther: string;
  side: string;
  measurement: string;
  landmark: string;
}

export interface ObjectiveData {
  vitals?: VitalsData;

  // Multi-measurement vitals flowsheet
  vitalsSeries?: VitalsEntry[];
  vitalsActiveId?: string;

  // Systems Review (APTA cascade)
  systemsReview?: SystemsReviewData;

  // Observation / inspection / palpation
  observation?: string;
  text?: string;
  inspection?: { visual?: string };
  palpation?: { findings?: string };
  palpationFindings?: PalpationFinding[];

  // Communication / cognition
  arousalLevel?: string;
  orientation?: string | OrientationData;
  hearingStatus?: string;
  speechStatus?: string;
  memoryAttention?: string;
  safetyAwareness?: string;
  visionPerception?: string;

  // Cardiovascular / pulmonary
  auscultation?: string;
  heartSounds?: string;
  lungAuscultation?: LungAuscultationData;
  respiratoryPattern?: RespiratoryPatternData;
  edema?: string;
  edemaAssessments?: EdemaEntry[];
  circumferentialMeasurements?: CircumferentialEntry[];
  endurance?: string;

  // Integumentary
  skinIntegrity?: string;
  woundAssessments?: WoundEntry[];
  colorTemp?: string;

  // Musculoskeletal (regional picker + posture)
  postureAssessment?: PostureData;
  regionalAssessments?: RegionalAssessments;

  // Neuromuscular
  neuro?: { screening?: string; cranialNerves?: string };
  neuroscreenData?: {
    selectedRegions?: string[];
    dermatome?: Record<string, string>;
    myotome?: Record<string, string>;
    reflex?: Record<string, string>;
  };
  tone?: string;
  toneAssessments?: ToneEntry[];
  coordination?: string;
  balance?: string;
  functional?: { assessment?: string };
  gaitAssessment?: GaitAssessmentData;
  functionalMobility?: FunctionalMobilityEntry[];
  proprioception?: ProprioceptionEntry[];
  sensationAdvanced?: SensationEntry[];

  // Standardized functional assessments
  standardizedAssessments?: AssessmentInstance[];

  // Treatment performed
  treatmentPerformed?: string;
  interventions?: InterventionEntry[];
}

// ─── Assessment ─────────────────────────────────────────────────────────────

export interface ImpairmentEntry {
  id: string;
  bodyRegion: string;
  impairmentType: string;
  severity: string;
  notes: string;
}

export interface AssessmentData {
  primaryImpairments?: string;
  impairmentEntries?: ImpairmentEntry[];
  bodyFunctions?: string;
  activityLimitations?: string;
  participationRestrictions?: string;
  movementSystemDiagnosis?: string;
  ptDiagnosis?: string;
  prognosis?: string;
  positivePrognosticFactors?: string[];
  negativePrognosticFactors?: string[];
  prognosticFactors?: string;
  tissueIrritability?: string;
  stageOfHealing?: string;
  clinicalReasoning?: string;
}

// ─── Plan ───────────────────────────────────────────────────────────────────

export interface PlanGoal {
  goal: string;
  timeframe: string;
  icfDomain: string;
  goalType?: string; // stg | ltg
  status?: string; // not-started | in-progress | met | not-met | modified
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
  educationTopics?: string[];

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
  modifier?: string;
  linkedDiagnosisCode: string;
}

export type OrderType =
  | 'Order'
  | 'Referral'
  | 'Imaging'
  | 'Lab'
  | 'DME'
  | 'Home Health'
  | 'Specialist Consult'
  | 'Procedure'
  | 'Prescription'
  | 'Other';

export type OrderUrgency = 'routine' | 'urgent' | 'stat';
export type OrderStatus = 'pending' | 'sent' | 'completed' | 'cancelled';

export interface OrderEntry {
  type: OrderType;
  description: string;
  linkedDiagnosisCode: string;
  urgency?: OrderUrgency;
  orderingProvider?: string;
  dateNeeded?: string;
  status?: OrderStatus;
  facility?: string;
  notes?: string;
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

export interface MonitoringEntry {
  id: string;
  indicator: string;
  currentValue: string;
  targetValue: string;
  timeline: string;
}

export interface NutritionMonitoringData {
  indicators?: string; // legacy single indicator
  criteria?: string; // legacy single criteria
  monitoringEntries?: MonitoringEntry[];
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
