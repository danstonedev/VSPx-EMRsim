/**
 * Discipline-keyed intervention catalog for the structured treatment log.
 *
 * Each discipline defines intervention categories; each category contains
 * selectable intervention types. Components render from this config so
 * adding OT/SLP categories later is just data work.
 */

import type { DisciplineId } from '$lib/stores/auth';

export interface InterventionType {
  id: string;
  label: string;
}

export interface InterventionCategory {
  id: string;
  label: string;
  types: InterventionType[];
}

export interface PatientResponseOption {
  id: string;
  label: string;
}

/** Common structured patient-response options. */
export const PATIENT_RESPONSE_OPTIONS: PatientResponseOption[] = [
  { id: 'tolerated-well', label: 'Tolerated well' },
  { id: 'limited-by-pain', label: 'Limited by pain' },
  { id: 'required-rest-breaks', label: 'Required rest breaks' },
  { id: 'fatigue-limited', label: 'Fatigue-limited' },
  { id: 'required-cueing', label: 'Required verbal/tactile cueing' },
  { id: 'declined', label: 'Declined / refused' },
  { id: 'other', label: 'Other (see notes)' },
];

/** PT intervention categories and types. */
const ptCategories: InterventionCategory[] = [
  {
    id: 'therapeutic-exercise',
    label: 'Therapeutic Exercise',
    types: [
      { id: 'strengthening', label: 'Strengthening' },
      { id: 'stretching', label: 'Stretching / Flexibility' },
      { id: 'rom-exercise', label: 'ROM Exercise' },
      { id: 'core-stabilization', label: 'Core Stabilization' },
      { id: 'endurance-training', label: 'Endurance / Aerobic Training' },
      { id: 'plyometrics', label: 'Plyometrics' },
    ],
  },
  {
    id: 'manual-therapy',
    label: 'Manual Therapy',
    types: [
      { id: 'joint-mobilization', label: 'Joint Mobilization' },
      { id: 'joint-manipulation', label: 'Joint Manipulation' },
      { id: 'soft-tissue-mobilization', label: 'Soft Tissue Mobilization' },
      { id: 'myofascial-release', label: 'Myofascial Release' },
      { id: 'manual-stretch', label: 'Manual Stretching' },
      { id: 'manual-traction', label: 'Manual Traction' },
    ],
  },
  {
    id: 'neuromuscular-reeducation',
    label: 'Neuromuscular Re-education',
    types: [
      { id: 'proprioceptive-training', label: 'Proprioceptive Training' },
      { id: 'motor-control', label: 'Motor Control Training' },
      { id: 'pnf', label: 'PNF Techniques' },
      { id: 'task-specific-training', label: 'Task-Specific Training' },
    ],
  },
  {
    id: 'gait-training',
    label: 'Gait Training',
    types: [
      { id: 'level-surface', label: 'Level Surface' },
      { id: 'uneven-surface', label: 'Uneven / Outdoor Surface' },
      { id: 'stairs', label: 'Stair Negotiation' },
      { id: 'curbs-ramps', label: 'Curbs / Ramps' },
      { id: 'assistive-device', label: 'Assistive Device Training' },
      { id: 'body-weight-supported', label: 'Body Weight–Supported' },
    ],
  },
  {
    id: 'balance-training',
    label: 'Balance Training',
    types: [
      { id: 'static-balance', label: 'Static Balance' },
      { id: 'dynamic-balance', label: 'Dynamic Balance' },
      { id: 'perturbation', label: 'Perturbation Training' },
      { id: 'vestibular-rehab', label: 'Vestibular Rehabilitation' },
    ],
  },
  {
    id: 'functional-training',
    label: 'Functional Training',
    types: [
      { id: 'transfers', label: 'Transfer Training' },
      { id: 'bed-mobility', label: 'Bed Mobility' },
      { id: 'wheelchair-mobility', label: 'Wheelchair Mobility' },
      { id: 'adl-training', label: 'ADL / Functional Task Training' },
      { id: 'work-conditioning', label: 'Work Conditioning' },
    ],
  },
  {
    id: 'modalities',
    label: 'Modalities',
    types: [
      { id: 'ultrasound', label: 'Therapeutic Ultrasound' },
      { id: 'estim', label: 'Electrical Stimulation (NMES/TENS)' },
      { id: 'iontophoresis', label: 'Iontophoresis' },
      { id: 'hot-pack', label: 'Hot Pack / Moist Heat' },
      { id: 'cold-pack', label: 'Cold Pack / Cryotherapy' },
      { id: 'traction-mechanical', label: 'Mechanical Traction' },
      { id: 'laser', label: 'Low-Level Laser Therapy' },
      { id: 'dry-needling', label: 'Dry Needling' },
    ],
  },
  {
    id: 'patient-education',
    label: 'Patient / Caregiver Education',
    types: [
      { id: 'hep-instruction', label: 'HEP Instruction' },
      { id: 'disease-process', label: 'Disease Process Education' },
      { id: 'body-mechanics', label: 'Body Mechanics / Ergonomics' },
      { id: 'fall-prevention', label: 'Fall Prevention Strategies' },
      { id: 'activity-modification', label: 'Activity Modification' },
      { id: 'caregiver-training', label: 'Caregiver Training' },
    ],
  },
];

