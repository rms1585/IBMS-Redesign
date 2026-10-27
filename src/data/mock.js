// Demonstration fixtures only. Names, plates, references and amounts are invented
// and must not be treated as real records or approved tariff values.

export const currentUser = { name: 'Farhana Rahman', role: 'Port in-charge', port: 'BEN', email: 'farhana.rahman@blpa.gov.bd' };

export const ports = [
  { code: 'BEN', name: 'Benapole', station: 'Benapole Customs House', tariff: 'TO-2026-03 (invented reference)', state: 'Live', admin: 'Farhana Rahman', readiness: 100 },
  { code: 'BUR', name: 'Burimari', station: 'Burimari LCS', tariff: 'TO-2026-03 (invented reference)', state: 'Live', admin: 'Imran Hossain', readiness: 100 },
  { code: 'SON', name: 'Sonamasjid', station: 'Sonamasjid LCS', tariff: 'TO-2026-03 (invented reference)', state: 'Setting up', admin: 'Nusrat Jahan', readiness: 72 },
  { code: 'AKH', name: 'Akhaura', station: 'Akhaura LCS', tariff: 'TO-2026-03 (invented reference)', state: 'Awaiting go-live approval', admin: 'Tanvir Alam', readiness: 100 },
  { code: 'HIL', name: 'Hili', station: 'Hili LCS', tariff: 'TO-2025-11 (invented reference)', state: 'Setting up', admin: 'Sabbir Ahmed', readiness: 38 },
];

export const agencies = [
  { id: 'AG-01', name: 'Rupsha Clearing & Forwarding', licence: 'CF-0412', validTo: '2027-06-30', ports: ['BEN', 'BUR'] },
  { id: 'AG-02', name: 'Meghna Trade Logistics', licence: 'CF-1180', validTo: '2026-12-31', ports: ['BEN'] },
  { id: 'AG-03', name: 'Padma Border Agents', licence: 'CF-0927', validTo: '2026-11-15', ports: ['BEN', 'SON', 'HIL'] },
  { id: 'AG-04', name: 'Jamuna Shipping Services', licence: 'CF-2231', validTo: '2028-01-31', ports: ['AKH'] },
];

export const traders = [
  { name: 'Delta Agro Foods Ltd.', bin: '000123456-0101', contact: '+880 1711 000101', ports: ['BEN', 'BUR'] },
  { name: 'Northern Textiles PLC', bin: '000234567-0202', contact: '+880 1811 000202', ports: ['BEN'] },
  { name: 'Coastal Chemicals Ltd.', bin: '000345678-0303', contact: '+880 1911 000303', ports: ['BEN', 'SON'] },
  { name: 'Shapla Tyre House', bin: '000456789-0404', contact: '+880 1611 000404', ports: ['AKH'] },
];

export const products = [
  { code: 'P-1006', name: 'Rice (non-basmati)', hs: '1006.30', type: 'Non-perishable', categories: ['Food'], route: 'Warehouse' },
  { code: 'P-0703', name: 'Onion', hs: '0703.10', type: 'Perishable', categories: ['Food'], route: 'Transshipment' },
  { code: 'P-0808', name: 'Apple', hs: '0808.10', type: 'Perishable', categories: ['Food'], route: 'Transshipment' },
  { code: 'P-5208', name: 'Cotton fabric', hs: '5208.12', type: 'Non-perishable', categories: ['Textile'], route: 'Warehouse' },
  { code: 'P-3814', name: 'Industrial solvent', hs: '3814.00', type: 'Non-perishable', categories: ['Chemical'], route: 'Warehouse' },
  { code: 'P-3402', name: 'Detergent', hs: '3402.50', type: 'Non-perishable', categories: ['Chemical'], route: 'Warehouse' },
  { code: 'P-1901', name: 'Infant cereal', hs: '1901.10', type: 'Non-perishable', categories: ['Food', 'Baby products'], route: 'Warehouse' },
  { code: 'P-4011', name: 'Truck tyres', hs: '4011.20', type: 'Non-perishable', categories: ['Rubber'], route: 'Warehouse' },
  { code: 'P-2517', name: 'Stone boulders', hs: '2517.10', type: 'Bulk', categories: ['Stone'], route: 'Stone route' },
  { code: 'P-0910', name: 'Ginger', hs: '0910.11', type: 'Perishable', categories: ['Food'], route: 'Transshipment' },
];

