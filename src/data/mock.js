
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
  { code: 'VT-RW', name: 'Rail wagon', wheels: 8, mode: 'Rail' },
];

export const holidays = [
  { date: '2026-12-16', name: 'Victory Day', upcoming: true },
  { date: '2027-02-21', name: 'International Mother Language Day', upcoming: true },
  { date: '2027-03-26', name: 'Independence Day', upcoming: true },
  { date: '2026-08-15', name: 'National Mourning Day', upcoming: false },
];

// Demonstration tariff snapshot: not legal rates.
export const tariffLines = [
  { charge: 'Entrance fee (border gate)', rate: 184.7, basis: 'per vehicle, by gate and truck class', billedHere: true },
  { charge: 'Entrance fee (inland gate)', rate: 153.58, basis: 'per vehicle, by gate and truck class', billedHere: true },
  { charge: 'Weighment', rate: 76.83, basis: 'per weighing, by truck class', billedHere: true },
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

// Truck class sets the entrance and weighing charges (F8). The tariff lines above show the 10-wheel rate.
export const truckClassRates = {
  'Van / pick-up': { borderEntrance: 92.35, inlandEntrance: 76.79, weighing: 38.42 },
  '6-wheel truck': { borderEntrance: 138.53, inlandEntrance: 115.19, weighing: 57.62 },
  '10-wheel truck': { borderEntrance: 184.7, inlandEntrance: 153.58, weighing: 76.83 },
  '14-wheel trailer': { borderEntrance: 240.11, inlandEntrance: 199.65, weighing: 99.88 },
};

export const manifests = [
  {
    id: 'BEN-IGM-2026-08841', direction: 'Import', agency: 'Rupsha Clearing & Forwarding', trader: 'Delta Agro Foods Ltd.',
    product: 'Rice (non-basmati)', declaredKg: 64000, remainingKg: 32000, status: 'Open', balance: 4295.46,
    foreignTrucks: 2, localTrucks: 3, updated: '10:42',
  },
  {
    id: 'BEN-IGM-2026-08852', direction: 'Import', agency: 'Meghna Trade Logistics', trader: 'Northern Textiles PLC',
    product: 'Cotton fabric', declaredKg: 18500, remainingKg: 18500, status: 'Open', balance: 184.7,
    foreignTrucks: 1, localTrucks: 0, updated: '10:15',
  },
  {
    id: 'BEN-IGM-2026-08860', direction: 'Import', agency: 'Padma Border Agents', trader: 'Coastal Chemicals Ltd.',
    product: 'Industrial solvent', declaredKg: 22000, remainingKg: 0, status: 'Open', balance: 6380.12,
    foreignTrucks: 1, localTrucks: 1, updated: '09:58',
  },
  {
    id: 'BEN-IGM-2026-08799', direction: 'Import', agency: 'Rupsha Clearing & Forwarding', trader: 'Delta Agro Foods Ltd.',
    product: 'Onion', declaredKg: 30000, remainingKg: 0, status: 'Closed', balance: 0,
    foreignTrucks: 2, localTrucks: 4, updated: 'Yesterday',
  },
  {
    id: 'BEN-EGM-2026-01204', direction: 'Export', agency: 'Meghna Trade Logistics', trader: 'Northern Textiles PLC',
    product: 'Garment cartons', declaredKg: 12000, remainingKg: 12000, status: 'Open', balance: 0,
    foreignTrucks: 0, localTrucks: 1, updated: '08:31',
  },
  {
    id: 'BEN-IGM-2026-08871', direction: 'Import', agency: 'Padma Border Agents', trader: 'Coastal Chemicals Ltd.',
    product: 'Detergent', declaredKg: 26000, remainingKg: 26000, status: 'Open', balance: 0,
    foreignTrucks: 2, localTrucks: 0, updated: '08:05',
  },
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
    zones: [{ code: 'OY1A', rows: 3, cols: 10, capacityT: 40, categories: ['Rubber'] }],
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

export const payments = [
  { receipt: 'RCPT-BEN-22018', ref: 'GW-7C21A9', amount: 1500.0, by: 'Online gateway', payer: 'Rupsha Clearing & Forwarding', method: 'bKash', status: 'Confirmed', at: '27 Oct, 09:02' },
  { receipt: 'RCPT-BEN-22020', ref: 'CHQ-004415', amount: 1287.12, by: 'Shahidul Islam', payer: 'Delta Agro Foods Ltd.', method: 'Cheque', status: 'Dishonored', at: '26 Oct, 15:40' },
  { receipt: 'RCPT-BEN-22024', ref: 'SBL-BEN-9931', amount: 500.0, by: 'Rakib Hasan', payer: 'Rupsha Clearing & Forwarding', method: 'Bank fallback', status: 'Pending confirmation', at: '27 Oct, 10:10' },
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
  { key: 'access', name: 'Users & roles', actions: [['See', 'View users and roles'], ['Record and do', 'Invite user'], ['Set up', 'Assign role', true], ['Set up', 'Create or change role', true]] },
];

// What each template role may do: module key -> the actions it has (names from modulesCatalog). Demo data.
export const roleAccess = {
  'Border gate operator': { gates: ['View arriving / leaving queues', 'Admit truck', 'Record departure'], tracking: ['View manifests and timeline'] },
  'Weighbridge operator': { weigh: ['View weighing queue', 'Capture scale weight'], tracking: ['View manifests and timeline'] },
  'Posting officer': { posting: ['View bay grid', 'Allocate bay', 'Record receipt'], gates: ['View arriving / leaving queues'], tracking: ['View manifests and timeline'] },
  'Billing officer': { billing: ['View bills', 'Record bank fallback payment'], tracking: ['View manifests and timeline'], reports: ['View dashboards'] },
  'Bill approver': { billing: ['View bills', 'Confirm fallback payment', 'Request bill adjustment'] },
  'Port in-charge': 'all',
  'Access administrator': { access: ['View users and roles', 'Invite user', 'Assign role', 'Create or change role'], reports: ['View dashboards'] },
  'C&F agent user': { tracking: ['View manifests and timeline'], billing: ['View bills'], gates: ['View arriving / leaving queues'] },
  'Bank counter': { billing: ['View bills', 'Record bank fallback payment'] },
  'Benapole shift supervisor': { gates: ['View arriving / leaving queues', 'Admit truck', 'Record departure'], weigh: ['View weighing queue'], posting: ['View bay grid'], tracking: ['View manifests and timeline'], reports: ['View dashboards', 'Export reports'] },
};

export const users = [
  { name: 'Farhana Rahman', email: 'farhana.rahman@blpa.gov.bd', org: 'BLPA', assignments: ['Port in-charge @ BEN'], status: 'Active' },
  { name: 'Imran Hossain', email: 'imran.hossain@blpa.gov.bd', org: 'BLPA', assignments: ['Access administrator @ BEN', 'Port in-charge @ BUR'], status: 'Active' },
  { name: 'Shahidul Islam', email: 'shahidul.islam@blpa.gov.bd', org: 'BLPA', assignments: ['Billing officer @ BEN'], status: 'Active' },
  { name: 'Rakib Hasan', email: 'rakib.hasan@blpa.gov.bd', org: 'BLPA', assignments: ['Finance officer @ BEN (acting until 30 Nov)'], status: 'Active' },
  { name: 'Mahmud Karim', email: 'mahmud.karim@blpa.gov.bd', org: 'BLPA', assignments: ['Shed in-charge @ BEN'], status: 'Active' },
  { name: 'Ayesha Siddiqua', email: 'ayesha@rupsha-cf.com.bd', org: 'Rupsha Clearing & Forwarding', assignments: ['C&F agent user @ BEN'], status: 'Invited' },
  { name: 'Kamal Uddin', email: 'kamal.uddin@blpa.gov.bd', org: 'BLPA', assignments: ['Border gate operator @ BEN'], status: 'Deactivated' },
];