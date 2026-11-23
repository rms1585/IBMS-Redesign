import { createContext, useContext, useMemo, useState } from 'react';
import { useWarehouse } from './WarehouseContext';

// One record of foreign trucks' empty weights (tare), re-weigh orders and early re-weigh applications, read by
// the Weighbridge, the Border gate, the Inbox and the C&F portal (Phase 8). Demo state only: it resets on refresh.
const TruckWeightsContext = createContext(null);

const DAY = 86400000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);
export const formatDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const clockOf = (ms) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const clock = () => clockOf(Date.now());

// A new tare this far below the previous one is flagged for information only (F16). Demo figure until BLPA decides (#79).
export const TARE_DROP_FLAG_KG = 300;

// The two authorities named for re-weighs (F31). Who may order one is an assumption until BLPA and NBR confirm (#78, #79).
export const AUTHORITIES = { blpa: 'BLPA Assistant Director', customs: 'Customs Assistant Commissioner' };

// Past empty weighings per plate, oldest first.
const seededTares = {
  'WB-19-C-0803': [{ kg: 11180, date: daysAgo(140) }, { kg: 11240, date: daysAgo(41) }],
  'WB-19-C-0812': [{ kg: 10950, date: daysAgo(20) }],
  'WB-23-K-4471': [{ kg: 11060, date: daysAgo(12) }],
  'WB-19-C-0791': [{ kg: 11180, date: daysAgo(95) }],
  'WB-19-C-0755': [{ kg: 11310, date: daysAgo(20) }],
  'WB-19-C-0760': [{ kg: 11020, date: daysAgo(30) }],
  'WB-37-A-1612': [{ kg: 11390, date: daysAgo(197) }, { kg: 11420, date: daysAgo(104) }],
  'WB-41-B-1150': [{ kg: 13900, date: daysAgo(50) }],
  'WB-19-C-0788': [{ kg: 11100, date: daysAgo(97) }],
  'WB-23-K-4402': [{ kg: 12030, date: daysAgo(15) }],
  'WB-37-A-1650': [{ kg: 10840, date: daysAgo(60) }],
  'WB-37-B-5512': [{ kg: 8120, date: daysAgo(10) }],
  'WB-41-B-1288': [{ kg: 13650, date: daysAgo(85) }],
  'WB-23-K-4588': [{ kg: 12210, date: daysAgo(40) }],
};

// Empty foreign trucks inside the port, waiting to leave for India through the border gate.
const seededLeaving = [
  { plate: 'WB-19-C-0755', driver: 'Gopal Biswas', manifest: 'BEN-IGM-2026-08799', agency: 'Rupsha Clearing & Forwarding', location: 'Shed 5', load: 'Empty', admitted: '06:48', live: 11335 },
  { plate: 'WB-37-A-1612', driver: 'Tapan Roy', manifest: 'BEN-IGM-2026-08866', agency: 'Meghna Trade Logistics', location: 'Shed 5', load: 'Empty', admitted: '07:05', live: 10980 },
  { plate: 'WB-19-C-0760', driver: 'Sanjay Mondal', manifest: 'BEN-IGM-2026-08799', agency: 'Rupsha Clearing & Forwarding', location: 'Transshipment yard T1', load: 'Empty', admitted: '07:20', live: 11040 },
  { plate: 'WB-41-B-1150', driver: 'Nikhil Sen', manifest: 'BEN-IGM-2026-08871', agency: 'Padma Border Agents', location: 'Open yard 1', load: 'Empty', admitted: '07:31', cameraPlate: 'WB-41-B-1158', live: 13920 },
  { plate: 'WB-23-K-4402', driver: 'Asit Mondal', manifest: 'BEN-IGM-2026-08860', agency: 'Padma Border Agents', location: 'Shed 5', load: 'Unloading', admitted: '09:05', live: 12050 },
];

const seededOrders = [
  { id: 'RO-BEN-0042', plate: 'WB-19-C-0760', authority: 'customs', reason: 'Suspected removable weight at the last empty weighing', at: 'Today, 08:15', open: true },
];

const seededApplications = [
  {
    id: 'RW-BEN-0017', plate: 'WB-19-C-0803', manifest: 'BEN-IGM-2026-08841', agency: 'Rupsha Clearing & Forwarding', requester: 'Ayesha Siddiqua',
    reason: 'Stored tare was taken in heavy rain with a wet tarpaulin on board', at: 'Today, 09:40', status: 'Waiting',
    decisions: { blpa: { decision: 'Approved', by: 'Md. Kamrul Hasan', remarks: 'Rain recorded at the weighbridge that day.', at: 'Today, 10:05' }, customs: null },
  },
];

const seededNotices = [
  { at: '08:15', text: 'Re-weigh ordered for WB-19-C-0760 by the Customs Assistant Commissioner.', path: '/weighbridge', ref: 'RO-BEN-0042' },
];

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

