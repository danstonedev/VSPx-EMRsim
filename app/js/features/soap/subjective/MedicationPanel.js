// MedicationPanel.js – Structured Medication Entry with Search
// Tag-based medication input with type-ahead from a PT-relevant drug database.
// Stores structured `data.medications` array and auto-generates legacy
// `data.medicationsCurrent` string for backward compatibility.

import { el, textareaAutoResize } from '../../../ui/utils.js';
import { createPortalDropdown } from '../../../ui/portal-dropdown.js';

// ─── Medication Database ────────────────────────────────────────────────
// ~120 common medications a PT student should know, organized by drug class.
// `alert` categories flag clinical relevance for rehab:
//   fall   – increased fall risk (sedation, orthostatic hypotension)
//   bleed  – bleeding / bruising risk (anticoagulants, antiplatelets)
//   bone   – bone-health concern (steroids, osteoporosis drugs)
//   cardio – cardiovascular precaution (HR / BP response to exercise)
//   neuro  – CNS side-effects relevant to therapy
//   pain   – analgesic (may mask symptoms)
//   endo   – endocrine / metabolic (hypoglycemia risk with exercise)

const MED_DB = [
  // ── NSAIDs ──
  { name: 'Ibuprofen', brand: 'Advil / Motrin', class: 'NSAID', alerts: ['pain'], mlp: 'a682159' },
  { name: 'Naproxen', brand: 'Aleve', class: 'NSAID', alerts: ['pain'], mlp: 'a681029' },
  { name: 'Meloxicam', brand: 'Mobic', class: 'NSAID', alerts: ['pain'], mlp: 'a601242' },
  { name: 'Diclofenac', brand: 'Voltaren', class: 'NSAID', alerts: ['pain'], mlp: 'a689002' },
  {
    name: 'Celecoxib',
    brand: 'Celebrex',
    class: 'NSAID (COX-2)',
    alerts: ['pain'],
    mlp: 'a699022',
  },
  {
    name: 'Aspirin',
    brand: 'Bayer',
    class: 'NSAID / Antiplatelet',
    alerts: ['pain', 'bleed'],
    mlp: 'a682878',
  },
  { name: 'Indomethacin', brand: 'Indocin', class: 'NSAID', alerts: ['pain'], mlp: 'a681027' },
  { name: 'Ketorolac', brand: 'Toradol', class: 'NSAID', alerts: ['pain'], mlp: 'a693001' },

  // ── Acetaminophen ──
  { name: 'Acetaminophen', brand: 'Tylenol', class: 'Analgesic', alerts: ['pain'], mlp: 'a681004' },

  // ── Opioids ──
  {
    name: 'Hydrocodone/APAP',
    brand: 'Vicodin / Norco',
    class: 'Opioid',
    alerts: ['pain', 'fall'],
    mlp: 'a601006',
  },
  {
    name: 'Oxycodone',
    brand: 'OxyContin / Percocet',
    class: 'Opioid',
    alerts: ['pain', 'fall'],
    mlp: 'a682132',
  },
  { name: 'Tramadol', brand: 'Ultram', class: 'Opioid', alerts: ['pain', 'fall'], mlp: 'a695011' },
  {
    name: 'Morphine',
    brand: 'MS Contin',
    class: 'Opioid',
    alerts: ['pain', 'fall'],
    mlp: 'a682133',
  },
  {
    name: 'Codeine',
    brand: 'Tylenol #3',
    class: 'Opioid',
    alerts: ['pain', 'fall'],
    mlp: 'a682065',
  },
  {
    name: 'Fentanyl patch',
    brand: 'Duragesic',
    class: 'Opioid',
    alerts: ['pain', 'fall'],
    mlp: 'a601202',
  },

  // ── Muscle Relaxants ──
  {
    name: 'Cyclobenzaprine',
    brand: 'Flexeril',
    class: 'Muscle Relaxant',
    alerts: ['fall'],
    mlp: 'a682514',
  },
  {
    name: 'Methocarbamol',
    brand: 'Robaxin',
    class: 'Muscle Relaxant',
    alerts: ['fall'],
    mlp: 'a682737',
  },
  {
    name: 'Tizanidine',
    brand: 'Zanaflex',
    class: 'Muscle Relaxant',
    alerts: ['fall'],
    mlp: 'a601121',
  },
  {
    name: 'Baclofen',
    brand: 'Lioresal',
    class: 'Muscle Relaxant',
    alerts: ['fall'],
    mlp: 'a682530',
  },
  {
    name: 'Carisoprodol',
    brand: 'Soma',
    class: 'Muscle Relaxant',
    alerts: ['fall'],
    mlp: 'a682578',
  },
  {
    name: 'Dantrolene',
    brand: 'Dantrium',
    class: 'Muscle Relaxant',
    alerts: ['fall'],
    mlp: 'a682582',
  },
  {
    name: 'Diazepam',
    brand: 'Valium',
    class: 'Benzodiazepine / Relaxant',
    alerts: ['fall'],
    mlp: 'a682047',
  },

  // ── Neuropathic Pain ──
  {
    name: 'Gabapentin',
    brand: 'Neurontin',
    class: 'Anticonvulsant',
    alerts: ['neuro', 'fall'],
    mlp: 'a694007',
  },
  {
    name: 'Pregabalin',
    brand: 'Lyrica',
    class: 'Anticonvulsant',
    alerts: ['neuro', 'fall'],
    mlp: 'a605045',
  },
  {
    name: 'Duloxetine',
    brand: 'Cymbalta',
    class: 'SNRI',
    alerts: ['neuro', 'pain'],
    mlp: 'a604030',
  },
  {
    name: 'Amitriptyline',
    brand: 'Elavil',
    class: 'TCA',
    alerts: ['neuro', 'fall'],
    mlp: 'a682388',
  },
  {
    name: 'Nortriptyline',
    brand: 'Pamelor',
    class: 'TCA',
    alerts: ['neuro', 'fall'],
    mlp: 'a682620',
  },
  {
    name: 'Carbamazepine',
    brand: 'Tegretol',
    class: 'Anticonvulsant',
    alerts: ['neuro', 'fall'],
    mlp: 'a682237',
  },

  // ── Anticoagulants / Antiplatelets ──
  {
    name: 'Warfarin',
    brand: 'Coumadin',
    class: 'Anticoagulant',
    alerts: ['bleed'],
    mlp: 'a682277',
  },
  {
    name: 'Rivaroxaban',
    brand: 'Xarelto',
    class: 'Anticoagulant (DOAC)',
    alerts: ['bleed'],
    mlp: 'a612049',
  },
  {
    name: 'Apixaban',
    brand: 'Eliquis',
    class: 'Anticoagulant (DOAC)',
    alerts: ['bleed'],
    mlp: 'a613002',
  },
  {
    name: 'Dabigatran',
    brand: 'Pradaxa',
    class: 'Anticoagulant (DOAC)',
    alerts: ['bleed'],
    mlp: 'a610024',
  },
  {
    name: 'Enoxaparin',
    brand: 'Lovenox',
    class: 'Anticoagulant (LMWH)',
    alerts: ['bleed'],
    mlp: 'a696006',
  },
  { name: 'Heparin', brand: 'Heparin', class: 'Anticoagulant', alerts: ['bleed'], mlp: 'a682826' },
  {
    name: 'Clopidogrel',
    brand: 'Plavix',
    class: 'Antiplatelet',
    alerts: ['bleed'],
    mlp: 'a601040',
  },

  // ── Beta Blockers ──
  {
    name: 'Metoprolol',
    brand: 'Lopressor / Toprol',
    class: 'Beta Blocker',
    alerts: ['cardio'],
    mlp: 'a682864',
  },
  {
    name: 'Atenolol',
    brand: 'Tenormin',
    class: 'Beta Blocker',
    alerts: ['cardio'],
    mlp: 'a684031',
  },
  {
    name: 'Propranolol',
    brand: 'Inderal',
    class: 'Beta Blocker',
    alerts: ['cardio'],
    mlp: 'a682607',
  },
  { name: 'Carvedilol', brand: 'Coreg', class: 'Beta Blocker', alerts: ['cardio'], mlp: 'a697042' },
  {
    name: 'Bisoprolol',
    brand: 'Zebeta',
    class: 'Beta Blocker',
    alerts: ['cardio'],
    mlp: 'a693024',
  },

  // ── ACE Inhibitors ──
  {
    name: 'Lisinopril',
    brand: 'Zestril / Prinivil',
    class: 'ACE Inhibitor',
    alerts: ['cardio'],
    mlp: 'a692051',
  },
  {
    name: 'Enalapril',
    brand: 'Vasotec',
    class: 'ACE Inhibitor',
    alerts: ['cardio'],
    mlp: 'a686022',
  },
  { name: 'Ramipril', brand: 'Altace', class: 'ACE Inhibitor', alerts: ['cardio'], mlp: 'a692027' },
  {
    name: 'Benazepril',
    brand: 'Lotensin',
    class: 'ACE Inhibitor',
    alerts: ['cardio'],
    mlp: 'a693038',
  },

  // ── ARBs ──
  { name: 'Losartan', brand: 'Cozaar', class: 'ARB', alerts: ['cardio'], mlp: 'a695008' },
  { name: 'Valsartan', brand: 'Diovan', class: 'ARB', alerts: ['cardio'], mlp: 'a697015' },
  { name: 'Irbesartan', brand: 'Avapro', class: 'ARB', alerts: ['cardio'], mlp: 'a698009' },

  // ── Calcium Channel Blockers ──
  { name: 'Amlodipine', brand: 'Norvasc', class: 'CCB', alerts: ['cardio'], mlp: 'a692044' },
  { name: 'Diltiazem', brand: 'Cardizem', class: 'CCB', alerts: ['cardio'], mlp: 'a684027' },
  { name: 'Nifedipine', brand: 'Procardia', class: 'CCB', alerts: ['cardio'], mlp: 'a684028' },
  { name: 'Verapamil', brand: 'Calan', class: 'CCB', alerts: ['cardio'], mlp: 'a682395' },

  // ── Diuretics ──
  {
    name: 'Furosemide',
    brand: 'Lasix',
    class: 'Loop Diuretic',
    alerts: ['cardio', 'fall'],
    mlp: 'a682858',
  },
  {
    name: 'Hydrochlorothiazide',
    brand: 'HCTZ',
    class: 'Thiazide Diuretic',
    alerts: ['cardio'],
    mlp: 'a682571',
  },
  {
    name: 'Spironolactone',
    brand: 'Aldactone',
    class: 'K-Sparing Diuretic',
    alerts: ['cardio'],
    mlp: 'a682627',
  },
  {
    name: 'Bumetanide',
    brand: 'Bumex',
    class: 'Loop Diuretic',
    alerts: ['cardio', 'fall'],
    mlp: 'a684051',
  },

  // ── Statins ──
  { name: 'Atorvastatin', brand: 'Lipitor', class: 'Statin', alerts: [], mlp: 'a600045' },
  { name: 'Rosuvastatin', brand: 'Crestor', class: 'Statin', alerts: [], mlp: 'a603033' },
  { name: 'Simvastatin', brand: 'Zocor', class: 'Statin', alerts: [], mlp: 'a692030' },
  { name: 'Pravastatin', brand: 'Pravachol', class: 'Statin', alerts: [], mlp: 'a692025' },

  // ── Diabetes ──
  { name: 'Metformin', brand: 'Glucophage', class: 'Biguanide', alerts: ['endo'], mlp: 'a696005' },
  {
    name: 'Glipizide',
    brand: 'Glucotrol',
    class: 'Sulfonylurea',
    alerts: ['endo'],
    mlp: 'a684053',
  },
  { name: 'Glyburide', brand: 'DiaBeta', class: 'Sulfonylurea', alerts: ['endo'], mlp: 'a684058' },
  {
    name: 'Insulin (rapid)',
    brand: 'Humalog / Novolog',
    class: 'Insulin',
    alerts: ['endo'],
    mlp: 'a605013',
  },
  {
    name: 'Insulin (long)',
    brand: 'Lantus / Levemir',
    class: 'Insulin',
    alerts: ['endo'],
    mlp: 'a600027',
  },
  {
    name: 'Empagliflozin',
    brand: 'Jardiance',
    class: 'SGLT2 Inhibitor',
    alerts: ['endo'],
    mlp: 'a614044',
  },
  {
    name: 'Sitagliptin',
    brand: 'Januvia',
    class: 'DPP-4 Inhibitor',
    alerts: ['endo'],
    mlp: 'a607015',
  },
  {
    name: 'Semaglutide',
    brand: 'Ozempic / Wegovy',
    class: 'GLP-1 Agonist',
    alerts: ['endo'],
    mlp: 'a618008',
  },

  // ── Corticosteroids ──
  {
    name: 'Prednisone',
    brand: 'Deltasone',
    class: 'Corticosteroid',
    alerts: ['bone', 'endo'],
    mlp: 'a601102',
  },
  {
    name: 'Methylprednisolone',
    brand: 'Medrol',
    class: 'Corticosteroid',
    alerts: ['bone', 'endo'],
    mlp: 'a682795',
  },
  {
    name: 'Dexamethasone',
    brand: 'Decadron',
    class: 'Corticosteroid',
    alerts: ['bone', 'endo'],
    mlp: 'a682792',
  },
  {
    name: 'Prednisolone',
    brand: 'Prelone',
    class: 'Corticosteroid',
    alerts: ['bone', 'endo'],
    mlp: 'a615042',
  },

  // ── Osteoporosis ──
  {
    name: 'Alendronate',
    brand: 'Fosamax',
    class: 'Bisphosphonate',
    alerts: ['bone'],
    mlp: 'a601011',
  },
  {
    name: 'Risedronate',
    brand: 'Actonel',
    class: 'Bisphosphonate',
    alerts: ['bone'],
    mlp: 'a600042',
  },
  {
    name: 'Denosumab',
    brand: 'Prolia',
    class: 'RANK-L Inhibitor',
    alerts: ['bone'],
    mlp: 'a610023',
  },
  { name: 'Teriparatide', brand: 'Forteo', class: 'PTH Analog', alerts: ['bone'], mlp: 'a603018' },
  { name: 'Calcium + Vitamin D', brand: 'Various', class: 'Supplement', alerts: ['bone'] },

  // ── Parkinson's ──
  {
    name: 'Carbidopa/Levodopa',
    brand: 'Sinemet',
    class: 'Dopaminergic',
    alerts: ['neuro', 'fall'],
    mlp: 'a601068',
  },
  {
    name: 'Ropinirole',
    brand: 'Requip',
    class: 'Dopamine Agonist',
    alerts: ['neuro', 'fall'],
    mlp: 'a698013',
  },
  {
    name: 'Pramipexole',
    brand: 'Mirapex',
    class: 'Dopamine Agonist',
    alerts: ['neuro', 'fall'],
    mlp: 'a697029',
  },
  {
    name: 'Amantadine',
    brand: 'Symmetrel',
    class: 'Dopaminergic',
    alerts: ['neuro', 'fall'],
    mlp: 'a682064',
  },
  {
    name: 'Entacapone',
    brand: 'Comtan',
    class: 'COMT Inhibitor',
    alerts: ['neuro'],
    mlp: 'a601236',
  },

  // ── Antispasticity (neuro rehab) ──
  {
    name: 'OnabotulinumtoxinA',
    brand: 'Botox',
    class: 'Neuromuscular Blocker',
    alerts: ['neuro'],
    mlp: 'a696016',
  },

  // ── Antidepressants / Anxiolytics (common comorbid) ──
  { name: 'Sertraline', brand: 'Zoloft', class: 'SSRI', alerts: ['neuro'], mlp: 'a697048' },
  { name: 'Fluoxetine', brand: 'Prozac', class: 'SSRI', alerts: ['neuro'], mlp: 'a689006' },
  { name: 'Citalopram', brand: 'Celexa', class: 'SSRI', alerts: ['neuro'], mlp: 'a699001' },
  { name: 'Escitalopram', brand: 'Lexapro', class: 'SSRI', alerts: ['neuro'], mlp: 'a603005' },
  { name: 'Venlafaxine', brand: 'Effexor', class: 'SNRI', alerts: ['neuro'], mlp: 'a694020' },
  { name: 'Bupropion', brand: 'Wellbutrin', class: 'NDRI', alerts: ['neuro'], mlp: 'a695033' },
  { name: 'Lorazepam', brand: 'Ativan', class: 'Benzodiazepine', alerts: ['fall'], mlp: 'a682053' },
  { name: 'Alprazolam', brand: 'Xanax', class: 'Benzodiazepine', alerts: ['fall'], mlp: 'a684001' },
  {
    name: 'Clonazepam',
    brand: 'Klonopin',
    class: 'Benzodiazepine',
    alerts: ['fall'],
    mlp: 'a682279',
  },

  // ── Sleep aids ──
  {
    name: 'Zolpidem',
    brand: 'Ambien',
    class: 'Sedative-Hypnotic',
    alerts: ['fall'],
    mlp: 'a693025',
  },
  {
    name: 'Trazodone',
    brand: 'Desyrel',
    class: 'Antidepressant / Sedative',
    alerts: ['fall'],
    mlp: 'a681038',
  },

  // ── Seizure / neuro ──
  {
    name: 'Levetiracetam',
    brand: 'Keppra',
    class: 'Anticonvulsant',
    alerts: ['neuro'],
    mlp: 'a699059',
  },
  {
    name: 'Phenytoin',
    brand: 'Dilantin',
    class: 'Anticonvulsant',
    alerts: ['neuro', 'bone'],
    mlp: 'a682022',
  },
  {
    name: 'Lamotrigine',
    brand: 'Lamictal',
    class: 'Anticonvulsant',
    alerts: ['neuro'],
    mlp: 'a695007',
  },
  {
    name: 'Topiramate',
    brand: 'Topamax',
    class: 'Anticonvulsant',
    alerts: ['neuro'],
    mlp: 'a697012',
  },
  {
    name: 'Valproic Acid',
    brand: 'Depakote',
    class: 'Anticonvulsant',
    alerts: ['neuro'],
    mlp: 'a682412',
  },

  // ── MS-specific ──
  {
    name: 'Fingolimod',
    brand: 'Gilenya',
    class: 'S1P Modulator',
    alerts: ['neuro', 'cardio'],
    mlp: 'a611027',
  },
  {
    name: 'Dimethyl Fumarate',
    brand: 'Tecfidera',
    class: 'Immunomodulator',
    alerts: ['neuro'],
    mlp: 'a614017',
  },
  {
    name: 'Ocrelizumab',
    brand: 'Ocrevus',
    class: 'Anti-CD20 mAb',
    alerts: ['neuro'],
    mlp: 'a617028',
  },
  {
    name: 'Interferon beta-1a',
    brand: 'Avonex / Rebif',
    class: 'Immunomodulator',
    alerts: ['neuro'],
    mlp: 'a601152',
  },

  // ── Thyroid ──
  {
    name: 'Levothyroxine',
    brand: 'Synthroid',
    class: 'Thyroid Hormone',
    alerts: ['endo'],
    mlp: 'a682461',
  },

  // ── GI (common comorbid) ──
  { name: 'Omeprazole', brand: 'Prilosec', class: 'PPI', alerts: ['bone'], mlp: 'a693050' },
  { name: 'Pantoprazole', brand: 'Protonix', class: 'PPI', alerts: ['bone'], mlp: 'a601246' },
  { name: 'Ondansetron', brand: 'Zofran', class: 'Anti-emetic', alerts: [], mlp: 'a601209' },

  // ── Allergy / Respiratory ──
  {
    name: 'Diphenhydramine',
    brand: 'Benadryl',
    class: 'Antihistamine',
    alerts: ['fall'],
    mlp: 'a682539',
  },
  { name: 'Cetirizine', brand: 'Zyrtec', class: 'Antihistamine', alerts: [], mlp: 'a698026' },
  {
    name: 'Montelukast',
    brand: 'Singulair',
    class: 'Leukotriene Inhibitor',
    alerts: [],
    mlp: 'a600014',
  },
  {
    name: 'Albuterol',
    brand: 'ProAir / Ventolin',
    class: 'Bronchodilator',
    alerts: ['cardio'],
    mlp: 'a682145',
  },
  {
    name: 'Fluticasone',
    brand: 'Flovent',
    class: 'Inhaled Corticosteroid',
    alerts: [],
    mlp: 'a601049',
  },

  // ── Topicals (PT-relevant) ──
  {
    name: 'Lidocaine patch',
    brand: 'Lidoderm',
    class: 'Topical Anesthetic',
    alerts: ['pain'],
    mlp: 'a603026',
  },
  {
    name: 'Diclofenac gel',
    brand: 'Voltaren Gel',
    class: 'Topical NSAID',
    alerts: ['pain'],
    mlp: 'a611002',
  },
  {
    name: 'Capsaicin cream',
    brand: 'Zostrix',
    class: 'Topical Analgesic',
    alerts: ['pain'],
    mlp: 'a601269',
  },
];

