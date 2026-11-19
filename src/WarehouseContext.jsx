import { createContext, useContext, useMemo, useState } from 'react';

// Shed work that several screens share: trucks waiting or unloading at a shed (fed by Posting), the labour
// requisitions that supply gangs and equipment (Labour), goods in the shed, and shiftings inside it.
// Demo state only: it resets when the page is refreshed.
const WarehouseContext = createContext(null);

export const EQUIPMENT = ['Forklift FL-01 (3 t)', 'Forklift FL-02 (3 t)', 'Forklift FL-05 (5 t)', 'Mobile crane MC-01 (25 t)'];
export const isCrane = (item) => item.startsWith('Mobile crane');
export const isForklift = (item) => item.startsWith('Forklift');
// Crane off the truck and forklift into the shed is billed as double equipment handling (Item 8, Benapole).
export const isDoubleHandling = (items) => items.some(isCrane) && items.some(isForklift);

// Demonstration contractor rates per tonne, not contract values.
export const CONTRACTOR_RATES = { manual: 42.5, equipment: 18 };
// Demonstration shifting fee per tonne, charged to the owner of the goods moved (Item 8, Bhomra).
export const SHIFTING_FEE_PER_T = 120;

// Demonstration handling charge per tonne for transshipment. True transshipment of perishables is one handling;
// non-perishable transshipment and truck-to-truck transfer are billed as unloading plus loading (Item 9, Bhomra).
export const TRANSSHIP_HANDLING_RATE = 95;
export const handlingsFor = (order) => (order.kind === 'truck-to-truck' || order.productType !== 'Perishable' ? 2 : 1);

const labourerNames = [
  'Abul Kalam', 'Rafiqul Islam', 'Motaleb Mia', 'Nurul Amin', 'Shahidul Haque', 'Jamal Uddin', 'Kamrul Hasan', 'Selim Reza',
  'Harun Mia', 'Babul Sheikh', 'Alamgir Hossain', 'Mizanur Rahman', 'Ripon Das', 'Sohel Rana', 'Faruk Ahmed', 'Monir Hossain',
  'Shafiqul Alam', 'Liton Mia', 'Rubel Sheikh', 'Anwar Hossain', 'Delwar Hossain', 'Hanif Mia', 'Jahangir Alam', 'Kabir Hossain',
  'Masud Rana', 'Nazrul Islam', 'Obaidul Haque', 'Polash Mia', 'Rashed Khan', 'Saiful Islam', 'Tariqul Islam', 'Yusuf Ali',
  'Zakir Hossain', 'Habibur Rahman', 'Idris Ali', 'Jalal Uddin', 'Khokon Mia', 'Lutfor Rahman', 'Mamun Mia', 'Nasir Uddin',
  'Ruhul Amin', 'Shamim Ahmed',
];
const gangSizes = [['Gang 1', 12], ['Gang 2', 10], ['Gang 3', 12], ['Gang 4', 8]];
// The contractor names the labourers in each gang; BLPA issued their port cards (Item 8, Bhomra).
export const GANGS = gangSizes.reduce((all, [name, size]) => {
  const start = all.reduce((n, g) => n + g.labourers.length, 0);
  return [...all, { name, labourers: labourerNames.slice(start, start + size).map((n, i) => ({ name: n, card: `LB-${String(400 + start + i).padStart(4, '0')}` })) }];
}, []);
export const gangByName = (name) => GANGS.find((g) => g.name === name);