export function TruckWeightsProvider({ children }) {
  const { workOrders, emptied } = useWarehouse();
  const [tares, setTares] = useState(seededTares);
  const [tareMonths, setTareMonths] = useState(3);
  const [orders, setOrders] = useState(seededOrders);
  const [applications, setApplications] = useState(seededApplications);
  const [departed, setDeparted] = useState([]);
  const [notices, setNotices] = useState(seededNotices);

  const value = useMemo(() => {
    const openOrder = (plate) => orders.find((o) => o.plate === plate && o.open);

    // The tare the port holds for a plate, how old it is against the Port setup interval, and its history (#73, #76).
    const tareFor = (plate) => {
      const history = tares[plate] ?? [];
      const last = history[history.length - 1];
      if (!last) return { history, kg: null, valid: false, status: 'No stored tare' };
      const expiresOn = addMonths(last.date, tareMonths);
      const ageDays = Math.floor((Date.now() - last.date) / DAY);
      const valid = expiresOn > new Date();
      return {
        history, kg: last.kg, date: last.date, expiresOn, ageDays, valid,
        status: valid ? `${ageDays} days old, valid until ${formatDate(expiresOn)}` : `Expired on ${formatDate(expiresOn)} (${ageDays} days old)`,
      };
    };

    // Why a foreign truck must be weighed empty before it leaves, or null when it needn't be (#71, #74).
    const emptyWeighingReason = (plate) => {
      const order = openOrder(plate);
      if (order?.application) return `Early re-weigh ${order.application} approved by the Customs AC and the BLPA AD`;
      if (order) return `Re-weigh ordered by the ${AUTHORITIES[order.authority]} (${order.reason})`;
      const tare = tareFor(plate);
      if (!tare.kg) return 'No stored tare';
      if (!tare.valid) return `Stored tare expired on ${formatDate(tare.expiresOn)}`;
      return null;
    };

    // Trucks emptied in the port join the leaving list: unloaded at a shed, or finished in transshipment (#71).
    const fromWarehouse = [
      ...emptied.map((e) => ({ ...e, load: 'Empty' })),
      ...workOrders.filter((o) => o.done).map((o) => ({ plate: o.plate, manifest: o.manifest, agency: o.agency, location: 'Transshipment yard T1', load: 'Empty', admitted: clockOf(o.arrivedAt) })),
    ];
    const emptiedPlates = new Set(fromWarehouse.map((t) => t.plate));
    const leaving = [
      ...seededLeaving.map((t) => (emptiedPlates.has(t.plate) ? { ...t, load: 'Empty' } : t)),
      ...fromWarehouse.filter((t) => !seededLeaving.some((s) => s.plate === t.plate)),
    ].filter((t) => !departed.includes(t.plate));

    const notify = (n) => setNotices((all) => [{ at: clock(), ...n }, ...all]);
    const createOrder = (order) => {
      const id = `RO-BEN-${String(43 + orders.length - seededOrders.length).padStart(4, '0')}`;
      setOrders((all) => [{ id, at: 'Just now', open: true, ...order }, ...all]);
      notify({
        text: order.application ? `Early re-weigh ${order.application} approved for ${order.plate}. Weigh it empty before it leaves.` : `Re-weigh ordered for ${order.plate} by the ${AUTHORITIES[order.authority]}.`,
        path: '/weighbridge', ref: id,
      });
      return id;
    };

    return {
      tareMonths,
      setTareMonths,
      tareFor,
      emptyWeighingReason,
      openOrder,
      orders,
      applications,
      leaving,
      notices,
      createOrder,
      // Saves an empty weighing as the new tare and closes any open re-weigh order. Returns the drop from the last tare.
      recordEmptyWeighing: (plate, kg) => {
        const previous = tareFor(plate).kg;
        setTares((all) => ({ ...all, [plate]: [...(all[plate] ?? []), { kg, date: new Date() }] }));
        setOrders((all) => all.map((o) => (o.plate === plate && o.open ? { ...o, open: false } : o)));
        return previous == null ? 0 : previous - kg;
      },
      recordDeparture: (plate) => setDeparted((all) => [...all, plate]),
      applyForReweigh: (app) => {
        const id = `RW-BEN-${String(18 + applications.length - seededApplications.length).padStart(4, '0')}`;
        setApplications((all) => [{ id, at: 'Just now', status: 'Waiting', decisions: { blpa: null, customs: null }, ...app }, ...all]);
        return id;
      },
      // One authority's decision on an early re-weigh. Both approvals create the order; one rejection closes it (F31).
      decideApplication: (id, authority, decision, remarks, by) => {
        const app = applications.find((a) => a.id === id);
        const decisions = { ...app.decisions, [authority]: { decision, by, remarks, at: 'Just now' } };
        const status = decision === 'Rejected' ? 'Rejected' : decisions.blpa && decisions.customs ? 'Approved' : 'Waiting';
        setApplications((all) => all.map((a) => (a.id === id ? { ...a, decisions, status } : a)));
        if (status === 'Approved') createOrder({ plate: app.plate, authority, reason: app.reason, application: app.id });
        return status;
      },
    };
  }, [tares, tareMonths, orders, applications, departed, notices, workOrders, emptied]);

  return <TruckWeightsContext.Provider value={value}>{children}</TruckWeightsContext.Provider>;
}

export const useTruckWeights = () => useContext(TruckWeightsContext);