export const vehicleTypes = [
  { code: 'VT-06', name: '6-wheel truck', wheels: 6, mode: 'Road' },
  { code: 'VT-10', name: '10-wheel truck', wheels: 10, mode: 'Road' },
  { code: 'VT-14', name: '14-wheel trailer', wheels: 14, mode: 'Road' },
  { code: 'VT-VP', name: 'Van / pick-up', wheels: 4, mode: 'Road' },
  { code: 'VT-RW', name: 'Rail wagon', wheels: 8, mode: 'Rail (coming soon)' },
];

export const holidays = [
  { date: '2026-12-16', name: 'Victory Day', upcoming: true },
  { date: '2027-02-21', name: 'International Mother Language Day', upcoming: true },
  { date: '2027-03-26', name: 'Independence Day', upcoming: true },
  { date: '2026-08-15', name: 'National Mourning Day', upcoming: false },
];

// Demonstration tariff snapshot: not legal rates.
export const tariffLines = [
  { charge: 'Entrance fee (border gate)', rate: 184.7, basis: 'per vehicle, by gate of entry', billedHere: true },
  { charge: 'Entrance fee (inland gate)', rate: 153.58, basis: 'per vehicle, by gate of entry', billedHere: true },
  { charge: 'Weighment', rate: 76.83, basis: 'per weighing', billedHere: true },
  { charge: 'Shed storage, days 1–10', rate: 21.5, basis: 'per tonne, slab by stay length', billedHere: true },
  { charge: 'Shed storage, days 11–20', rate: 43.04, basis: 'per tonne, slab by stay length', billedHere: true },
  { charge: 'Shed storage, day 21+', rate: 64.52, basis: 'per tonne, slab by stay length', billedHere: true },
  { charge: 'Open-yard storage, days 1–10', rate: 15.34, basis: 'per tonne, slab by stay length', billedHere: true },
  { charge: 'Unloading / loading, manual', rate: 76.83, basis: 'per tonne', billedHere: true },
  { charge: 'Unloading / loading, equipment', rate: 140.45, basis: 'per tonne', billedHere: true },
  { charge: 'Haltage', rate: 190.17, basis: 'per truck per day', billedHere: false },
  { charge: 'Documentation', rate: 321.78, basis: 'per document', billedHere: true },
  { charge: 'Carpenter', rate: 20.46, basis: 'per package', billedHere: true },
  { charge: 'Night', rate: 1316.4, basis: 'per Bill of Entry', billedHere: true },
];