/** OT intervention categories and types. */
const otCategories: InterventionCategory[] = [
  {
    id: 'therapeutic-exercise',
    label: 'Therapeutic Exercise',
    types: [
      { id: 'strengthening', label: 'Strengthening' },
      { id: 'rom-exercise', label: 'ROM Exercise' },
      { id: 'stretching', label: 'Stretching / Flexibility' },
      { id: 'fine-motor-training', label: 'Fine Motor Training' },
      { id: 'grip-strengthening', label: 'Grip Strengthening' },
      { id: 'ue-endurance', label: 'Upper Extremity Endurance' },
    ],
  },
  {
    id: 'therapeutic-activities',
    label: 'Therapeutic Activities',
    types: [
      { id: 'functional-task-training', label: 'Functional Task Training' },
      { id: 'simulated-work-tasks', label: 'Simulated Work Tasks' },
      { id: 'craft-activities', label: 'Craft Activities' },
      { id: 'pegboard-manipulation', label: 'Pegboard / Manipulation Tasks' },
    ],
  },
  {
    id: 'adl-training',
    label: 'ADL Training',
    types: [
      { id: 'dressing-training', label: 'Dressing Training' },
      { id: 'grooming-hygiene', label: 'Grooming / Hygiene Training' },
      { id: 'bathing-training', label: 'Bathing Training' },
      { id: 'feeding-eating', label: 'Feeding / Eating Training' },
      { id: 'toileting-training', label: 'Toileting Training' },
      { id: 'home-management', label: 'Home Management Tasks' },
    ],
  },
  {
    id: 'manual-therapy',
    label: 'Manual Therapy',
    types: [
      { id: 'joint-mobilization', label: 'Joint Mobilization' },
      { id: 'soft-tissue-mobilization', label: 'Soft Tissue Mobilization' },
      { id: 'myofascial-release', label: 'Myofascial Release' },
      { id: 'manual-edema-mobilization', label: 'Manual Edema Mobilization' },
      { id: 'scar-management', label: 'Scar Management / Massage' },
    ],
  },
  {
    id: 'neuromuscular-reeducation',
    label: 'Neuromuscular Re-education',
    types: [
      { id: 'motor-control', label: 'Motor Control Training' },
      { id: 'proprioceptive-training', label: 'Proprioceptive Training' },
      { id: 'sensory-reeducation', label: 'Sensory Re-education' },
      { id: 'visual-perceptual', label: 'Visual-Perceptual Training' },
      { id: 'cimt', label: 'Constraint-Induced Movement Therapy' },
    ],
  },
  {
    id: 'splinting-orthotics',
    label: 'Splinting / Orthotics',
    types: [
      { id: 'static-splint', label: 'Static Splint Fabrication' },
      { id: 'dynamic-splint', label: 'Dynamic Splint Fabrication' },
      { id: 'splint-adjustment', label: 'Splint Adjustment / Modification' },
      { id: 'orthotic-training', label: 'Orthotic Training' },
    ],
  },
  {
    id: 'cognitive-rehab',
    label: 'Cognitive Rehabilitation',
    types: [
      { id: 'attention-training', label: 'Attention Training' },
      { id: 'memory-strategies', label: 'Memory Strategies' },
      { id: 'executive-function', label: 'Executive Function Training' },
      { id: 'problem-solving', label: 'Problem-Solving Tasks' },
      { id: 'safety-awareness', label: 'Safety Awareness Training' },
    ],
  },
  {
    id: 'modalities',
    label: 'Modalities',
    types: [
      { id: 'hot-pack', label: 'Hot Pack / Moist Heat' },
      { id: 'cold-pack', label: 'Cold Pack / Cryotherapy' },
      { id: 'paraffin', label: 'Paraffin' },
      { id: 'estim', label: 'Electrical Stimulation' },
      { id: 'fluidotherapy', label: 'Fluidotherapy' },
      { id: 'ultrasound', label: 'Ultrasound' },
    ],
  },
  {
    id: 'patient-education',
    label: 'Patient / Caregiver Education',
    types: [
      { id: 'hep-instruction', label: 'HEP Instruction' },
      { id: 'energy-conservation', label: 'Energy Conservation' },
      { id: 'joint-protection', label: 'Joint Protection' },
      { id: 'adaptive-equipment', label: 'Adaptive Equipment Training' },
      { id: 'ergonomic-education', label: 'Ergonomic Education' },
      { id: 'caregiver-training', label: 'Caregiver Training' },
    ],
  },
];

