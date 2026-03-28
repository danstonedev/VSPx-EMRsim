/**
 * Regional assessment data: ROM, RIMs, MMT, and Special Tests
 * for 9 body regions used in PT objective exam.
 */

export interface RomDef {
  joint: string;
  normal: string;
  side: '' | 'R' | 'L';
}

export interface MmtDef {
  muscle: string;
  side: '' | 'R' | 'L';
  normal: string;
}

export interface SpecialTestDef {
  name: string;
  purpose: string;
}

export interface RegionDef {
  name: string;
  rom: RomDef[];
  rims: RomDef[];
  mmt: MmtDef[];
  specialTests: SpecialTestDef[];
}

export const REGION_ORDER = [
  'hip',
  'knee',
  'ankle',
  'shoulder',
  'elbow',
  'wrist-hand',
  'cervical-spine',
  'thoracic-spine',
  'lumbar-spine',
];

export const RIMS_OPTIONS = [
  { value: '', label: '—' },
  { value: 'strong-painfree', label: 'Strong & Pain-Free' },
  { value: 'strong-painful', label: 'Strong & Painful' },
  { value: 'weak-painfree', label: 'Weak & Pain-Free' },
  { value: 'weak-painful', label: 'Weak & Painful' },
];

export const MMT_GRADES = [
  { value: '', label: 'Not tested' },
  { value: '0/5', label: '0/5 — No contraction' },
  { value: '1/5', label: '1/5 — Trace contraction' },
  { value: '2/5', label: '2/5 — Full ROM gravity eliminated' },
  { value: '3/5', label: '3/5 — Full ROM against gravity' },
  { value: '4-/5', label: '4-/5 — Less than normal resistance' },
  { value: '4/5', label: '4/5 — Moderate resistance' },
  { value: '4+/5', label: '4+/5 — Nearly normal resistance' },
  { value: '5/5', label: '5/5 — Normal strength' },
];

function bilateral(joint: string, normal: string): RomDef[] {
  return [
    { joint, normal, side: 'R' },
    { joint, normal, side: 'L' },
  ];
}

function bilateralRims(joint: string): RomDef[] {
  return [
    { joint, normal: '', side: 'R' },
    { joint, normal: '', side: 'L' },
  ];
}

function bilateralMmt(muscle: string, normal = '5/5'): MmtDef[] {
  return [
    { muscle, side: 'R', normal },
    { muscle, side: 'L', normal },
  ];
}

