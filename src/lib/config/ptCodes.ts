// PT-specific code reference data — CPT, ICD-10, and intervention lists
// Ported from app/js/features/soap/billing/BillingSection.js and plan/TreatmentPlan.js
//
// Code vintage: CY2025 CMS Physician Fee Schedule / ICD-10-CM FY2025
// Last reviewed: 2026-04-01
// Next review:   After CMS CY2026 PFS final rule (~Nov 2025) and ICD-10-CM FY2026 (~Oct 2025)
// Source:        AMA CPT codebook; CMS MPFS lookup (https://www.cms.gov/medicare/payment/fee-schedules/physician)
// NOTE: This is an educational simulator — codes are representative, not claims-grade.

export interface PTIntervention {
  value: string;
  label: string;
  category: string;
}

export interface CPTCode {
  value: string;
  label: string;
  description: string;
  timed: boolean;
  category:
    | 'evaluation'
    | 'therapeutic'
    | 'modality-supervised'
    | 'modality-constant'
    | 'testing'
    | 'ortho-prosthetic'
    | 'wound'
    | 'other';
}

export interface ICD10Code {
  value: string;
  label: string;
  description: string;
}

// ─── PT Interventions (~160) ───

export const PT_INTERVENTIONS: PTIntervention[] = [
  // Therapeutic Exercise
  { value: 'Squats', label: 'Squats', category: 'TherEx' },
  { value: 'Lunges', label: 'Lunges', category: 'TherEx' },
  { value: 'Heel Raises', label: 'Heel Raises', category: 'TherEx' },
  { value: 'Bridges', label: 'Bridges', category: 'TherEx' },
  { value: 'Clamshells', label: 'Clamshells', category: 'TherEx' },
  { value: 'Straight Leg Raise (SLR)', label: 'Straight Leg Raise (SLR)', category: 'TherEx' },
  { value: 'Short Arc Quads (SAQ)', label: 'Short Arc Quads (SAQ)', category: 'TherEx' },
  { value: 'Long Arc Quads (LAQ)', label: 'Long Arc Quads (LAQ)', category: 'TherEx' },
  { value: 'Hamstring Curls', label: 'Hamstring Curls', category: 'TherEx' },
  { value: 'Calf Stretch', label: 'Calf Stretch', category: 'TherEx' },
  { value: 'Hamstring Stretch', label: 'Hamstring Stretch', category: 'TherEx' },
  { value: 'Quad Stretch', label: 'Quad Stretch', category: 'TherEx' },
  { value: 'Piriformis Stretch', label: 'Piriformis Stretch', category: 'TherEx' },
  { value: 'Hip Flexor Stretch', label: 'Hip Flexor Stretch', category: 'TherEx' },
  { value: 'IT Band Stretch', label: 'IT Band Stretch', category: 'TherEx' },
  { value: 'Pec Stretch', label: 'Pec Stretch', category: 'TherEx' },
  { value: 'Lat Stretch', label: 'Lat Stretch', category: 'TherEx' },
  { value: 'Upper Trapezius Stretch', label: 'Upper Trapezius Stretch', category: 'TherEx' },
  { value: 'Levator Scapulae Stretch', label: 'Levator Scapulae Stretch', category: 'TherEx' },
  { value: 'Scalene Stretch', label: 'Scalene Stretch', category: 'TherEx' },
  {
    value: 'Cervical Retraction (Chin Tucks)',
    label: 'Cervical Retraction (Chin Tucks)',
    category: 'TherEx',
  },
  { value: 'Scapular Retraction', label: 'Scapular Retraction', category: 'TherEx' },
  { value: 'Rows', label: 'Rows', category: 'TherEx' },
  { value: 'Lat Pulldowns', label: 'Lat Pulldowns', category: 'TherEx' },
  { value: 'Bicep Curls', label: 'Bicep Curls', category: 'TherEx' },
  { value: 'Tricep Extensions', label: 'Tricep Extensions', category: 'TherEx' },
  { value: 'Shoulder Flexion', label: 'Shoulder Flexion', category: 'TherEx' },
  { value: 'Shoulder Abduction', label: 'Shoulder Abduction', category: 'TherEx' },
  { value: 'Shoulder Internal Rotation', label: 'Shoulder Internal Rotation', category: 'TherEx' },
  { value: 'Shoulder External Rotation', label: 'Shoulder External Rotation', category: 'TherEx' },
  { value: 'Wall Walks', label: 'Wall Walks', category: 'TherEx' },
  { value: 'Pendulums', label: 'Pendulums', category: 'TherEx' },
  { value: 'Pulleys', label: 'Pulleys', category: 'TherEx' },
  { value: 'Wand Exercises', label: 'Wand Exercises', category: 'TherEx' },
  { value: 'Finger Walks', label: 'Finger Walks', category: 'TherEx' },
  { value: 'Wrist Flexion', label: 'Wrist Flexion', category: 'TherEx' },
  { value: 'Wrist Extension', label: 'Wrist Extension', category: 'TherEx' },
  { value: 'Wrist Radial Deviation', label: 'Wrist Radial Deviation', category: 'TherEx' },
  { value: 'Wrist Ulnar Deviation', label: 'Wrist Ulnar Deviation', category: 'TherEx' },
  { value: 'Grip Strengthening', label: 'Grip Strengthening', category: 'TherEx' },
  { value: 'Putty Exercises', label: 'Putty Exercises', category: 'TherEx' },
  { value: 'Tendon Gliding', label: 'Tendon Gliding', category: 'TherEx' },
  { value: 'Nerve Gliding', label: 'Nerve Gliding', category: 'TherEx' },
  { value: 'Core Stabilization', label: 'Core Stabilization', category: 'TherEx' },
  { value: 'Planks', label: 'Planks', category: 'TherEx' },
  { value: 'Side Planks', label: 'Side Planks', category: 'TherEx' },
  { value: 'Bird Dog', label: 'Bird Dog', category: 'TherEx' },
  { value: 'Dead Bug', label: 'Dead Bug', category: 'TherEx' },
  { value: 'Pelvic Tilts', label: 'Pelvic Tilts', category: 'TherEx' },
  {
    value: 'Transverse Abdominis Activation',
    label: 'Transverse Abdominis Activation',
    category: 'TherEx',
  },
  { value: 'Multifidus Activation', label: 'Multifidus Activation', category: 'TherEx' },
  { value: 'Kegels', label: 'Kegels', category: 'TherEx' },
  { value: 'Diaphragmatic Breathing', label: 'Diaphragmatic Breathing', category: 'TherEx' },
  { value: 'Pursed Lip Breathing', label: 'Pursed Lip Breathing', category: 'TherEx' },
  { value: 'Incentive Spirometry', label: 'Incentive Spirometry', category: 'TherEx' },
  { value: 'Coughing Techniques', label: 'Coughing Techniques', category: 'TherEx' },
  { value: 'Postural Drainage', label: 'Postural Drainage', category: 'TherEx' },

  // Manual Therapy
  { value: 'Percussion', label: 'Percussion', category: 'Manual Therapy' },
  { value: 'Vibration', label: 'Vibration', category: 'Manual Therapy' },
  { value: 'Shaking', label: 'Shaking', category: 'Manual Therapy' },
  { value: 'Rib Springing', label: 'Rib Springing', category: 'Manual Therapy' },
  {
    value: 'Joint Mobilization (Grade I-IV)',
    label: 'Joint Mobilization (Grade I-IV)',
    category: 'Manual Therapy',
  },
  {
    value: 'Joint Manipulation (Grade V)',
    label: 'Joint Manipulation (Grade V)',
    category: 'Manual Therapy',
  },
  {
    value: 'Soft Tissue Mobilization',
    label: 'Soft Tissue Mobilization',
    category: 'Manual Therapy',
  },
  { value: 'Myofascial Release', label: 'Myofascial Release', category: 'Manual Therapy' },
  { value: 'Trigger Point Release', label: 'Trigger Point Release', category: 'Manual Therapy' },
  { value: 'Friction Massage', label: 'Friction Massage', category: 'Manual Therapy' },
  {
    value: 'Instrument Assisted Soft Tissue Mobilization (IASTM)',
    label: 'Instrument Assisted Soft Tissue Mobilization (IASTM)',
    category: 'Manual Therapy',
  },
  { value: 'Cupping', label: 'Cupping', category: 'Manual Therapy' },
  { value: 'Dry Needling', label: 'Dry Needling', category: 'Manual Therapy' },
  {
    value: 'Muscle Energy Technique (MET)',
    label: 'Muscle Energy Technique (MET)',
    category: 'Manual Therapy',
  },
  { value: 'Strain-Counterstrain', label: 'Strain-Counterstrain', category: 'Manual Therapy' },
  { value: 'Craniosacral Therapy', label: 'Craniosacral Therapy', category: 'Manual Therapy' },
  { value: 'Visceral Manipulation', label: 'Visceral Manipulation', category: 'Manual Therapy' },
  { value: 'Lymphatic Drainage', label: 'Lymphatic Drainage', category: 'Manual Therapy' },
  { value: 'Traction (Manual)', label: 'Traction (Manual)', category: 'Manual Therapy' },

  // Modalities
  { value: 'Traction (Mechanical)', label: 'Traction (Mechanical)', category: 'Modalities' },
  { value: 'Hot Pack', label: 'Hot Pack', category: 'Modalities' },
  { value: 'Cold Pack', label: 'Cold Pack', category: 'Modalities' },
  { value: 'Ice Massage', label: 'Ice Massage', category: 'Modalities' },
  { value: 'Vapocoolant Spray', label: 'Vapocoolant Spray', category: 'Modalities' },
  { value: 'Paraffin Bath', label: 'Paraffin Bath', category: 'Modalities' },
  { value: 'Fluidotherapy', label: 'Fluidotherapy', category: 'Modalities' },
  { value: 'Ultrasound', label: 'Ultrasound', category: 'Modalities' },
  { value: 'Phonophoresis', label: 'Phonophoresis', category: 'Modalities' },
  { value: 'Diathermy', label: 'Diathermy', category: 'Modalities' },
  { value: 'Infrared', label: 'Infrared', category: 'Modalities' },
  { value: 'Ultraviolet', label: 'Ultraviolet', category: 'Modalities' },
  { value: 'Laser Therapy', label: 'Laser Therapy', category: 'Modalities' },
  {
    value: 'Electrical Stimulation (TENS)',
    label: 'Electrical Stimulation (TENS)',
    category: 'Modalities',
  },
  {
    value: 'Electrical Stimulation (NMES)',
    label: 'Electrical Stimulation (NMES)',
    category: 'Modalities',
  },
  {
    value: 'Electrical Stimulation (FES)',
    label: 'Electrical Stimulation (FES)',
    category: 'Modalities',
  },
  {
    value: 'Electrical Stimulation (IFC)',
    label: 'Electrical Stimulation (IFC)',
    category: 'Modalities',
  },
  {
    value: 'Electrical Stimulation (High Volt)',
    label: 'Electrical Stimulation (High Volt)',
    category: 'Modalities',
  },
  {
    value: 'Electrical Stimulation (Russian)',
    label: 'Electrical Stimulation (Russian)',
    category: 'Modalities',
  },
  {
    value: 'Electrical Stimulation (Microcurrent)',
    label: 'Electrical Stimulation (Microcurrent)',
    category: 'Modalities',
  },
  { value: 'Iontophoresis', label: 'Iontophoresis', category: 'Modalities' },
  { value: 'Biofeedback', label: 'Biofeedback', category: 'Modalities' },
  { value: 'Compression (Pneumatic)', label: 'Compression (Pneumatic)', category: 'Modalities' },
  { value: 'Compression (Garments)', label: 'Compression (Garments)', category: 'Modalities' },
  { value: 'Compression (Bandaging)', label: 'Compression (Bandaging)', category: 'Modalities' },

  // Gait Training
  {
    value: 'Assistive Device Training',
    label: 'Assistive Device Training',
    category: 'Gait Training',
  },
  {
    value: 'Gait Training (Level Surfaces)',
    label: 'Gait Training (Level Surfaces)',
    category: 'Gait Training',
  },
  {
    value: 'Gait Training (Uneven Surfaces)',
    label: 'Gait Training (Uneven Surfaces)',
    category: 'Gait Training',
  },
  { value: 'Gait Training (Stairs)', label: 'Gait Training (Stairs)', category: 'Gait Training' },
  { value: 'Gait Training (Curbs)', label: 'Gait Training (Curbs)', category: 'Gait Training' },
  { value: 'Gait Training (Ramps)', label: 'Gait Training (Ramps)', category: 'Gait Training' },
  {
    value: 'Gait Training (Obstacles)',
    label: 'Gait Training (Obstacles)',
    category: 'Gait Training',
  },
  {
    value: 'Gait Training (Treadmill)',
    label: 'Gait Training (Treadmill)',
    category: 'Gait Training',
  },
  {
    value: 'Gait Training (Overground)',
    label: 'Gait Training (Overground)',
    category: 'Gait Training',
  },
  {
    value: 'Gait Training (Body Weight Supported)',
    label: 'Gait Training (Body Weight Supported)',
    category: 'Gait Training',
  },
  { value: 'Gait Training (Robotic)', label: 'Gait Training (Robotic)', category: 'Gait Training' },
  {
    value: 'Gait Training (Virtual Reality)',
    label: 'Gait Training (Virtual Reality)',
    category: 'Gait Training',
  },

  // Neuromuscular Re-education
  {
    value: 'Balance Training (Static)',
    label: 'Balance Training (Static)',
    category: 'Neuromuscular Re-ed',
  },
  {
    value: 'Balance Training (Dynamic)',
    label: 'Balance Training (Dynamic)',
    category: 'Neuromuscular Re-ed',
  },
  {
    value: 'Balance Training (Reactive)',
    label: 'Balance Training (Reactive)',
    category: 'Neuromuscular Re-ed',
  },
  {
    value: 'Balance Training (Anticipatory)',
    label: 'Balance Training (Anticipatory)',
    category: 'Neuromuscular Re-ed',
  },
  {
    value: 'Balance Training (Perturbations)',
    label: 'Balance Training (Perturbations)',
    category: 'Neuromuscular Re-ed',
  },
  {
    value: 'Balance Training (Dual Task)',
    label: 'Balance Training (Dual Task)',
    category: 'Neuromuscular Re-ed',
  },
  {
    value: 'Balance Training (Eyes Closed)',
    label: 'Balance Training (Eyes Closed)',
    category: 'Neuromuscular Re-ed',
  },
  {
    value: 'Balance Training (Foam)',
    label: 'Balance Training (Foam)',
    category: 'Neuromuscular Re-ed',
  },
  {
    value: 'Balance Training (BOSU)',
    label: 'Balance Training (BOSU)',
    category: 'Neuromuscular Re-ed',
  },
  {
    value: 'Balance Training (Wobble Board)',
    label: 'Balance Training (Wobble Board)',
    category: 'Neuromuscular Re-ed',
  },
  {
    value: 'Balance Training (Rocker Board)',
    label: 'Balance Training (Rocker Board)',
    category: 'Neuromuscular Re-ed',
  },
  {
    value: 'Balance Training (Swiss Ball)',
    label: 'Balance Training (Swiss Ball)',
    category: 'Neuromuscular Re-ed',
  },
  {
    value: 'Balance Training (Trampoline)',
    label: 'Balance Training (Trampoline)',
    category: 'Neuromuscular Re-ed',
  },
  {
    value: 'Proprioceptive Training',
    label: 'Proprioceptive Training',
    category: 'Neuromuscular Re-ed',
  },
  { value: 'Kinesthetic Training', label: 'Kinesthetic Training', category: 'Neuromuscular Re-ed' },
  {
    value: 'Coordination Training',
    label: 'Coordination Training',
    category: 'Neuromuscular Re-ed',
  },
  { value: 'Agility Training', label: 'Agility Training', category: 'Neuromuscular Re-ed' },
  { value: 'Plyometrics', label: 'Plyometrics', category: 'Neuromuscular Re-ed' },
  {
    value: 'PNF (Proprioceptive Neuromuscular Facilitation)',
    label: 'PNF (Proprioceptive Neuromuscular Facilitation)',
    category: 'Neuromuscular Re-ed',
  },
  {
    value: 'NDT (Neuro-Developmental Treatment)',
    label: 'NDT (Neuro-Developmental Treatment)',
    category: 'Neuromuscular Re-ed',
  },
  { value: 'Brunnstrom Approach', label: 'Brunnstrom Approach', category: 'Neuromuscular Re-ed' },
  { value: 'Rood Approach', label: 'Rood Approach', category: 'Neuromuscular Re-ed' },
  { value: 'Bobath Concept', label: 'Bobath Concept', category: 'Neuromuscular Re-ed' },
  { value: 'Vojta Method', label: 'Vojta Method', category: 'Neuromuscular Re-ed' },
  {
    value: 'Constraint-Induced Movement Therapy (CIMT)',
    label: 'Constraint-Induced Movement Therapy (CIMT)',
    category: 'Neuromuscular Re-ed',
  },
  { value: 'Mirror Therapy', label: 'Mirror Therapy', category: 'Neuromuscular Re-ed' },
  { value: 'Mental Practice', label: 'Mental Practice', category: 'Neuromuscular Re-ed' },
  { value: 'Motor Imagery', label: 'Motor Imagery', category: 'Neuromuscular Re-ed' },
  {
    value: 'Task-Specific Training',
    label: 'Task-Specific Training',
    category: 'Neuromuscular Re-ed',
  },
  { value: 'Functional Training', label: 'Functional Training', category: 'Neuromuscular Re-ed' },
  {
    value: 'Activities of Daily Living (ADL) Training',
    label: 'Activities of Daily Living (ADL) Training',
    category: 'Neuromuscular Re-ed',
  },
  {
    value: 'Instrumental Activities of Daily Living (IADL) Training',
    label: 'Instrumental Activities of Daily Living (IADL) Training',
    category: 'Neuromuscular Re-ed',
  },

  // Other
  { value: 'Taping (Kinesio)', label: 'Taping (Kinesio)', category: 'Other' },
  { value: 'Taping (McConnell)', label: 'Taping (McConnell)', category: 'Other' },
  { value: 'Taping (Athletic)', label: 'Taping (Athletic)', category: 'Other' },
  { value: 'Bracing', label: 'Bracing', category: 'Other' },
  { value: 'Splinting', label: 'Splinting', category: 'Other' },
  { value: 'Orthotics', label: 'Orthotics', category: 'Other' },
  { value: 'Prosthetics', label: 'Prosthetics', category: 'Other' },
  { value: 'Work Conditioning', label: 'Work Conditioning', category: 'Other' },
  { value: 'Work Hardening', label: 'Work Hardening', category: 'Other' },
  { value: 'Ergonomic Training', label: 'Ergonomic Training', category: 'Other' },
  { value: 'Body Mechanics Training', label: 'Body Mechanics Training', category: 'Other' },
  { value: 'Postural Training', label: 'Postural Training', category: 'Other' },
  { value: 'Transfer Training', label: 'Transfer Training', category: 'Other' },
  { value: 'Bed Mobility Training', label: 'Bed Mobility Training', category: 'Other' },
  {
    value: 'Wheelchair Mobility Training',
    label: 'Wheelchair Mobility Training',
    category: 'Other',
  },
  { value: 'Fall Prevention Training', label: 'Fall Prevention Training', category: 'Other' },
  { value: 'Safety Training', label: 'Safety Training', category: 'Other' },
  {
    value: 'Energy Conservation Training',
    label: 'Energy Conservation Training',
    category: 'Other',
  },
  { value: 'Joint Protection Training', label: 'Joint Protection Training', category: 'Other' },
  { value: 'Pacing Techniques', label: 'Pacing Techniques', category: 'Other' },
  { value: 'Relaxation Techniques', label: 'Relaxation Techniques', category: 'Other' },
  { value: 'Stress Management', label: 'Stress Management', category: 'Other' },
  { value: 'Pain Management', label: 'Pain Management', category: 'Other' },
  {
    value: 'Cognitive Behavioral Therapy (CBT) Principles',
    label: 'Cognitive Behavioral Therapy (CBT) Principles',
    category: 'Other',
  },
  {
    value: 'Motivational Interviewing Principles',
    label: 'Motivational Interviewing Principles',
    category: 'Other',
  },
  { value: 'Patient Education', label: 'Patient Education', category: 'Other' },
  { value: 'Family/Caregiver Education', label: 'Family/Caregiver Education', category: 'Other' },
  {
    value: 'Home Exercise Program (HEP) Instruction',
    label: 'Home Exercise Program (HEP) Instruction',
    category: 'Other',
  },
  { value: 'Discharge Planning', label: 'Discharge Planning', category: 'Other' },
  { value: 'Equipment Prescription', label: 'Equipment Prescription', category: 'Other' },
  { value: 'Environmental Modification', label: 'Environmental Modification', category: 'Other' },
  { value: 'Community Reintegration', label: 'Community Reintegration', category: 'Other' },
  { value: 'Return to Sport/Play', label: 'Return to Sport/Play', category: 'Other' },
  { value: 'Return to Work', label: 'Return to Work', category: 'Other' },
];