const seededReceipts = [
  {
    key: 'W1', plate: 'WB-19-C-0788', handheldPlate: 'WB-19-C-0788', manifest: 'BEN-IGM-2026-08829', product: 'Rice (non-basmati)', category: 'Food',
    agency: 'Rupsha Clearing & Forwarding', declaredKg: 30000, weighedKg: 30410, parts: [{ bay: 'S5A-R2-C03', m3: 45 }], shed: 'Shed 5', stage: 'waiting',
    customs: { boe: 'C-48211', channel: 'Green' },
  },
  {
    key: 'W2', plate: 'WB-23-K-4402', handheldPlate: 'WB-23-K-4402', manifest: 'BEN-IGM-2026-08860', product: 'Industrial solvent', category: 'Chemical',
    agency: 'Padma Border Agents', declaredKg: 22000, weighedKg: 21940, parts: [{ bay: 'S5B-R3-C01', m3: 30 }], shed: 'Shed 5', stage: 'unloading',
    startedAt: Date.now() - 34 * 60000, customs: { boe: 'C-48190', channel: 'Red' },
  },
  {
    key: 'W3', plate: 'WB-37-A-1650', handheldPlate: 'WB-37-A-1658', manifest: 'BEN-IGM-2026-08866', product: 'Cotton yarn', category: 'Textile',
    agency: 'Meghna Trade Logistics', declaredKg: 18000, weighedKg: 17880, parts: [{ bay: 'S5A-R4-C02', m3: 52 }], shed: 'Shed 5', stage: 'waiting',
    customs: { boe: 'C-48230', channel: 'Yellow' },
  },
  {
    key: 'W4', plate: 'WB-11-F-3307', handheldPlate: 'WB-11-F-3307', manifest: 'BEN-IGM-2026-08874', product: 'Motor cars (3 units)', category: 'General',
    agency: 'Rupsha Clearing & Forwarding', declaredKg: 4200, weighedKg: 4350, parts: [{ bay: 'S5B-R1-C04', m3: 60 }], shed: 'Shed 5', stage: 'waiting',
    customs: { boe: null, channel: null },
  },
];

const done = (gang, work, manualT, equipmentT, sent, lifts, at, id, truck) => ({
  id, shed: 'Shed 5', truck, work, workers: gangByName(gang).labourers.length, requested: sent, sent, status: 'Completed', gang, at,
  handling: { manualT, equipmentT, lifts, double: isDoubleHandling(sent), source: 'In-charge' },
});

const seededRequisitions = [
  { id: 'LR-BEN-2041', shed: 'Shed 5', truck: 'WB-37-A-1650', work: 'Unloading', workers: 12, requested: ['Forklift FL-01 (3 t)'], sent: [], status: 'Requested', gang: null, at: 'Today, 10:58' },
  // The contractor's device captured the lifts for this one (F25: mechanised capture is kept beside manual entry).
  {
    id: 'LR-BEN-2040', shed: 'Shed 5', truck: 'WB-23-K-4402', work: 'Unloading', workers: 10, requested: ['Forklift FL-01 (3 t)'],
    sent: ['Mobile crane MC-01 (25 t)', 'Forklift FL-02 (3 t)'], status: 'Gang assigned', gang: 'Gang 2', at: 'Today, 09:12',
    captured: { 'Mobile crane MC-01 (25 t)': 18, 'Forklift FL-02 (3 t)': 22 },
  },
  { id: 'LR-BEN-2035', shed: 'Transshipment yard T1', truck: 'WB-23-K-4588', work: 'Transshipment', workers: 12, requested: ['Forklift FL-01 (3 t)'], sent: ['Mobile crane MC-01 (25 t)', 'Forklift FL-01 (3 t)'], status: 'Gang assigned', gang: 'Gang 3', at: 'Today, 09:40' },
  { id: 'LR-BEN-2037', shed: 'Transshipment yard T1', truck: 'WB-19-C-0791', work: 'Transshipment', workers: 12, requested: [], sent: [], status: 'Gang assigned', gang: 'Gang 4', at: 'Today, 08:05' },
  { id: 'LR-BEN-2039', shed: 'Shed 5', truck: 'WB-19-C-0788', work: 'Unloading', workers: 12, requested: [], sent: [], status: 'Gang assigned', gang: 'Gang 1', at: 'Today, 08:47' },
  done('Gang 1', 'Loading', 12, 9.5, ['Mobile crane MC-01 (25 t)'], { 'Mobile crane MC-01 (25 t)': 14 }, 'Today, 07:40', 'LR-BEN-2038', 'JESSORE-TA-11-2034'),
  done('Gang 3', 'Unloading', 26, 0, [], {}, '17 Nov, 22:10', 'LR-BEN-2036', 'WB-25-G-7731'),
  done('Gang 2', 'Unloading', 8, 21, ['Mobile crane MC-01 (25 t)', 'Forklift FL-01 (3 t)'], { 'Mobile crane MC-01 (25 t)': 16, 'Forklift FL-01 (3 t)': 19 }, '17 Nov, 15:32', 'LR-BEN-2034', 'WB-19-C-0761'),
  done('Gang 4', 'Unloading', 14, 0, [], {}, '16 Nov, 11:05', 'LR-BEN-2031', 'WB-41-B-1150'),
  done('Gang 1', 'Unloading', 6, 24, ['Forklift FL-05 (5 t)'], { 'Forklift FL-05 (5 t)': 31 }, '15 Nov, 13:48', 'LR-BEN-2027', 'WB-58-D-2204'),
];

