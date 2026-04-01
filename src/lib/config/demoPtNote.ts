import { buildRedFlagSummary, createDefaultScreening } from '$lib/config/redFlagCategories';
import { createAssessmentInstance } from '$lib/config/standardizedAssessments';
import { MED_DB } from '$lib/config/medicationDb';
import { neuroKey } from '$lib/config/neuroscreenData';
import { createDefaultSystemsReview } from '$lib/config/systemsReview';
import {
  allergySummary,
  computeAge,
  displayName,
  normalizeSex,
  type VspRecord,
} from '$lib/services/vspRegistry';
import type {
  MedicationRecord,
  ObjectiveData,
  SubjectiveData,
  TypedNoteDraft,
} from '$lib/types/sections';

export const ROBERT_CASTELLANO_DEMO_MRN = 'VSP-42652635';

function computeBmi(heightFt: string, heightIn: string, weightLbs: string): string {
  const feet = Number(heightFt || 0);
  const inches = Number(heightIn || 0);
  const weight = Number(weightLbs || 0);
  const totalInches = feet * 12 + inches;
  if (
    !Number.isFinite(totalInches) ||
    !Number.isFinite(weight) ||
    totalInches <= 0 ||
    weight <= 0
  ) {
    return '';
  }
  return ((weight / (totalInches * totalInches)) * 703).toFixed(1);
}

function lookupMedication(name: string): Pick<MedicationRecord, 'class' | 'alerts'> {
  const normalized = name.trim().toLowerCase();
  const match = MED_DB.find(
    (entry) =>
      entry.name.toLowerCase() === normalized || entry.brand.toLowerCase().includes(normalized),
  );
  return match ? { class: match.class, alerts: [...match.alerts] } : { class: '', alerts: [] };
}

function buildMedicationRecords(patient: VspRecord): MedicationRecord[] {
  return (patient.activeMedications ?? []).map((med) => {
    const info = lookupMedication(med.name);
    return {
      name: med.name,
      dose: med.dose || '',
      frequency: med.frequency || '',
      class: info.class,
      alerts: info.alerts,
    };
  });
}

function buildSystemsReview() {
  const systems = createDefaultSystemsReview();

  systems.communication.status = 'impaired';
  systems.communication.subcategories.orientation = 'wnl';
  systems.communication.subcategories.memory = 'impaired';
  systems.communication.subcategories.safetyAwareness = 'impaired';
  systems.communication.subcategories.visionPerception = 'wnl';

  systems.cardiovascular.status = 'impaired';
  systems.cardiovascular.subcategories.auscultation = 'wnl';
  systems.cardiovascular.subcategories.edema = 'impaired';
  systems.cardiovascular.subcategories.endurance = 'impaired';

  systems.integumentary.status = 'impaired';
  systems.integumentary.subcategories.skinIntegrity = 'impaired';
  systems.integumentary.subcategories.colorTemp = 'impaired';

  systems.musculoskeletal.status = 'impaired';
  systems.musculoskeletal.subcategories.rom = 'impaired';
  systems.musculoskeletal.subcategories.strength = 'impaired';
  systems.musculoskeletal.subcategories.specialTests = 'impaired';
  systems.musculoskeletal.subcategories.posture = 'impaired';

  systems.neuromuscular.status = 'impaired';
  systems.neuromuscular.subcategories.sensation = 'impaired';
  systems.neuromuscular.subcategories.reflexes = 'impaired';
  systems.neuromuscular.subcategories.tone = 'wnl';
  systems.neuromuscular.subcategories.cranialNerves = 'wnl';
  systems.neuromuscular.subcategories.coordination = 'wnl';
  systems.neuromuscular.subcategories.balance = 'impaired';
  systems.neuromuscular.subcategories.gaitMobility = 'impaired';
  systems.neuromuscular.subcategories.endurance = 'impaired';

  systems.standardizedFunctional.status = 'impaired';

  return systems;
}