export const REGIONS: Record<string, RegionDef> = {
  'lumbar-spine': {
    name: 'Lumbar Spine',
    rom: [
      { joint: 'Flexion', normal: '60°', side: '' },
      { joint: 'Extension', normal: '25°', side: '' },
      ...bilateral('Lateral Flexion', '25°'),
      ...bilateral('Rotation', '30°'),
    ],
    rims: [
      { joint: 'Flexion', normal: '', side: '' },
      { joint: 'Extension', normal: '', side: '' },
      ...bilateralRims('Lateral Flexion'),
      ...bilateralRims('Rotation'),
    ],
    mmt: [
      ...bilateralMmt('Hip Flexors'),
      ...bilateralMmt('Quadriceps'),
      ...bilateralMmt('Hamstrings'),
      ...bilateralMmt('Gluteus Maximus'),
    ],
    specialTests: [
      { name: 'Straight Leg Raise (SLR)', purpose: 'Sciatic nerve tension' },
      { name: 'Slump Test', purpose: 'Neural tension' },
      { name: 'Prone Instability', purpose: 'Lumbar segmental instability' },
      { name: 'Central PA Spring', purpose: 'Segmental mobility' },
      { name: 'FABER / Patrick', purpose: 'SI joint / hip pathology' },
    ],
  },
  'cervical-spine': {
    name: 'Cervical Spine',
    rom: [
      { joint: 'Flexion', normal: '50°', side: '' },
      { joint: 'Extension', normal: '60°', side: '' },
      ...bilateral('Lateral Flexion', '45°'),
      ...bilateral('Rotation', '80°'),
    ],
    rims: [
      { joint: 'Flexion', normal: '', side: '' },
      { joint: 'Extension', normal: '', side: '' },
      ...bilateralRims('Lateral Flexion'),
      ...bilateralRims('Rotation'),
    ],
    mmt: [
      ...bilateralMmt('Neck Flexors'),
      ...bilateralMmt('Neck Extensors'),
      ...bilateralMmt('Upper Trapezius'),
    ],
    specialTests: [
      { name: 'Spurling Test', purpose: 'Cervical radiculopathy' },
      { name: 'ULTT', purpose: 'Upper limb neural tension' },
      { name: 'Distraction Test', purpose: 'Cervical radiculopathy relief' },
      { name: 'Vertebral Artery Test', purpose: 'VBI screening' },
    ],
  },
  shoulder: {
    name: 'Shoulder',
    rom: [
      ...bilateral('Flexion', '180°'),
      ...bilateral('Extension', '60°'),
      ...bilateral('Abduction', '180°'),
      ...bilateral('Internal Rotation', '70°'),
      ...bilateral('External Rotation', '90°'),
    ],
    rims: [
      ...bilateralRims('Flexion'),
      ...bilateralRims('Extension'),
      ...bilateralRims('Abduction'),
      ...bilateralRims('Internal Rotation'),
      ...bilateralRims('External Rotation'),
    ],
    mmt: [
      ...bilateralMmt('Anterior Deltoid'),
      ...bilateralMmt('Middle Deltoid'),
      ...bilateralMmt('Posterior Deltoid'),
      ...bilateralMmt('Rotator Cuff (ER/IR)'),
    ],
    specialTests: [
      { name: 'Neer Impingement', purpose: 'Subacromial impingement' },
      { name: 'Hawkins-Kennedy', purpose: 'Subacromial impingement' },
      { name: 'Empty Can (Jobe)', purpose: 'Supraspinatus pathology' },
      { name: 'Apprehension Test', purpose: 'Anterior instability' },
    ],
  },
  knee: {
    name: 'Knee',
    rom: [...bilateral('Flexion', '135°'), ...bilateral('Extension', '0°')],
    rims: [...bilateralRims('Flexion'), ...bilateralRims('Extension')],
    mmt: [...bilateralMmt('Quadriceps'), ...bilateralMmt('Hamstrings')],
    specialTests: [
      { name: 'Lachman Test', purpose: 'ACL integrity' },
      { name: 'Anterior Drawer', purpose: 'ACL integrity' },
      { name: 'Posterior Drawer', purpose: 'PCL integrity' },
      { name: 'McMurray Test', purpose: 'Meniscal pathology' },
      { name: 'Valgus Stress', purpose: 'MCL integrity' },
      { name: 'Varus Stress', purpose: 'LCL integrity' },
    ],
  },
  hip: {
    name: 'Hip',
    rom: [
      ...bilateral('Flexion', '120°'),
      ...bilateral('Extension', '20°'),
      ...bilateral('Abduction', '45°'),
      ...bilateral('Adduction', '30°'),
      ...bilateral('Internal Rotation', '35°'),
      ...bilateral('External Rotation', '45°'),
    ],
    rims: [
      ...bilateralRims('Flexion'),
      ...bilateralRims('Extension'),
      ...bilateralRims('Abduction'),
      ...bilateralRims('Adduction'),
      ...bilateralRims('Internal Rotation'),
      ...bilateralRims('External Rotation'),
    ],
    mmt: [
      ...bilateralMmt('Hip Flexors'),
      ...bilateralMmt('Hip Extensors'),
      ...bilateralMmt('Hip Abductors'),
      ...bilateralMmt('Hip Adductors'),
      ...bilateralMmt('Hip IR'),
      ...bilateralMmt('Hip ER'),
    ],
    specialTests: [
      { name: 'FABER Test', purpose: 'SI joint / hip pathology' },
      { name: 'FADIR Test', purpose: 'Labral / impingement' },
      { name: 'Scour Test', purpose: 'Intra-articular pathology' },
      { name: 'Thomas Test', purpose: 'Hip flexor contracture' },
      { name: 'Ober Test', purpose: 'IT band tightness' },
    ],
  },
  ankle: {
    name: 'Foot & Ankle',
    rom: [
      ...bilateral('Dorsiflexion', '20°'),
      ...bilateral('Plantarflexion', '50°'),
      ...bilateral('Inversion', '35°'),
      ...bilateral('Eversion', '15°'),
    ],
    rims: [
      ...bilateralRims('Dorsiflexion'),
      ...bilateralRims('Plantarflexion'),
      ...bilateralRims('Inversion'),
      ...bilateralRims('Eversion'),
    ],
    mmt: [
      ...bilateralMmt('Dorsiflexors'),
      ...bilateralMmt('Plantarflexors'),
      ...bilateralMmt('Invertors'),
      ...bilateralMmt('Evertors'),
    ],
    specialTests: [
      { name: 'Anterior Drawer', purpose: 'ATFL integrity' },
      { name: 'Talar Tilt', purpose: 'CFL integrity' },
      { name: 'Thompson Test', purpose: 'Achilles tendon rupture' },
      { name: 'Kleiger Test', purpose: 'Syndesmosis injury' },
      { name: 'Squeeze Test', purpose: 'Syndesmosis injury' },
    ],
  },
  elbow: {
    name: 'Elbow',
    rom: [
      ...bilateral('Flexion', '145°'),
      ...bilateral('Extension', '0°'),
      ...bilateral('Pronation', '80°'),
      ...bilateral('Supination', '80°'),
    ],
    rims: [
      ...bilateralRims('Flexion'),
      ...bilateralRims('Extension'),
      ...bilateralRims('Pronation'),
      ...bilateralRims('Supination'),
    ],
    mmt: [
      ...bilateralMmt('Biceps'),
      ...bilateralMmt('Triceps'),
      ...bilateralMmt('Pronators'),
      ...bilateralMmt('Supinators'),
    ],
    specialTests: [
      { name: 'Cozen Test', purpose: 'Lateral epicondylitis' },
      { name: 'Mill Test', purpose: 'Lateral epicondylitis' },
      { name: 'Golfer Elbow Test', purpose: 'Medial epicondylitis' },
      { name: 'Valgus Stress', purpose: 'UCL integrity' },
      { name: 'Varus Stress', purpose: 'LCL integrity' },
    ],
  },
  'wrist-hand': {
    name: 'Wrist & Hand',
    rom: [
      ...bilateral('Flexion', '80°'),
      ...bilateral('Extension', '70°'),
      ...bilateral('Radial Deviation', '20°'),
      ...bilateral('Ulnar Deviation', '30°'),
    ],
    rims: [
      ...bilateralRims('Flexion'),
      ...bilateralRims('Extension'),
      ...bilateralRims('Radial Deviation'),
      ...bilateralRims('Ulnar Deviation'),
    ],
    mmt: [
      ...bilateralMmt('Wrist Flexors'),
      ...bilateralMmt('Wrist Extensors'),
      ...bilateralMmt('Grip Strength'),
      ...bilateralMmt('Pinch Strength'),
    ],
    specialTests: [
      { name: 'Finkelstein Test', purpose: 'De Quervain tenosynovitis' },
      { name: 'Phalen Test', purpose: 'Carpal tunnel syndrome' },
      { name: 'Tinel Sign', purpose: 'Nerve entrapment' },
      { name: 'TFCC Load', purpose: 'TFCC injury' },
    ],
  },
  'thoracic-spine': {
    name: 'Thoracic Spine',
    rom: [
      { joint: 'Flexion', normal: '30°', side: '' },
      { joint: 'Extension', normal: '25°', side: '' },
      ...bilateral('Lateral Flexion', '25°'),
      ...bilateral('Rotation', '30°'),
    ],
    rims: [
      { joint: 'Flexion', normal: '', side: '' },
      { joint: 'Extension', normal: '', side: '' },
      ...bilateralRims('Lateral Flexion'),
      ...bilateralRims('Rotation'),
    ],
    mmt: [
      { muscle: 'Thoracic Extensors', side: '', normal: '5/5' },
      ...bilateralMmt('Scapular Retractors'),
    ],
    specialTests: [
      { name: 'PA Spring Test', purpose: 'Segmental mobility' },
      { name: 'Rib Spring Test', purpose: 'Rib mobility' },
      { name: 'Rotation Spring', purpose: 'Rotational mobility' },
    ],
  },
};
