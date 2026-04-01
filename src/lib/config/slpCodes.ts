// SLP-specific billing code reference data — CPT and ICD-10
// Speech-Language Pathology codes for evaluation, treatment, and diagnosis
//
// Code vintage: CY2025 CMS Physician Fee Schedule / ICD-10-CM FY2025
// Last reviewed: 2026-04-01
// Next review:   After CMS CY2026 PFS final rule (~Nov 2025) and ICD-10-CM FY2026 (~Oct 2025)
// Source:        AMA CPT codebook; ASHA billing/coding resources
// NOTE: This is an educational simulator — codes are representative, not claims-grade.

import type { CPTCode, ICD10Code } from './ptCodes';

// ─── SLP CPT Codes ───

export const SLP_CPT_CODES: CPTCode[] = [
  // ── Evaluations (untimed) ──
  {
    value: '92521',
    label: '92521 - Evaluation of Speech Fluency',
    description: 'Evaluation of speech fluency (e.g., stuttering, cluttering)',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '92522',
    label: '92522 - Evaluation of Speech Sound Production',
    description:
      'Evaluation of speech sound production (e.g., articulation, phonological process, apraxia, dysarthria)',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '92523',
    label: '92523 - Speech Sound Production and Language Comprehension',
    description:
      'Evaluation of speech sound production with evaluation of language comprehension and expression',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '92524',
    label: '92524 - Behavioral and Qualitative Analysis of Voice',
    description: 'Behavioral and qualitative analysis of voice and resonance',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '92610',
    label: '92610 - Evaluation of Oral and Pharyngeal Swallowing Function',
    description:
      'Evaluation of oral and pharyngeal swallowing function (clinical swallowing evaluation)',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '92611',
    label: '92611 - Motion Fluoroscopic Eval of Swallowing (MBSS/MBS)',
    description:
      'Motion fluoroscopic evaluation of swallowing function by cine or video recording (modified barium swallow study)',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '92612',
    label: '92612 - Flexible Fiberoptic Eval of Swallowing (FEES)',
    description:
      'Flexible fiberoptic endoscopic evaluation of swallowing by cine or video recording (FEES)',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '92613',
    label: '92613 - Interpretation of Flexible Fiberoptic Eval (FEES)',
    description:
      'Flexible fiberoptic endoscopic evaluation of swallowing; interpretation and report only',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '92597',
    label: '92597 - Evaluation for Use of Voice Prosthetic Device',
    description:
      'Evaluation for use and/or fitting of voice prosthetic device to supplement oral speech',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '92605',
    label: '92605 - Evaluation for AAC Device/System',
    description:
      'Evaluation for prescription of non-speech-generating augmentative and alternative communication device, face-to-face',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '92607',
    label: '92607 - AAC Eval for Speech-Generating Device, First Hour',
    description:
      'Evaluation for prescription for speech-generating augmentative and alternative communication device; first hour, face-to-face',
    timed: false,
    category: 'evaluation',
  },

  // ── Therapeutic Procedures (untimed unless noted) ──
  {
    value: '92507',
    label: '92507 - Speech/Language Treatment (Individual)',
    description:
      'Treatment of speech, language, voice, communication, and/or auditory processing disorder; individual',
    timed: false,
    category: 'therapeutic',
  },
  {
    value: '92508',
    label: '92508 - Speech/Language Treatment (Group)',
    description:
      'Treatment of speech, language, voice, communication, and/or auditory processing disorder; group, 2 or more individuals',
    timed: false,
    category: 'therapeutic',
  },
  {
    value: '92526',
    label: '92526 - Treatment of Swallowing Dysfunction',
    description: 'Treatment of swallowing dysfunction and/or oral function for feeding',
    timed: false,
    category: 'therapeutic',
  },
  {
    value: '92609',
    label: '92609 - Use of Speech-Generating Device Service',
    description:
      'Therapeutic services for the use of speech-generating device, including programming and modification',
    timed: false,
    category: 'therapeutic',
  },
  {
    value: '92606',
    label: '92606 - AAC Non-Speech Device Service',
    description:
      'Therapeutic service(s) for the use of non-speech-generating device, including programming and modification',
    timed: false,
    category: 'therapeutic',
  },
  {
    value: '92608',
    label: '92608 - AAC Eval for Speech-Generating Device, Each Addtl 30 Min',
    description:
      'Evaluation for prescription for speech-generating augmentative and alternative communication device; each additional 30 minutes',
    timed: true,
    category: 'evaluation',
  },
  {
    value: '92630',
    label: '92630 - Auditory Rehabilitation, Pre-lingual',
    description: 'Auditory rehabilitation; pre-lingual hearing loss',
    timed: false,
    category: 'therapeutic',
  },
  {
    value: '92633',
    label: '92633 - Auditory Rehabilitation, Post-lingual',
    description: 'Auditory rehabilitation; post-lingual hearing loss',
    timed: false,
    category: 'therapeutic',
  },

  // ── Cognitive Function Intervention (timed, 15-min) ──
  {
    value: '97129',
    label: '97129 - Therapeutic Intervention, Cognitive Function, First 15 Min',
    description:
      'Therapeutic interventions that focus on cognitive function (e.g., attention, memory, reasoning, executive function, problem solving, and/or pragmatic functioning) and compensatory strategies to manage the performance of an activity; initial 15 minutes, face-to-face',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97130',
    label: '97130 - Therapeutic Intervention, Cognitive Function, Each Addtl 15 Min',
    description:
      'Therapeutic interventions that focus on cognitive function; each additional 15 minutes, face-to-face',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97532',
    label: '97532 - Cognitive Skills Development',
    description:
      'Development of cognitive skills to improve attention, memory, problem solving; each 15 minutes',
    timed: true,
    category: 'therapeutic',
  },

  // ── Testing ──
  {
    value: '96105',
    label: '96105 - Aphasia Assessment',
    description:
      'Assessment of aphasia (includes assessment of expressive and receptive speech and language function, language comprehension, speech production ability, reading, spelling, writing); per hour',
    timed: false,
    category: 'testing',
  },
  {
    value: '92520',
    label: '92520 - Laryngeal Function Studies',
    description: 'Laryngeal function studies (e.g., aerodynamic testing and acoustic testing)',
    timed: false,
    category: 'testing',
  },
];