export const manifests = [
  {
    id: 'BEN-IGM-2026-08841', direction: 'Import', agency: 'Rupsha Clearing & Forwarding', trader: 'Delta Agro Foods Ltd.',
    product: 'Rice (non-basmati)', declaredKg: 64000, remainingKg: 32000, customs: 'Released', status: 'Open', balance: 4295.46,
    foreignTrucks: 2, localTrucks: 3, updated: '10:42',
  },
  {
    id: 'BEN-IGM-2026-08852', direction: 'Import', agency: 'Meghna Trade Logistics', trader: 'Northern Textiles PLC',
    product: 'Cotton fabric', declaredKg: 18500, remainingKg: 18500, customs: 'Pending', status: 'Open', balance: 184.7,
    foreignTrucks: 1, localTrucks: 0, updated: '10:15',
  },
  {
    id: 'BEN-IGM-2026-08860', direction: 'Import', agency: 'Padma Border Agents', trader: 'Coastal Chemicals Ltd.',
    product: 'Industrial solvent', declaredKg: 22000, remainingKg: 0, customs: 'Hold', status: 'Open', balance: 6380.12,
    foreignTrucks: 1, localTrucks: 1, updated: '09:58',
  },
  {
    id: 'BEN-IGM-2026-08799', direction: 'Import', agency: 'Rupsha Clearing & Forwarding', trader: 'Delta Agro Foods Ltd.',
    product: 'Onion', declaredKg: 30000, remainingKg: 0, customs: 'Released', status: 'Closed', balance: 0,
    foreignTrucks: 2, localTrucks: 4, updated: 'Yesterday',
  },
  {
    id: 'BEN-EGM-2026-01204', direction: 'Export', agency: 'Meghna Trade Logistics', trader: 'Northern Textiles PLC',
    product: 'Garment cartons', declaredKg: 12000, remainingKg: 12000, customs: 'Released', status: 'Open', balance: 0,
    foreignTrucks: 0, localTrucks: 1, updated: '08:31',
  },
  {
    id: 'BEN-IGM-2026-08871', direction: 'Import', agency: 'Padma Border Agents', trader: 'Coastal Chemicals Ltd.',
    product: 'Detergent', declaredKg: 26000, remainingKg: 26000, customs: 'Pending', status: 'Open', balance: 0,
    foreignTrucks: 2, localTrucks: 0, updated: '08:05',
  },
];

export const arrivingTrucks = [
  { plate: 'WB-23-K-4471', kind: 'Foreign', cls: '10-wheel truck', manifest: 'BEN-IGM-2026-08852', agency: 'Meghna Trade Logistics', driver: 'Ramesh Kumar Das', driverCard: 'DC-IN-88213', declaredKg: 18500, eta: '10:30', firstVisit: true, cargo: 'Cotton fabric', customs: 'Pending', fee: 184.7, cameraPlate: 'WB-23-K-4471' },
  { plate: 'WB-41-B-1192', kind: 'Foreign', cls: '14-wheel trailer', manifest: 'BEN-IGM-2026-08871', agency: 'Padma Border Agents', driver: 'Subrata Ghosh', driverCard: 'DC-IN-55120', declaredKg: 13000, eta: '10:55', firstVisit: false, cargo: 'Detergent', customs: 'Pending', fee: 184.7, cameraPlate: 'WB-41-B-1192' },
  { plate: 'WB-41-B-1207', kind: 'Foreign', cls: '14-wheel trailer', manifest: 'BEN-IGM-2026-08871', agency: 'Padma Border Agents', driver: 'Anil Mondal', driverCard: 'DC-IN-55982', declaredKg: 13000, eta: '11:20', firstVisit: false, cargo: 'Detergent', customs: 'Pending', fee: 184.7, cameraPlate: 'WB-41-B-1201' },
  { plate: 'WB-19-C-0803', kind: 'Foreign', cls: '10-wheel truck', manifest: 'BEN-IGM-2026-08841', agency: 'Rupsha Clearing & Forwarding', driver: 'Prakash Roy', driverCard: 'DC-IN-10477', declaredKg: 32000, eta: '11:45', firstVisit: false, cargo: 'Rice (non-basmati)', customs: 'Released', fee: 184.7, cameraPlate: 'WB-19-C-0803' },
];

export const leavingTrucks = [
  { plate: 'WB-19-C-0791', kind: 'Foreign', location: 'Transshipment yard T1', load: 'Empty', admitted: '07:12', manifest: 'BEN-IGM-2026-08841', release: 'Released', pass: '—' },
  { plate: 'JESSORE-TA-11-2034', kind: 'Local', location: 'Inland gate lane 2', load: 'Loaded · 16,000 kg', admitted: '08:40', manifest: 'BEN-IGM-2026-08841', release: 'Released', pass: 'BEN-PASS-004412' },
  { plate: 'WB-23-K-4402', kind: 'Foreign', location: 'Shed S5', load: 'Unloading', admitted: '09:05', manifest: 'BEN-IGM-2026-08860', release: 'Hold', pass: '—' },
];

