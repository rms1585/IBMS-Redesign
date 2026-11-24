// Demo figures for the Milestone 3 prototype (allowed as a demo aid, Annex 24.12).
// Every time is relative to when the demo was last reset, so ages and "Today" stay meaningful.

const ago = (hours) => new Date(Date.now() - hours * 3600 * 1000).toISOString();
const today = () => new Date().toISOString();

export const TARIFF = {
  version: 'Tariff order 2026/03',
  vat: 0.15,
  rates: {
    gateEntry: { what: 'Entry gate, foreign truck', unit: 'truck', rate: 230 },
    weighbridge: { what: 'Weighbridge', unit: 'truck', rate: 150 },
    overnight: { what: 'Overnight stay', unit: 'night', rate: 500 },
    storage: { what: 'Storage', unit: 'tonne-day', rate: 25 },
    handling: { what: 'Handling', unit: 'tonne', rate: 120 },
    entrance: { what: 'Entrance fee, local truck', unit: 'truck', rate: 115 },
  },
};

export const PORT = {
  code: 'BEN',
  name: 'Benapole',
  stationCode: '601',
  tolerancePct: 5,
  toleranceVersion: 'Weight tolerance v2 (BLPA and Customs, 2026-10-01)',
  // One tare rule for every port, set by BLPA headquarters (Annex 7.4).
  tareRule: 'Stored tare valid for 3 months',
  modules: { warehouse: true, outsideYard: false, rail: true, busTerminal: true, truckScanner: false, exportStorage: false },
  otherManifestEntry: true,
  sheds: [
    { id: 'Shed 7', capacityT: 400, usedT: 388, takes: 'general' },
    { id: 'Shed 12', capacityT: 600, usedT: 410, takes: 'general' },
    { id: 'Shed 31', capacityT: 300, usedT: 120, takes: 'chemicals' },
    { id: 'Open yard B', capacityT: 900, usedT: 655, takes: 'heavy' },
  ],
};

export const PARTIES = {
  importers: [
    { bin: '000123456-0101', name: 'Rahman Traders Ltd' },
    { bin: '000234567-0202', name: 'Delta Foods Ltd' },
    { bin: '000345678-0303', name: 'Meghna Steel Mills' },
    { bin: '000456789-0404', name: 'Surma Textiles' },
  ],
  agencies: [
    { ain: '301045', name: 'Padma C&F Agency', signer: 'Kamal Hossain', licence: { number: 'CF-BEN-2019-045', issuer: 'NBR Customs House Benapole', validTo: '2027-06-30', status: 'Verified', verifiedBy: 'Nasrin Akter, licence administrator' } },
    { ain: '301112', name: 'Jamuna C&F Services', signer: 'Rafiq Ahmed', licence: { number: 'CF-BEN-2021-112', issuer: 'NBR Customs House Benapole', validTo: '2027-02-28', status: 'Verified', verifiedBy: 'Nasrin Akter, licence administrator' } },
    { ain: '301207', name: 'Karnaphuli C&F', signer: 'Shirin Sultana', licence: { number: 'CF-BEN-2016-207', issuer: 'NBR Customs House Benapole', validTo: '2026-10-31', status: 'Expired', verifiedBy: 'Nasrin Akter, licence administrator' } },
  ],
};

const line = (manifest, no, importer, goods, packages, declaredKg, category = 'general') => ({
  id: `${manifest}-${no}`,
  manifest,
  no,
  importer,
  goods,
  packages,
  declaredKg,
  category,
});