function buildRedFlagScreening() {
  const screening = createDefaultScreening().map((entry) => {
    if (entry.id === 'recent-infection') {
      return {
        ...entry,
        status: 'present' as const,
        note: 'Recent right TKA on 2024-01-15, incision healed without complication.',
      };
    }
    if (entry.id === 'age-new-onset') {
      return { ...entry, status: 'present' as const, note: 'Age > 50 with chronic lumbar pain.' };
    }
    if (
      entry.id === 'phq2-feeling-down' ||
      entry.id === 'tobacco-former' ||
      entry.id === 'alcohol-current'
    ) {
      return { ...entry, status: 'present' as const, note: entry.note };
    }
    return { ...entry, status: 'denied' as const };
  });

  return {
    screening,
    summary: buildRedFlagSummary(screening),
  };
}

function buildStandardizedAssessments() {
  const berg = createAssessmentInstance('berg-balance-scale', {
    discipline: 'pt',
    performedAt: '2026-03-30',
    assessor: 'Demo Faculty User',
    responses: {
      sitting_to_standing: 3,
      standing_unsupported: 3,
      sitting_unsupported: 4,
      standing_to_sitting: 3,
      transfers: 3,
      standing_eyes_closed: 2,
      standing_feet_together: 2,
      reaching_forward: 2,
      retrieve_object_floor: 2,
      turn_to_look_behind: 2,
      turn_360: 2,
      place_alternate_foot: 1,
      tandem_stance: 1,
      single_leg_stance: 1,
    },
    notes:
      'Completed without physical assist. Performance limited by right knee stiffness, lumbar pain, and decreased confidence with narrow base tasks.',
  });

  return berg ? [berg] : [];
}

function buildSubjective(patient: VspRecord): SubjectiveData {
  const name = displayName(patient) || `${patient.firstName} ${patient.lastName}`;
  const age = computeAge(patient.dob);
  const bmi = computeBmi(patient.heightFt, patient.heightIn, patient.weightLbs);
  const redFlags = buildRedFlagScreening();

  return {
    patientName: name,
    patientBirthday: patient.dob || '',
    patientAge: age != null ? String(age) : '',
    patientGender: normalizeSex(patient.sex) || '',
    patientGenderIdentityPronouns: patient.pronouns || '',
    patientPreferredLanguage: patient.preferredLanguage || 'English',
    patientInterpreterNeeded: patient.interpreterNeeded ? 'yes' : 'no',
    patientHeightFt: patient.heightFt || '',
    patientHeightIn: patient.heightIn || '',
    patientWeight: patient.weightLbs || '',
    patientBmi: bmi,
    patientMeasurementUnit: 'imperial',
    patientWorkStatusOccupation:
      'Retired maintenance supervisor; helps coach youth baseball in the spring.',
    patientLivingSituationHomeEnvironment:
      'Lives with spouse in a two-story home with 3 entry steps and a right-sided handrail. Bedroom is upstairs; currently using main-floor recliner for convenience.',
    patientSocialSupport:
      'Spouse assists with transportation, meal prep, and heavier household tasks. Adult daughter lives 10 minutes away and checks in twice weekly.',
    patientDemographics:
      '67-year-old male with prior right total knee arthroplasty, lumbar degenerative disc disease, diabetes, and bilateral knee osteoarthritis.',
    patientAllergies: allergySummary(patient),
    __vspId: patient.id,
    chiefComplaint:
      'Right knee stiffness, balance decline, and low back pain limiting walking distance, stairs, and prolonged standing since right TKA.',
    historyOfPresentIllness:
      'Patient presents for PT evaluation after persistent functional decline following right total knee arthroplasty in January 2024. He reports improved surgical pain compared with the immediate post-op phase but continues to have morning stiffness, intermittent low back pain with standing more than 10 minutes, and reduced confidence on stairs and uneven ground.',
    functionalLimitations:
      'Difficulty walking more than 8-10 minutes, negotiating stairs reciprocally, rising from low chairs without upper extremity support, carrying groceries, community outings, and coaching baseball practice without frequent seated rest breaks.',
    priorLevel:
      'Prior to surgery, patient ambulated community distances without an assistive device, managed home and yard work independently, and attended weekly church and community events without limitation.',
    patientGoals:
      'Walk 1 mile without needing to stop, ascend and descend stairs more normally, stand through baseball practice, and resume light yard work with less pain and fear of falling.',
    additionalHistory:
      'PMH includes type 2 diabetes, hypertension, hyperlipidemia, obesity, bilateral knee OA, lumbar DDD, peripheral neuropathy, GERD, and mild depression. Surgical history includes right TKA, cholecystectomy, appendectomy, and right carpal tunnel release. PCP: Dr. Sarah Lindgren, MD.',
    painLocation:
      'Right anterior knee/peripatellar region, bilateral calves after prolonged walking, and central low lumbar spine.',
    painScale: 6,
    painQuality: 'Dull / Aching',
    painPattern: 'Activity-related',
    aggravatingFactors:
      'Stairs, prolonged standing, walking on uneven surfaces, sit-to-stand from low surfaces, and carrying loads.',
    easingFactors:
      'Seated rest, ice to right knee, gentle stretching, and short bouts of movement.',
    redFlags: redFlags.summary,
    redFlagScreening: redFlags.screening,
    qaItems: [
      {
        question: 'What task bothers you the most right now?',
        response:
          'Going up and down stairs because the right knee feels stiff and weak, and I worry about losing my balance.',
      },
      {
        question: 'How has this changed your normal routine?',
        response:
          'I need more breaks during community outings and my spouse has taken over most yard work and carrying tasks.',
      },
      {
        question: 'What would make therapy feel successful to you?',
        response:
          'Being able to walk around the ball field and get back to light outdoor chores without feeling unsteady.',
      },
    ],
    medications: buildMedicationRecords(patient),
  };
}