/** SLP intervention categories and types. */
const slpCategories: InterventionCategory[] = [
  {
    id: 'speech-treatment',
    label: 'Speech Treatment',
    types: [
      { id: 'articulation-therapy', label: 'Articulation Therapy' },
      { id: 'motor-speech', label: 'Motor Speech Treatment' },
      { id: 'voice-therapy', label: 'Voice Therapy' },
      { id: 'resonance-therapy', label: 'Resonance Therapy' },
      { id: 'fluency-therapy', label: 'Fluency Therapy' },
      { id: 'apraxia-treatment', label: 'Apraxia Treatment (DTTC/ReST)' },
      { id: 'dysarthria-treatment', label: 'Dysarthria Treatment (LSVT/Clear Speech)' },
    ],
  },
  {
    id: 'language-treatment',
    label: 'Language Treatment',
    types: [
      { id: 'aphasia-therapy', label: 'Aphasia Therapy (semantic/phonological)' },
      { id: 'word-finding', label: 'Word-Finding Strategies' },
      { id: 'sentence-formulation', label: 'Sentence Formulation' },
      { id: 'auditory-comprehension', label: 'Auditory Comprehension' },
      { id: 'reading-comprehension', label: 'Reading Comprehension' },
      { id: 'written-expression', label: 'Written Expression' },
      { id: 'pragmatic-language', label: 'Pragmatic Language' },
    ],
  },
  {
    id: 'cognitive-communication',
    label: 'Cognitive-Communication',
    types: [
      { id: 'attention-training', label: 'Attention Training' },
      { id: 'memory-strategies', label: 'Memory Strategies' },
      { id: 'executive-function', label: 'Executive Function Training' },
      { id: 'problem-solving', label: 'Problem-Solving' },
      { id: 'reasoning-tasks', label: 'Reasoning Tasks' },
      { id: 'self-monitoring', label: 'Self-Monitoring Strategies' },
      { id: 'compensatory-strategy', label: 'Compensatory Strategy Training' },
    ],
  },
  {
    id: 'swallowing-dysphagia',
    label: 'Swallowing / Dysphagia',
    types: [
      { id: 'oral-motor-exercises', label: 'Oral Motor Exercises' },
      { id: 'swallowing-exercises', label: 'Swallowing Exercises (Mendelsohn/Effortful)' },
      { id: 'diet-texture-modification', label: 'Diet Texture Modification' },
      { id: 'compensatory-swallow', label: 'Compensatory Swallow Strategies' },
      { id: 'thermal-tactile', label: 'Thermal-Tactile Stimulation' },
      { id: 'vitalstim-nmes', label: 'VitalStim / NMES for Swallowing' },
      { id: 'fees', label: 'Fiberoptic Endoscopic Evaluation (FEES)' },
      { id: 'mbs', label: 'Modified Barium Swallow Study' },
    ],
  },
  {
    id: 'aac',
    label: 'AAC (Augmentative/Alternative Communication)',
    types: [
      { id: 'aac-assessment', label: 'AAC Device Assessment' },
      { id: 'aac-programming', label: 'AAC Device Programming' },
      { id: 'aac-training', label: 'AAC Device Training' },
      { id: 'low-tech-aac', label: 'Low-Tech AAC Strategies' },
      { id: 'comm-partner-training', label: 'Communication Partner Training' },
    ],
  },
  {
    id: 'voice-resonance',
    label: 'Voice / Resonance',
    types: [
      { id: 'vocal-function-exercises', label: 'Vocal Function Exercises' },
      { id: 'vocal-hygiene', label: 'Vocal Hygiene Education' },
      { id: 'pitch-loudness', label: 'Pitch / Loudness Training' },
      { id: 'lsvt-loud', label: 'LSVT LOUD' },
      { id: 'resonance-techniques', label: 'Resonance Therapy Techniques' },
    ],
  },
  {
    id: 'pediatric-specific',
    label: 'Pediatric-Specific',
    types: [
      { id: 'oral-placement', label: 'Oral Placement Therapy' },
      { id: 'language-stimulation', label: 'Language Stimulation' },
      { id: 'play-based-therapy', label: 'Play-Based Therapy' },
      { id: 'phonological-awareness', label: 'Phonological Awareness' },
      { id: 'literacy-intervention', label: 'Literacy Intervention' },
      { id: 'social-skills', label: 'Social Skills Training' },
      { id: 'parent-coaching', label: 'Parent Coaching' },
    ],
  },
  {
    id: 'patient-education',
    label: 'Patient / Caregiver Education',
    types: [
      { id: 'swallowing-safety', label: 'Swallowing Safety Education' },
      { id: 'communication-strategies', label: 'Communication Strategies' },
      { id: 'hep-instruction', label: 'HEP Instruction' },
      { id: 'aphasia-friendly-comm', label: 'Aphasia-Friendly Communication Training' },
      { id: 'caregiver-training', label: 'Caregiver Training' },
    ],
  },
];

