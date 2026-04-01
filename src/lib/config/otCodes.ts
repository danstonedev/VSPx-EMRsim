// OT-specific billing code reference data — CPT and ICD-10
// Occupational Therapy codes for evaluation, treatment, and diagnosis
//
// Code vintage: CY2025 CMS Physician Fee Schedule / ICD-10-CM FY2025
// Last reviewed: 2026-04-01
// Next review:   After CMS CY2026 PFS final rule (~Nov 2025) and ICD-10-CM FY2026 (~Oct 2025)
// Source:        AMA CPT codebook; AOTA billing/coding resources
// NOTE: This is an educational simulator — codes are representative, not claims-grade.

import type { CPTCode, ICD10Code } from './ptCodes';

// ─── OT CPT Codes ───

export const OT_CPT_CODES: CPTCode[] = [
  // ── Evaluations (untimed) ──
  {
    value: '97165',
    label: '97165 - OT Evaluation, Low Complexity',
    description:
      'Occupational therapy evaluation, low complexity: occupational profile and medical/therapy history, 1-3 performance deficits, clinical decision making of low complexity',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '97166',
    label: '97166 - OT Evaluation, Moderate Complexity',
    description:
      'Occupational therapy evaluation, moderate complexity: occupational profile and medical/therapy history, 3-5 performance deficits, clinical decision making of moderate complexity',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '97167',
    label: '97167 - OT Evaluation, High Complexity',
    description:
      'Occupational therapy evaluation, high complexity: occupational profile and medical/therapy history, 5+ performance deficits, clinical decision making of high complexity',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '97168',
    label: '97168 - OT Re-evaluation',
    description:
      'Occupational therapy re-evaluation: reassessment of occupational profile, revised plan of care, updated goals',
    timed: false,
    category: 'evaluation',
  },

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
    value: '97537',
    label: '97537 - Community / Work Reintegration',
    description:
      'Community/work reintegration training (e.g., shopping, transportation, money management, work task analysis)',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97542',
    label: '97542 - Wheelchair Management',
    description: 'Wheelchair management/propulsion training, each 15 minutes',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97150',
    label: '97150 - Group Therapeutic Procedures',
    description: 'Therapeutic procedure(s), group (2 or more individuals); group therapy session',
    timed: true,
    category: 'therapeutic',
  },

  // ── Cognitive / Perceptual (timed, 15-min) ──
  {
    value: '97129',
    label: '97129 - Cognitive Function Intervention, Initial 15 min',
    description:
      'Therapeutic interventions that focus on cognitive function (e.g., attention, memory, reasoning, executive function, problem solving, and/or pragmatic functioning) and compensatory strategies to manage the performance of an activity, direct one-on-one contact; initial 15 minutes',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97130',
    label: '97130 - Cognitive Function Intervention, Each Addtl 15 min',
    description:
      'Therapeutic interventions that focus on cognitive function, direct one-on-one contact; each additional 15 minutes (list separately in addition to 97129)',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97532',
    label: '97532 - Cognitive Skills Development',
    description:
      'Development of cognitive skills to improve attention, memory, problem solving (includes compensatory training), direct one-on-one contact, each 15 minutes',
    timed: true,
    category: 'therapeutic',
  },

  // ── Modalities — Supervised (untimed) ──
  {
    value: '97010',
    label: '97010 - Hot / Cold Packs',
    description: 'Application of hot or cold packs to one or more areas',
    timed: false,
    category: 'modality-supervised',
  },
  {
    value: '97012',
    label: '97012 - Mechanical Traction',
    description: 'Mechanical traction to one or more areas',
    timed: false,
    category: 'modality-supervised',
  },
  {
    value: '97014',
    label: '97014 - Electrical Stimulation (Unattended)',
    description: 'Electrical stimulation (unattended) to one or more areas',
    timed: false,
    category: 'modality-supervised',
  },

  // ── Modalities — Constant Attendance (timed, 15-min) ──
  {
    value: '97032',
    label: '97032 - Electrical Stimulation (Manual)',
    description: 'Application of electrical stimulation (manual), each 15 minutes',
    timed: true,
    category: 'modality-constant',
  },
  {
    value: '97033',
    label: '97033 - Iontophoresis',
    description:
      'Iontophoresis, each 15 minutes (electric current to drive ions of medication into body tissues)',
    timed: true,
    category: 'modality-constant',
  },
  {
    value: '97034',
    label: '97034 - Contrast Bath',
    description: 'Contrast bath therapy, each 15 minutes',
    timed: true,
    category: 'modality-constant',
  },
  {
    value: '97035',
    label: '97035 - Ultrasound',
    description: 'Ultrasound, each 15 minutes',
    timed: true,
    category: 'modality-constant',
  },
  {
    value: '97036',
    label: '97036 - Hubbard Tank',
    description: 'Hubbard tank, each 15 minutes',
    timed: true,
    category: 'modality-constant',
  },

  // ── Orthotics / Prosthetics / Splinting ──
  {
    value: '97760',
    label: '97760 - Orthotic Mgmt & Training, Initial',
    description:
      'Orthotic(s) management and training (including assessment and fitting when not otherwise reported), upper extremity(s), lower extremity(s), and/or trunk; initial orthotic encounter, each 15 minutes',
    timed: true,
    category: 'ortho-prosthetic',
  },
  {
    value: '97763',
    label: '97763 - Orthotic / Prosthetic Mgmt, Subsequent',
    description:
      'Orthotic(s)/prosthetic(s) management and/or training, upper extremity(s), lower extremity(s), and/or trunk; subsequent orthotic/prosthetic encounter, each 15 minutes',
    timed: true,
    category: 'ortho-prosthetic',
  },
  {
    value: '29105',
    label: '29105 - Long Arm Splint (Shoulder to Hand)',
    description: 'Application of long arm splint (shoulder to hand)',
    timed: false,
    category: 'ortho-prosthetic',
  },
  {
    value: '29125',
    label: '29125 - Short Arm Splint (Forearm to Hand)',
    description: 'Application of short arm splint (forearm to hand); static',
    timed: false,
    category: 'ortho-prosthetic',
  },
  {
    value: '29130',
    label: '29130 - Finger Splint, Static',
    description: 'Application of finger splint; static',
    timed: false,
    category: 'ortho-prosthetic',
  },
  {
    value: '29131',
    label: '29131 - Finger Splint, Dynamic',
    description: 'Application of finger splint; dynamic',
    timed: false,
    category: 'ortho-prosthetic',
  },
  {
    value: 'L3808',
    label: 'L3808 - WHFO Custom Fabricated',
    description:
      'Wrist-hand-finger orthosis (WHFO), rigid without joints, custom fabricated, includes fitting and adjustment',
    timed: false,
    category: 'ortho-prosthetic',
  },

  // ── Testing (untimed) ──
  {
    value: '97750',
    label: '97750 - Physical Performance Test',
    description:
      'Physical performance test or measurement (e.g., musculoskeletal, functional capacity), with written report, each 15 minutes',
    timed: true,
    category: 'testing',
  },
  {
    value: '97755',
    label: '97755 - Assistive Technology Assessment',
    description:
      'Assistive technology assessment (e.g., to restore, augment or compensate for existing function, optimize functional tasks, and/or maximize environmental accessibility), direct one-on-one contact, with written report, each 15 minutes',
    timed: true,
    category: 'testing',
  },

  // ── Other ──
  {
    value: '98960',
    label: '98960 - Self-Management Education, Individual',
    description:
      'Education and training for patient self-management by a qualified, non-physician health care professional using a standardized curriculum, face-to-face with the patient, each 30 minutes; individual patient',
    timed: false,
    category: 'other',
  },
];