export function createSeed() {
  const manifests = [
    {
      id: '2026/601/08841', alias: 'LC 0417-26-0091', source: 'BNSW', receivedAt: ago(30), exporter: 'Ganga Exports, Kolkata',
      lines: [
        line('2026/601/08841', 1, '000123456-0101', 'Cotton yarn, 40s combed', 320, 9600),
        line('2026/601/08841', 2, '000234567-0202', 'Lentils, red, split', 400, 8000),
      ],
      tags: { '000123456-0101': '301045', '000234567-0202': '301112' },
    },
    {
      id: '2026/601/08852', alias: 'LC 0417-26-0102', source: 'BNSW', receivedAt: ago(70), exporter: 'Tata Steel Distribution',
      lines: [line('2026/601/08852', 1, '000345678-0303', 'Steel billets', 22, 21000, 'heavy')],
      tags: { '000345678-0303': '301045' },
    },
    {
      id: '2026/601/08860', alias: 'LC 0417-26-0110', source: 'BNSW', receivedAt: ago(52), exporter: 'Shree Chemicals',
      lines: [line('2026/601/08860', 1, '000456789-0404', 'Reactive dyes', 180, 7200, 'chemicals')],
      tags: { '000456789-0404': '301112' },
    },
    {
      id: '2026/601/08866', alias: 'LC 0417-26-0118', source: 'BNSW', receivedAt: ago(6), exporter: 'Bharat Agro',
      lines: [line('2026/601/08866', 1, '000234567-0202', 'Onions', 600, 15000, 'perishable')],
      tags: {},
    },
    {
      id: '2026/601/08799', alias: 'LC 0417-26-0071', source: 'BNSW', receivedAt: ago(140), exporter: 'Ganga Exports, Kolkata',
      lines: [line('2026/601/08799', 1, '000123456-0101', 'Cotton yarn, 30s carded', 500, 15000)],
      tags: { '000123456-0101': '301045' },
    },
    {
      id: '2026/601/08874', alias: 'LC 0417-26-0125', source: 'BNSW', receivedAt: ago(4), exporter: 'Ganga Exports, Kolkata',
      lines: [line('2026/601/08874', 1, '000123456-0101', 'Polyester staple fibre', 360, 18000)],
      tags: { '000123456-0101': '301045' },
    },
    // Trucks further along, so every queue opens with work in it.
    {
      id: '2026/601/08886', alias: 'LC 0417-26-0133', source: 'BNSW', receivedAt: ago(9), exporter: 'Arvind Mills, Ahmedabad',
      lines: [line('2026/601/08886', 1, '000456789-0404', 'Viscose woven fabric', 140, 11200)],
      tags: { '000456789-0404': '301112' },
    },
    {
      id: '2026/601/08888', alias: 'LC 0417-26-0135', source: 'BNSW', receivedAt: ago(11), exporter: 'Ganga Exports, Kolkata',
      lines: [line('2026/601/08888', 1, '000123456-0101', 'Cotton yarn, 20s carded', 420, 12600)],
      tags: { '000123456-0101': '301045' },
    },
    {
      id: '2026/601/08890', alias: 'LC 0417-26-0137', source: 'BNSW', receivedAt: ago(8), exporter: 'Bharat Agro',
      lines: [line('2026/601/08890', 1, '000234567-0202', 'Lentils, red, split', 380, 9500)],
      tags: { '000234567-0202': '301112' },
    },
  ];

  // The manifest Customs has not yet sent: the simulator sends it to match the late truck.
  const pendingManifests = [
    {
      id: '2026/601/08881', alias: 'LC 0417-26-0131', source: 'BNSW', exporter: 'Bharat Agro',
      lines: [line('2026/601/08881', 1, '000234567-0202', 'Chickpeas', 300, 12000)],
      tags: { '000234567-0202': '301112' },
    },
  ];

  const visits = [
    {
      id: 'V-26-1187', plate: 'WB 23 D 1187', kind: 'foreign', vehicleClass: '10-wheel truck', axles: 3,
      driver: { name: 'Sunil Das', nid: 'Car Pass driver ID 4471' }, carPass: 'CP-BEN-26-77410',
      manifests: ['2026/601/08841'], enteredBy: '301045', enteredAt: ago(3),
      stage: 'Expected', events: {},
    },
    {
      id: 'V-26-2240', plate: 'WB 41 B 2240', kind: 'foreign', vehicleClass: '10-wheel truck', axles: 3,
      driver: { name: 'Ajay Kumar', nid: 'Car Pass driver ID 5520' }, carPass: 'CP-BEN-26-77452',
      manifests: ['2026/601/08874'], enteredBy: '301045', enteredAt: ago(2),
      stage: 'Admitted', gateIn: { at: ago(0.6), gate: 'Border gate 1', lane: 'Lane 2', by: 'Abdul Karim' },
      // The reading the scale will send when this truck drives on (over the 5% tolerance).
      pendingReadingKg: 19150,
      events: {},
    },
    {
      id: 'V-26-4420', plate: 'WB 11 C 4420', kind: 'foreign', vehicleClass: '12-wheel truck', axles: 4,
      driver: { name: 'Manoj Singh', nid: 'Car Pass driver ID 3318' }, carPass: 'CP-BEN-26-76990',
      manifests: ['2026/601/08852'], enteredBy: '301045', enteredAt: ago(74),
      stage: 'Exited',
      gateIn: { at: ago(72), gate: 'Border gate 1', lane: 'Lane 1', by: 'Abdul Karim' },
      weigh: { kg: 21640, at: ago(71.5), scale: 'Scale 2', source: 'Device', declaredKg: 21000, overTolerance: false },
      posting: { shed: 'Open yard B', accepted: true, by: 'Habibur Rahman', at: ago(70) },
      receipt: { locked: true, by: 'Habibur Rahman', at: ago(66), times: { start: ago(69), end: ago(67), by: 'Selina Parvin' }, association: 'Benapole Port Labour Association No. 2', lines: { '2026/601/08852-1': { packages: 22, counted: true, receiptKg: 21640 } } },
      exitAt: ago(60), emptyWeighed: true,
      events: {},
    },
    {
      id: 'V-26-3307', plate: 'WB 25 A 3307', kind: 'foreign', vehicleClass: '10-wheel truck', axles: 3,
      driver: { name: 'Ramesh Pal', nid: 'Car Pass driver ID 6624' }, carPass: 'CP-BEN-26-77180',
      manifests: ['2026/601/08860'], enteredBy: '301112', enteredAt: ago(55),
      stage: 'Unloaded',
      gateIn: { at: ago(53), gate: 'Border gate 2', lane: 'Lane 1', by: 'Abdul Karim' },
      weigh: { kg: 7390, at: ago(52.6), scale: 'Scale 1', source: 'Device', declaredKg: 7200, overTolerance: false },
      posting: { shed: 'Shed 31', accepted: true, by: 'Habibur Rahman', at: ago(51) },
      receipt: { locked: true, by: 'Habibur Rahman', at: ago(48), times: { start: ago(50), end: ago(49), by: 'Selina Parvin' }, association: 'Benapole Port Labour Association No. 1', lines: { '2026/601/08860-1': { packages: 180, counted: true, receiptKg: 7390 } } },
      events: {},
    },
    {
      id: 'V-26-0719', plate: 'WB 19 F 0719', kind: 'foreign', vehicleClass: '10-wheel truck', axles: 3,
      driver: { name: 'Bikash Roy', nid: 'Car Pass driver ID 7710' }, carPass: 'CP-BEN-26-77501',
      manifests: [], enteredBy: null, enteredAt: null,
      // A late IGM: the manifest number on the Car Pass is not in IBMS yet (EXC-04).
      carPassManifest: '2026/601/08881',
      stage: 'Expected', late: true, events: {},
    },
    {
      id: 'V-26-3310', plate: 'WB 07 E 3310', kind: 'foreign', vehicleClass: '10-wheel truck', axles: 3,
      driver: { name: 'Dilip Ghosh', nid: 'Car Pass driver ID 2209' }, carPass: 'CP-BEN-26-77488',
      manifests: ['2026/601/08866'], enteredBy: null, enteredAt: null,
      stage: 'Expected', events: {},
    },
    {
      id: 'V-26-5512', plate: 'WB 27 C 5512', kind: 'foreign', vehicleClass: '10-wheel truck', axles: 3,
      driver: { name: 'Prakash Mondal', nid: 'Car Pass driver ID 8103' }, carPass: 'CP-BEN-26-77530',
      manifests: ['2026/601/08886'], enteredBy: '301112', enteredAt: ago(6),
      stage: 'Weighed',
      gateIn: { at: ago(1.4), gate: 'Border gate 2', lane: 'Lane 1', by: 'Abdul Karim' },
      weigh: { kg: 11480, at: ago(1.1), scale: 'Scale 1', source: 'Device', declaredKg: 11200, overTolerance: false, toleranceVersion: PORT.toleranceVersion },
      events: {},
    },
    {
      id: 'V-26-6630', plate: 'WB 33 A 6630', kind: 'foreign', vehicleClass: '12-wheel truck', axles: 4,
      driver: { name: 'Gopal Saha', nid: 'Car Pass driver ID 8240' }, carPass: 'CP-BEN-26-77512',
      manifests: ['2026/601/08888'], enteredBy: '301045', enteredAt: ago(8),
      stage: 'Weighed',
      gateIn: { at: ago(3.2), gate: 'Border gate 1', lane: 'Lane 1', by: 'Abdul Karim' },
      weigh: { kg: 12930, at: ago(2.9), scale: 'Scale 2', source: 'Device', declaredKg: 12600, overTolerance: false, toleranceVersion: PORT.toleranceVersion },
      holding: { since: ago(2.6), reason: 'No free space in Shed 7' },
      events: {},
    },
    {
      id: 'V-26-7741', plate: 'WB 15 D 7741', kind: 'foreign', vehicleClass: '10-wheel truck', axles: 3,
      driver: { name: 'Anil Biswas', nid: 'Car Pass driver ID 8017' }, carPass: 'CP-BEN-26-77498',
      manifests: ['2026/601/08890'], enteredBy: '301112', enteredAt: ago(7),
      stage: 'Weighed',
      gateIn: { at: ago(2.2), gate: 'Border gate 2', lane: 'Lane 2', by: 'Abdul Karim' },
      weigh: { kg: 9710, at: ago(1.9), scale: 'Scale 1', source: 'Device', declaredKg: 9500, overTolerance: false, toleranceVersion: PORT.toleranceVersion },
      posting: { shed: 'Shed 12', accepted: null, proposedBy: 'Farhana Yasmin', at: ago(0.7) },
      events: {},
    },
  ];

  const boes = [
    {
      id: 'BOE-1', type: 'C', office: '601', reg: 'C-48211', date: '2026-11-21',
      manifest: '2026/601/08852', importer: '000345678-0303', agency: '301045', lines: ['2026/601/08852-1'],
      recordedAt: ago(58), source: 'BNSW',
      release: { at: ago(30), source: 'BNSW', ref: 'RO 601/2026/18871', kg: 21640, exitNotes: {} },
      deliveredKg: 0, closed: false,
    },
    {
      id: 'BOE-2', type: 'C', office: '601', reg: 'C-48370', date: '2026-11-22',
      manifest: '2026/601/08860', importer: '000456789-0404', agency: '301112', lines: ['2026/601/08860-1'],
      recordedAt: ago(40), source: 'BNSW', release: null, deliveredKg: 0, closed: false,
    },
    {
      id: 'BOE-3', type: 'C', office: '601', reg: 'C-47902', date: '2026-11-19',
      manifest: '2026/601/08799', importer: '000123456-0101', agency: '301045', lines: ['2026/601/08799-1'],
      recordedAt: ago(120), source: 'BNSW',
      release: { at: ago(26), source: 'BNSW', ref: 'RO 601/2026/18790', kg: 15000, exitNotes: { 'Dhaka Metro-TA 14-2231': ago(5) } },
      deliveredKg: 6000, closed: false,
    },
    // Keyed by the agency while BNSW was down; waits to be checked once BNSW confirms it.
    {
      id: 'BOE-4', type: 'C', office: '601', reg: 'C-48602', date: '2026-11-23',
      manifest: '2026/601/08886', importer: '000456789-0404', agency: '301112', lines: ['2026/601/08886-1'],
      recordedAt: ago(5), source: 'Keyed by the agency', release: null, deliveredKg: 0, closed: false,
    },
  ];

  const holds = [
    {
      id: 'H-1', target: { kind: 'line', id: '2026/601/08860-1' }, body: 'Customs', person: 'Md. Jahid Hasan, Revenue Officer',
      reason: 'Classification query on reactive dyes', ref: 'CUS/BEN/H/2026/0442', source: 'IBMS', at: ago(20), lifted: null,
    },
  ];

  const deliveryRequests = [
    {
      id: 'DR-2026-0311', boe: 'BOE-3', day: today(), kg: 9000, ceiling: 2, agency: '301045', raisedAt: ago(8), bill: 'BILL-0311',
      slots: [
        { plate: 'Dhaka Metro-TA 14-2231', entryPass: 'EP-26-55021', enteredAt: ago(6), load: { kg: 6000, lockedAt: ago(5.5), lockedBy: 'Habibur Rahman', aro: { name: 'Md. Jahid Hasan', at: ago(5.2) } }, pass: 'BEN-PASS-004419' },
        { plate: null, entryPass: null, enteredAt: null, load: null, pass: null },
      ],
      closed: false,
    },
    {
      id: 'DR-2026-0312', boe: 'BOE-1', day: today(), kg: 18000, ceiling: 3, agency: '301045', raisedAt: ago(4), bill: 'BILL-0312',
      slots: [
        { plate: 'Khulna-TA 12-4410', entryPass: null, enteredAt: null, load: null, pass: null },
        { plate: 'Jessore-TA 14-0951', entryPass: 'EP-26-55064', enteredAt: ago(1), load: null, pass: null },
        { plate: 'Jessore-TA 11-0388', entryPass: 'EP-26-55059', enteredAt: ago(2.5), load: { kg: 6000, lockedAt: ago(1.6), lockedBy: 'Habibur Rahman', aro: { name: 'Md. Jahid Hasan', at: ago(1.4) } }, pass: null },
      ],
      closed: false,
    },
  ];

  const passes = [
    {
      id: 'BEN-PASS-004419', dr: 'DR-2026-0311', plate: 'Dhaka Metro-TA 14-2231', goods: 'Cotton yarn, 30s carded', kg: 6000, validDay: today(),
      approvals: {
        shed: { name: 'Habibur Rahman', role: 'Shed in-charge', at: ago(5.5), device: 'Shed 12 handheld' },
        aro: { name: 'Md. Jahid Hasan', role: 'Customs Assistant Revenue Officer', at: ago(5.2), device: 'Phone' },
        signer: null,
      },
      used: null, invalidatedBy: null,
    },
  ];

  const bills = [
    {
      id: 'BILL-0311', paymentId: 'PAY-601-26-0311', party: '301045', for: { kind: 'dr', id: 'DR-2026-0311' }, raisedAt: ago(8),
      lines: [
        { what: 'Storage', qty: 15, unit: 'tonne-day', rate: 25, note: '15 t remaining, 6 days' },
        { what: 'Handling', qty: 9, unit: 'tonne', rate: 120 },
        { what: 'Entrance fee, local truck', qty: 2, unit: 'truck', rate: 115 },
        { what: 'Truck charges, WB 19 A 2001 (entry gate, weighbridge, 2 nights)', qty: 1, unit: 'visit', rate: 1380 },
      ],
      status: 'Paid', paidAt: ago(7), provider: 'Sonali Bank e-payment, ref SB-99231',
    },
    {
      id: 'BILL-0312', paymentId: 'PAY-601-26-0312', party: '301045', for: { kind: 'dr', id: 'DR-2026-0312' }, raisedAt: ago(4),
      lines: [
        { what: 'Storage', qty: 22, unit: 'tonne-day', rate: 25, note: '22 t, 1 day' },
        { what: 'Handling', qty: 18, unit: 'tonne', rate: 120 },
        { what: 'Entrance fee, local truck', qty: 3, unit: 'truck', rate: 115 },
      ],
      status: 'Paid', paidAt: ago(3.5), provider: 'Sonali Bank e-payment, ref SB-99307',
    },
  ];

  const corrections = [
    {
      id: 'COR-97', record: '2026/601/08852', field: 'Receipt weight, line 1', from: '21,640 kg', to: '21,460 kg',
      reason: 'Digits swapped when the count sheet was typed in', by: 'Habibur Rahman', role: 'Shed in-charge', at: ago(2), decision: null,
    },
    {
      id: 'COR-93', record: '2026/601/08860', field: 'Packages counted, line 1', from: '178', to: '180',
      reason: 'Two cartons were on the second pallet', by: 'Selina Parvin', role: 'Warehouse manager', at: ago(30),
      decision: { approve: true, remarks: 'Matches the tally photo', by: 'Farhana Rahman', at: ago(29) },
    },
  ];

  const events = [
    { id: 'E-1', at: ago(30), text: 'Manifest 2026/601/08841 received', record: '2026/601/08841', by: 'BNSW', role: 'Customs system', source: 'BNSW' },
    { id: 'E-2', at: ago(20), text: 'Customs hold placed on line 1 of 2026/601/08860: Classification query on reactive dyes', record: '2026/601/08860', by: 'Md. Jahid Hasan', role: 'Customs user', source: 'IBMS' },
    { id: 'E-3', at: ago(3), text: 'Truck WB 23 D 1187 entered for 2026/601/08841 with Car Pass CP-BEN-26-77410', record: '2026/601/08841', by: 'Kamal Hossain', role: 'C&F agent user', source: 'Keyed by the agency' },
    { id: 'E-4', at: ago(5), text: 'Bill of Entry C 601 C-48602 2026-11-23 keyed for 2026/601/08886 while BNSW was down', record: '2026/601/08886', by: 'Rafiq Ahmed', role: 'C&F agent user', source: 'Keyed by the agency' },
    { id: 'E-5', at: ago(4), text: 'Delivery Request DR-2026-0312 raised for 18,000 kg on 3 trucks', record: '2026/601/08852', by: 'Kamal Hossain', role: 'C&F agent user', source: 'IBMS' },
    { id: 'E-6', at: ago(2.6), text: 'WB 33 A 6630 placed in the holding area: No free space in Shed 7', record: '2026/601/08888', by: 'Farhana Yasmin', role: 'Posting officer', source: 'IBMS' },
    { id: 'E-7', at: ago(2), text: 'Correction requested on 2026/601/08852 receipt weight, line 1: 21,640 kg to 21,460 kg', record: '2026/601/08852', by: 'Habibur Rahman', role: 'Shed in-charge', source: 'IBMS' },
    { id: 'E-8', at: ago(1.6), text: 'Load of Jessore-TA 11-0388 locked at 6,000 kg', record: '2026/601/08852', by: 'Habibur Rahman', role: 'Shed in-charge', source: 'Device' },
    { id: 'E-9', at: ago(0.7), text: 'Posting proposed for WB 15 D 7741: Shed 12', record: '2026/601/08890', by: 'Farhana Yasmin', role: 'Posting officer', source: 'IBMS' },
  ];

  return {
    seededAt: today(),
    bnswDown: false,
    exitCheckDown: false,
    manifests,
    pendingManifests,
    visits,
    boes,
    holds,
    deliveryRequests,
    passes,
    bills,
    events,
    corrections,
    truckChanges: [],
    seq: 100,
  };
}