// Pre-compute lowercase search strings once for performance
const MED_DB_INDEXED = MED_DB.map((m) => ({
  ...m,
  _search: `${m.name} ${m.brand} ${m.class}`.toLowerCase(),
}));

// ── Alert labels for display ────────────────────────────────────────────
const ALERT_LABELS = {
  fall: 'Fall risk',
  bleed: 'Bleeding risk',
  bone: 'Bone health',
  cardio: 'Cardio precaution',
  neuro: 'CNS effects',
  pain: 'Analgesic',
  endo: 'Metabolic',
};

// ── Common dosages by medication name ───────────────────────────────────
const MED_DOSES = {
  // NSAIDs
  Ibuprofen: ['200mg', '400mg', '600mg', '800mg'],
  Naproxen: ['220mg', '250mg', '500mg'],
  Meloxicam: ['7.5mg', '15mg'],
  Diclofenac: ['25mg', '50mg', '75mg'],
  Celecoxib: ['100mg', '200mg'],
  Aspirin: ['81mg', '325mg'],
  Indomethacin: ['25mg', '50mg'],
  Ketorolac: ['10mg'],
  // Acetaminophen
  Acetaminophen: ['325mg', '500mg', '650mg', '1000mg'],
  // Opioids
  'Hydrocodone/APAP': ['5/325mg', '7.5/325mg', '10/325mg'],
  Oxycodone: ['5mg', '10mg', '15mg', '20mg'],
  Tramadol: ['50mg', '100mg'],
  Morphine: ['15mg', '30mg', '60mg'],
  Codeine: ['15mg', '30mg', '60mg'],
  'Fentanyl patch': ['12mcg/hr', '25mcg/hr', '50mcg/hr', '75mcg/hr'],
  // Muscle Relaxants
  Cyclobenzaprine: ['5mg', '10mg'],
  Methocarbamol: ['500mg', '750mg'],
  Tizanidine: ['2mg', '4mg'],
  Baclofen: ['5mg', '10mg', '20mg'],
  Carisoprodol: ['250mg', '350mg'],
  Dantrolene: ['25mg', '50mg', '100mg'],
  Diazepam: ['2mg', '5mg', '10mg'],
  // Neuropathic Pain
  Gabapentin: ['100mg', '300mg', '600mg', '800mg'],
  Pregabalin: ['25mg', '50mg', '75mg', '150mg', '300mg'],
  Duloxetine: ['20mg', '30mg', '60mg'],
  Amitriptyline: ['10mg', '25mg', '50mg'],
  Nortriptyline: ['10mg', '25mg', '50mg'],
  Carbamazepine: ['100mg', '200mg', '400mg'],
  // Anticoagulants / Antiplatelets
  Warfarin: ['1mg', '2mg', '2.5mg', '5mg', '7.5mg', '10mg'],
  Rivaroxaban: ['10mg', '15mg', '20mg'],
  Apixaban: ['2.5mg', '5mg'],
  Dabigatran: ['75mg', '150mg'],
  Enoxaparin: ['30mg', '40mg', '60mg', '80mg'],
  Heparin: ['5000 units'],
  Clopidogrel: ['75mg'],
  // Beta Blockers
  Metoprolol: ['25mg', '50mg', '100mg', '200mg'],
  Atenolol: ['25mg', '50mg', '100mg'],
  Propranolol: ['10mg', '20mg', '40mg', '80mg'],
  Carvedilol: ['3.125mg', '6.25mg', '12.5mg', '25mg'],
  Bisoprolol: ['2.5mg', '5mg', '10mg'],
  // ACE Inhibitors
  Lisinopril: ['2.5mg', '5mg', '10mg', '20mg', '40mg'],
  Enalapril: ['2.5mg', '5mg', '10mg', '20mg'],
  Ramipril: ['1.25mg', '2.5mg', '5mg', '10mg'],
  Benazepril: ['5mg', '10mg', '20mg', '40mg'],
  // ARBs
  Losartan: ['25mg', '50mg', '100mg'],
  Valsartan: ['40mg', '80mg', '160mg', '320mg'],
  Irbesartan: ['75mg', '150mg', '300mg'],
  // Calcium Channel Blockers
  Amlodipine: ['2.5mg', '5mg', '10mg'],
  Diltiazem: ['120mg', '180mg', '240mg', '360mg'],
  Nifedipine: ['30mg', '60mg', '90mg'],
  Verapamil: ['80mg', '120mg', '180mg', '240mg'],
  // Diuretics
  Furosemide: ['20mg', '40mg', '80mg'],
  Hydrochlorothiazide: ['12.5mg', '25mg', '50mg'],
  Spironolactone: ['25mg', '50mg', '100mg'],
  Bumetanide: ['0.5mg', '1mg', '2mg'],
  // Statins
  Atorvastatin: ['10mg', '20mg', '40mg', '80mg'],
  Rosuvastatin: ['5mg', '10mg', '20mg', '40mg'],
  Simvastatin: ['10mg', '20mg', '40mg'],
  Pravastatin: ['10mg', '20mg', '40mg', '80mg'],
  // Diabetes
  Metformin: ['500mg', '850mg', '1000mg'],
  Glipizide: ['2.5mg', '5mg', '10mg'],
  Glyburide: ['1.25mg', '2.5mg', '5mg'],
  'Insulin (rapid)': ['varies by patient'],
  'Insulin (long)': ['varies by patient'],
  Empagliflozin: ['10mg', '25mg'],
  Sitagliptin: ['25mg', '50mg', '100mg'],
  Semaglutide: ['0.25mg', '0.5mg', '1mg', '2mg'],
  // Corticosteroids
  Prednisone: ['5mg', '10mg', '20mg', '40mg', '60mg'],
  Methylprednisolone: ['4mg dose pack', '16mg'],
  Dexamethasone: ['0.5mg', '0.75mg', '4mg', '6mg'],
  Prednisolone: ['5mg', '15mg'],
  // Osteoporosis
  Alendronate: ['10mg daily', '70mg weekly'],
  Risedronate: ['5mg daily', '35mg weekly'],
  Denosumab: ['60mg SC q6mo'],
  Teriparatide: ['20mcg daily'],
  'Calcium + Vitamin D': ['500mg/400IU', '600mg/800IU'],
  // Parkinson's
  'Carbidopa/Levodopa': ['10/100mg', '25/100mg', '25/250mg'],
  Ropinirole: ['0.25mg', '0.5mg', '1mg', '2mg'],
  Pramipexole: ['0.125mg', '0.25mg', '0.5mg', '1mg'],
  Amantadine: ['100mg'],
  Entacapone: ['200mg'],
  // Antispasticity
  OnabotulinumtoxinA: ['varies by muscle'],
  // Antidepressants / Anxiolytics
  Sertraline: ['25mg', '50mg', '100mg', '150mg', '200mg'],
  Fluoxetine: ['10mg', '20mg', '40mg'],
  Citalopram: ['10mg', '20mg', '40mg'],
  Escitalopram: ['5mg', '10mg', '20mg'],
  Venlafaxine: ['37.5mg', '75mg', '150mg'],
  Bupropion: ['75mg', '100mg', '150mg', '300mg'],
  Lorazepam: ['0.5mg', '1mg', '2mg'],
  Alprazolam: ['0.25mg', '0.5mg', '1mg'],
  Clonazepam: ['0.5mg', '1mg', '2mg'],
  // Sleep
  Zolpidem: ['5mg', '10mg'],
  Trazodone: ['50mg', '100mg', '150mg'],
  // Seizure / Neuro
  Levetiracetam: ['250mg', '500mg', '750mg', '1000mg'],
  Phenytoin: ['100mg', '200mg', '300mg'],
  Lamotrigine: ['25mg', '50mg', '100mg', '200mg'],
  Topiramate: ['25mg', '50mg', '100mg', '200mg'],
  'Valproic Acid': ['250mg', '500mg'],
  // MS
  Fingolimod: ['0.5mg'],
  'Dimethyl Fumarate': ['120mg', '240mg'],
  Ocrelizumab: ['300mg IV'],
  'Interferon beta-1a': ['30mcg IM weekly'],
  // Thyroid
  Levothyroxine: ['25mcg', '50mcg', '75mcg', '88mcg', '100mcg', '112mcg', '125mcg', '150mcg'],
  // GI
  Omeprazole: ['20mg', '40mg'],
  Pantoprazole: ['20mg', '40mg'],
  Ondansetron: ['4mg', '8mg'],
  // Allergy / Respiratory
  Diphenhydramine: ['25mg', '50mg'],
  Cetirizine: ['5mg', '10mg'],
  Montelukast: ['10mg'],
  Albuterol: ['90mcg/inh, 2 puffs PRN'],
  Fluticasone: ['44mcg', '110mcg', '220mcg'],
  // Topicals
  'Lidocaine patch': ['5% patch'],
  'Diclofenac gel': ['1% gel'],
  'Capsaicin cream': ['0.025%', '0.075%'],
};

