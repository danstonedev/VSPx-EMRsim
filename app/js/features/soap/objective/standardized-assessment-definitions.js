const BERG_ITEMS = [
  { id: 'sitting_to_standing', label: 'Sitting to standing' },
  { id: 'standing_unsupported', label: 'Standing unsupported' },
  { id: 'sitting_unsupported', label: 'Sitting unsupported' },
  { id: 'standing_to_sitting', label: 'Standing to sitting' },
  { id: 'transfers', label: 'Transfers' },
  { id: 'standing_eyes_closed', label: 'Standing with eyes closed' },
  { id: 'standing_feet_together', label: 'Standing with feet together' },
  { id: 'reaching_forward', label: 'Reaching forward with outstretched arm' },
  { id: 'retrieve_object_floor', label: 'Retrieve object from floor' },
  { id: 'turn_to_look_behind', label: 'Turn to look behind' },
  { id: 'turn_360', label: 'Turn 360 degrees' },
  { id: 'place_alternate_foot', label: 'Place alternate foot on stool' },
  { id: 'tandem_stance', label: 'Standing with one foot in front' },
  { id: 'single_leg_stance', label: 'Standing on one foot' },
];

const BERG_ITEM_COUNT = BERG_ITEMS.length;
const BERG_MAX_SCORE = BERG_ITEM_COUNT * 4;
const BERG_RUBRIC_SCALE = [
  { score: '4', description: 'Independent, safe, and controlled task performance.' },
  { score: '3', description: 'Completes task with supervision, mild instability, or extra time.' },
  { score: '2', description: 'Needs light assistance, support, or partial task performance.' },
  { score: '1', description: 'Needs substantial assistance and demonstrates marked instability.' },
  { score: '0', description: 'Unable to complete task safely or requires maximal assistance.' },
];