const minutesAgo = (m) => Date.now() - m * 60000;
const seededWorkOrders = [
  {
    id: 'WO-BEN-3381', kind: 'transshipment', plate: 'WB-19-C-0791', manifest: 'BEN-IGM-2026-08799', product: 'Onion', productType: 'Perishable',
    agency: 'Padma Border Agents', driver: 'Mithun Saha', location: 'Yard T1, position 3', goodsKg: 30000, arrivedAt: minutesAgo(130),
    receivers: [
      { plate: 'KHULNA-DA-14-0412', handheldPlate: 'KHULNA-DA-14-0412', movedKg: 10000 },
      { plate: 'KHULNA-DA-14-0433', handheldPlate: 'KHULNA-DA-14-0433', movedKg: 8000 },
    ],
  },
  {
    id: 'WO-BEN-3384', kind: 'transshipment', plate: 'WB-37-B-5512', manifest: 'BEN-IGM-2026-08881', product: 'Green chilli', productType: 'Perishable',
    agency: 'Rupsha Clearing & Forwarding', driver: 'Bikash Das', location: 'Yard T1, position 5', goodsKg: 9000, arrivedAt: minutesAgo(40),
    receivers: [], handheld: { 'JESSORE-TA-11-2210': 'JESSORE-TA-11-2216' },
  },
  {
    id: 'WO-BEN-3386', kind: 'transshipment', plate: 'WB-41-B-1288', manifest: 'BEN-IGM-2026-08883', product: 'Truck tyres', productType: 'Non-perishable',
    agency: 'Meghna Trade Logistics', driver: 'Sunil Ghosh', location: 'Yard T1, position 1', goodsKg: 14000, arrivedAt: minutesAgo(95),
    receivers: [], customsPermission: 'Pending',
  },
  {
    id: 'WO-BEN-3387', kind: 'truck-to-truck', plate: 'WB-23-K-4588', manifest: 'BEN-IGM-2026-08885', product: 'Detergent', productType: 'Non-perishable',
    agency: 'Padma Border Agents', driver: 'Ajoy Paul', location: 'Shed 5 apron', goodsKg: 12000, arrivedAt: minutesAgo(70),
    receivers: [], jammedBy: 'Farhana Rahman',
  },
];

const seededStock = [
  { id: 'LOT-5101', manifest: 'BEN-IGM-2026-08790', product: 'Wheat flour', owner: 'Rupsha Clearing & Forwarding', bay: 'S5A-R1-C02', kg: 26000 },
  { id: 'LOT-5102', manifest: 'BEN-IGM-2026-08802', product: 'Cotton yarn', owner: 'Meghna Trade Logistics', bay: 'S5A-R4-C01', kg: 15500 },
  { id: 'LOT-5103', manifest: 'BEN-IGM-2026-08811', product: 'Ceramic tiles', owner: 'Padma Border Agents', bay: 'S5B-R2-C03', kg: 21000 },
];