export const weighQueue = [
  { plate: 'WB-19-C-0803', manifest: 'BEN-IGM-2026-08841', reason: 'Loaded (arrival)', agency: 'Rupsha Clearing & Forwarding', driver: 'Prakash Roy', cls: '10-wheel truck', tare: 11240, tareAge: '41 days', admitted: '10:48', declaredKg: 32000, live: 43310 },
  { plate: 'WB-41-B-1192', manifest: 'BEN-IGM-2026-08871', reason: 'Loaded (arrival)', agency: 'Padma Border Agents', driver: 'Subrata Ghosh', cls: '14-wheel trailer', tare: null, tareAge: 'No stored tare', admitted: '10:58', declaredKg: 13000, live: 27920 },
  { plate: 'WB-19-C-0791', manifest: 'BEN-IGM-2026-08841', reason: 'Empty (return)', agency: 'Rupsha Clearing & Forwarding', driver: 'Mithun Saha', cls: '10-wheel truck', tare: 11180, tareAge: '3 months (expired)', admitted: '07:12', declaredKg: 0, live: 11205 },
];

export const facilities = [
  {
    id: 'S5', name: 'Shed 5', kind: 'Shed', live: true,
    zones: [
      { code: 'S5A', rows: 4, cols: 8, capacityT: 20, categories: ['Food', 'Textile'] },
      { code: 'S5B', rows: 3, cols: 8, capacityT: 20, categories: ['Chemical'] },
    ],
  },
  {
    id: 'S9', name: 'Shed 9', kind: 'Shed', live: true,
    zones: [{ code: 'S9A', rows: 4, cols: 6, capacityT: 25, categories: ['Any'] }],
  },
  {
    id: 'OY1', name: 'Open yard 1', kind: 'Open yard', live: true,
    zones: [{ code: 'OY1A', rows: 3, cols: 10, capacityT: 40, categories: ['Rubber', 'Stone'] }],
  },
  { id: 'T1', name: 'Transshipment yard T1', kind: 'Transshipment yard', live: true, zones: [] },
];

// Deterministic occupancy pattern for demo bay grids.
export function bayState(zone, r, c) {
  const seed = (zone.charCodeAt(2) * 31 + r * 7 + c * 13) % 23;
  if (zone === 'S5A' && r === 1 && c >= 2 && c <= 4) return { state: 'same', product: 'Rice (non-basmati)', manifest: 'BEN-IGM-2026-08841' };
  if (seed % 11 === 0) return { state: 'blocked', reason: 'Roof leak reported' };
  if (zone === 'S5B' && seed % 5 === 0) return { state: 'occupied', product: 'Industrial solvent', category: 'Chemical' };
  if (seed % 3 === 0) return { state: 'occupied', product: seed % 2 ? 'Cotton fabric' : 'Onion', category: seed % 2 ? 'Textile' : 'Food' };
  return { state: 'empty' };
}

export const storageRules = [
  { a: 'Food', b: 'Chemical', scope: 'adjacent', gap: 1, source: 'National', reason: 'Contamination risk', state: 'Active' },
  { a: 'Baby products', b: 'Chemical', scope: 'zone', gap: null, source: 'National', reason: 'Health circular (invented reference)', state: 'Active' },
  { a: 'Food', b: 'Rubber', scope: 'bay', gap: null, source: 'Local · BEN', reason: 'Odour transfer', state: 'Active' },
  { a: 'Textile', b: 'Chemical', scope: 'adjacent', gap: 2, source: 'Local · BEN', reason: 'Fire safety review', state: 'Waiting for approval' },
  { a: 'Food', b: 'Stone', scope: 'facility', gap: null, source: 'Local · BEN', reason: 'Dust', state: 'Draft' },
];