// ── Common frequency options ────────────────────────────────────────────
const FREQ_OPTIONS = [
  { value: '', label: 'Frequency' },
  { value: 'QD (once daily)', label: 'QD (once daily)' },
  { value: 'BID (twice daily)', label: 'BID (twice daily)' },
  { value: 'TID (3x daily)', label: 'TID (3x daily)' },
  { value: 'QID (4x daily)', label: 'QID (4x daily)' },
  { value: 'Q4H (every 4 hrs)', label: 'Q4H (every 4 hrs)' },
  { value: 'Q6H (every 6 hrs)', label: 'Q6H (every 6 hrs)' },
  { value: 'Q8H (every 8 hrs)', label: 'Q8H (every 8 hrs)' },
  { value: 'Q12H (every 12 hrs)', label: 'Q12H (every 12 hrs)' },
  { value: 'PRN (as needed)', label: 'PRN (as needed)' },
  { value: 'QHS (at bedtime)', label: 'QHS (at bedtime)' },
  { value: 'QAM (every morning)', label: 'QAM (every morning)' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Biweekly', label: 'Biweekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Q6 months', label: 'Q6 months' },
];

// ─── Scoring ────────────────────────────────────────────────────────────
function scoreMed(med, q) {
  const name = med.name.toLowerCase();
  const brand = med.brand.toLowerCase();
  const cls = med.class.toLowerCase();
  if (name === q) return 100;
  if (name.startsWith(q)) return 90;
  if (brand.startsWith(q)) return 80;
  if (cls.startsWith(q)) return 70;
  if (name.includes(q)) return 60;
  if (brand.includes(q)) return 55;
  if (med._search.includes(q)) return 40;
  return 0;
}

// ─── Build backward-compat summary string ───────────────────────────────
function buildMedSummary(medications) {
  if (!medications || !medications.length) return '';
  return medications
    .map((m) => {
      const parts = [m.name];
      if (m.dose) parts.push(m.dose);
      if (m.frequency) parts.push(m.frequency);
      return parts.join(' ');
    })
    .join(', ');
}

// ─── Initialize structured data, migrating from legacy string ───────────
function initMedicationsData(data) {
  if (Array.isArray(data.medications) && data.medications.length > 0) return;

  // Attempt migration from legacy comma-separated string
  if (data.medicationsCurrent && typeof data.medicationsCurrent === 'string') {
    const parts = data.medicationsCurrent
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) {
      data.medications = parts.map((raw) => ({
        name: raw,
        dose: '',
        frequency: '',
        class: '',
        alerts: [],
        custom: true,
      }));
      return;
    }
  }
  data.medications = [];
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export const MedicationPanel = {
  /**
   * @param {Object} data - Subjective data (reads/writes medications, medicationsCurrent)
   * @param {Function} updateField - Callback to persist a single field
   * @returns {HTMLElement}
   */
  create(data, updateField) {
    initMedicationsData(data);

    const wrapper = el('div', { class: 'med-panel' });

    // Persist helper — structured array + legacy string
    const persist = () => {
      updateField('medications', data.medications);
      updateField('medicationsCurrent', buildMedSummary(data.medications));
    };

    // ── Count badge ─────────────────────────────────────────────────────
    const countBadge = el('span', { class: 'med-panel__badge' });

    // ── Body ────────────────────────────────────────────────────────────
    const body = el('div', { class: 'med-panel__body' });
    wrapper.append(body);

    // ── Search row ──────────────────────────────────────────────────────
    const searchWrap = el('div', { class: 'med-panel__search-wrap' });
    const searchInput = el('input', {
      type: 'text',
      class:
        'med-panel__search-input combined-neuroscreen__input combined-neuroscreen__input--left',
      placeholder: 'Search medication by name, brand, or class…',
      autocomplete: 'off',
    });
    searchWrap.append(searchInput);

    const portal = createPortalDropdown(searchInput, 'med-panel__results');
    const resultsList = portal.dropdown;
    let highlightIndex = -1;
    let currentResults = [];

    function renderResults() {
      resultsList.replaceChildren();
      if (!currentResults.length) {
        portal.hide();
        return;
      }
      portal.show();
      currentResults.forEach((med, idx) => {
        const alertTags = (med.alerts || []).map((a) => ALERT_LABELS[a] || a).join(', ');
        const row = el(
          'div',
          {
            class: 'med-panel__result-row',
            style: idx === highlightIndex ? 'background: rgba(0,154,68,0.08);' : '',
            onmouseenter: () => {
              highlightIndex = idx;
              // Update highlight inline instead of re-rendering (preserves click targets)
              Array.from(resultsList.children).forEach((child, cIdx) => {
                child.style.background = cIdx === idx ? 'rgba(0,154,68,0.08)' : '';
              });
            },
            onclick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              selectMed(med);
            },
          },
          [
            el(
              'div',
              { class: 'med-panel__result-name' },
              [
                document.createTextNode(med.name),
                med.brand
                  ? el('span', { class: 'med-panel__result-brand' }, ` (${med.brand})`)
                  : null,
              ].filter(Boolean),
            ),
            el(
              'div',
              { class: 'med-panel__result-meta' },
              [
                el('span', { class: 'med-panel__result-class' }, med.class || ''),
                alertTags ? el('span', { class: 'med-panel__result-alerts' }, alertTags) : null,
              ].filter(Boolean),
            ),
          ],
        );
        resultsList.append(row);
      });
    }

    function performSearch() {
      const q = (searchInput.value || '').trim().toLowerCase();
      if (!q) {
        currentResults = [];
        renderResults();
        return;
      }
      // Exclude already-added meds
      const existing = new Set(data.medications.map((m) => m.name.toLowerCase()));
      currentResults = MED_DB_INDEXED.filter((m) => !existing.has(m.name.toLowerCase()))
        .map((m) => ({ ...m, _score: scoreMed(m, q) }))
        .filter((m) => m._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 12);
      highlightIndex = currentResults.length ? 0 : -1;
      renderResults();
    }

    function selectMed(med) {
      data.medications.push({
        name: med.name,
        brand: med.brand || '',
        dose: '',
        frequency: '',
        class: med.class || '',
        alerts: med.alerts || [],
        mlp: med.mlp || '',
        custom: false,
      });
      searchInput.value = '';
      currentResults = [];
      portal.hide();
      persist();
      renderBody();
    }

    function addCustomMed() {
      const raw = searchInput.value.trim();
      if (!raw) return;
      data.medications.push({
        name: raw,
        dose: '',
        frequency: '',
        class: '',
        alerts: [],
        custom: true,
      });
      searchInput.value = '';
      currentResults = [];
      portal.hide();
      persist();
      renderBody();
    }

    searchInput.addEventListener('input', () => performSearch());
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        portal.hide();
        searchInput.blur();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (currentResults.length && highlightIndex >= 0) {
          selectMed(currentResults[highlightIndex]);
        } else {
          addCustomMed();
        }
        return;
      }
      if (!currentResults.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightIndex = (highlightIndex + 1) % currentResults.length;
        renderResults();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightIndex = (highlightIndex - 1 + currentResults.length) % currentResults.length;
        renderResults();
      }
    });

    // ── Render body ─────────────────────────────────────────────────────
    function updateBadge() {
      const n = data.medications.length;
      countBadge.textContent = n ? `${n} medication${n > 1 ? 's' : ''}` : 'None listed';
      countBadge.className = 'med-panel__badge' + (n ? '' : ' med-panel__badge--empty');
    }

    function renderBody() {
      body.replaceChildren();

      // ── Integrated search bar with icon and badge ───────────────────
      const searchIcon = el(
        'span',
        { class: 'med-panel__search-icon', 'aria-hidden': 'true' },
        '\u{1F50D}',
      );
      const searchBar = el('div', { class: 'med-panel__search-bar' }, [
        searchIcon,
        searchWrap,
        countBadge,
      ]);
      body.append(searchBar);

      const hint = el(
        'div',
        { class: 'med-panel__search-hint' },
        'Type to search or press Enter to add a custom entry',
      );
      body.append(hint);

      // ── Medication list ─────────────────────────────────────────────
      if (data.medications.length) {
        const list = el('div', { class: 'med-panel__list' });

        data.medications.forEach((med, idx) => {
          const chip = createMedChip(med, idx, data, persist, renderBody);
          list.append(chip);
        });
        body.append(list);
      } else {
        body.append(el('div', { class: 'med-panel__empty' }, 'No medications listed.'));
      }

      // Additional notes textarea
      const notesInput = el('textarea', {
        class:
          'med-panel__notes-input combined-neuroscreen__input combined-neuroscreen__input--left',
        rows: 1,
        placeholder: 'Medication allergies, interactions noted, pharmacist consult…',
      });
      notesInput.value = data.medicationNotes || '';
      textareaAutoResize(notesInput);
      notesInput.addEventListener('blur', () => {
        data.medicationNotes = notesInput.value;
        updateField('medicationNotes', data.medicationNotes);
      });

      const notesSection = el('div', { class: 'med-panel__notes' }, [
        el('label', { class: 'med-panel__notes-label' }, 'Notes'),
        notesInput,
      ]);
      body.append(notesSection);

      updateBadge();
    }

    renderBody();
    return wrapper;
  },
};