// ─── CPT Codes (38 entries) ───

export const PT_CPT_CODES: CPTCode[] = [
  // ── Therapeutic Procedures (timed, 15-min) ──
  {
    value: '97110',
    label: '97110 - Therapeutic Exercise',
    description: 'Therapeutic exercises to develop strength, endurance, ROM, and flexibility',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97112',
    label: '97112 - Neuromuscular Re-education',
    description:
      'Neuromuscular reeducation of movement, balance, coordination, kinesthetic sense, posture, proprioception',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97116',
    label: '97116 - Gait Training',
    description: 'Gait training (includes stair climbing)',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97140',
    label: '97140 - Manual Therapy',
    description:
      'Manual therapy techniques (mobilization/manipulation, manual lymphatic drainage, manual traction)',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97530',
    label: '97530 - Therapeutic Activities',
    description: 'Dynamic activities to improve functional performance, direct one-on-one contact',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97535',
    label: '97535 - Self-Care / Home Mgmt Training',
    description:
      'ADL and compensatory training, meal preparation, safety procedures, assistive technology instruction',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97113',
    label: '97113 - Aquatic Therapy',
    description: 'Aquatic therapy with therapeutic exercises',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97124',
    label: '97124 - Massage',
    description: 'Massage including effleurage, petrissage and/or tapotement',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97542',
    label: '97542 - Wheelchair Management',
    description: 'Wheelchair assessment, fitting, and training',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97150',
    label: '97150 - Group Therapy',
    description: 'Therapeutic procedure(s), group (2 or more individuals)',
    timed: false,
    category: 'therapeutic',
  },
  {
    value: '97139',
    label: '97139 - Unlisted Therapeutic Procedure',
    description: 'Unlisted therapeutic procedure (specify)',
    timed: false,
    category: 'therapeutic',
  },
  // ── Evaluations (untimed) ──
  {
    value: '97161',
    label: '97161 - PT Eval: Low Complexity',
    description: 'Physical therapy evaluation: low complexity',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '97162',
    label: '97162 - PT Eval: Moderate Complexity',
    description: 'Physical therapy evaluation: moderate complexity',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '97163',
    label: '97163 - PT Eval: High Complexity',
    description: 'Physical therapy evaluation: high complexity',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '97164',
    label: '97164 - PT Re-evaluation',
    description: 'Re-evaluation of physical therapy established plan of care',
    timed: false,
    category: 'evaluation',
  },
  // ── Supervised Modalities (untimed) ──
  {
    value: '97010',
    label: '97010 - Hot/Cold Packs',
    description: 'Application of hot or cold packs',
    timed: false,
    category: 'modality-supervised',
  },
  {
    value: '97012',
    label: '97012 - Mechanical Traction',
    description: 'Mechanical traction',
    timed: false,
    category: 'modality-supervised',
  },
  {
    value: '97014',
    label: '97014 - Electrical Stimulation (Unattended)',
    description: 'Electrical stimulation (unattended)',
    timed: false,
    category: 'modality-supervised',
  },
  {
    value: '97016',
    label: '97016 - Vasopneumatic Device',
    description: 'Vasopneumatic devices (compression therapy)',
    timed: false,
    category: 'modality-supervised',
  },
  {
    value: '97018',
    label: '97018 - Paraffin Bath',
    description: 'Paraffin bath',
    timed: false,
    category: 'modality-supervised',
  },
  {
    value: '97022',
    label: '97022 - Whirlpool',
    description: 'Whirlpool',
    timed: false,
    category: 'modality-supervised',
  },
  {
    value: '97039',
    label: '97039 - Unlisted Modality',
    description: 'Unlisted modality (specify type and time if constant attendance)',
    timed: false,
    category: 'modality-supervised',
  },
  // ── Constant Attendance Modalities (timed, 15-min) ──
  {
    value: '97032',
    label: '97032 - E-Stim (Manual / Attended)',
    description: 'Electrical stimulation (manual), constant attendance',
    timed: true,
    category: 'modality-constant',
  },
  {
    value: '97033',
    label: '97033 - Iontophoresis',
    description: 'Iontophoresis, constant attendance',
    timed: true,
    category: 'modality-constant',
  },
  {
    value: '97034',
    label: '97034 - Contrast Baths',
    description: 'Contrast baths, constant attendance',
    timed: true,
    category: 'modality-constant',
  },
  {
    value: '97035',
    label: '97035 - Ultrasound',
    description: 'Ultrasound, constant attendance',
    timed: true,
    category: 'modality-constant',
  },
  // ── Testing & Measurement (timed) ──
  {
    value: '97750',
    label: '97750 - Physical Performance Test',
    description: 'Physical performance test or measurement with written report',
    timed: true,
    category: 'testing',
  },
  {
    value: '97755',
    label: '97755 - Assistive Technology Assessment',
    description: 'Assistive technology assessment with written report',
    timed: true,
    category: 'testing',
  },
  {
    value: '95831',
    label: '95831 - Muscle Testing, Manual',
    description: 'Manual muscle testing with report; extremity (excluding hand) or trunk',
    timed: false,
    category: 'testing',
  },
  {
    value: '95852',
    label: '95852 - Range of Motion Measurements',
    description: 'Range of motion measurements and report; each additional joint',
    timed: false,
    category: 'testing',
  },
  // ── Orthotic / Prosthetic (timed) ──
  {
    value: '97760',
    label: '97760 - Orthotic Mgmt & Training (Initial)',
    description: 'Orthotic management and training, initial encounter',
    timed: true,
    category: 'ortho-prosthetic',
  },
  {
    value: '97761',
    label: '97761 - Prosthetic Training (Initial)',
    description: 'Prosthetic training, upper and/or lower extremity, initial encounter',
    timed: true,
    category: 'ortho-prosthetic',
  },
  {
    value: '97763',
    label: '97763 - Orthotic/Prosthetic Mgmt (Subsequent)',
    description: 'Follow-up orthotic or prosthetic management and patient training',
    timed: true,
    category: 'ortho-prosthetic',
  },
  {
    value: '29125',
    label: '29125 - Short Arm Splint (Static)',
    description: 'Application of short arm splint (forearm to hand); static',
    timed: false,
    category: 'ortho-prosthetic',
  },
  {
    value: '29126',
    label: '29126 - Short Arm Splint (Dynamic)',
    description: 'Application of short arm splint (forearm to hand); dynamic',
    timed: false,
    category: 'ortho-prosthetic',
  },
  // ── Wound Care ──
  {
    value: '97597',
    label: '97597 - Debridement (first 20 sq cm)',
    description: 'Debridement, open wound, first 20 sq cm or less',
    timed: false,
    category: 'wound',
  },
  {
    value: '97598',
    label: '97598 - Debridement (each addtl 20 sq cm)',
    description: 'Debridement, open wound, each additional 20 sq cm',
    timed: false,
    category: 'wound',
  },
  // ── Other ──
  {
    value: '95992',
    label: '95992 - Canalith Repositioning',
    description: 'Vestibular treatment for BPPV using repositioning maneuvers (Epley, Semont)',
    timed: false,
    category: 'other',
  },
];

