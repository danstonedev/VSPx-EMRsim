/**
 * PT-relevant medication database (~120 drugs).
 * Each entry includes clinical alert categories relevant to rehab.
 */

export interface MedEntry {
  name: string;
  brand: string;
  class: string;
  alerts: AlertCategory[];
}

export type AlertCategory = 'fall' | 'bleed' | 'bone' | 'cardio' | 'neuro' | 'pain' | 'endo';

export const ALERT_LABELS: Record<AlertCategory, string> = {
  fall: 'Fall risk',
  bleed: 'Bleeding risk',
  bone: 'Bone health',
  cardio: 'Cardio precaution',
  neuro: 'CNS effects',
  pain: 'Analgesic',
  endo: 'Metabolic',
};

export const ALERT_COLORS: Record<AlertCategory, string> = {
  fall: '#e65100',
  bleed: '#c62828',
  bone: '#6a1b9a',
  cardio: '#1565c0',
  neuro: '#4e342e',
  pain: '#2e7d32',
  endo: '#f9a825',
};

export const MED_DB: MedEntry[] = [
  // NSAIDs
  { name: 'Ibuprofen', brand: 'Advil / Motrin', class: 'NSAID', alerts: ['pain'] },
  { name: 'Naproxen', brand: 'Aleve', class: 'NSAID', alerts: ['pain'] },
  { name: 'Meloxicam', brand: 'Mobic', class: 'NSAID', alerts: ['pain'] },
  { name: 'Diclofenac', brand: 'Voltaren', class: 'NSAID', alerts: ['pain'] },
  { name: 'Celecoxib', brand: 'Celebrex', class: 'NSAID (COX-2)', alerts: ['pain'] },
  { name: 'Aspirin', brand: 'Bayer', class: 'NSAID / Antiplatelet', alerts: ['pain', 'bleed'] },
  { name: 'Indomethacin', brand: 'Indocin', class: 'NSAID', alerts: ['pain'] },
  { name: 'Ketorolac', brand: 'Toradol', class: 'NSAID', alerts: ['pain'] },
  // Acetaminophen
  { name: 'Acetaminophen', brand: 'Tylenol', class: 'Analgesic', alerts: ['pain'] },
  // Opioids
  { name: 'Hydrocodone/APAP', brand: 'Vicodin / Norco', class: 'Opioid', alerts: ['pain', 'fall'] },
  { name: 'Oxycodone', brand: 'OxyContin / Percocet', class: 'Opioid', alerts: ['pain', 'fall'] },
  { name: 'Tramadol', brand: 'Ultram', class: 'Opioid', alerts: ['pain', 'fall'] },
  { name: 'Morphine', brand: 'MS Contin', class: 'Opioid', alerts: ['pain', 'fall'] },
  { name: 'Codeine', brand: 'Tylenol #3', class: 'Opioid', alerts: ['pain', 'fall'] },
  { name: 'Fentanyl patch', brand: 'Duragesic', class: 'Opioid', alerts: ['pain', 'fall'] },
  // Muscle Relaxants
  { name: 'Cyclobenzaprine', brand: 'Flexeril', class: 'Muscle Relaxant', alerts: ['fall'] },
  { name: 'Methocarbamol', brand: 'Robaxin', class: 'Muscle Relaxant', alerts: ['fall'] },
  { name: 'Tizanidine', brand: 'Zanaflex', class: 'Muscle Relaxant', alerts: ['fall'] },
  { name: 'Baclofen', brand: 'Lioresal', class: 'Muscle Relaxant', alerts: ['fall'] },
  { name: 'Carisoprodol', brand: 'Soma', class: 'Muscle Relaxant', alerts: ['fall'] },
  { name: 'Dantrolene', brand: 'Dantrium', class: 'Muscle Relaxant', alerts: ['fall'] },
  { name: 'Diazepam', brand: 'Valium', class: 'Benzodiazepine / Relaxant', alerts: ['fall'] },
  // Neuropathic Pain
  { name: 'Gabapentin', brand: 'Neurontin', class: 'Anticonvulsant', alerts: ['neuro', 'fall'] },
  { name: 'Pregabalin', brand: 'Lyrica', class: 'Anticonvulsant', alerts: ['neuro', 'fall'] },
  { name: 'Duloxetine', brand: 'Cymbalta', class: 'SNRI', alerts: ['neuro', 'pain'] },
  { name: 'Amitriptyline', brand: 'Elavil', class: 'TCA', alerts: ['neuro', 'fall'] },
  { name: 'Nortriptyline', brand: 'Pamelor', class: 'TCA', alerts: ['neuro', 'fall'] },
  { name: 'Carbamazepine', brand: 'Tegretol', class: 'Anticonvulsant', alerts: ['neuro', 'fall'] },
  // Anticoagulants / Antiplatelets
  { name: 'Warfarin', brand: 'Coumadin', class: 'Anticoagulant', alerts: ['bleed'] },
  { name: 'Rivaroxaban', brand: 'Xarelto', class: 'Anticoagulant (DOAC)', alerts: ['bleed'] },
  { name: 'Apixaban', brand: 'Eliquis', class: 'Anticoagulant (DOAC)', alerts: ['bleed'] },
  { name: 'Dabigatran', brand: 'Pradaxa', class: 'Anticoagulant (DOAC)', alerts: ['bleed'] },
  { name: 'Enoxaparin', brand: 'Lovenox', class: 'Anticoagulant (LMWH)', alerts: ['bleed'] },
  { name: 'Heparin', brand: 'Heparin', class: 'Anticoagulant', alerts: ['bleed'] },
  { name: 'Clopidogrel', brand: 'Plavix', class: 'Antiplatelet', alerts: ['bleed'] },
  // Beta Blockers
  { name: 'Metoprolol', brand: 'Lopressor / Toprol', class: 'Beta Blocker', alerts: ['cardio'] },
  { name: 'Atenolol', brand: 'Tenormin', class: 'Beta Blocker', alerts: ['cardio'] },
  { name: 'Propranolol', brand: 'Inderal', class: 'Beta Blocker', alerts: ['cardio'] },
  { name: 'Carvedilol', brand: 'Coreg', class: 'Beta Blocker', alerts: ['cardio'] },
  { name: 'Bisoprolol', brand: 'Zebeta', class: 'Beta Blocker', alerts: ['cardio'] },
  // ACE Inhibitors
  { name: 'Lisinopril', brand: 'Zestril / Prinivil', class: 'ACE Inhibitor', alerts: ['cardio'] },
  { name: 'Enalapril', brand: 'Vasotec', class: 'ACE Inhibitor', alerts: ['cardio'] },
  { name: 'Ramipril', brand: 'Altace', class: 'ACE Inhibitor', alerts: ['cardio'] },
  { name: 'Benazepril', brand: 'Lotensin', class: 'ACE Inhibitor', alerts: ['cardio'] },
  // ARBs
  { name: 'Losartan', brand: 'Cozaar', class: 'ARB', alerts: ['cardio'] },
  { name: 'Valsartan', brand: 'Diovan', class: 'ARB', alerts: ['cardio'] },
  { name: 'Irbesartan', brand: 'Avapro', class: 'ARB', alerts: ['cardio'] },
  // Calcium Channel Blockers
  { name: 'Amlodipine', brand: 'Norvasc', class: 'CCB', alerts: ['cardio'] },
  { name: 'Diltiazem', brand: 'Cardizem', class: 'CCB', alerts: ['cardio'] },
  { name: 'Nifedipine', brand: 'Procardia', class: 'CCB', alerts: ['cardio'] },
  { name: 'Verapamil', brand: 'Calan', class: 'CCB', alerts: ['cardio'] },
  // Diuretics
  { name: 'Furosemide', brand: 'Lasix', class: 'Loop Diuretic', alerts: ['cardio', 'fall'] },
  { name: 'Hydrochlorothiazide', brand: 'HCTZ', class: 'Thiazide Diuretic', alerts: ['cardio'] },
  { name: 'Spironolactone', brand: 'Aldactone', class: 'K-Sparing Diuretic', alerts: ['cardio'] },
  { name: 'Bumetanide', brand: 'Bumex', class: 'Loop Diuretic', alerts: ['cardio', 'fall'] },
  // Statins
  { name: 'Atorvastatin', brand: 'Lipitor', class: 'Statin', alerts: [] },
  { name: 'Rosuvastatin', brand: 'Crestor', class: 'Statin', alerts: [] },
  { name: 'Simvastatin', brand: 'Zocor', class: 'Statin', alerts: [] },
  { name: 'Pravastatin', brand: 'Pravachol', class: 'Statin', alerts: [] },
  // Diabetes
  { name: 'Metformin', brand: 'Glucophage', class: 'Biguanide', alerts: ['endo'] },
  { name: 'Glipizide', brand: 'Glucotrol', class: 'Sulfonylurea', alerts: ['endo'] },
  { name: 'Glyburide', brand: 'DiaBeta', class: 'Sulfonylurea', alerts: ['endo'] },
  { name: 'Insulin (rapid)', brand: 'Humalog / Novolog', class: 'Insulin', alerts: ['endo'] },
  { name: 'Insulin (long)', brand: 'Lantus / Levemir', class: 'Insulin', alerts: ['endo'] },
  { name: 'Empagliflozin', brand: 'Jardiance', class: 'SGLT2 Inhibitor', alerts: ['endo'] },
  { name: 'Sitagliptin', brand: 'Januvia', class: 'DPP-4 Inhibitor', alerts: ['endo'] },
  { name: 'Semaglutide', brand: 'Ozempic / Wegovy', class: 'GLP-1 Agonist', alerts: ['endo'] },
  // Corticosteroids
  { name: 'Prednisone', brand: 'Deltasone', class: 'Corticosteroid', alerts: ['bone', 'endo'] },
  {
    name: 'Methylprednisolone',
    brand: 'Medrol',
    class: 'Corticosteroid',
    alerts: ['bone', 'endo'],
  },
  { name: 'Dexamethasone', brand: 'Decadron', class: 'Corticosteroid', alerts: ['bone', 'endo'] },
  { name: 'Prednisolone', brand: 'Prelone', class: 'Corticosteroid', alerts: ['bone', 'endo'] },
  // Osteoporosis
  { name: 'Alendronate', brand: 'Fosamax', class: 'Bisphosphonate', alerts: ['bone'] },
  { name: 'Risedronate', brand: 'Actonel', class: 'Bisphosphonate', alerts: ['bone'] },
  { name: 'Denosumab', brand: 'Prolia', class: 'RANK-L Inhibitor', alerts: ['bone'] },
  { name: 'Teriparatide', brand: 'Forteo', class: 'PTH Analog', alerts: ['bone'] },
  { name: 'Calcium + Vitamin D', brand: 'Various', class: 'Supplement', alerts: ['bone'] },
  // Parkinson's
  {
    name: 'Carbidopa/Levodopa',
    brand: 'Sinemet',
    class: 'Dopaminergic',
    alerts: ['neuro', 'fall'],
  },
  { name: 'Ropinirole', brand: 'Requip', class: 'Dopamine Agonist', alerts: ['neuro', 'fall'] },
  { name: 'Pramipexole', brand: 'Mirapex', class: 'Dopamine Agonist', alerts: ['neuro', 'fall'] },
  { name: 'Amantadine', brand: 'Symmetrel', class: 'Dopaminergic', alerts: ['neuro', 'fall'] },
  { name: 'Entacapone', brand: 'Comtan', class: 'COMT Inhibitor', alerts: ['neuro'] },
  // Antispasticity
  { name: 'OnabotulinumtoxinA', brand: 'Botox', class: 'Neuromuscular Blocker', alerts: ['neuro'] },
  // Antidepressants / Anxiolytics
  { name: 'Sertraline', brand: 'Zoloft', class: 'SSRI', alerts: ['neuro'] },
  { name: 'Fluoxetine', brand: 'Prozac', class: 'SSRI', alerts: ['neuro'] },
  { name: 'Citalopram', brand: 'Celexa', class: 'SSRI', alerts: ['neuro'] },
  { name: 'Escitalopram', brand: 'Lexapro', class: 'SSRI', alerts: ['neuro'] },
  { name: 'Venlafaxine', brand: 'Effexor', class: 'SNRI', alerts: ['neuro'] },
  { name: 'Bupropion', brand: 'Wellbutrin', class: 'NDRI', alerts: ['neuro'] },
  { name: 'Lorazepam', brand: 'Ativan', class: 'Benzodiazepine', alerts: ['fall'] },
  { name: 'Alprazolam', brand: 'Xanax', class: 'Benzodiazepine', alerts: ['fall'] },
  { name: 'Clonazepam', brand: 'Klonopin', class: 'Benzodiazepine', alerts: ['fall'] },
  // Sleep aids
  { name: 'Zolpidem', brand: 'Ambien', class: 'Sedative-Hypnotic', alerts: ['fall'] },
  { name: 'Trazodone', brand: 'Desyrel', class: 'Antidepressant / Sedative', alerts: ['fall'] },
  // Seizure / Neuro
  { name: 'Levetiracetam', brand: 'Keppra', class: 'Anticonvulsant', alerts: ['neuro'] },
  { name: 'Phenytoin', brand: 'Dilantin', class: 'Anticonvulsant', alerts: ['neuro', 'bone'] },
  { name: 'Lamotrigine', brand: 'Lamictal', class: 'Anticonvulsant', alerts: ['neuro'] },
  { name: 'Topiramate', brand: 'Topamax', class: 'Anticonvulsant', alerts: ['neuro'] },
  { name: 'Valproic Acid', brand: 'Depakote', class: 'Anticonvulsant', alerts: ['neuro'] },
  // MS
  { name: 'Fingolimod', brand: 'Gilenya', class: 'S1P Modulator', alerts: ['neuro', 'cardio'] },
  { name: 'Dimethyl Fumarate', brand: 'Tecfidera', class: 'Immunomodulator', alerts: ['neuro'] },
  { name: 'Ocrelizumab', brand: 'Ocrevus', class: 'Anti-CD20 mAb', alerts: ['neuro'] },
  {
    name: 'Interferon beta-1a',
    brand: 'Avonex / Rebif',
    class: 'Immunomodulator',
    alerts: ['neuro'],
  },
  // Thyroid
  { name: 'Levothyroxine', brand: 'Synthroid', class: 'Thyroid Hormone', alerts: ['endo'] },
  // GI
  { name: 'Omeprazole', brand: 'Prilosec', class: 'PPI', alerts: ['bone'] },
  { name: 'Pantoprazole', brand: 'Protonix', class: 'PPI', alerts: ['bone'] },
  { name: 'Ondansetron', brand: 'Zofran', class: 'Anti-emetic', alerts: [] },
  // Allergy / Respiratory
  { name: 'Diphenhydramine', brand: 'Benadryl', class: 'Antihistamine', alerts: ['fall'] },
  { name: 'Cetirizine', brand: 'Zyrtec', class: 'Antihistamine', alerts: [] },
  { name: 'Montelukast', brand: 'Singulair', class: 'Leukotriene Inhibitor', alerts: [] },
  { name: 'Albuterol', brand: 'ProAir / Ventolin', class: 'Bronchodilator', alerts: ['cardio'] },
  { name: 'Fluticasone', brand: 'Flovent', class: 'Inhaled Corticosteroid', alerts: [] },
  // Topicals
  { name: 'Lidocaine patch', brand: 'Lidoderm', class: 'Topical Anesthetic', alerts: ['pain'] },
  { name: 'Diclofenac gel', brand: 'Voltaren Gel', class: 'Topical NSAID', alerts: ['pain'] },
  { name: 'Capsaicin cream', brand: 'Zostrix', class: 'Topical Analgesic', alerts: ['pain'] },
];