// ─── Medication chip ────────────────────────────────────────────────────
let _datalistId = 0;

function createDoseInput(med, persist, chip) {
  const commonDoses = MED_DOSES[med.name] || [];
  const doseInput = el('input', {
    type: 'text',
    class: 'med-panel__chip-input combined-neuroscreen__input combined-neuroscreen__input--left',
    placeholder: commonDoses.length ? 'Select or type dose' : 'Dose',
    value: med.dose || '',
  });
  if (commonDoses.length) {
    const listId = `med-doses-${_datalistId++}`;
    doseInput.setAttribute('list', listId);
    const datalist = el('datalist', { id: listId });
    for (const d of commonDoses) {
      datalist.append(el('option', { value: d }));
    }
    chip.append(datalist);
  }
  doseInput.addEventListener('change', () => {
    med.dose = doseInput.value.trim();
    persist();
  });
  doseInput.addEventListener('blur', () => {
    med.dose = doseInput.value.trim();
    persist();
  });
  return doseInput;
}

function createChipTags(med) {
  const tagsWrap = el('div', { class: 'med-panel__chip-tags' });
  if (med.class) {
    tagsWrap.append(el('span', { class: 'med-panel__chip-class' }, med.class));
  }
  if (med.alerts?.length) {
    for (const a of med.alerts) {
      tagsWrap.append(
        el(
          'span',
          { class: `med-panel__alert-tag med-panel__alert-tag--${a}` },
          ALERT_LABELS[a] || a,
        ),
      );
    }
  }
  return tagsWrap;
}