/** Nursing intervention categories and types. */
const nursingCategories: InterventionCategory[] = [
  {
    id: 'assessment-monitoring',
    label: 'Assessment / Monitoring',
    types: [
      { id: 'vital-signs', label: 'Vital Signs Monitoring' },
      { id: 'neuro-assessment', label: 'Neurological Assessment' },
      { id: 'pain-assessment', label: 'Pain Assessment' },
      { id: 'fall-risk-assessment', label: 'Fall Risk Assessment' },
      { id: 'skin-wound-assessment', label: 'Skin / Wound Assessment' },
      { id: 'io-monitoring', label: 'Intake / Output Monitoring' },
    ],
  },
  {
    id: 'wound-care',
    label: 'Wound Care',
    types: [
      { id: 'wound-cleansing', label: 'Wound Cleansing / Irrigation' },
      { id: 'wound-debridement', label: 'Wound Debridement' },
      { id: 'dressing-simple', label: 'Dressing Change (simple)' },
      { id: 'dressing-complex', label: 'Dressing Change (complex)' },
      { id: 'npwt', label: 'Negative Pressure Wound Therapy' },
      { id: 'wound-measurement', label: 'Wound Measurement / Documentation' },
    ],
  },
  {
    id: 'iv-therapy-medication',
    label: 'IV Therapy / Medication',
    types: [
      { id: 'iv-insertion', label: 'IV Insertion / Maintenance' },
      { id: 'iv-fluid', label: 'IV Fluid Administration' },
      { id: 'iv-medication', label: 'IV Medication Infusion' },
      { id: 'im-subq-injection', label: 'IM / SubQ Injection' },
      { id: 'oral-medication', label: 'Oral Medication Administration' },
      { id: 'blood-products', label: 'Blood Product Administration' },
      { id: 'central-line-care', label: 'Central Line Care' },
    ],
  },
  {
    id: 'respiratory-care',
    label: 'Respiratory Care',
    types: [
      { id: 'oxygen-admin', label: 'Oxygen Administration' },
      { id: 'suctioning', label: 'Suctioning (oral/tracheal)' },
      { id: 'nebulizer', label: 'Nebulizer Treatment' },
      { id: 'incentive-spirometry', label: 'Incentive Spirometry Instruction' },
      { id: 'chest-pt', label: 'Chest Physiotherapy' },
      { id: 'trach-care', label: 'Tracheostomy Care' },
      { id: 'pulse-ox', label: 'Pulse Oximetry Monitoring' },
    ],
  },
  {
    id: 'catheter-drainage',
    label: 'Catheter / Drainage',
    types: [
      { id: 'foley-insertion', label: 'Foley Catheter Insertion' },
      { id: 'foley-care', label: 'Foley Catheter Care' },
      { id: 'straight-cath', label: 'Straight Catheterization' },
      { id: 'ng-tube', label: 'NG Tube Insertion / Management' },
      { id: 'drain-management', label: 'Drain Management' },
      { id: 'ostomy-care', label: 'Ostomy Care' },
    ],
  },
  {
    id: 'patient-safety',
    label: 'Patient Safety',
    types: [
      { id: 'fall-prevention', label: 'Fall Prevention Interventions' },
      { id: 'restraint-assessment', label: 'Restraint Assessment / Application' },
      { id: 'isolation-precautions', label: 'Isolation Precautions' },
      { id: 'seizure-precautions', label: 'Seizure Precautions' },
      { id: 'suicide-precautions', label: 'Suicide Precautions' },
    ],
  },
  {
    id: 'care-coordination',
    label: 'Care Coordination',
    types: [
      { id: 'discharge-planning', label: 'Discharge Planning' },
      { id: 'care-conference', label: 'Care Conference' },
      { id: 'patient-family-teaching', label: 'Patient / Family Teaching' },
      { id: 'medication-reconciliation', label: 'Medication Reconciliation' },
      { id: 'referral-coordination', label: 'Referral Coordination' },
      { id: 'transitions-of-care', label: 'Transitions of Care' },
    ],
  },
  {
    id: 'patient-education',
    label: 'Patient Education',
    types: [
      { id: 'disease-process', label: 'Disease Process Education' },
      { id: 'medication-education', label: 'Medication Education' },
      { id: 'wound-care-self-mgmt', label: 'Wound Care Self-Management' },
      { id: 'blood-sugar', label: 'Blood Sugar Monitoring' },
      { id: 'diet-nutrition', label: 'Diet / Nutrition Education' },
      { id: 'activity-exercise', label: 'Activity / Exercise Instruction' },
    ],
  },
];