// ─── OT ICD-10 Codes ───

export const OT_ICD10_CODES: ICD10Code[] = [
  // ── Upper Extremity Fractures ──
  {
    value: 'S62.101A',
    label: 'S62.101A - Fx of unspecified carpal bone, right wrist',
    description: 'Fracture of unspecified carpal bone, right wrist, initial encounter',
  },
  {
    value: 'S62.102A',
    label: 'S62.102A - Fx of unspecified carpal bone, left wrist',
    description: 'Fracture of unspecified carpal bone, left wrist, initial encounter',
  },
  {
    value: 'S62.309A',
    label: 'S62.309A - Unspecified fracture of unspecified metacarpal bone',
    description: 'Unspecified fracture of unspecified metacarpal bone, initial encounter',
  },
  {
    value: 'S62.609A',
    label: 'S62.609A - Fx of unspecified phalanx of unspecified finger',
    description: 'Fracture of unspecified phalanx of unspecified finger, initial encounter',
  },
  {
    value: 'S52.501A',
    label: 'S52.501A - Unspecified fracture of lower end of right radius',
    description:
      'Unspecified fracture of the lower end of right radius, initial encounter for closed fracture',
  },
  {
    value: 'S52.502A',
    label: 'S52.502A - Unspecified fracture of lower end of left radius',
    description:
      'Unspecified fracture of the lower end of left radius, initial encounter for closed fracture',
  },
  {
    value: 'S42.001A',
    label: 'S42.001A - Fx of unspecified part of right clavicle',
    description:
      'Fracture of unspecified part of right clavicle, initial encounter for closed fracture',
  },
  {
    value: 'S42.201A',
    label: 'S42.201A - Unspecified fracture of upper end of right humerus',
    description:
      'Unspecified fracture of upper end of right humerus, initial encounter for closed fracture',
  },

  // ── Dislocations / Sprains — Wrist & Hand ──
  {
    value: 'S63.501A',
    label: 'S63.501A - Unspecified sprain of right wrist',
    description: 'Unspecified sprain of right wrist, initial encounter',
  },
  {
    value: 'S63.502A',
    label: 'S63.502A - Unspecified sprain of left wrist',
    description: 'Unspecified sprain of left wrist, initial encounter',
  },
  {
    value: 'S63.019A',
    label: 'S63.019A - Unspecified subluxation of unspecified wrist',
    description: 'Unspecified subluxation of unspecified wrist and hand joint, initial encounter',
  },

  // ── Dislocations / Sprains — Elbow ──
  {
    value: 'S53.101A',
    label: 'S53.101A - Unspecified subluxation of right ulnohumeral joint',
    description: 'Unspecified subluxation of right ulnohumeral joint, initial encounter',
  },
  {
    value: 'S53.401A',
    label: 'S53.401A - Unspecified sprain of right elbow',
    description: 'Unspecified sprain of right elbow, initial encounter',
  },
  {
    value: 'S53.402A',
    label: 'S53.402A - Unspecified sprain of left elbow',
    description: 'Unspecified sprain of left elbow, initial encounter',
  },

  // ── Muscle / Tendon Injuries — Shoulder, Forearm, Wrist/Hand ──
  {
    value: 'S46.011A',
    label: 'S46.011A - Strain of muscle/tendon of rotator cuff, right',
    description:
      'Strain of muscle(s) and tendon(s) of the rotator cuff of right shoulder, initial encounter',
  },
  {
    value: 'S56.011A',
    label: 'S56.011A - Strain of flexor muscle/tendon of right thumb at forearm level',
    description:
      'Strain of flexor muscle, fascia and tendon of right thumb at forearm level, initial encounter',
  },
  {
    value: 'S66.011A',
    label: 'S66.011A - Strain of flexor muscle/tendon of right thumb at wrist/hand',
    description:
      'Strain of long flexor muscle, fascia and tendon of right thumb at wrist and hand level, initial encounter',
  },
  {
    value: 'S66.111A',
    label: 'S66.111A - Strain of flexor muscle/tendon of right index finger',
    description:
      'Strain of flexor muscle, fascia and tendon of right index finger at wrist and hand level, initial encounter',
  },

  // ── Hand / Wrist Conditions ──
  {
    value: 'M19.041',
    label: 'M19.041 - Primary osteoarthritis, right hand',
    description: 'Primary osteoarthritis, right hand',
  },
  {
    value: 'M19.042',
    label: 'M19.042 - Primary osteoarthritis, left hand',
    description: 'Primary osteoarthritis, left hand',
  },
  {
    value: 'M65.30',
    label: 'M65.30 - Trigger finger, unspecified finger',
    description: 'Trigger finger, unspecified finger',
  },
  {
    value: 'M65.311',
    label: 'M65.311 - Trigger thumb, right',
    description: 'Trigger thumb, right hand',
  },
  {
    value: 'M65.312',
    label: 'M65.312 - Trigger thumb, left',
    description: 'Trigger thumb, left hand',
  },
  {
    value: 'M65.319',
    label: 'M65.319 - Trigger finger, unspecified',
    description: 'Trigger finger, unspecified finger',
  },
  {
    value: 'M72.0',
    label: "M72.0 - Dupuytren's Contracture",
    description: "Palmar fascial fibromatosis (Dupuytren's contracture)",
  },
  {
    value: 'M77.10',
    label: 'M77.10 - Lateral Epicondylitis, Unspecified',
    description: 'Lateral epicondylitis, unspecified elbow',
  },
  {
    value: 'M77.11',
    label: 'M77.11 - Lateral Epicondylitis, Right Elbow',
    description: 'Lateral epicondylitis, right elbow',
  },
  {
    value: 'M77.12',
    label: 'M77.12 - Lateral Epicondylitis, Left Elbow',
    description: 'Lateral epicondylitis, left elbow',
  },
  {
    value: 'G56.00',
    label: 'G56.00 - Carpal Tunnel Syndrome, Unspecified',
    description: 'Carpal tunnel syndrome, unspecified upper limb',
  },
  {
    value: 'G56.01',
    label: 'G56.01 - Carpal Tunnel Syndrome, Right',
    description: 'Carpal tunnel syndrome, right upper limb',
  },
  {
    value: 'G56.02',
    label: 'G56.02 - Carpal Tunnel Syndrome, Left',
    description: 'Carpal tunnel syndrome, left upper limb',
  },
  {
    value: 'M79.641',
    label: 'M79.641 - Pain in Right Hand',
    description: 'Pain in right hand',
  },
  {
    value: 'M79.642',
    label: 'M79.642 - Pain in Left Hand',
    description: 'Pain in left hand',
  },

  // ── Shoulder Conditions ──
  {
    value: 'M75.10',
    label: 'M75.10 - Rotator Cuff Syndrome, Unspecified',
    description:
      'Unspecified rotator cuff tear or rupture of unspecified shoulder, not specified as traumatic',
  },
  {
    value: 'M75.11',
    label: 'M75.11 - Rotator Cuff Syndrome, Right',
    description:
      'Unspecified rotator cuff tear or rupture of right shoulder, not specified as traumatic',
  },
  {
    value: 'M75.12',
    label: 'M75.12 - Rotator Cuff Syndrome, Left',
    description:
      'Unspecified rotator cuff tear or rupture of left shoulder, not specified as traumatic',
  },
  {
    value: 'M75.00',
    label: 'M75.00 - Adhesive Capsulitis, Unspecified Shoulder',
    description: 'Adhesive capsulitis of unspecified shoulder',
  },
  {
    value: 'M75.01',
    label: 'M75.01 - Adhesive Capsulitis, Right Shoulder',
    description: 'Adhesive capsulitis of right shoulder',
  },
  {
    value: 'M75.02',
    label: 'M75.02 - Adhesive Capsulitis, Left Shoulder',
    description: 'Adhesive capsulitis of left shoulder',
  },

  // ── Neurological ──
  {
    value: 'G81.90',
    label: 'G81.90 - Hemiplegia, Unspecified',
    description: 'Hemiplegia, unspecified affecting unspecified side',
  },
  {
    value: 'G81.91',
    label: 'G81.91 - Hemiplegia, Right Dominant Side',
    description: 'Hemiplegia, unspecified affecting right dominant side',
  },
  {
    value: 'G81.92',
    label: 'G81.92 - Hemiplegia, Left Dominant Side',
    description: 'Hemiplegia, unspecified affecting left dominant side',
  },
  {
    value: 'I69.351',
    label: 'I69.351 - Hemiplegia Following Cerebral Infarction, Right Dominant',
    description:
      'Hemiplegia and hemiparesis following cerebral infarction affecting right dominant side',
  },
  {
    value: 'I69.354',
    label: 'I69.354 - Hemiplegia Following Cerebral Infarction, Left Dominant',
    description:
      'Hemiplegia and hemiparesis following cerebral infarction affecting left dominant side',
  },
  {
    value: 'G80.9',
    label: 'G80.9 - Cerebral Palsy, Unspecified',
    description: 'Cerebral palsy, unspecified',
  },
  {
    value: 'G35',
    label: 'G35 - Multiple Sclerosis',
    description: 'Multiple sclerosis',
  },
  {
    value: 'G20',
    label: "G20 - Parkinson's Disease",
    description: "Parkinson's disease",
  },
  {
    value: 'I63.9',
    label: 'I63.9 - Cerebral Infarction, Unspecified',
    description: 'Cerebral infarction, unspecified',
  },
  {
    value: 'G30.9',
    label: "G30.9 - Alzheimer's Disease, Unspecified",
    description: "Alzheimer's disease, unspecified",
  },

  // ── ADL / Functional ──
  {
    value: 'R26.89',
    label: 'R26.89 - Other Abnormalities of Gait and Mobility',
    description: 'Other abnormalities of gait and mobility',
  },
  {
    value: 'Z74.1',
    label: 'Z74.1 - Need for Assistance with Personal Care',
    description: 'Need for assistance with personal care',
  },
  {
    value: 'Z74.2',
    label: 'Z74.2 - Need for Assistance at Home, No Household Member Able to Render Care',
    description: 'Need for assistance at home and no other household member able to render care',
  },
  {
    value: 'R29.3',
    label: 'R29.3 - Abnormal Posture',
    description: 'Abnormal posture',
  },
  {
    value: 'Z87.39',
    label: 'Z87.39 - Personal Hx of Musculoskeletal Disorders',
    description:
      'Personal history of other diseases of the musculoskeletal system and connective tissue',
  },

  // ── Cognitive / Developmental ──
  {
    value: 'F84.0',
    label: 'F84.0 - Autistic Disorder',
    description: 'Autistic disorder',
  },
  {
    value: 'R41.840',
    label: 'R41.840 - Attention and Concentration Deficit',
    description: 'Attention and concentration deficit',
  },
  {
    value: 'R41.841',
    label: 'R41.841 - Cognitive Communication Deficit',
    description: 'Cognitive communication deficit',
  },
  {
    value: 'G31.84',
    label: 'G31.84 - Mild Cognitive Impairment',
    description: 'Mild cognitive impairment, so stated',
  },
  {
    value: 'R27.8',
    label: 'R27.8 - Other Lack of Coordination',
    description: 'Other lack of coordination',
  },
  {
    value: 'R27.0',
    label: 'R27.0 - Ataxia, Unspecified',
    description: 'Ataxia, unspecified',
  },
  {
    value: 'F82',
    label: 'F82 - Developmental Coordination Disorder',
    description:
      'Specific developmental disorder of motor function (developmental coordination disorder)',
  },

  // ── Burns / Wounds ──
  {
    value: 'T22.011A',
    label: 'T22.011A - Burn of unspecified degree of right shoulder',
    description: 'Burn of unspecified degree of right shoulder, initial encounter',
  },
  {
    value: 'T22.012A',
    label: 'T22.012A - Burn of unspecified degree of left shoulder',
    description: 'Burn of unspecified degree of left shoulder, initial encounter',
  },
  {
    value: 'T23.001A',
    label: 'T23.001A - Burn of unspecified degree of right hand, unspecified site',
    description: 'Burn of unspecified degree of right hand, unspecified site, initial encounter',
  },
  {
    value: 'T23.002A',
    label: 'T23.002A - Burn of unspecified degree of left hand, unspecified site',
    description: 'Burn of unspecified degree of left hand, unspecified site, initial encounter',
  },
  {
    value: 'L89.90',
    label: 'L89.90 - Pressure Ulcer of Unspecified Site, Unspecified Stage',
    description: 'Pressure ulcer of unspecified site, unspecified stage',
  },
  {
    value: 'L89.91',
    label: 'L89.91 - Pressure Ulcer of Unspecified Site, Stage 1',
    description:
      'Pressure ulcer of unspecified site, stage 1 (healing pressure pre-ulcer skin changes limited to persistent focal edema)',
  },
  {
    value: 'L97.919',
    label: 'L97.919 - Non-Pressure Chronic Ulcer of Unspecified Lower Leg',
    description:
      'Non-pressure chronic ulcer of unspecified part of unspecified lower leg with unspecified severity',
  },

  // ── Joint Contracture / Stiffness ──
  {
    value: 'M24.541',
    label: 'M24.541 - Contracture, Right Hand',
    description: 'Contracture, right hand',
  },
  {
    value: 'M24.542',
    label: 'M24.542 - Contracture, Left Hand',
    description: 'Contracture, left hand',
  },
  {
    value: 'M24.521',
    label: 'M24.521 - Contracture, Right Elbow',
    description: 'Contracture, right elbow',
  },
  {
    value: 'M24.522',
    label: 'M24.522 - Contracture, Left Elbow',
    description: 'Contracture, left elbow',
  },
  {
    value: 'M24.511',
    label: 'M24.511 - Contracture, Right Shoulder',
    description: 'Contracture, right shoulder',
  },
  {
    value: 'M24.512',
    label: 'M24.512 - Contracture, Left Shoulder',
    description: 'Contracture, left shoulder',
  },
  {
    value: 'M62.40',
    label: 'M62.40 - Contracture of Muscle, Unspecified',
    description: 'Contracture of muscle, unspecified site',
  },

  // ── Mental Health (OT Role) ──
  {
    value: 'F32.9',
    label: 'F32.9 - Major Depressive Disorder, Single Episode, Unspecified',
    description: 'Major depressive disorder, single episode, unspecified',
  },
  {
    value: 'F32.1',
    label: 'F32.1 - Major Depressive Disorder, Single Episode, Moderate',
    description: 'Major depressive disorder, single episode, moderate',
  },
  {
    value: 'F41.1',
    label: 'F41.1 - Generalized Anxiety Disorder',
    description: 'Generalized anxiety disorder',
  },
  {
    value: 'F43.10',
    label: 'F43.10 - Post-Traumatic Stress Disorder, Unspecified',
    description: 'Post-traumatic stress disorder, unspecified',
  },
];

// ─── Scoring Functions ───

export function scoreOTCPT(item: CPTCode, query: string): number {
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

export function scoreOTICD10(item: ICD10Code, query: string): number {
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