const BERG_ITEM_RUBRICS = {
  sitting_to_standing: {
    instructions: 'Please stand up. Try not to use your hands for support.',
    scores: {
      4: 'Able to stand without using hands, stabilizes independently',
      3: 'Able to stand independently using hands',
      2: 'Able to stand using hands after several tries',
      1: 'Needs minimal aid to stand or to stabilize',
      0: 'Needs moderate or maximal assist to stand',
    },
  },
  standing_unsupported: {
    instructions: 'Please stand for two minutes without holding on.',
    scores: {
      4: 'Able to stand safely for 2 minutes',
      3: 'Able to stand 2 minutes with supervision',
      2: 'Able to stand 30 seconds unsupported',
      1: 'Needs several tries to stand 30 seconds unsupported',
      0: 'Unable to stand 30 seconds unsupported',
    },
  },
  sitting_unsupported: {
    instructions: 'Please sit with arms folded for two minutes.',
    scores: {
      4: 'Able to sit safely and securely for 2 minutes',
      3: 'Able to sit 2 minutes under supervision',
      2: 'Able to sit 30 seconds',
      1: 'Able to sit 10 seconds',
      0: 'Unable to sit without support for 10 seconds',
    },
  },
  standing_to_sitting: {
    instructions: 'Please sit down.',
    scores: {
      4: 'Sits safely with minimal use of hands',
      3: 'Controls descent by using hands',
      2: 'Uses back of legs against chair to control descent',
      1: 'Sits independently but has uncontrolled descent',
      0: 'Needs assistance to sit',
    },
  },
  transfers: {
    instructions:
      'Arrange chair(s) for pivot transfer. Ask subject to transfer one way toward a seat with armrests and one way toward a seat without armrests.',
    scores: {
      4: 'Able to transfer safely with minor use of hands',
      3: 'Able to transfer safely with definite need of hands',
      2: 'Able to transfer with verbal cueing and/or supervision',
      1: 'Needs one person assist',
      0: 'Needs two people to assist or supervise for safety',
    },
  },
  standing_eyes_closed: {
    instructions: 'Please close your eyes and stand still for 10 seconds.',
    scores: {
      4: 'Able to stand 10 seconds safely',
      3: 'Able to stand 10 seconds with supervision',
      2: 'Able to stand 3 seconds',
      1: 'Unable to keep eyes closed 3 seconds but stays safely',
      0: 'Needs help to keep from falling',
    },
  },
  standing_feet_together: {
    instructions: 'Place your feet together and stand without holding on.',
    scores: {
      4: 'Able to place feet together independently and stand 1 minute safely',
      3: 'Able to place feet together independently and stand 1 minute with supervision',
      2: 'Able to place feet together independently but unable to hold for 30 seconds',
      1: 'Needs help to attain position but able to stand 15 seconds feet together',
      0: 'Needs help to attain position and unable to hold 15 seconds',
    },
  },
  reaching_forward: {
    instructions:
      'Lift arm to 90 degrees. Stretch out your fingers and reach forward as far as you can. Examiner places a ruler at the end of fingertips when arm is at 90 degrees. Fingers should not touch the ruler while reaching forward.',
    scores: {
      4: 'Can reach forward confidently >25 cm (10 in)',
      3: 'Can reach forward >12 cm (5 in) safely',
      2: 'Can reach forward >5 cm (2 in) safely',
      1: 'Reaches forward but needs supervision',
      0: 'Loses balance while trying / requires external support',
    },
  },
  retrieve_object_floor: {
    instructions: 'Pick up the shoe/slipper which is placed in front of your feet.',
    scores: {
      4: 'Able to pick up slipper safely and easily',
      3: 'Able to pick up slipper but needs supervision',
      2: 'Unable to pick up but reaches 2\u20135 cm from slipper and keeps balance independently',
      1: 'Unable to pick up and needs supervision while trying',
      0: 'Unable to try / needs assist to keep from losing balance or falling',
    },
  },
  turn_to_look_behind: {
    instructions:
      'Turn to look directly behind you over your left shoulder. Repeat to the right. Examiner may pick an object to look at directly behind the subject to encourage a better twist turn.',
    scores: {
      4: 'Looks behind from both sides and weight shifts well',
      3: 'Looks behind one side only; other side shows less weight shift',
      2: 'Turns sideways only but maintains balance',
      1: 'Needs supervision when turning',
      0: 'Needs assist to keep from losing balance or falling',
    },
  },
  turn_360: {
    instructions:
      'Turn completely around in a full circle. Pause. Then turn a full circle in the other direction.',
    scores: {
      4: 'Able to turn 360\u00B0 safely in \u22644 seconds each direction',
      3: 'Able to turn 360\u00B0 safely one side only in \u22644 seconds',
      2: 'Able to turn 360\u00B0 safely but slowly',
      1: 'Needs close supervision or verbal cueing',
      0: 'Needs assistance while turning',
    },
  },
  place_alternate_foot: {
    instructions:
      'Place each foot alternately on the step/stool. Continue until each foot has touched the step/stool four times.',
    scores: {
      4: 'Able to stand independently and safely, complete 8 steps in 20 seconds',
      3: 'Able to stand independently, complete 8 steps in >20 seconds',
      2: 'Able to complete 4 steps without aid, with supervision',
      1: 'Able to complete >2 steps, needs minimal assist',
      0: 'Needs assistance to keep from falling / unable to try',
    },
  },
  tandem_stance: {
    instructions:
      'Place one foot directly in front of the other. If you feel that you cannot place your foot directly in front, try to step far enough ahead that the heel of your forward foot is ahead of the toes of the other foot.',
    scores: {
      4: 'Able to place foot tandem independently and hold 30 seconds',
      3: 'Able to place foot ahead of other independently and hold 30 seconds',
      2: 'Able to take small step independently and hold 30 seconds',
      1: 'Needs help to step but can hold 15 seconds',
      0: 'Loses balance while stepping or standing',
    },
  },
  single_leg_stance: {
    instructions: 'Stand on one leg as long as you can without holding on.',
    scores: {
      4: 'Able to lift leg independently and hold >10 seconds',
      3: 'Able to lift leg independently and hold 5\u201310 seconds',
      2: 'Able to lift leg independently and hold \u22653 seconds',
      1: 'Tries to lift leg, unable to hold 3 seconds but remains standing independently',
      0: 'Unable to try or needs assist to prevent fall',
    },
  },
};

const STANDARDIZED_ASSESSMENT_DEFINITIONS = {
  'berg-balance-scale': {
    key: 'berg-balance-scale',
    version: 1,
    name: 'Berg Balance Scale',
    disciplines: ['pt', 'ot'],
    instructions:
      'Assess 14 functional balance tasks using standardized setup and cues. Score each item from 0 to 4, then sum for a total out of 56.',
    scoringGuide: [
      { score: '4', description: 'Independent task completion with safe control.' },
      { score: '3', description: 'Completes task with supervision or minor compensation.' },
      { score: '2', description: 'Requires minimal to moderate assistance or notable support.' },
      { score: '1', description: 'Requires substantial assistance; limited completion.' },
      { score: '0', description: 'Unable to complete task safely.' },
    ],
    scoreRange: { min: 0, max: 4 },
    maxScore: BERG_MAX_SCORE,
    items: BERG_ITEMS,
    rubricScale: BERG_RUBRIC_SCALE,
    itemRubrics: BERG_ITEM_RUBRICS,
    interpret: (total) => {
      if (total >= 45) return 'Low fall risk';
      if (total >= 41) return 'Increased fall risk';
      return 'High fall risk';
    },
  },
};