// ─── ICD-10 Codes (106 entries) ───

export const PT_ICD10_CODES: ICD10Code[] = [
  // Low Back Pain
  { value: 'M54.5', label: 'M54.5 - Low back pain', description: 'Low back pain, unspecified' },
  {
    value: 'M51.36',
    label: 'M51.36 - Other intervertebral disc degeneration, lumbar region',
    description: 'Disc degeneration in lumbar spine',
  },
  {
    value: 'M54.16',
    label: 'M54.16 - Radiculopathy, lumbar region',
    description: 'Nerve root compression in lumbar spine',
  },
  // Neck Pain
  { value: 'M54.2', label: 'M54.2 - Cervicalgia', description: 'Neck pain, unspecified' },
  {
    value: 'M50.30',
    label: 'M50.30 - Other cervical disc degeneration',
    description: 'Cervical disc degeneration',
  },
  {
    value: 'M54.12',
    label: 'M54.12 - Radiculopathy, cervical region',
    description: 'Nerve root compression in cervical spine',
  },
  // Shoulder Conditions
  {
    value: 'M75.41',
    label: 'M75.41 - Impingement syndrome of right shoulder',
    description: 'Impingement syndrome, right shoulder',
  },
  {
    value: 'M75.42',
    label: 'M75.42 - Impingement syndrome of left shoulder',
    description: 'Impingement syndrome, left shoulder',
  },
  {
    value: 'M75.21',
    label: 'M75.21 - Bicipital tendinitis, right shoulder',
    description: 'Bicipital tendinitis, right shoulder',
  },
  {
    value: 'M75.22',
    label: 'M75.22 - Bicipital tendinitis, left shoulder',
    description: 'Bicipital tendinitis, left shoulder',
  },
  {
    value: 'M25.511',
    label: 'M25.511 - Pain in right shoulder',
    description: 'Right shoulder pain, unspecified cause',
  },
  {
    value: 'M25.512',
    label: 'M25.512 - Pain in left shoulder',
    description: 'Left shoulder pain, unspecified cause',
  },
  {
    value: 'M75.30',
    label: 'M75.30 - Calcific tendinitis of unspecified shoulder',
    description: 'Calcific deposits in shoulder tendons',
  },
  {
    value: 'M75.100',
    label: 'M75.100 - Unspecified rotator cuff tear',
    description: 'Rotator cuff pathology',
  },
  {
    value: 'M75.101',
    label: 'M75.101 - Rotator cuff tear, right shoulder',
    description: 'Rotator cuff tear, right shoulder',
  },
  {
    value: 'M75.102',
    label: 'M75.102 - Rotator cuff tear, left shoulder',
    description: 'Rotator cuff tear, left shoulder',
  },
  {
    value: 'M75.111',
    label: 'M75.111 - Incomplete rotator cuff tear, right shoulder',
    description: 'Partial thickness rotator cuff tear, right shoulder',
  },
  {
    value: 'M75.112',
    label: 'M75.112 - Incomplete rotator cuff tear, left shoulder',
    description: 'Partial thickness rotator cuff tear, left shoulder',
  },
  {
    value: 'M75.121',
    label: 'M75.121 - Complete rotator cuff tear, right shoulder',
    description: 'Full thickness rotator cuff tear, right shoulder',
  },
  {
    value: 'M75.122',
    label: 'M75.122 - Complete rotator cuff tear, left shoulder',
    description: 'Full thickness rotator cuff tear, left shoulder',
  },
  {
    value: 'M75.01',
    label: 'M75.01 - Adhesive capsulitis of right shoulder',
    description: 'Frozen shoulder, right side',
  },
  {
    value: 'M75.02',
    label: 'M75.02 - Adhesive capsulitis of left shoulder',
    description: 'Frozen shoulder, left side',
  },
  {
    value: 'S43.401A',
    label: 'S43.401A - Sprain of right shoulder joint, initial',
    description: 'Right shoulder sprain, first treatment',
  },
  {
    value: 'S43.402A',
    label: 'S43.402A - Sprain of left shoulder joint, initial',
    description: 'Left shoulder sprain, first treatment',
  },
  {
    value: 'M19.011',
    label: 'M19.011 - Primary osteoarthritis, right shoulder',
    description: 'Shoulder osteoarthritis, right side',
  },
  {
    value: 'M19.012',
    label: 'M19.012 - Primary osteoarthritis, left shoulder',
    description: 'Shoulder osteoarthritis, left side',
  },
  {
    value: 'S42.201A',
    label: 'S42.201A - Fracture of upper end of right humerus, initial',
    description: 'Proximal humerus fracture, right, initial treatment',
  },
  // Elbow Conditions
  {
    value: 'M77.11',
    label: 'M77.11 - Lateral epicondylitis, right elbow',
    description: 'Tennis elbow, right side',
  },
  {
    value: 'M77.12',
    label: 'M77.12 - Lateral epicondylitis, left elbow',
    description: 'Tennis elbow, left side',
  },
  {
    value: 'M77.01',
    label: 'M77.01 - Medial epicondylitis, right elbow',
    description: "Golfer's elbow, right side",
  },
  {
    value: 'M77.02',
    label: 'M77.02 - Medial epicondylitis, left elbow',
    description: "Golfer's elbow, left side",
  },
  {
    value: 'M25.521',
    label: 'M25.521 - Pain in right elbow',
    description: 'Right elbow pain, unspecified cause',
  },
  {
    value: 'M25.522',
    label: 'M25.522 - Pain in left elbow',
    description: 'Left elbow pain, unspecified cause',
  },
  {
    value: 'S53.401A',
    label: 'S53.401A - Sprain of right elbow, initial',
    description: 'Right elbow sprain, first treatment',
  },
  {
    value: 'S53.402A',
    label: 'S53.402A - Sprain of left elbow, initial',
    description: 'Left elbow sprain, first treatment',
  },
  {
    value: 'M19.021',
    label: 'M19.021 - Primary osteoarthritis, right elbow',
    description: 'Elbow osteoarthritis, right side',
  },
  {
    value: 'M19.022',
    label: 'M19.022 - Primary osteoarthritis, left elbow',
    description: 'Elbow osteoarthritis, left side',
  },
  // Wrist and Hand Conditions
  {
    value: 'M25.531',
    label: 'M25.531 - Pain in right wrist',
    description: 'Right wrist pain, unspecified cause',
  },
  {
    value: 'M25.532',
    label: 'M25.532 - Pain in left wrist',
    description: 'Left wrist pain, unspecified cause',
  },
  {
    value: 'M25.541',
    label: 'M25.541 - Pain in joints of right hand',
    description: 'Right hand joint pain, unspecified cause',
  },
  {
    value: 'M25.542',
    label: 'M25.542 - Pain in joints of left hand',
    description: 'Left hand joint pain, unspecified cause',
  },
  {
    value: 'G56.01',
    label: 'G56.01 - Carpal tunnel syndrome, right upper limb',
    description: 'Median nerve compression at wrist, right side',
  },
  {
    value: 'G56.02',
    label: 'G56.02 - Carpal tunnel syndrome, left upper limb',
    description: 'Median nerve compression at wrist, left side',
  },
  {
    value: 'M65.311',
    label: 'M65.311 - Trigger finger, right index finger',
    description: 'Stenosing tenosynovitis, right index finger',
  },
  {
    value: 'M65.30',
    label: 'M65.30 - Trigger finger, unspecified finger',
    description: 'Stenosing tenosynovitis, unspecified digit',
  },
  {
    value: 'M65.841',
    label: 'M65.841 - Tenosynovitis, right hand',
    description: "de Quervain's tenosynovitis / hand tendinitis, right",
  },
  {
    value: 'M65.842',
    label: 'M65.842 - Tenosynovitis, left hand',
    description: "de Quervain's tenosynovitis / hand tendinitis, left",
  },
  {
    value: 'S63.501A',
    label: 'S63.501A - Sprain of right wrist, initial',
    description: 'Right wrist sprain, first treatment',
  },
  {
    value: 'S63.502A',
    label: 'S63.502A - Sprain of left wrist, initial',
    description: 'Left wrist sprain, first treatment',
  },
  {
    value: 'S62.101A',
    label: 'S62.101A - Fracture of carpal bone, right wrist, initial',
    description: 'Carpal fracture, right wrist, initial treatment',
  },
  {
    value: 'S62.102A',
    label: 'S62.102A - Fracture of carpal bone, left wrist, initial',
    description: 'Carpal fracture, left wrist, initial treatment',
  },
  {
    value: 'M18.11',
    label: 'M18.11 - Primary OA, right first CMC joint',
    description: 'Thumb CMC osteoarthritis, right side',
  },
  {
    value: 'M18.12',
    label: 'M18.12 - Primary OA, left first CMC joint',
    description: 'Thumb CMC osteoarthritis, left side',
  },
  {
    value: 'M72.0',
    label: "M72.0 - Palmar fascial fibromatosis (Dupuytren's)",
    description: "Dupuytren's contracture",
  },
  // Knee Conditions
  {
    value: 'M25.561',
    label: 'M25.561 - Pain in right knee',
    description: 'Right knee pain, unspecified cause',
  },
  {
    value: 'M25.562',
    label: 'M25.562 - Pain in left knee',
    description: 'Left knee pain, unspecified cause',
  },
  {
    value: 'M17.10',
    label: 'M17.10 - Unilateral primary osteoarthritis, unspecified knee',
    description: 'Knee osteoarthritis, one side',
  },
  {
    value: 'S83.511A',
    label: 'S83.511A - ACL sprain, right knee, initial',
    description: 'ACL injury, right knee, first treatment',
  },
  {
    value: 'S83.512A',
    label: 'S83.512A - ACL sprain, left knee, initial',
    description: 'ACL injury, left knee, first treatment',
  },
  {
    value: 'S83.521A',
    label: 'S83.521A - PCL sprain, right knee, initial',
    description: 'PCL injury, right knee, first treatment',
  },
  {
    value: 'M22.41',
    label: 'M22.41 - Chondromalacia patellae, right knee',
    description: "Patellofemoral syndrome / runner's knee, right side",
  },
  {
    value: 'M22.42',
    label: 'M22.42 - Chondromalacia patellae, left knee',
    description: "Patellofemoral syndrome / runner's knee, left side",
  },
  {
    value: 'S83.241A',
    label: 'S83.241A - Medial meniscus tear, right knee, initial',
    description: 'Medial meniscus tear, right knee',
  },
  // Hip Conditions
  {
    value: 'M25.551',
    label: 'M25.551 - Pain in right hip',
    description: 'Right hip pain, unspecified cause',
  },
  {
    value: 'M25.552',
    label: 'M25.552 - Pain in left hip',
    description: 'Left hip pain, unspecified cause',
  },
  {
    value: 'M16.10',
    label: 'M16.10 - Unilateral primary osteoarthritis, unspecified hip',
    description: 'Hip osteoarthritis, one side',
  },
  // General Musculoskeletal
  {
    value: 'M79.3',
    label: 'M79.3 - Panniculitis, unspecified',
    description: 'Inflammation of subcutaneous fat tissue',
  },
  {
    value: 'M62.81',
    label: 'M62.81 - Muscle weakness (generalized)',
    description: 'Generalized muscle weakness',
  },
  {
    value: 'M25.50',
    label: 'M25.50 - Pain in unspecified joint',
    description: 'Joint pain, location not specified',
  },
  { value: 'M79.1', label: 'M79.1 - Myalgia', description: 'Muscle pain, unspecified' },
  { value: 'M79.7', label: 'M79.7 - Fibromyalgia', description: 'Fibromyalgia syndrome' },
  // Thoracic Spine
  {
    value: 'M54.6',
    label: 'M54.6 - Pain in thoracic spine',
    description: 'Thoracic back pain, unspecified',
  },
  {
    value: 'M54.14',
    label: 'M54.14 - Radiculopathy, thoracic region',
    description: 'Nerve root compression in thoracic spine',
  },
  // Ankle/Foot Conditions
  {
    value: 'M25.571',
    label: 'M25.571 - Pain in right ankle/foot',
    description: 'Right ankle/foot pain',
  },
  {
    value: 'M25.572',
    label: 'M25.572 - Pain in left ankle/foot',
    description: 'Left ankle/foot pain',
  },
  {
    value: 'S93.401A',
    label: 'S93.401A - Sprain of right ankle, initial',
    description: 'Right ankle sprain, first treatment',
  },
  // Balance and Gait
  {
    value: 'R26.81',
    label: 'R26.81 - Unsteadiness on feet',
    description: 'Balance impairment, unsteadiness',
  },
  {
    value: 'R26.2',
    label: 'R26.2 - Difficulty in walking',
    description: 'Walking difficulty, gait dysfunction',
  },
  {
    value: 'R29.6',
    label: 'R29.6 - Repeated falls',
    description: 'History of recurrent falls, fall risk',
  },
  // Neurologic Conditions
  {
    value: 'I63.9',
    label: 'I63.9 - Cerebral infarction, unspecified',
    description: 'Stroke / cerebral infarction, unspecified',
  },
  {
    value: 'I69.398',
    label: 'I69.398 - Other sequelae of cerebral infarction',
    description: 'Late effects of stroke such as weakness, spasticity, or sensory loss',
  },
  {
    value: 'I69.351',
    label: 'I69.351 - Hemiplegia following cerebral infarction, right dominant',
    description: 'Post-stroke hemiparesis / hemiplegia, right dominant side',
  },
  {
    value: 'G45.9',
    label: 'G45.9 - Transient cerebral ischemic attack',
    description: 'Transient ischemic attack (TIA)',
  },
  {
    value: 'G20.A1',
    label: "G20.A1 - Parkinson's disease without dyskinesia",
    description: "Parkinson's disease without dyskinesia",
  },
  {
    value: 'G20.B1',
    label: "G20.B1 - Parkinson's disease with dyskinesia",
    description: "Parkinson's disease with dyskinesia",
  },
  {
    value: 'G82.20',
    label: 'G82.20 - Paraplegia, unspecified',
    description: 'Paraplegia / paraparesis, unspecified',
  },
  {
    value: 'G82.22',
    label: 'G82.22 - Paraplegia, incomplete',
    description: 'Incomplete paraplegia, often used in spinal cord injury rehab',
  },
  {
    value: 'G82.50',
    label: 'G82.50 - Quadriplegia, unspecified',
    description: 'Quadriplegia / tetraplegia, unspecified',
  },
  {
    value: 'G82.52',
    label: 'G82.52 - Quadriplegia, C1-C4 incomplete',
    description: 'Incomplete cervical tetraplegia',
  },
  {
    value: 'F07.81',
    label: 'F07.81 - Postconcussional syndrome',
    description: 'Persistent symptoms after concussion / mild TBI',
  },
  {
    value: 'S06.0X0S',
    label: 'S06.0X0S - Concussion without LOC, sequela',
    description: 'Concussion sequela without loss of consciousness',
  },
  {
    value: 'H81.10',
    label: 'H81.10 - Benign paroxysmal vertigo',
    description: 'Benign paroxysmal positional vertigo (BPPV)',
  },
  { value: 'G80.9', label: 'G80.9 - Cerebral palsy, unspecified', description: 'Cerebral palsy' },
  {
    value: 'G62.9',
    label: 'G62.9 - Polyneuropathy, unspecified',
    description: 'Peripheral neuropathy / polyneuropathy',
  },
  {
    value: 'G35.A',
    label: 'G35.A - Relapsing-remitting multiple sclerosis',
    description: 'Relapsing-remitting multiple sclerosis',
  },
  {
    value: 'G35.B0',
    label: 'G35.B0 - Primary progressive MS, unspecified',
    description: 'Primary progressive multiple sclerosis, unspecified activity',
  },
  {
    value: 'G35.B1',
    label: 'G35.B1 - Active primary progressive MS',
    description: 'Active primary progressive multiple sclerosis',
  },
  {
    value: 'G35.B2',
    label: 'G35.B2 - Non-active primary progressive MS',
    description: 'Non-active primary progressive multiple sclerosis',
  },
  {
    value: 'G35.C0',
    label: 'G35.C0 - Secondary progressive MS, unspecified',
    description: 'Secondary progressive multiple sclerosis, unspecified activity',
  },
  {
    value: 'G35.C1',
    label: 'G35.C1 - Active secondary progressive MS',
    description: 'Active secondary progressive multiple sclerosis',
  },
  {
    value: 'G35.C2',
    label: 'G35.C2 - Non-active secondary progressive MS',
    description: 'Non-active secondary progressive multiple sclerosis',
  },
  {
    value: 'G35.D',
    label: 'G35.D - Multiple sclerosis, unspecified',
    description: 'Multiple sclerosis, unspecified subtype',
  },
  // Post-Surgical / Aftercare
  {
    value: 'Z96.641',
    label: 'Z96.641 - Presence of right artificial hip joint',
    description: 'Status post right total hip replacement',
  },
  {
    value: 'Z96.642',
    label: 'Z96.642 - Presence of left artificial hip joint',
    description: 'Status post left total hip replacement',
  },
  {
    value: 'Z96.651',
    label: 'Z96.651 - Presence of right artificial knee joint',
    description: 'Status post right total knee replacement',
  },
  {
    value: 'Z96.652',
    label: 'Z96.652 - Presence of left artificial knee joint',
    description: 'Status post left total knee replacement',
  },
  {
    value: 'Z87.39',
    label: 'Z87.39 - History of musculoskeletal disorders',
    description: 'History of prior musculoskeletal conditions',
  },
  {
    value: 'Z48.89',
    label: 'Z48.89 - Other specified surgical aftercare',
    description: 'Post-operative rehabilitation encounter',
  },
];