function createMedChip(med, idx, data, persist, renderBody) {
  const chip = el('div', {
    class: 'med-panel__chip' + (med.alerts?.length ? ' med-panel__chip--flagged' : ''),
  });

  // Top row: Name + brand (left) + class & alert tags (right, single line)
  const nameParts = [el('span', { class: 'med-panel__chip-name' }, med.name)];
  if (med.brand) {
    nameParts.push(el('span', { class: 'med-panel__chip-brand' }, ` (${med.brand})`));
  }
  const topRow = el('div', { class: 'med-panel__chip-top' }, [
    el('span', { class: 'med-panel__chip-name-wrap' }, nameParts),
    createChipTags(med),
  ]);
  chip.append(topRow);

  // Dose + Frequency inline inputs
  const detailRow = el('div', { class: 'med-panel__chip-details' });
  const doseInput = createDoseInput(med, persist, chip);

  const freqSelect = el('select', {
    class: 'med-panel__chip-select combined-neuroscreen__input combined-neuroscreen__input--left',
  });
  for (const opt of FREQ_OPTIONS) {
    const option = el('option', { value: opt.value }, opt.label);
    if (opt.value === (med.frequency || '')) option.selected = true;
    freqSelect.append(option);
  }
  // If stored value isn't in preset list, add it as a custom option
  if (med.frequency && !FREQ_OPTIONS.some((o) => o.value === med.frequency)) {
    const custom = el('option', { value: med.frequency }, med.frequency);
    custom.selected = true;
    freqSelect.append(custom);
  }
  freqSelect.addEventListener('change', () => {
    med.frequency = freqSelect.value;
    persist();
  });

  // Info link → MedlinePlus (NIH): direct drug page when ID known, else alphabetical index
  const mlpUrl = med.mlp
    ? `https://medlineplus.gov/druginfo/meds/${med.mlp}.html`
    : `https://medlineplus.gov/druginfo/drug_${med.name.charAt(0).toUpperCase()}a.html`;
  const infoLink = el(
    'a',
    {
      class: 'med-panel__chip-info',
      href: mlpUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      title: `Look up ${med.name} on MedlinePlus (NIH)`,
    },
    'ⓘ',
  );

  const removeBtn = el(
    'button',
    {
      type: 'button',
      class: 'med-panel__chip-remove',
      title: 'Remove medication',
      onclick: () => {
        data.medications.splice(idx, 1);
        persist();
        renderBody();
      },
    },
    '×',
  );

  detailRow.append(doseInput, freqSelect, infoLink, removeBtn);
  chip.append(detailRow);

  return chip;
}