// ─── SLP ICD-10 Codes ───

export const SLP_ICD10_CODES: ICD10Code[] = [
  // ── Speech / Articulation ──
  {
    value: 'R47.1',
    label: 'R47.1 - Dysarthria and anarthria',
    description: 'Dysarthria and anarthria (motor speech disorder)',
  },
  {
    value: 'R47.02',
    label: 'R47.02 - Dysphasia',
    description: 'Dysphasia (acquired language impairment, not dominant hemisphere)',
  },
  {
    value: 'R47.01',
    label: 'R47.01 - Aphasia',
    description: 'Aphasia (acquired loss of language ability)',
  },
  {
    value: 'R47.89',
    label: 'R47.89 - Other speech disturbances',
    description: 'Other speech disturbances (e.g., slurred speech NOS)',
  },
  {
    value: 'F80.0',
    label: 'F80.0 - Phonological disorder',
    description: 'Phonological disorder (speech sound disorder of known developmental origin)',
  },
  {
    value: 'F80.1',
    label: 'F80.1 - Expressive language disorder',
    description: 'Expressive language disorder (developmental)',
  },
  {
    value: 'F80.2',
    label: 'F80.2 - Mixed receptive-expressive language disorder',
    description: 'Mixed receptive-expressive language disorder (developmental)',
  },
  {
    value: 'F80.9',
    label: 'F80.9 - Developmental disorder of speech and language, unspecified',
    description: 'Developmental disorder of speech and language, unspecified',
  },

  // ── Voice ──
  {
    value: 'R49.0',
    label: 'R49.0 - Dysphonia',
    description: 'Dysphonia (hoarseness or altered voice quality)',
  },
  {
    value: 'R49.1',
    label: 'R49.1 - Aphonia',
    description: 'Aphonia (loss of voice)',
  },
  {
    value: 'R49.8',
    label: 'R49.8 - Other voice and resonance disorders',
    description: 'Other voice and resonance disorders (e.g., hypernasality, hyponasality)',
  },
  {
    value: 'J38.3',
    label: 'J38.3 - Other diseases of vocal cords',
    description: 'Other diseases of vocal cords (includes vocal cord paralysis/paresis)',
  },
  {
    value: 'J38.01',
    label: 'J38.01 - Paralysis of vocal cords and larynx, unilateral',
    description: 'Paralysis of vocal cords and larynx, unilateral',
  },
  {
    value: 'J38.02',
    label: 'J38.02 - Paralysis of vocal cords and larynx, bilateral',
    description: 'Paralysis of vocal cords and larynx, bilateral',
  },
  {
    value: 'J38.1',
    label: 'J38.1 - Polyp of vocal cord and larynx',
    description: 'Polyp of vocal cord and larynx (vocal fold polyp)',
  },
  {
    value: 'J38.2',
    label: 'J38.2 - Nodules of vocal cords',
    description: 'Nodules of vocal cords (vocal fold nodules)',
  },

  // ── Fluency ──
  {
    value: 'F98.5',
    label: 'F98.5 - Adult onset fluency disorder',
    description: 'Adult onset fluency disorder (stuttering, acquired)',
  },
  {
    value: 'F80.81',
    label: 'F80.81 - Childhood onset fluency disorder',
    description: 'Childhood onset fluency disorder (developmental stuttering)',
  },

  // ── Swallowing / Dysphagia ──
  {
    value: 'R13.10',
    label: 'R13.10 - Dysphagia, unspecified',
    description: 'Dysphagia, unspecified',
  },
  {
    value: 'R13.11',
    label: 'R13.11 - Dysphagia, oral phase',
    description: 'Dysphagia, oral phase',
  },
  {
    value: 'R13.12',
    label: 'R13.12 - Dysphagia, oropharyngeal phase',
    description: 'Dysphagia, oropharyngeal phase',
  },
  {
    value: 'R13.13',
    label: 'R13.13 - Dysphagia, pharyngeal phase',
    description: 'Dysphagia, pharyngeal phase',
  },
  {
    value: 'R13.14',
    label: 'R13.14 - Dysphagia, pharyngoesophageal phase',
    description: 'Dysphagia, pharyngoesophageal phase',
  },
  {
    value: 'R13.19',
    label: 'R13.19 - Other dysphagia',
    description: 'Other dysphagia (including cervical dysphagia)',
  },
  {
    value: 'R63.3',
    label: 'R63.3 - Feeding difficulties',
    description: 'Feeding difficulties (includes feeding problems in newborn/infant)',
  },

  // ── Cognitive-Communication ──
  {
    value: 'R41.840',
    label: 'R41.840 - Attention and concentration deficit',
    description: 'Attention and concentration deficit',
  },
  {
    value: 'R41.841',
    label: 'R41.841 - Cognitive communication deficit',
    description: 'Cognitive communication deficit',
  },
  {
    value: 'R41.3',
    label: 'R41.3 - Other amnesia',
    description: 'Other amnesia (memory impairment NOS)',
  },
  {
    value: 'R41.0',
    label: 'R41.0 - Disorientation, unspecified',
    description: 'Disorientation, unspecified',
  },
  {
    value: 'F06.8',
    label: 'F06.8 - Other specified mental disorders due to brain damage',
    description:
      'Other specified mental disorders due to known physiological condition (including cognitive-communication deficits from brain injury)',
  },
  {
    value: 'R48.8',
    label: 'R48.8 - Other symbolic dysfunctions',
    description: 'Other symbolic dysfunctions (e.g., acalculia, agraphia, impaired pragmatics)',
  },
  {
    value: 'R48.2',
    label: 'R48.2 - Apraxia',
    description: 'Apraxia (includes apraxia of speech when no other specific code applies)',
  },

  // ── Neurological ──
  {
    value: 'I69.320',
    label: 'I69.320 - Aphasia following cerebral infarction',
    description: 'Aphasia following cerebral infarction',
  },
  {
    value: 'I69.321',
    label: 'I69.321 - Dysphasia following cerebral infarction',
    description: 'Dysphasia following cerebral infarction',
  },
  {
    value: 'I69.322',
    label: 'I69.322 - Dysarthria following cerebral infarction',
    description: 'Dysarthria following cerebral infarction',
  },
  {
    value: 'I69.328',
    label: 'I69.328 - Other speech and language deficits following cerebral infarction',
    description: 'Other speech and language deficits following cerebral infarction',
  },
  {
    value: 'I69.391',
    label: 'I69.391 - Dysphagia following cerebral infarction',
    description: 'Dysphagia following cerebral infarction',
  },
  {
    value: 'I69.120',
    label: 'I69.120 - Aphasia following nontraumatic intracerebral hemorrhage',
    description: 'Aphasia following nontraumatic intracerebral hemorrhage',
  },
  {
    value: 'G31.84',
    label: 'G31.84 - Mild cognitive impairment',
    description: 'Mild cognitive impairment, so stated',
  },
  {
    value: 'G30.9',
    label: 'G30.9 - Alzheimer disease, unspecified',
    description: "Alzheimer's disease, unspecified",
  },
  {
    value: 'G12.21',
    label: 'G12.21 - Amyotrophic lateral sclerosis',
    description: 'Amyotrophic lateral sclerosis (ALS) — progressive bulbar/speech involvement',
  },
  {
    value: 'G20',
    label: "G20 - Parkinson's disease",
    description: "Parkinson's disease (hypokinetic dysarthria, dysphagia)",
  },
  {
    value: 'S06.0X0A',
    label: 'S06.0X0A - Concussion without loss of consciousness, initial',
    description: 'Concussion without loss of consciousness, initial encounter',
  },

  // ── Pediatric ──
  {
    value: 'F84.0',
    label: 'F84.0 - Autistic disorder',
    description: 'Autistic disorder (autism spectrum disorder)',
  },
  {
    value: 'Q38.1',
    label: 'Q38.1 - Ankyloglossia',
    description: 'Ankyloglossia (tongue-tie)',
  },
  {
    value: 'Q35.1',
    label: 'Q35.1 - Cleft hard palate',
    description: 'Cleft hard palate',
  },
  {
    value: 'Q35.3',
    label: 'Q35.3 - Cleft soft palate',
    description: 'Cleft soft palate',
  },
  {
    value: 'Q35.5',
    label: 'Q35.5 - Cleft hard palate with cleft soft palate',
    description: 'Cleft hard palate with cleft soft palate',
  },
  {
    value: 'Q37.0',
    label: 'Q37.0 - Cleft hard palate with unilateral cleft lip',
    description: 'Cleft hard palate with unilateral cleft lip',
  },
  {
    value: 'Q36.9',
    label: 'Q36.9 - Cleft lip, unilateral',
    description: 'Cleft lip, unilateral (cleft lip NOS)',
  },
];

// ─── Scoring functions ───

export function scoreSLPCPT(item: CPTCode, query: string): number {
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

export function scoreSLPICD10(item: ICD10Code, query: string): number {
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