function buildObjective(patient: VspRecord): ObjectiveData {
  const bmi = computeBmi(patient.heightFt, patient.heightIn, patient.weightLbs);

  return {
    vitals: {
      bp: '138/84',
      hr: '78',
      rr: '18',
      temp: '98.4',
      o2sat: '96',
      pain: '6',
      heightFt: patient.heightFt || '',
      heightIn: patient.heightIn || '',
      weightLbs: patient.weightLbs || '',
      bmi,
    },
    vitalsSeries: [
      {
        id: 'demo-initial-vitals',
        label: 'Initial Eval',
        time: '09:10',
        vitals: {
          bpSystolic: '138',
          bpDiastolic: '84',
          hr: '78',
          rr: '18',
          spo2: '96',
          temperature: '98.4',
          pain: '6',
        },
      },
    ],
    vitalsActiveId: 'demo-initial-vitals',
    systemsReview: buildSystemsReview(),
    text: 'Ambulates into clinic with single-point cane and mild antalgic gait favoring right lower extremity. Requires extra time for sit-to-stand and repositioning.',
    inspection: {
      visual:
        'Well-healed anterior right knee incision. Mild genu varum left knee, reduced right knee terminal extension in standing, and guarded trunk rotation during gait.',
    },
    palpation: {
      findings:
        'Tenderness at right medial joint line and distal quadriceps. Increased tone and tenderness in bilateral lumbar paraspinals, right greater than left.',
    },
    orientation: 'Alert and oriented x4. Follows conversation and interview appropriately.',
    memoryAttention:
      'Able to follow 3-step commands. Mildly slowed processing when given dual-task instructions but remains accurate.',
    safetyAwareness:
      'Good insight into current mobility limits. Requires intermittent cueing to slow transfers and keep cane within reach.',
    visionPerception:
      'Uses bifocals. No neglect or perceptual deficit observed during functional screening.',
    auscultation:
      'Heart rhythm regular. Breath sounds clear bilaterally. Mild exertional shortness of breath after repeated sit-to-stand testing.',
    edema:
      'Trace to 1+ pitting edema around right knee and distal lower leg. Circumferential asymmetry approximately 1.2 cm compared with left.',
    endurance:
      '6-minute walk: 890 ft with single-point cane and two brief standing rest breaks. RPE 5/10 post test.',
    skinIntegrity:
      'Right TKA incision fully closed and mobile. No open areas. Mild scar adhesion superior pole with localized sensitivity.',
    colorTemp:
      'Mild warmth over right peripatellar region compared with left. Distal lower extremity skin otherwise intact with slightly decreased hair growth at bilateral shins.',
    regionalAssessments: {
      selectedRegions: ['knee', 'lumbar-spine'],
      arom: {
        'knee:Flexion:L': '128 deg',
        'knee:Flexion:R': '104 deg',
        'knee:Extension:L': '0 deg',
        'knee:Extension:R': '-6 deg',
        'lumbar-spine:Flexion:': '40 deg with pain/stiffness',
        'lumbar-spine:Extension:': '10 deg with central low back pain',
        'lumbar-spine:Lateral Flexion:L': '15 deg',
        'lumbar-spine:Lateral Flexion:R': '12 deg',
        'lumbar-spine:Rotation:L': '20 deg',
        'lumbar-spine:Rotation:R': '18 deg',
      },
      prom: {
        'knee:Flexion:L': '132 deg',
        'knee:Flexion:R': '110 deg',
        'knee:Extension:L': '0 deg',
        'knee:Extension:R': '-3 deg',
        'lumbar-spine:Flexion:': '45 deg',
        'lumbar-spine:Extension:': '12 deg',
        'lumbar-spine:Lateral Flexion:L': '18 deg',
        'lumbar-spine:Lateral Flexion:R': '15 deg',
        'lumbar-spine:Rotation:L': '24 deg',
        'lumbar-spine:Rotation:R': '22 deg',
      },
      rims: {
        'knee:Flexion:L': 'strong-painfree',
        'knee:Flexion:R': 'weak-painful',
        'knee:Extension:L': 'strong-painfree',
        'knee:Extension:R': 'weak-painful',
        'lumbar-spine:Flexion:': 'weak-painful',
        'lumbar-spine:Extension:': 'weak-painful',
        'lumbar-spine:Lateral Flexion:L': 'strong-painfree',
        'lumbar-spine:Lateral Flexion:R': 'weak-painful',
        'lumbar-spine:Rotation:L': 'strong-painfree',
        'lumbar-spine:Rotation:R': 'weak-painful',
      },
      mmt: {
        'knee:Quadriceps:L': '5/5',
        'knee:Quadriceps:R': '4-/5',
        'knee:Hamstrings:L': '5/5',
        'knee:Hamstrings:R': '4/5',
        'lumbar-spine:Hip Flexors:L': '4+/5',
        'lumbar-spine:Hip Flexors:R': '4/5',
        'lumbar-spine:Quadriceps:L': '5/5',
        'lumbar-spine:Quadriceps:R': '4-/5',
        'lumbar-spine:Hamstrings:L': '4+/5',
        'lumbar-spine:Hamstrings:R': '4/5',
        'lumbar-spine:Gluteus Maximus:L': '4/5',
        'lumbar-spine:Gluteus Maximus:R': '4-/5',
      },
      specialTests: {
        'knee:Lachman Test': 'negative',
        'knee:Anterior Drawer': 'negative',
        'knee:Posterior Drawer': 'negative',
        'knee:McMurray Test': 'equivocal',
        'knee:Valgus Stress': 'negative',
        'knee:Varus Stress': 'negative',
        'lumbar-spine:Straight Leg Raise (SLR)': 'positive',
        'lumbar-spine:Slump Test': 'positive',
        'lumbar-spine:Prone Instability': 'equivocal',
        'lumbar-spine:Central PA Spring': 'positive',
        'lumbar-spine:FABER / Patrick': 'negative',
      },
    },
    neuroscreenData: {
      selectedRegions: ['lower-extremity'],
      dermatome: {
        [neuroKey('lower-extremity', 'L3', 'L', 'derm')]: 'intact',
        [neuroKey('lower-extremity', 'L3', 'R', 'derm')]: 'intact',
        [neuroKey('lower-extremity', 'L4', 'L', 'derm')]: 'intact',
        [neuroKey('lower-extremity', 'L4', 'R', 'derm')]: 'impaired',
        [neuroKey('lower-extremity', 'L5', 'L', 'derm')]: 'intact',
        [neuroKey('lower-extremity', 'L5', 'R', 'derm')]: 'impaired',
        [neuroKey('lower-extremity', 'S1', 'L', 'derm')]: 'intact',
        [neuroKey('lower-extremity', 'S1', 'R', 'derm')]: 'impaired',
      },
      myotome: {
        [neuroKey('lower-extremity', 'L3', 'L', 'myo')]: '5/5',
        [neuroKey('lower-extremity', 'L3', 'R', 'myo')]: '4/5',
        [neuroKey('lower-extremity', 'L4', 'L', 'myo')]: '5/5',
        [neuroKey('lower-extremity', 'L4', 'R', 'myo')]: '4/5',
        [neuroKey('lower-extremity', 'L5', 'L', 'myo')]: '5/5',
        [neuroKey('lower-extremity', 'L5', 'R', 'myo')]: '4/5',
        [neuroKey('lower-extremity', 'S1', 'L', 'myo')]: '5/5',
        [neuroKey('lower-extremity', 'S1', 'R', 'myo')]: '4/5',
      },
      reflex: {
        [neuroKey('lower-extremity', 'L3', 'L', 'reflex')]: '2+',
        [neuroKey('lower-extremity', 'L3', 'R', 'reflex')]: '1+',
        [neuroKey('lower-extremity', 'L4', 'L', 'reflex')]: '2+',
        [neuroKey('lower-extremity', 'L4', 'R', 'reflex')]: '1+',
        [neuroKey('lower-extremity', 'S1', 'L', 'reflex')]: '2+',
        [neuroKey('lower-extremity', 'S1', 'R', 'reflex')]: '1+',
      },
    },
    neuro: {
      screening:
        'Light touch diminished over right L4-S1 dermatomes with reduced patellar and Achilles reflexes on the right. No upper motor neuron signs noted.',
      cranialNerves:
        'Cranial nerve screen grossly intact for conversation, eye tracking, facial symmetry, and swallow.',
    } as ObjectiveData['neuro'],
    tone: 'Normal resting tone throughout lower extremities; no clonus observed.',
    coordination: 'Heel-to-shin intact bilaterally, slowed on right due to knee stiffness.',
    balance:
      'Static standing with feet together 20 sec, tandem stance 8 sec with loss of balance, single-leg stance 2 sec right and 5 sec left.',
    functional: {
      assessment:
        'Five times sit-to-stand: 18.2 sec using bilateral UE assist. Stair negotiation step-to pattern with railing. Transfers independent but slow and guarded.',
    },
    standardizedAssessments: buildStandardizedAssessments(),
    treatmentPerformed:
      'Completed evaluation, reviewed imaging and surgical timeline, instructed in quad sets/SAQ/standing weight shifts, practiced gait sequencing with cane, and educated on pacing plus symptom monitoring.',
  };
}