/** Dietetics intervention categories and types. */
const dieteticsCategories: InterventionCategory[] = [
  {
    id: 'mnt',
    label: 'Medical Nutrition Therapy',
    types: [
      { id: 'initial-nutrition-assessment', label: 'Initial Nutrition Assessment' },
      { id: 'nutrition-reassessment', label: 'Nutrition Reassessment' },
      { id: 'calorie-count', label: 'Calorie Count Analysis' },
      { id: 'diet-modification', label: 'Diet Modification' },
      { id: 'enteral-management', label: 'Enteral Nutrition Management' },
      { id: 'parenteral-management', label: 'Parenteral Nutrition Management' },
      { id: 'supplement-recommendation', label: 'Supplement Recommendation' },
      { id: 'fluid-management', label: 'Fluid Management' },
    ],
  },
  {
    id: 'nutrition-counseling',
    label: 'Nutrition Counseling',
    types: [
      { id: 'motivational-interviewing', label: 'Motivational Interviewing' },
      { id: 'behavior-change', label: 'Behavior Change Strategies' },
      { id: 'goal-setting', label: 'Goal Setting' },
      { id: 'self-monitoring', label: 'Self-Monitoring Training' },
      { id: 'mindful-eating', label: 'Mindful Eating Techniques' },
      { id: 'relapse-prevention', label: 'Relapse Prevention' },
    ],
  },
  {
    id: 'diet-education',
    label: 'Diet Education',
    types: [
      { id: 'diabetes-diet', label: 'Diabetes Diet Education' },
      { id: 'cardiac-diet', label: 'Cardiac / Heart-Healthy Diet' },
      { id: 'renal-diet', label: 'Renal Diet Education' },
      { id: 'low-sodium-diet', label: 'Low-Sodium Diet Education' },
      { id: 'texture-modified-diet', label: 'Texture-Modified Diet Education' },
      { id: 'allergy-intolerance', label: 'Allergy / Intolerance Education' },
      { id: 'weight-management', label: 'Weight Management Education' },
      { id: 'pediatric-nutrition', label: 'Pediatric Nutrition Education' },
    ],
  },
  {
    id: 'assessment-tools',
    label: 'Assessment Tools',
    types: [
      { id: 'malnutrition-screening', label: 'Malnutrition Screening (MST/MUST)' },
      { id: 'nutrition-focused-pe', label: 'Nutrition-Focused Physical Exam' },
      { id: 'body-composition', label: 'Body Composition Analysis' },
      { id: 'indirect-calorimetry', label: 'Indirect Calorimetry' },
      { id: 'diet-history', label: 'Diet History Analysis' },
      { id: 'lab-data-interpretation', label: 'Laboratory Data Interpretation' },
    ],
  },
  {
    id: 'care-coordination',
    label: 'Care Coordination',
    types: [
      { id: 'interdisciplinary-rounds', label: 'Interdisciplinary Rounds' },
      { id: 'discharge-nutrition', label: 'Discharge Nutrition Planning' },
      { id: 'home-nutrition-setup', label: 'Home Nutrition Setup' },
      { id: 'community-resource-referral', label: 'Community Resource Referral' },
      { id: 'follow-up-planning', label: 'Follow-Up Planning' },
    ],
  },
];