// ─── Scoring functions ───

export function scoreCPTCode(item: CPTCode, query: string): number {
  const q = query.toLowerCase();
  const v = item.value.toLowerCase();
  const l = item.label.toLowerCase();
  const d = item.description.toLowerCase();
  if (v === q) return 100;
  if (v.startsWith(q)) return 90;
  if (l.startsWith(q)) return 80;
  if (l.includes(q)) return 60;
  if (d.includes(q)) return 40;
  return 0;
}

export function scoreICD10Code(item: ICD10Code, query: string): number {
  const q = query.toLowerCase();
  const v = item.value.toLowerCase();
  const l = item.label.toLowerCase();
  const d = item.description.toLowerCase();
  if (v === q) return 100;
  if (v.startsWith(q)) return 90;
  if (l.startsWith(q)) return 80;
  if (l.includes(q)) return 60;
  if (d.includes(q)) return 40;
  return 0;
}

// ─── Search scoring for interventions ───

export function scoreIntervention(item: PTIntervention, query: string): number {
  const q = query.toLowerCase();
  const v = item.value.toLowerCase();
  const l = item.label.toLowerCase();
  const c = item.category.toLowerCase();
  if (v === q) return 100;
  if (v.startsWith(q)) return 90;
  if (l.startsWith(q)) return 80;
  if (v.includes(q)) return 60;
  if (l.includes(q)) return 55;
  if (c.includes(q)) return 30;
  return 0;
}

export function searchInterventions(query: string, limit = 15): PTIntervention[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PT_INTERVENTIONS.map((item) => ({ ...item, _score: scoreIntervention(item, q) }))
    .filter((i) => i._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...item }) => item);
}