export function isRobertCastellanoDemoPatient(
  patient: Pick<VspRecord, 'firstName' | 'lastName' | 'dob' | 'mrn'> | null | undefined,
): boolean {
  if (!patient) return false;

  const first = patient.firstName?.trim().toLowerCase();
  const last = patient.lastName?.trim().toLowerCase();
  const mrn = patient.mrn?.trim();

  return (
    mrn === ROBERT_CASTELLANO_DEMO_MRN ||
    (first === 'robert' && last === 'castellano' && patient.dob === '1958-04-12')
  );
}

export function buildRobertCastellanoPtDemoDraft(patient: VspRecord): TypedNoteDraft {
  return {
    subjective: buildSubjective(patient),
    objective: buildObjective(patient),
    assessment: {
      primaryImpairments:
        'Right knee mobility deficit, decreased right quadriceps strength, impaired balance, reduced gait endurance, and lumbar movement coordination deficit.',
      bodyFunctions:
        'Pain, reduced right knee ROM, decreased LE strength, sensory changes in distal right LE, reduced balance reactions, and impaired aerobic capacity.',
      activityLimitations:
        'Walking community distances, stair negotiation, repeated sit-to-stand transfers, prolonged standing, carrying household items, and uneven-ground mobility.',
      participationRestrictions:
        'Limited participation in coaching, community events, church activities, yard work, and shared household responsibilities.',
      ptDiagnosis:
        'Post-surgical right knee mobility and force-production deficits with concurrent lumbar extension/rotation syndrome and balance impairment.',
      prognosis: 'good',
      prognosticFactors:
        'Positive factors include strong family support, good motivation, and prior independence. Negative factors include diabetes, lumbar DDD, chronicity of symptoms, obesity, and peripheral neuropathy.',
      clinicalReasoning:
        'Presentation is consistent with persistent strength and mobility deficits after right TKA layered with chronic lumbar degenerative changes and distal sensory loss. Objective findings explain his stair, endurance, and balance limitations and support skilled PT focused on progressive loading, gait efficiency, balance retraining, and self-management.',
    },
    plan: {
      frequency: '2x-week',
      duration: '8-weeks',
      goals: [
        {
          goal: 'Ambulate 1,200 ft in 6 minutes with no more than one rest break and pain <= 3/10.',
          timeframe: '4-6 weeks',
          icfDomain: 'activity',
        },
        {
          goal: 'Negotiate one flight of stairs with reciprocal pattern using single handrail and good control.',
          timeframe: '6-8 weeks',
          icfDomain: 'activity',
        },
        {
          goal: 'Improve Berg Balance Scale score from 31/56 to at least 42/56 to reduce fall risk.',
          timeframe: '8-12 weeks',
          icfDomain: 'body-functions',
        },
      ],
      treatmentPlan:
        'Progress ROM, strength, functional transfer training, gait efficiency, and balance with graded exposure to community-level mobility demands.',
      exerciseFocus:
        'Right quadriceps activation, posterior chain strengthening, trunk stability, gait mechanics, stair power/control, and endurance building.',
      exercisePrescription:
        'Clinic sessions 2x/week with progressive resistance and task-specific practice. Home program daily for mobility and 5x/week for strengthening.',
      manualTherapy:
        'Patellar mobilization, scar mobilization, tibiofemoral extension mobilization, and soft tissue work to distal quadriceps/lumbar paraspinals as indicated.',
      modalities: ['Cold Pack / Cryotherapy', 'Electrical Stimulation (NMES/TENS)'],
      inClinicInterventions: [
        {
          intervention: 'Short Arc Quads (SAQ)',
          dosage:
            '3 x 10 with towel roll, slow eccentric lowering, verbal cueing for full terminal extension.',
        },
        {
          intervention: 'Gait Training (Level Surfaces)',
          dosage:
            '8 minutes with cane height review, step-through pattern cueing, and posture correction.',
        },
        {
          intervention: 'Sit-to-Stand Training',
          dosage: '3 x 8 from standard chair using reduced UE support as tolerated.',
        },
      ],
      hepInterventions: [
        {
          intervention: 'Long Arc Quads (LAQ)',
          dosage: '2 x 12 daily with 3-second hold on right.',
        },
        {
          intervention: 'Bridges',
          dosage: '2 x 10 every other day emphasizing neutral spine control.',
        },
        {
          intervention: 'Quad Stretch',
          dosage: '3 x 30 seconds daily within comfortable range.',
        },
      ],
      patientEducation:
        'Discussed expected recovery timeline, activity pacing, symptom-monitoring thresholds, home safety for stairs, cane use, edema management, and importance of adherence to HEP.',
    },
    billing: {
      diagnosisCodes: [
        {
          code: 'Z96.651',
          description: 'Status post right total knee replacement',
          label: 'Z96.651 - Presence of right artificial knee joint',
          isPrimary: true,
        },
        {
          code: 'M54.16',
          description: 'Nerve root compression in lumbar spine',
          label: 'M54.16 - Radiculopathy, lumbar region',
          isPrimary: false,
        },
        {
          code: 'M51.36',
          description: 'Disc degeneration in lumbar spine',
          label: 'M51.36 - Other intervertebral disc degeneration, lumbar region',
          isPrimary: false,
        },
      ],
      billingCodes: [
        {
          code: '97110',
          description: 'Therapeutic exercise to improve ROM, strength, endurance',
          label: '97110 - Therapeutic Exercise',
          units: 2,
          timeSpent: '23',
          linkedDiagnosisCode: 'Z96.651',
        },
        {
          code: '97112',
          description: 'Neuromuscular re-education for balance, coordination, posture',
          label: '97112 - Neuromuscular Re-education',
          units: 1,
          timeSpent: '15',
          linkedDiagnosisCode: 'M54.16',
        },
        {
          code: '97530',
          description: 'Dynamic functional activities to improve performance',
          label: '97530 - Therapeutic Activities',
          units: 1,
          timeSpent: '12',
          linkedDiagnosisCode: 'Z96.651',
        },
      ],
      ordersReferrals: [
        {
          type: 'Referral',
          description: 'Continue outpatient PT 2x/week for 8 weeks.',
          linkedDiagnosisCode: 'Z96.651',
        },
        {
          type: 'Order',
          description: 'HEP issued and reviewed with patient; recheck compliance next visit.',
          linkedDiagnosisCode: 'M54.16',
        },
      ],
    },
  };
}
