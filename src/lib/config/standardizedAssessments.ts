export interface AssessmentItem {
  id: string;
  label: string;
}

export type ItemRubricScores = Record<number, string>;

export interface ItemRubric {
  instructions: string;
  scores: ItemRubricScores;
}

export interface RubricScaleEntry {
  score: string;
  description: string;
}

export interface ScoreRange {
  min: number;
  max: number;
}

export interface AssessmentScores {
  total: number;
  max: number;
  completedItems: number;
  totalItems: number;
}

export interface AssessmentInstance {
  id: string;
  discipline: string;
  instrumentKey: string;
  version: number;
  title: string;
  status: 'complete' | 'in-progress';
  responses: Record<string, number | ''>;
  scores: AssessmentScores;
  interpretation: string;
  notes: string;
  performedAt: string;
  assessor: string;
}

/**
 * measurementType controls which UI the panel renders:
 * - 'ordinal-scale': Score chip grid per item (BERG, LEFS, NDI, ODI, ABC, FIM)
 * - 'timed': Single time input (mm:ss.ms) with interpretation bands (TUG, 10MWT)
 * - 'distance': Single distance input (meters) with interpretation bands (6MWT)
 */
export type MeasurementType = 'ordinal-scale' | 'timed' | 'distance';

export interface AssessmentDefinition {
  key: string;
  version: number;
  name: string;
  disciplines: string[];
  measurementType: MeasurementType;
  instructions: string;
  /** Unit label for timed/distance types (e.g., "seconds", "meters") */
  unit?: string;
  scoringGuide: RubricScaleEntry[];
  scoreRange: ScoreRange;
  maxScore: number;
  items: AssessmentItem[];
  rubricScale: RubricScaleEntry[];
  itemRubrics: Record<string, ItemRubric>;
  interpret: (total: number) => string;
}

export const BERG_ITEMS: AssessmentItem[] = [
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

export const BERG_RUBRIC_SCALE: RubricScaleEntry[] = [
  { score: '4', description: 'Independent, safe, and controlled task performance.' },
  {
    score: '3',
    description: 'Completes task with supervision, mild instability, or extra time.',
  },
  { score: '2', description: 'Needs light assistance, support, or partial task performance.' },
  {
    score: '1',
    description: 'Needs substantial assistance and demonstrates marked instability.',
  },
  {
    score: '0',
    description: 'Unable to complete task safely or requires maximal assistance.',
  },
];

export const BERG_ITEM_RUBRICS: Record<string, ItemRubric> = {
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
      2: 'Unable to pick up but reaches 2-5 cm from slipper and keeps balance independently',
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
      4: 'Able to turn 360 degrees safely in <=4 seconds each direction',
      3: 'Able to turn 360 degrees safely one side only in <=4 seconds',
      2: 'Able to turn 360 degrees safely but slowly',
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
      3: 'Able to lift leg independently and hold 5-10 seconds',
      2: 'Able to lift leg independently and hold >=3 seconds',
      1: 'Tries to lift leg, unable to hold 3 seconds but remains standing independently',
      0: 'Unable to try or needs assist to prevent fall',
    },
  },
};