/** Pre-indexed for fast search */
export const MED_DB_INDEXED = MED_DB.map((m) => ({
  ...m,
  _search: `${m.name} ${m.brand} ${m.class}`.toLowerCase(),
}));

/** Common dosages keyed by drug name */
export const MED_DOSES: Record<string, string[]> = {
  Ibuprofen: ['200mg', '400mg', '600mg', '800mg'],
  Naproxen: ['220mg', '250mg', '500mg'],
  Meloxicam: ['7.5mg', '15mg'],
  Diclofenac: ['25mg', '50mg', '75mg'],
  Celecoxib: ['100mg', '200mg'],
  Aspirin: ['81mg', '325mg'],
  Indomethacin: ['25mg', '50mg'],
  Ketorolac: ['10mg'],
  Acetaminophen: ['325mg', '500mg', '650mg', '1000mg'],
  'Hydrocodone/APAP': ['5/325mg', '7.5/325mg', '10/325mg'],
  Oxycodone: ['5mg', '10mg', '15mg', '20mg'],
  Tramadol: ['50mg', '100mg'],
  Morphine: ['15mg', '30mg', '60mg'],
  Codeine: ['15mg', '30mg', '60mg'],
  'Fentanyl patch': ['12mcg/hr', '25mcg/hr', '50mcg/hr', '75mcg/hr'],
  Cyclobenzaprine: ['5mg', '10mg'],
  Methocarbamol: ['500mg', '750mg'],
  Tizanidine: ['2mg', '4mg'],
  Baclofen: ['5mg', '10mg', '20mg'],
  Carisoprodol: ['250mg', '350mg'],
  Dantrolene: ['25mg', '50mg', '100mg'],
  Diazepam: ['2mg', '5mg', '10mg'],
  Gabapentin: ['100mg', '300mg', '600mg', '800mg'],
  Pregabalin: ['25mg', '50mg', '75mg', '150mg', '300mg'],
  Duloxetine: ['20mg', '30mg', '60mg'],
  Amitriptyline: ['10mg', '25mg', '50mg'],
  Nortriptyline: ['10mg', '25mg', '50mg'],
  Carbamazepine: ['100mg', '200mg', '400mg'],
  Warfarin: ['1mg', '2mg', '2.5mg', '5mg', '7.5mg', '10mg'],
  Rivaroxaban: ['10mg', '15mg', '20mg'],
  Apixaban: ['2.5mg', '5mg'],
  Dabigatran: ['75mg', '150mg'],
  Enoxaparin: ['30mg', '40mg', '60mg', '80mg'],
  Heparin: ['5000 units'],
  Clopidogrel: ['75mg'],
  Metoprolol: ['25mg', '50mg', '100mg', '200mg'],
  Atenolol: ['25mg', '50mg', '100mg'],
  Propranolol: ['10mg', '20mg', '40mg', '80mg'],
  Carvedilol: ['3.125mg', '6.25mg', '12.5mg', '25mg'],
  Bisoprolol: ['2.5mg', '5mg', '10mg'],
  Lisinopril: ['2.5mg', '5mg', '10mg', '20mg', '40mg'],
  Enalapril: ['2.5mg', '5mg', '10mg', '20mg'],
  Ramipril: ['1.25mg', '2.5mg', '5mg', '10mg'],
  Benazepril: ['5mg', '10mg', '20mg', '40mg'],
  Losartan: ['25mg', '50mg', '100mg'],
  Valsartan: ['40mg', '80mg', '160mg', '320mg'],
  Irbesartan: ['75mg', '150mg', '300mg'],
  Amlodipine: ['2.5mg', '5mg', '10mg'],
  Diltiazem: ['120mg', '180mg', '240mg', '360mg'],
  Nifedipine: ['30mg', '60mg', '90mg'],
  Verapamil: ['80mg', '120mg', '180mg', '240mg'],
  Furosemide: ['20mg', '40mg', '80mg'],
  Hydrochlorothiazide: ['12.5mg', '25mg', '50mg'],
  Spironolactone: ['25mg', '50mg', '100mg'],
  Bumetanide: ['0.5mg', '1mg', '2mg'],
  Atorvastatin: ['10mg', '20mg', '40mg', '80mg'],
  Rosuvastatin: ['5mg', '10mg', '20mg', '40mg'],
  Simvastatin: ['10mg', '20mg', '40mg'],
  Pravastatin: ['10mg', '20mg', '40mg', '80mg'],
  Metformin: ['500mg', '850mg', '1000mg'],
  Glipizide: ['2.5mg', '5mg', '10mg'],
  Glyburide: ['1.25mg', '2.5mg', '5mg'],
  'Insulin (rapid)': ['varies by patient'],
  'Insulin (long)': ['varies by patient'],
  Empagliflozin: ['10mg', '25mg'],
  Sitagliptin: ['25mg', '50mg', '100mg'],
  Semaglutide: ['0.25mg', '0.5mg', '1mg', '2mg'],
  Prednisone: ['5mg', '10mg', '20mg', '40mg', '60mg'],
  Methylprednisolone: ['4mg dose pack', '16mg'],
  Dexamethasone: ['0.5mg', '0.75mg', '4mg', '6mg'],
  Prednisolone: ['5mg', '15mg'],
  Alendronate: ['10mg daily', '70mg weekly'],
  Risedronate: ['5mg daily', '35mg weekly'],
  Denosumab: ['60mg SC q6mo'],
  Teriparatide: ['20mcg daily'],
  'Calcium + Vitamin D': ['500mg/400IU', '600mg/800IU'],
  'Carbidopa/Levodopa': ['10/100mg', '25/100mg', '25/250mg'],
  Ropinirole: ['0.25mg', '0.5mg', '1mg', '2mg'],
  Pramipexole: ['0.125mg', '0.25mg', '0.5mg', '1mg'],
  Amantadine: ['100mg'],
  Entacapone: ['200mg'],
  OnabotulinumtoxinA: ['varies by muscle'],
  Sertraline: ['25mg', '50mg', '100mg', '150mg', '200mg'],
  Fluoxetine: ['10mg', '20mg', '40mg'],
  Citalopram: ['10mg', '20mg', '40mg'],
  Escitalopram: ['5mg', '10mg', '20mg'],
  Venlafaxine: ['37.5mg', '75mg', '150mg'],
  Bupropion: ['75mg', '100mg', '150mg', '300mg'],
  Lorazepam: ['0.5mg', '1mg', '2mg'],
  Alprazolam: ['0.25mg', '0.5mg', '1mg'],
  Clonazepam: ['0.5mg', '1mg', '2mg'],
  Zolpidem: ['5mg', '10mg'],
  Trazodone: ['50mg', '100mg', '150mg'],
  Levetiracetam: ['250mg', '500mg', '750mg', '1000mg'],
  Phenytoin: ['100mg', '200mg', '300mg'],
  Lamotrigine: ['25mg', '50mg', '100mg', '200mg'],
  Topiramate: ['25mg', '50mg', '100mg', '200mg'],
  'Valproic Acid': ['250mg', '500mg'],
  Fingolimod: ['0.5mg'],
  'Dimethyl Fumarate': ['120mg', '240mg'],
  Ocrelizumab: ['300mg IV'],
  'Interferon beta-1a': ['30mcg IM weekly'],
  Levothyroxine: ['25mcg', '50mcg', '75mcg', '88mcg', '100mcg', '112mcg', '125mcg', '150mcg'],
  Omeprazole: ['20mg', '40mg'],
  Pantoprazole: ['20mg', '40mg'],
  Ondansetron: ['4mg', '8mg'],
  Diphenhydramine: ['25mg', '50mg'],
  Cetirizine: ['5mg', '10mg'],
  Montelukast: ['10mg'],
  Albuterol: ['90mcg/inh, 2 puffs PRN'],
  Fluticasone: ['44mcg', '110mcg', '220mcg'],
  'Lidocaine patch': ['5% patch'],
  'Diclofenac gel': ['1% gel'],
  'Capsaicin cream': ['0.025%', '0.075%'],
};

/** Frequency options for dosing schedule */
export const FREQ_OPTIONS = [
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

/** Score a medication entry against a search query */
export function scoreMed(med: MedEntry & { _search: string }, q: string): number {
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

/** Search medications by query string, return top matches */
export function searchMedications(query: string, limit = 10): MedEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return MED_DB_INDEXED.map((m) => ({ med: m, score: scoreMed(m, q) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.med);
}
