/**
 * Configuration data for the Assessment section structured inputs.
 * Body regions, impairment types, tissue irritability, healing stages,
 * movement system diagnoses, and prognostic factor checklists.
 */

// ─── Structured Impairments ─────────────────────────────────────────────────

export const BODY_REGIONS = [
  { value: '', label: 'Select region...' },
  { value: 'cervical', label: 'Cervical Spine' },
  { value: 'thoracic', label: 'Thoracic Spine' },
  { value: 'lumbar', label: 'Lumbar Spine' },
  { value: 'shoulder', label: 'Shoulder' },
  { value: 'elbow', label: 'Elbow' },
  { value: 'wrist', label: 'Wrist / Hand' },
  { value: 'hip', label: 'Hip' },
  { value: 'knee', label: 'Knee' },
  { value: 'ankle', label: 'Ankle / Foot' },
  { value: 'pelvis', label: 'Pelvis / SI Joint' },
  { value: 'other', label: 'Other' },
] as const;

export const IMPAIRMENT_TYPES = [
  { value: '', label: 'Select type...' },
  { value: 'rom-deficit', label: 'ROM Deficit' },
  { value: 'strength-deficit', label: 'Strength Deficit' },
  { value: 'motor-control', label: 'Motor Control Deficit' },
  { value: 'pain', label: 'Pain' },
  { value: 'postural-deviation', label: 'Postural Deviation' },
  { value: 'balance-deficit', label: 'Balance Deficit' },
  { value: 'endurance-deficit', label: 'Endurance Deficit' },
  { value: 'sensory-deficit', label: 'Sensory Deficit' },
  { value: 'flexibility-deficit', label: 'Flexibility Deficit' },
  { value: 'other', label: 'Other' },
] as const;

export const SEVERITY_LEVELS = [
  { value: '', label: '—' },
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
] as const;

// ─── Tissue Irritability & Healing Stage ────────────────────────────────────

export const TISSUE_IRRITABILITY_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'high', label: 'High — easily provoked, slow to settle' },
  { value: 'moderate', label: 'Moderate — moderate provocation threshold' },
  { value: 'low', label: 'Low — difficult to provoke, tolerates higher intensity' },
] as const;

export const HEALING_STAGE_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'acute', label: 'Acute / Inflammatory (0–7 days)' },
  { value: 'subacute', label: 'Subacute / Proliferative (7 days – 6 weeks)' },
  { value: 'chronic', label: 'Chronic / Remodeling (> 6 weeks)' },
] as const;

// ─── Movement System Diagnoses (APTA) ──────────────────────────────────────

export interface MovementDiagnosis {
  value: string;
  label: string;
  category: string;
}

export const MOVEMENT_SYSTEM_DIAGNOSES: MovementDiagnosis[] = [
  {
    value: 'lumbar-rotation-extension',
    label: 'Lumbar Rotation with Extension',
    category: 'Lumbar',
  },
  { value: 'lumbar-rotation-flexion', label: 'Lumbar Rotation with Flexion', category: 'Lumbar' },
  { value: 'lumbar-extension', label: 'Lumbar Extension Syndrome', category: 'Lumbar' },
  { value: 'lumbar-flexion', label: 'Lumbar Flexion Syndrome', category: 'Lumbar' },
  { value: 'cervical-extension', label: 'Cervical Extension Syndrome', category: 'Cervical' },
  { value: 'cervical-flexion', label: 'Cervical Flexion Syndrome', category: 'Cervical' },
  { value: 'thoracic-rotation-deficit', label: 'Thoracic Rotation Deficit', category: 'Thoracic' },
  { value: 'shoulder-impingement', label: 'Shoulder Impingement Syndrome', category: 'Shoulder' },
  { value: 'shoulder-instability', label: 'Shoulder Instability', category: 'Shoulder' },
  { value: 'knee-extension-deficit', label: 'Knee Extension Deficit', category: 'Knee' },
  { value: 'knee-hyperextension', label: 'Knee Hyperextension Syndrome', category: 'Knee' },
  { value: 'hip-extension-deficit', label: 'Hip Extension Deficit', category: 'Hip' },
  { value: 'ankle-df-deficit', label: 'Ankle Dorsiflexion Deficit', category: 'Ankle' },
  { value: 'balance-deficit', label: 'Balance Deficit', category: 'Other' },
  { value: 'other', label: 'Other (specify in notes)', category: 'Other' },
];

export function scoreMSD(item: MovementDiagnosis, query: string): number {
  const q = query.toLowerCase();
  const l = item.label.toLowerCase();
  const c = item.category.toLowerCase();
  if (l === q) return 100;
  if (l.startsWith(q)) return 90;
  if (l.includes(q)) return 60;
  if (c.includes(q)) return 30;
  return 0;
}

// ─── Prognostic Factors ─────────────────────────────────────────────────────

export const POSITIVE_PROGNOSTIC_FACTORS = [
  'Motivated patient',
  'Good general health',
  'Acute condition',
  'Clear mechanism of injury',
  'Strong social support',
  'Prior rehabilitation success',
  'Young age',
] as const;

export const NEGATIVE_PROGNOSTIC_FACTORS = [
  'Multiple comorbidities',
  'Chronic condition',
  'Psychosocial barriers',
  'Poor adherence history',
  'Complex pain presentation',
  'Advanced age',
  'Limited social support',
  "Workers' comp / litigation",
] as const;