const seededShiftings = [
  { id: 'SH-BEN-0118', lot: 'LOT-5103', manifest: 'BEN-IGM-2026-08811', product: 'Ceramic tiles', owner: 'Padma Border Agents', from: 'S5B-R2-C02', to: 'S5B-R2-C03', tonnes: 21, reason: 'Make room for chemical drums', at: '17 Nov, 16:20', by: 'Farhana Rahman' },
];

let nextKey = 1;

export function WarehouseProvider({ children }) {
  const [receipts, setReceipts] = useState(seededReceipts);
  const [requisitions, setRequisitions] = useState(seededRequisitions);
  const [stock, setStock] = useState(seededStock);
  const [shiftings, setShiftings] = useState(seededShiftings);
  const [workOrders, setWorkOrders] = useState(seededWorkOrders);
  const updateOrder = (id, change) => setWorkOrders((all) => all.map((o) => (o.id === id ? { ...o, ...(typeof change === 'function' ? change(o) : change) } : o)));

  const value = useMemo(() => ({
    receipts,
    requisitions,
    stock,
    shiftings,
    workOrders,
    updateOrder,
    completeRequisition: (id, handling) => setRequisitions((all) => all.map((r) => (r.id === id ? { ...r, status: 'Completed', handling } : r))),
    // An accepted posting sends the truck to its shed. The Bill of Entry usually comes after unloading.
    addPosted: (line, shed) => setReceipts((all) => [...all, {
      key: `P${nextKey++}`, plate: line.plate, handheldPlate: line.plate, manifest: line.manifest, product: line.product, category: line.category,
      agency: line.agency, declaredKg: line.declaredKg, weighedKg: line.weighedKg, sharedTruck: line.sharedTruck, parts: line.parts, shed, stage: 'waiting',
      customs: { boe: null, channel: null }, fromPosting: true,
    }]),
    updateReceipt: (key, change) => setReceipts((all) => all.map((r) => (r.key === key ? { ...r, ...change } : r))),
    // A recorded receipt leaves the queue, puts the goods in stock and completes the truck's requisition.
    recordReceipt: (item, receiptKg, handling) => {
      setReceipts((all) => all.filter((r) => r.key !== item.key));
      setStock((all) => [...all, { id: `LOT-${5104 + all.length}`, manifest: item.manifest, product: item.product, owner: item.agency, bay: item.parts[0].bay, kg: receiptKg }]);
      setRequisitions((all) => all.map((r) => (r.truck === item.plate && r.work === 'Unloading' && r.status === 'Gang assigned' ? { ...r, status: 'Completed', handling } : r)));
    },
    raiseRequisition: (f) => setRequisitions((all) => [{ ...f, id: `LR-BEN-${2042 + all.length - seededRequisitions.length}`, sent: [], status: 'Requested', gang: null, at: 'Just now' }, ...all]),
    assignGang: (id, gang, sent) => setRequisitions((all) => all.map((r) => (r.id === id ? { ...r, gang, sent, status: 'Gang assigned' } : r))),
    addShifting: (s) => {
      setShiftings((all) => [{ ...s, id: `SH-BEN-${String(119 + all.length - seededShiftings.length).padStart(4, '0')}`, at: 'Just now' }, ...all]);
      setStock((all) => all.map((l) => (l.id === s.lot ? { ...l, bay: s.to } : l)));
    },
  }), [receipts, requisitions, stock, shiftings, workOrders]);

  return <WarehouseContext.Provider value={value}>{children}</WarehouseContext.Provider>;
}

export const useWarehouse = () => useContext(WarehouseContext);
// The truck's open requisition for this work, if one has been raised.
export const requisitionFor = (requisitions, plate, work = 'Unloading') => requisitions.find((r) => r.truck === plate && r.work === work && r.status !== 'Completed');