export const billLines = [
  { event: 'Entrance · border gate · WB-19-C-0803', at: '27 Oct, 10:48', tariff: 'TO-2026-03 v2', calc: '1 vehicle × 184.70', amount: 184.7 },
  { event: 'Weighment · loaded · WB-19-C-0803', at: '27 Oct, 10:55', tariff: 'TO-2026-03 v2', calc: '1 weighing × 76.83', amount: 76.83 },
  { event: 'Unloading · equipment · Shed 5 / S5A-R2', at: '27 Oct, 11:30', tariff: 'TO-2026-03 v2', calc: '16.00 t × 140.45', amount: 2247.2 },
  { event: 'Storage · shed · days 1–10 slab', at: '27 Oct, 11:30', tariff: 'TO-2026-03 v2', calc: '16.00 t × 21.50', amount: 344.0 },
  { event: 'Entrance · inland gate · JESSORE-TA-11-2034', at: '27 Oct, 08:40', tariff: 'TO-2026-03 v2', calc: '1 vehicle × 153.58', amount: 153.58 },
  { event: 'Documentation', at: '27 Oct, 08:41', tariff: 'TO-2026-03 v2', calc: '4 documents × 321.78', amount: 1287.12 },
];

export const payments = [
  { receipt: 'RCPT-BEN-22018', ref: 'GW-7C21A9', amount: 1500.0, by: 'Online gateway', payer: 'Rupsha Clearing & Forwarding', method: 'bKash', status: 'Confirmed', at: '27 Oct, 09:02' },
  { receipt: 'RCPT-BEN-22020', ref: 'CHQ-004415', amount: 1287.12, by: 'Shahidul Islam', payer: 'Delta Agro Foods Ltd.', method: 'Cheque', status: 'Dishonored', at: '26 Oct, 15:40' },
  { receipt: 'RCPT-BEN-22024', ref: 'SBL-BEN-9931', amount: 500.0, by: 'Rakib Hasan', payer: 'Rupsha Clearing & Forwarding', method: 'Bank fallback', status: 'Pending confirmation', at: '27 Oct, 10:10' },
];

export const inboxRequests = [
  { id: 'REQ-1042', kind: 'Port go-live', summary: 'Akhaura (AKH) ready for go-live — all blocking checks pass', requester: 'Tanvir Alam', port: 'AKH', at: '27 Oct, 09:14', mine: false },
  { id: 'REQ-1043', kind: 'Sensitive role assignment', summary: 'Assign "Bill approver" to Rakib Hasan at BEN', requester: 'Imran Hossain', port: 'BEN', at: '27 Oct, 09:40', mine: false },
  { id: 'REQ-1044', kind: 'Bill adjustment', summary: 'Reduce documentation charge on BEN-IGM-2026-08841 (duplicate document)', requester: 'Farhana Rahman', port: 'BEN', at: '27 Oct, 10:02', mine: true },
  { id: 'REQ-1045', kind: 'Storage-rule override', summary: 'Allow Textile next to Chemical at S5B-R1-C02 for 48 h', requester: 'Mahmud Karim', port: 'BEN', at: '27 Oct, 10:21', mine: false },
  { id: 'REQ-1046', kind: 'Manual-status confirmation', summary: 'Paper release for BEN-IGM-2026-08852 (feed down, consent ref CNS-118)', requester: 'Shahidul Islam', port: 'BEN', at: '27 Oct, 10:33', mine: false },
];

export const decidedRequests = [
  { id: 'REQ-1031', kind: 'Correction', summary: 'Correct unloaded quantity on S5A-R2 from 16,400 to 16,000 kg', requester: 'Mahmud Karim', decision: 'Approved', decider: 'Farhana Rahman', at: '26 Oct, 16:12', reason: 'Scale ticket attached matches 16,000 kg.' },
  { id: 'REQ-1029', kind: 'Module change', summary: 'Turn off Transshipment at HIL', requester: 'Sabbir Ahmed', decision: 'Rejected', decider: 'Head office', at: '26 Oct, 11:05', reason: 'Port has transshipment work in flight.' },
];

