/**
 * APTA-aligned Systems Review configuration.
 * 6 systems, each with Add/Defer toggles and subcategories.
 */

export interface SystemDef {
  id: string;
  label: string;
}

export interface SubcategoryDef {
  id: string;
  label: string;
}

export type SystemStatus = '' | 'impaired' | 'wnl';

export interface SystemState {
  status: SystemStatus;
  subcategories: Record<string, SystemStatus>;
  deferReason: string;
  deferReasons: Record<string, string>;
}

export type SystemsReviewData = Record<string, SystemState>;

export const SYSTEMS: SystemDef[] = [
  { id: 'communication', label: 'Communication / Cognition' },
  { id: 'cardiovascular', label: 'Cardiovascular / Pulmonary' },
  { id: 'integumentary', label: 'Integumentary' },
  { id: 'musculoskeletal', label: 'Musculoskeletal' },
  { id: 'neuromuscular', label: 'Neuromuscular' },
  { id: 'standardizedFunctional', label: 'Standardized Functional Assessment' },
];

export const SUBCATEGORIES: Record<string, SubcategoryDef[]> = {
  communication: [
    { id: 'orientation', label: 'Orientation' },
    { id: 'memory', label: 'Memory & Attention' },
    { id: 'safetyAwareness', label: 'Safety Awareness' },
    { id: 'visionPerception', label: 'Vision / Perception' },
  ],
  cardiovascular: [
    { id: 'auscultation', label: 'Auscultation' },
    { id: 'edema', label: 'Edema' },
    { id: 'endurance', label: 'Endurance' },
  ],
  integumentary: [
    { id: 'skinIntegrity', label: 'Skin Integrity' },
    { id: 'colorTemp', label: 'Color & Temperature' },
  ],
  musculoskeletal: [
    { id: 'rom', label: 'ROM' },
    { id: 'strength', label: 'Strength / MMT' },
    { id: 'specialTests', label: 'Special Tests' },
    { id: 'posture', label: 'Posture' },
  ],
  neuromuscular: [
    { id: 'sensation', label: 'Sensation' },
    { id: 'reflexes', label: 'Reflexes' },
    { id: 'tone', label: 'Tone' },
    { id: 'cranialNerves', label: 'Cranial Nerves' },
    { id: 'coordination', label: 'Coordination' },
    { id: 'balance', label: 'Balance' },
    { id: 'gaitMobility', label: 'Gait / Mobility' },
    { id: 'endurance', label: 'Endurance' },
  ],
  standardizedFunctional: [],
};

export const DEFER_REASONS = [
  { value: '', label: 'Select reason…' },
  { value: 'not-indicated', label: 'Not clinically indicated' },
  { value: 'follow-up', label: 'Deferred to follow-up visit' },
  { value: 'unable-to-tolerate', label: 'Patient unable to tolerate' },
  { value: 'medical-precaution', label: 'Medical precaution' },
  { value: 'patient-declined', label: 'Patient declined' },
  { value: 'other-provider', label: 'Assessed by other provider' },
];

/** Systems that default to "Add" (impaired) so their content is visible on new notes. */
const DEFAULT_OPEN_SYSTEMS = new Set(['musculoskeletal', 'neuromuscular']);

export function createDefaultSystemsReview(): SystemsReviewData {
  const data: SystemsReviewData = {};
  for (const sys of SYSTEMS) {
    const defaultOpen = DEFAULT_OPEN_SYSTEMS.has(sys.id);
    const subcats: Record<string, SystemStatus> = {};
    for (const sub of SUBCATEGORIES[sys.id] ?? []) {
      subcats[sub.id] = defaultOpen ? 'impaired' : '';
    }
    data[sys.id] = {
      status: defaultOpen ? 'impaired' : '',
      subcategories: subcats,
      deferReason: '',
      deferReasons: {},
    };
  }
  return data;
}

export function isGateOpen(data: SystemsReviewData, systemId: string): boolean {
  return data[systemId]?.status === 'impaired';
}

export function isSubcatImpaired(
  data: SystemsReviewData,
  systemId: string,
  subcatId: string,
): boolean {
  const sys = data[systemId];
  return sys?.status === 'impaired' && sys.subcategories[subcatId] === 'impaired';
}

export function isSystemsReviewComplete(data: SystemsReviewData): boolean {
  return Object.values(data).some((s) => s.status !== '');
}