const STANDARDIZED_ASSESSMENT_DEFINITIONS: Record<string, AssessmentDefinition> = {
  'berg-balance-scale': {
    key: 'berg-balance-scale',
    version: 1,
    name: 'Berg Balance Scale',
    disciplines: ['pt', 'ot'],
    measurementType: 'ordinal-scale',
    instructions:
      'Assess 14 functional balance tasks using standardized setup and cues. Score each item from 0 to 4, then sum for a total out of 56.',
    scoringGuide: [
      { score: '4', description: 'Independent task completion with safe control.' },
      { score: '3', description: 'Completes task with supervision or minor compensation.' },
      {
        score: '2',
        description: 'Requires minimal to moderate assistance or notable support.',
      },
      { score: '1', description: 'Requires substantial assistance; limited completion.' },
      { score: '0', description: 'Unable to complete task safely.' },
    ],
    scoreRange: { min: 0, max: 4 },
    maxScore: BERG_MAX_SCORE,
    items: BERG_ITEMS,
    rubricScale: BERG_RUBRIC_SCALE,
    itemRubrics: BERG_ITEM_RUBRICS,
    interpret: (total: number) => {
      if (total >= 45) return 'Low fall risk';
      if (total >= 41) return 'Increased fall risk';
      return 'High fall risk';
    },
  },

  // ── Timed Measures ──────────────────────────────────────────────────────

  'timed-up-and-go': {
    key: 'timed-up-and-go',
    version: 1,
    name: 'Timed Up and Go (TUG)',
    disciplines: ['pt', 'ot'],
    measurementType: 'timed',
    unit: 'seconds',
    instructions:
      'Patient sits in a standard arm chair, stands up, walks 3 meters at a comfortable pace, turns, walks back, and sits down. Time with a stopwatch from "Go" until seated.',
    scoringGuide: [
      { score: '<10', description: 'Freely mobile; low fall risk.' },
      { score: '10–19', description: 'Mostly independent; some fall risk.' },
      { score: '20–29', description: 'Variable mobility; moderate fall risk.' },
      { score: '≥30', description: 'Impaired mobility; high fall risk.' },
    ],
    scoreRange: { min: 0, max: 999 },
    maxScore: 0,
    items: [{ id: 'time', label: 'Time (seconds)' }],
    rubricScale: [],
    itemRubrics: {},
    interpret: (total: number) => {
      if (total <= 0) return '';
      if (total < 10) return 'Freely mobile — low fall risk';
      if (total < 20) return 'Mostly independent — some fall risk';
      if (total < 30) return 'Variable mobility — moderate fall risk';
      return 'Impaired mobility — high fall risk';
    },
  },

  '10-meter-walk-test': {
    key: '10-meter-walk-test',
    version: 1,
    name: '10-Meter Walk Test (10MWT)',
    disciplines: ['pt'],
    measurementType: 'timed',
    unit: 'seconds',
    instructions:
      'Mark a 10-meter walkway with 2-meter acceleration and deceleration zones. Time the middle 6 meters. Perform at both comfortable and fast speeds. Gait speed (m/s) = 6 / time.',
    scoringGuide: [
      { score: '>1.0 m/s', description: 'Community ambulatory.' },
      { score: '0.6–1.0 m/s', description: 'Limited community ambulation.' },
      { score: '<0.6 m/s', description: 'Household ambulator.' },
    ],
    scoreRange: { min: 0, max: 999 },
    maxScore: 0,
    items: [
      { id: 'comfortable_time', label: 'Comfortable speed (seconds)' },
      { id: 'fast_time', label: 'Fast speed (seconds)' },
    ],
    rubricScale: [],
    itemRubrics: {},
    interpret: (total: number) => {
      // total is comfortable_time; compute gait speed from 6m distance
      if (total <= 0) return '';
      const speed = 6 / total;
      const s = speed.toFixed(2);
      if (speed > 1.0) return `${s} m/s — community ambulatory`;
      if (speed >= 0.6) return `${s} m/s — limited community ambulation`;
      return `${s} m/s — household ambulator`;
    },
  },

  // ── Distance Measures ───────────────────────────────────────────────────

  '6-minute-walk-test': {
    key: '6-minute-walk-test',
    version: 1,
    name: '6-Minute Walk Test (6MWT)',
    disciplines: ['pt'],
    measurementType: 'distance',
    unit: 'meters',
    instructions:
      'Patient walks as far as possible in 6 minutes on a flat, hard surface (30-meter corridor preferred). Record total distance, rest breaks, vitals pre/post, RPE, and assistive device.',
    scoringGuide: [
      { score: '>400m', description: 'Functional community ambulation.' },
      { score: '300–400m', description: 'Limited community ambulation.' },
      { score: '<300m', description: 'Significant functional limitation.' },
    ],
    scoreRange: { min: 0, max: 9999 },
    maxScore: 0,
    items: [
      { id: 'distance', label: 'Distance (meters)' },
      { id: 'rest_breaks', label: 'Rest breaks (#)' },
    ],
    rubricScale: [],
    itemRubrics: {},
    interpret: (total: number) => {
      if (total <= 0) return '';
      if (total > 400) return `${total}m — functional community ambulation`;
      if (total >= 300) return `${total}m — limited community ambulation`;
      return `${total}m — significant functional limitation`;
    },
  },

  // ── Ordinal-Scale Questionnaires ────────────────────────────────────────

  'lower-extremity-functional-scale': {
    key: 'lower-extremity-functional-scale',
    version: 1,
    name: 'Lower Extremity Functional Scale (LEFS)',
    disciplines: ['pt', 'ot'],
    measurementType: 'ordinal-scale',
    instructions:
      'Patient rates 20 activities from 0 (extreme difficulty) to 4 (no difficulty). Total = sum of all items (max 80). MCID = 9 points.',
    scoringGuide: [
      { score: '4', description: 'No difficulty.' },
      { score: '3', description: 'A little bit of difficulty.' },
      { score: '2', description: 'Moderate difficulty.' },
      { score: '1', description: 'Quite a bit of difficulty.' },
      { score: '0', description: 'Extreme difficulty / unable.' },
    ],
    scoreRange: { min: 0, max: 4 },
    maxScore: 80,
    items: [
      { id: 'usual_work', label: 'Usual work, housework, school' },
      { id: 'usual_hobbies', label: 'Usual hobbies, recreation, sports' },
      { id: 'in_out_bath', label: 'Getting into / out of bath' },
      { id: 'walk_blocks', label: 'Walking between rooms' },
      { id: 'put_shoes', label: 'Putting on shoes / socks' },
      { id: 'squatting', label: 'Squatting' },
      { id: 'lift_bag', label: 'Lifting object from floor (e.g., bag of groceries)' },
      { id: 'light_activities', label: 'Performing light activities around home' },
      { id: 'heavy_activities', label: 'Performing heavy activities around home' },
      { id: 'get_car', label: 'Getting into / out of car' },
      { id: 'walk_2_blocks', label: 'Walking 2 blocks' },
      { id: 'walk_mile', label: 'Walking a mile' },
      { id: 'stairs_10', label: 'Going up / down 10 stairs' },
      { id: 'standing_1hr', label: 'Standing for 1 hour' },
      { id: 'sitting_1hr', label: 'Sitting for 1 hour' },
      { id: 'running', label: 'Running on even ground' },
      { id: 'running_uneven', label: 'Running on uneven ground' },
      { id: 'sharp_turns', label: 'Making sharp turns while running fast' },
      { id: 'hopping', label: 'Hopping' },
      { id: 'rolling_over', label: 'Rolling over in bed' },
    ],
    rubricScale: [
      { score: '4', description: 'No difficulty.' },
      { score: '3', description: 'A little bit of difficulty.' },
      { score: '2', description: 'Moderate difficulty.' },
      { score: '1', description: 'Quite a bit of difficulty.' },
      { score: '0', description: 'Extreme difficulty or unable to perform.' },
    ],
    itemRubrics: {},
    interpret: (total: number) => {
      const pct = Math.round((total / 80) * 100);
      if (total >= 73) return `${total}/80 (${pct}%) — minimal to no functional limitation`;
      if (total >= 47) return `${total}/80 (${pct}%) — moderate functional limitation`;
      return `${total}/80 (${pct}%) — significant functional limitation`;
    },
  },

  'neck-disability-index': {
    key: 'neck-disability-index',
    version: 1,
    name: 'Neck Disability Index (NDI)',
    disciplines: ['pt'],
    measurementType: 'ordinal-scale',
    instructions:
      'Patient rates 10 items from 0 (no disability) to 5 (complete disability). Total = sum (max 50). Expressed as percentage. MCID = 5 points (10%).',
    scoringGuide: [
      { score: '0', description: 'No disability.' },
      { score: '1', description: 'Mild difficulty.' },
      { score: '2', description: 'Moderate difficulty.' },
      { score: '3', description: 'Fairly severe difficulty.' },
      { score: '4', description: 'Very severe difficulty.' },
      { score: '5', description: 'Complete disability.' },
    ],
    scoreRange: { min: 0, max: 5 },
    maxScore: 50,
    items: [
      { id: 'pain_intensity', label: 'Pain intensity' },
      { id: 'personal_care', label: 'Personal care (washing, dressing)' },
      { id: 'lifting', label: 'Lifting' },
      { id: 'reading', label: 'Reading' },
      { id: 'headaches', label: 'Headaches' },
      { id: 'concentration', label: 'Concentration' },
      { id: 'work', label: 'Work' },
      { id: 'driving', label: 'Driving' },
      { id: 'sleeping', label: 'Sleeping' },
      { id: 'recreation', label: 'Recreation' },
    ],
    rubricScale: [
      { score: '0', description: 'No problem / no pain.' },
      { score: '1', description: 'Slight problem / mild pain.' },
      { score: '2', description: 'Moderate problem.' },
      { score: '3', description: 'Fairly severe problem.' },
      { score: '4', description: 'Very severe problem.' },
      { score: '5', description: 'Cannot do at all / worst imaginable.' },
    ],
    itemRubrics: {},
    interpret: (total: number) => {
      const pct = Math.round((total / 50) * 100);
      if (pct <= 8) return `${total}/50 (${pct}%) — no disability`;
      if (pct <= 28) return `${total}/50 (${pct}%) — mild disability`;
      if (pct <= 48) return `${total}/50 (${pct}%) — moderate disability`;
      if (pct <= 68) return `${total}/50 (${pct}%) — severe disability`;
      return `${total}/50 (${pct}%) — complete disability`;
    },
  },

  'oswestry-disability-index': {
    key: 'oswestry-disability-index',
    version: 1,
    name: 'Oswestry Disability Index (ODI)',
    disciplines: ['pt'],
    measurementType: 'ordinal-scale',
    instructions:
      'Patient rates 10 items from 0 (no disability) to 5 (complete disability). Total = sum (max 50). Expressed as percentage. MCID = 6 points (12%).',
    scoringGuide: [
      { score: '0', description: 'No difficulty.' },
      { score: '1', description: 'Slight difficulty.' },
      { score: '2', description: 'Moderate difficulty.' },
      { score: '3', description: 'Fairly severe difficulty.' },
      { score: '4', description: 'Very severe difficulty.' },
      { score: '5', description: 'Complete disability.' },
    ],
    scoreRange: { min: 0, max: 5 },
    maxScore: 50,
    items: [
      { id: 'pain_intensity', label: 'Pain intensity' },
      { id: 'personal_care', label: 'Personal care' },
      { id: 'lifting', label: 'Lifting' },
      { id: 'walking', label: 'Walking' },
      { id: 'sitting', label: 'Sitting' },
      { id: 'standing', label: 'Standing' },
      { id: 'sleeping', label: 'Sleeping' },
      { id: 'social_life', label: 'Social life' },
      { id: 'travelling', label: 'Travelling' },
      { id: 'employment', label: 'Employment / homemaking' },
    ],
    rubricScale: [
      { score: '0', description: 'No problem at all.' },
      { score: '1', description: 'Slight difficulty, no treatment needed.' },
      { score: '2', description: 'Moderate difficulty.' },
      { score: '3', description: 'Fairly severe difficulty.' },
      { score: '4', description: 'Very severe difficulty.' },
      { score: '5', description: 'Worst possible / unable to do.' },
    ],
    itemRubrics: {},
    interpret: (total: number) => {
      const pct = Math.round((total / 50) * 100);
      if (pct <= 20) return `${total}/50 (${pct}%) — minimal disability`;
      if (pct <= 40) return `${total}/50 (${pct}%) — moderate disability`;
      if (pct <= 60) return `${total}/50 (${pct}%) — severe disability`;
      if (pct <= 80) return `${total}/50 (${pct}%) — crippled`;
      return `${total}/50 (${pct}%) — bed-bound or exaggerating`;
    },
  },

  'abc-scale': {
    key: 'abc-scale',
    version: 1,
    name: 'Activities-specific Balance Confidence (ABC) Scale',
    disciplines: ['pt', 'ot'],
    measurementType: 'ordinal-scale',
    instructions:
      'Patient rates confidence (0–100%) for 16 activities. Average all items. Scores reported as percentage (0–100%). Enter whole-number confidence for each item.',
    scoringGuide: [
      { score: '>80%', description: 'High level of physical functioning.' },
      { score: '50–80%', description: 'Moderate level of physical functioning.' },
      { score: '<50%', description: 'Low level of physical functioning.' },
    ],
    scoreRange: { min: 0, max: 100 },
    maxScore: 100,
    items: [
      { id: 'walk_house', label: 'Walk around the house' },
      { id: 'stairs_up_down', label: 'Walk up or down stairs' },
      { id: 'bend_pick', label: 'Bend over and pick up a slipper' },
      { id: 'reach_shelf', label: 'Reach for a small can off a shelf at eye level' },
      { id: 'reach_tiptoe', label: 'Stand on tiptoes and reach for something above head' },
      { id: 'stand_chair', label: 'Stand on a chair and reach for something' },
      { id: 'sweep_floor', label: 'Sweep the floor' },
      { id: 'walk_parked_car', label: 'Walk outside to a nearby car' },
      { id: 'get_in_car', label: 'Get into or out of a car' },
      { id: 'walk_parking', label: 'Walk across a parking lot' },
      { id: 'walk_ramp', label: 'Walk up or down a ramp' },
      { id: 'walk_crowd', label: 'Walk in a crowded mall' },
      { id: 'bumped', label: 'Bumped into by people while walking' },
      { id: 'escalator_hold', label: 'Step on/off an escalator holding rail' },
      { id: 'escalator_parcels', label: 'Step on/off an escalator holding parcels' },
      { id: 'icy_sidewalk', label: 'Walk outside on icy sidewalks' },
    ],
    rubricScale: [],
    itemRubrics: {},
    interpret: (total: number) => {
      // total is sum; average = total / 16
      const avg = total / 16;
      const pct = Math.round(avg);
      if (avg > 80) return `${pct}% average — high physical functioning`;
      if (avg >= 50) return `${pct}% average — moderate physical functioning`;
      return `${pct}% average — low physical functioning`;
    },
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

export function getAssessmentDefinition(key: string): AssessmentDefinition | null {
  return STANDARDIZED_ASSESSMENT_DEFINITIONS[key] ?? null;
}

export function listAssessmentDefinitions(): AssessmentDefinition[] {
  return Object.values(STANDARDIZED_ASSESSMENT_DEFINITIONS);
}

export function createAssessmentId(): string {
  return `std-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeScoreValue(raw: unknown, min: number, max: number): number | '' {
  if (raw === '' || raw === null || raw === undefined) return '';

  const n = Number(raw);
  if (!Number.isFinite(n)) return '';

  const i = Math.trunc(n);
  if (i < min || i > max) return '';

  return i;
}

export function normalizeAssessmentResponses(
  def: AssessmentDefinition,
  responses: unknown,
): Record<string, number | ''> {
  const safe = asRecord(responses);
  const out: Record<string, number | ''> = {};
  const min = def.scoreRange?.min ?? 0;
  const max = def.scoreRange?.max ?? 4;

  for (const item of def.items ?? []) {
    out[item.id] = normalizeScoreValue(safe[item.id], min, max);
  }

  return out;
}

export function countCompletedItems(
  def: AssessmentDefinition,
  responses: Record<string, number | ''>,
): number {
  let completed = 0;

  for (const item of def.items ?? []) {
    if (responses[item.id] !== '' && responses[item.id] !== undefined) {
      completed += 1;
    }
  }

  return completed;
}

export function computeTotal(
  def: AssessmentDefinition,
  responses: Record<string, number | ''>,
): number {
  let total = 0;

  for (const item of def.items ?? []) {
    const score = responses[item.id];
    if (typeof score === 'number') {
      total += score;
    }
  }

  return total;
}

export function createAssessmentInstance(
  key: string,
  overrides: Partial<AssessmentInstance> = {},
): AssessmentInstance | null {
  const def = getAssessmentDefinition(key);
  if (!def) return null;

  return normalizeAssessmentInstance({
    id: overrides.id || createAssessmentId(),
    discipline: overrides.discipline || def.disciplines?.[0] || 'general',
    instrumentKey: def.key,
    version: def.version,
    title: overrides.title || def.name,
    status: overrides.status || 'in-progress',
    responses: overrides.responses || {},
    scores: overrides.scores,
    interpretation: overrides.interpretation || '',
    notes: overrides.notes || '',
    performedAt: overrides.performedAt || '',
    assessor: overrides.assessor || '',
  });
}

export function normalizeAssessmentInstance(
  raw: Partial<AssessmentInstance>,
): AssessmentInstance | null {
  const instrumentKey = raw?.instrumentKey || '';
  const def = getAssessmentDefinition(instrumentKey);
  if (!def) return null;

  const responses = normalizeAssessmentResponses(def, raw.responses);
  const completedItems = countCompletedItems(def, responses);
  const totalItems = (def.items ?? []).length;
  const maxScore = def.maxScore || totalItems * (def.scoreRange?.max ?? 4);
  const totalScore = computeTotal(def, responses);
  const isComplete = totalItems > 0 && completedItems === totalItems;
  const interpretation = isComplete ? def.interpret(totalScore) : '';

  return {
    id: raw.id || createAssessmentId(),
    discipline: raw.discipline || def.disciplines?.[0] || 'general',
    instrumentKey: def.key,
    version: raw.version || def.version,
    title: raw.title || def.name,
    status: isComplete ? 'complete' : 'in-progress',
    responses,
    scores: {
      total: totalScore,
      max: maxScore,
      completedItems,
      totalItems,
    },
    interpretation,
    notes: raw.notes || '',
    performedAt: raw.performedAt || '',
    assessor: raw.assessor || '',
  };
}

export function normalizeStandardizedAssessments(list: unknown[]): AssessmentInstance[] {
  if (!Array.isArray(list)) return [];

  return list
    .map((entry) => normalizeAssessmentInstance(asRecord(entry) as Partial<AssessmentInstance>))
    .filter((entry): entry is AssessmentInstance => entry !== null);
}

export function formatAssessmentScoreSummary(a: AssessmentInstance): string {
  const total = a?.scores?.total;
  const max = a?.scores?.max;
  if (!Number.isFinite(total) || !Number.isFinite(max) || max <= 0) return '';

  const summary = `${total}/${max}`;
  return a.interpretation ? `${summary} - ${a.interpretation}` : summary;
}