export const roles = [
  { name: 'Border gate operator', scope: 'Port + gates/lanes', org: 'BLPA', modules: 3, tasks: 9, template: true, sensitive: false },
  { name: 'Weighbridge operator', scope: 'Port + scale', org: 'BLPA', modules: 2, tasks: 6, template: true, sensitive: false },
  { name: 'Posting officer', scope: 'Port + shed/yard', org: 'BLPA', modules: 3, tasks: 8, template: true, sensitive: false },
  { name: 'Billing officer', scope: 'Port', org: 'BLPA', modules: 2, tasks: 7, template: true, sensitive: false },
  { name: 'Bill approver', scope: 'Port', org: 'BLPA', modules: 2, tasks: 4, template: true, sensitive: true },
  { name: 'Port in-charge', scope: 'Port', org: 'BLPA', modules: 11, tasks: 34, template: true, sensitive: true },
  { name: 'Access administrator', scope: 'Port', org: 'BLPA', modules: 2, tasks: 6, template: true, sensitive: true },
  { name: 'C&F agent user', scope: 'Own agency, per port', org: 'C&F agency', modules: 4, tasks: 12, template: true, sensitive: false },
  { name: 'Bank counter', scope: 'Bank booth', org: 'Bank', modules: 1, tasks: 3, template: true, sensitive: false },
  { name: 'Benapole shift supervisor', scope: 'Port', org: 'BLPA', modules: 6, tasks: 15, template: false, sensitive: false },
];

export const modulesCatalog = [
  { key: 'gates', name: 'Border & inland gates', actions: [['See', 'View arriving / leaving queues'], ['Record and do', 'Admit truck'], ['Record and do', 'Record departure'], ['Record and do', 'Admit and flag unregistered truck', true]] },
  { key: 'weigh', name: 'Weighing', actions: [['See', 'View weighing queue'], ['Record and do', 'Capture scale weight'], ['Record and do', 'Enter weight manually', true]] },
  { key: 'posting', name: 'Posting & warehousing', actions: [['See', 'View bay grid'], ['Record and do', 'Allocate bay'], ['Record and do', 'Record receipt'], ['Set up', 'Request storage-rule override', true]] },
  { key: 'billing', name: 'Billing & payment', actions: [['See', 'View bills'], ['Record and do', 'Record bank fallback payment'], ['Record and do', 'Confirm fallback payment', true], ['Set up', 'Request bill adjustment', true]] },
  { key: 'tracking', name: 'Manifest tracking', actions: [['See', 'View manifests and timeline']] },
  { key: 'reports', name: 'Dashboards & reports', actions: [['See', 'View dashboards'], ['Record and do', 'Export reports']] },
];

export const users = [
  { name: 'Farhana Rahman', email: 'farhana.rahman@blpa.gov.bd', org: 'BLPA', assignments: ['Port in-charge @ BEN'], status: 'Active' },
  { name: 'Imran Hossain', email: 'imran.hossain@blpa.gov.bd', org: 'BLPA', assignments: ['Access administrator @ BEN', 'Port in-charge @ BUR'], status: 'Active' },
  { name: 'Shahidul Islam', email: 'shahidul.islam@blpa.gov.bd', org: 'BLPA', assignments: ['Billing officer @ BEN'], status: 'Active' },
  { name: 'Rakib Hasan', email: 'rakib.hasan@blpa.gov.bd', org: 'BLPA', assignments: ['Finance officer @ BEN (acting until 30 Nov)'], status: 'Active' },
  { name: 'Mahmud Karim', email: 'mahmud.karim@blpa.gov.bd', org: 'BLPA', assignments: ['Shed in-charge @ BEN'], status: 'Active' },
  { name: 'Ayesha Siddiqua', email: 'ayesha@rupsha-cf.com.bd', org: 'Rupsha Clearing & Forwarding', assignments: ['C&F agent user @ BEN'], status: 'Invited' },
  { name: 'Kamal Uddin', email: 'kamal.uddin@blpa.gov.bd', org: 'BLPA', assignments: ['Border gate operator @ BEN'], status: 'Deactivated' },
];