/** Master catalog keyed by discipline. */
export const INTERVENTION_CATALOG: Record<DisciplineId, InterventionCategory[]> = {
  pt: ptCategories,
  ot: otCategories,
  slp: slpCategories,
  nursing: nursingCategories,
  dietetics: dieteticsCategories,
};

/** Common visit frequency options (shared across disciplines). */
export const FREQUENCY_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: '1x-week', label: '1x/week' },
  { value: '2x-week', label: '2x/week' },
  { value: '3x-week', label: '3x/week' },
  { value: '4x-week', label: '4x/week' },
  { value: '5x-week', label: '5x/week' },
  { value: '2x-day', label: '2x/day' },
  { value: 'prn', label: 'PRN' },
] as const;

/** Common treatment duration options (shared across disciplines). */
export const DURATION_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: '2-weeks', label: '2 weeks' },
  { value: '4-weeks', label: '4 weeks' },
  { value: '6-weeks', label: '6 weeks' },
  { value: '8-weeks', label: '8 weeks' },
  { value: '12-weeks', label: '12 weeks' },
  { value: '16-weeks', label: '16 weeks' },
  { value: '6-months', label: '6 months' },
  { value: 'ongoing', label: 'Ongoing' },
] as const;

/** Discipline-keyed physical modalities (checkbox lists in Plan → Treatment Narrative). */
export const MODALITY_CATALOG: Record<DisciplineId, string[]> = {
  pt: [
    'Ultrasound',
    'Electrical Stimulation (NMES/TENS)',
    'Iontophoresis',
    'Hot Pack / Moist Heat',
    'Cold Pack / Cryotherapy',
    'Paraffin',
    'Mechanical Traction',
    'Laser Therapy',
    'Biofeedback',
    'Whirlpool / Hydrotherapy',
    'Fluidotherapy',
    'Phonophoresis',
  ],
  ot: [
    'Hot Pack / Moist Heat',
    'Cold Pack / Cryotherapy',
    'Paraffin',
    'Electrical Stimulation (NMES/TENS)',
    'Fluidotherapy',
    'Ultrasound',
  ],
  slp: [],
  nursing: [],
  dietetics: [],
};

/** Get flat list of all category options for a discipline. */
export function getCategoryOptions(discipline: DisciplineId): { id: string; label: string }[] {
  return (INTERVENTION_CATALOG[discipline] ?? []).map((c) => ({ id: c.id, label: c.label }));
}

/** Get intervention types for a given category within a discipline. */
export function getTypeOptions(discipline: DisciplineId, categoryId: string): InterventionType[] {
  const cat = (INTERVENTION_CATALOG[discipline] ?? []).find((c) => c.id === categoryId);
  return cat?.types ?? [];
}