function createAssessmentId() {
  return `std-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeScoreValue(raw, min, max) {
  if (raw === '' || raw === null || raw === undefined) return '';
  const n = Number(raw);
  if (!Number.isFinite(n)) return '';
  const i = Math.trunc(n);
  if (i < min || i > max) return '';
  return i;
}

function normalizeAssessmentResponses(definition, responses) {
  const out = {};
  const safe = responses && typeof responses === 'object' ? responses : {};
  const min = definition.scoreRange?.min ?? 0;
  const max = definition.scoreRange?.max ?? 4;
  for (const item of definition.items || []) {
    out[item.id] = normalizeScoreValue(safe[item.id], min, max);
  }
  return out;
}

function countCompletedItems(definition, responses) {
  let completed = 0;
  for (const item of definition.items || []) {
    if (responses[item.id] !== '' && responses[item.id] !== undefined) completed += 1;
  }
  return completed;
}

function computeTotal(definition, responses) {
  let total = 0;
  for (const item of definition.items || []) {
    const score = responses[item.id];
    if (typeof score === 'number') total += score;
  }
  return total;
}

export function getAssessmentDefinition(instrumentKey) {
  return STANDARDIZED_ASSESSMENT_DEFINITIONS[instrumentKey] || null;
}

export function listAssessmentDefinitions() {
  return Object.values(STANDARDIZED_ASSESSMENT_DEFINITIONS);
}

export function createAssessmentInstance(instrumentKey, overrides = {}) {
  const definition = getAssessmentDefinition(instrumentKey);
  if (!definition) return null;
  return normalizeAssessmentInstance({
    id: overrides.id || createAssessmentId(),
    discipline: overrides.discipline || definition.disciplines?.[0] || 'general',
    instrumentKey: definition.key,
    version: definition.version,
    title: overrides.title || definition.name,
    status: overrides.status || 'in-progress',
    responses: overrides.responses || {},
    scores: overrides.scores || {},
    interpretation: overrides.interpretation || '',
    notes: overrides.notes || '',
    performedAt: overrides.performedAt || '',
    assessor: overrides.assessor || '',
  });
}

export function normalizeAssessmentInstance(raw) {
  const instrumentKey = raw?.instrumentKey || '';
  const definition = getAssessmentDefinition(instrumentKey);
  if (!definition) return null;

  const responses = normalizeAssessmentResponses(definition, raw?.responses);
  const completedItems = countCompletedItems(definition, responses);
  const totalItems = (definition.items || []).length;
  const maxScore = definition.maxScore || totalItems * (definition.scoreRange?.max ?? 4);
  const totalScore = computeTotal(definition, responses);
  const isComplete = totalItems > 0 && completedItems === totalItems;
  const interpretation =
    isComplete && typeof definition.interpret === 'function'
      ? definition.interpret(totalScore)
      : '';

  return {
    id: raw?.id || createAssessmentId(),
    discipline: raw?.discipline || definition.disciplines?.[0] || 'general',
    instrumentKey: definition.key,
    version: raw?.version || definition.version,
    title: raw?.title || definition.name,
    status: isComplete ? 'complete' : 'in-progress',
    responses,
    scores: {
      total: totalScore,
      max: maxScore,
      completedItems,
      totalItems,
    },
    interpretation,
    notes: raw?.notes || '',
    performedAt: raw?.performedAt || '',
    assessor: raw?.assessor || '',
  };
}

export function normalizeStandardizedAssessments(list) {
  if (!Array.isArray(list)) return [];
  return list.map((entry) => normalizeAssessmentInstance(entry)).filter(Boolean);
}

export function formatAssessmentScoreSummary(assessment) {
  const total = assessment?.scores?.total;
  const max = assessment?.scores?.max;
  if (!Number.isFinite(total) || !Number.isFinite(max) || max <= 0) return '';
  const summary = `${total}/${max}`;
  return assessment?.interpretation ? `${summary} - ${assessment.interpretation}` : summary;
}