export const auditEvents = [
  { id: 'EV-918204', time: '27 Oct 2026, 10:55:12', actor: 'Kamal Hasan', role: 'Weighbridge operator', module: 'Weighing', type: 'Record', text: 'Captured loaded weight 43,310 kg for WB-19-C-0803 on Scale 1', flags: [] },
  { id: 'EV-918199', time: '27 Oct 2026, 10:48:40', actor: 'Nasima Akter', role: 'Border gate operator', module: 'Gates', type: 'Record', text: 'Admitted WB-19-C-0803 at Border gate 1, lane B2', flags: [] },
  { id: 'EV-918190', time: '27 Oct 2026, 10:33:02', actor: 'Shahidul Islam', role: 'Billing officer', module: 'Single Window', type: 'Request', text: 'Requested paper release for BEN-IGM-2026-08852 (consent CNS-118)', flags: ['Manual pending reconciliation'] },
  { id: 'EV-918177', time: '27 Oct 2026, 10:10:44', actor: 'Rakib Hasan', role: 'Finance officer', module: 'Billing', type: 'Record', text: 'Recorded bank fallback payment BDT 500.00, ref SBL-BEN-9931', flags: [] },
  { id: 'EV-918160', time: '27 Oct 2026, 09:31:09', actor: 'Kamal Hasan', role: 'Weighbridge operator', module: 'Weighing', type: 'Record', text: 'Entered manual weight 27,880 kg for WB-41-B-1150 (scale link failure)', flags: ['Override'] },
  { id: 'EV-918101', time: '27 Oct 2026, 07:12:30', actor: 'Nasima Akter', role: 'Border gate operator', module: 'Gates', type: 'Record', text: 'Admitted WB-19-C-0791 at Border gate 1, lane B1', flags: ['Recorded offline'] },
  { id: 'EV-917980', time: '26 Oct 2026, 16:12:51', actor: 'Farhana Rahman', role: 'Port in-charge', module: 'Approvals', type: 'Decision', text: 'Approved correction REQ-1031 on S5A-R2', flags: [] },
];

export const alerts = [
  { at: '10:48', manifest: 'BEN-IGM-2026-08841', text: 'WB-19-C-0803 admitted at Border gate 1 and routed to Shed 5.' },
  { at: '09:02', manifest: 'BEN-IGM-2026-08841', text: 'Gateway confirmed payment BDT 1,500.00 (ref GW-7C21A9).' },
  { at: '08:40', manifest: 'BEN-IGM-2026-08841', text: 'JESSORE-TA-11-2034 admitted at inland gate.' },
  { at: 'Yesterday', manifest: 'BEN-IGM-2026-08860', text: 'Customs hold placed. Departure is blocked until released.' },
];

export const inlandArriving = [
  { plate: 'JESSORE-TA-11-2101', kind: 'Local', cls: '10-wheel truck', manifest: 'BEN-IGM-2026-08841', agency: 'Rupsha Clearing & Forwarding', driver: 'Abdul Malek', driverCard: 'DC-BD-30211', declaredKg: 16000, eta: '11:10', firstVisit: false, cargo: 'Rice (non-basmati)', customs: 'Released', fee: 153.58, cameraPlate: 'JESSORE-TA-11-2101' },
  { plate: 'KHULNA-DA-14-0587', kind: 'Local', cls: '6-wheel truck', manifest: 'BEN-IGM-2026-08860', agency: 'Padma Border Agents', driver: 'Jahangir Alam', driverCard: 'DC-BD-11873', declaredKg: 11000, eta: '12:30', firstVisit: true, cargo: 'Industrial solvent', customs: 'Hold', fee: 153.58, cameraPlate: null },
];
