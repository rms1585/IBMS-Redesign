import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button } from '@mui/material';
import { useRole } from '../RoleContext';
import { createSeed, PARTIES, PORT, TARIFF } from './seed';
import { billableTonnes, dayKey, daysSince, formatBoe, searchKey } from './format';
import { usesBlocks } from './blocks/config';
import { applyLoaded, changedElsewhere, loadRecord, replaceRecord, saveRecord } from './blocks/remote';
import { FullScreen, Waiting } from './blocks/SessionGate';

// One operating record per manifest and per truck visit, built from entries each checkpoint adds (M2 4.9).
// Every screen reads and writes this store, so a hold placed anywhere shows everywhere at once.
// On the hosted site the record is shared through Blocks: every change is saved there and other
// viewers' changes arrive within POLL_MS. On the local dev server it stays in this browser.

const STORAGE_KEY = 'ibms-port-record-v1';
const DAY_MS = 86400000;
const POLL_MS = 10000;

// Stored tares (BLPA's single tare rule: valid for three months).
const TARES = { 'WB 23 D 1187': '2026-09-30', 'WB 11 C 4420': '2026-10-12', 'WB 25 A 3307': '2026-08-02' };

const loadLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* storage unavailable: start from the seed */ }
  return createSeed();
};

// ----- Pure helpers (also used by screens) -----

export const importerName = (bin) => PARTIES.importers.find((p) => p.bin === bin)?.name ?? bin;
export const agencyOf = (ain) => PARTIES.agencies.find((a) => a.ain === ain);
export const agencyName = (ain) => agencyOf(ain)?.name ?? (ain ? `AIN ${ain}` : '–');

// M-18: a C&F action is allowed only with a verified licence valid today.
function licenceProblemOf(ain, licences) {
  const a = agencyOf(ain);
  if (!a) return 'The agency is not onboarded.';
  const l = licences?.[ain] ?? a.licence;
  if (!l) return `${a.name} has no licence on record.`;
  if (l.status === 'Suspended') return `${a.name}'s licence ${l.number} is suspended.`;
  if (l.status !== 'Verified') return `${a.name}'s licence ${l.number} is not verified yet.`;
  if (l.validTo < dayKey()) return `${a.name}'s licence ${l.number} expired on ${l.validTo}.`;
  return null;
}

export const tareValid = (plate) => {
  const d = TARES[plate];
  return Boolean(d) && Date.now() - new Date(d).getTime() < 92 * DAY_MS;
};

const lineTotal = (l) => l.qty * l.rate;
export const billTotals = (bill) => {
  const net = bill.lines.reduce((s, l) => s + lineTotal(l), 0);
  const vat = Math.round(net * TARIFF.vat * 100) / 100;
  return { net, vat, total: net + vat, paid: bill.status === 'Paid' || bill.status === 'Paid, awaiting settlement' ? net + vat : 0 };
};

// ----- Provider -----

const PortContext = createContext(null);

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

export function PortProvider({ children }) {
  const { role } = useRole();
  const shared = usesBlocks();
  const online = useOnline();
  const [state, setState] = useState(() => (shared ? null : loadLocal()));
  // loading, ready, saving, resetting, save-failed, load-failed; 'local' off the hosted site.
  const [sync, setSync] = useState({ status: shared ? 'loading' : 'local', error: null });
  const stateRef = useRef(state);
  const savedRef = useRef(null); // the record as Blocks last confirmed it
  const busyRef = useRef(false); // a save or reset is talking to Blocks

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (shared) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [shared, state]);

  const loadShared = useCallback(async () => {
    setSync({ status: 'loading', error: null });
    try {
      const loaded = await loadRecord();
      applyLoaded(loaded);
      let record = loaded.record;
      if (!record) {
        record = createSeed();
        await saveRecord(record);
      }
      savedRef.current = record;
      setState(record);
      setSync({ status: 'ready', error: null });
    } catch (e) {
      setSync({ status: 'load-failed', error: e.message });
    }
  }, []);

  useEffect(() => {
    if (shared) loadShared();
  }, [shared, loadShared]);

  // Saves whatever changed since Blocks last confirmed the record; changes made while a save is in
  // flight go out in the next round.
  const flush = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      while (stateRef.current && stateRef.current !== savedRef.current) {
        const snapshot = stateRef.current;
        setSync({ status: 'saving', error: null });
        await saveRecord(snapshot);
        savedRef.current = snapshot;
      }
      setSync({ status: 'ready', error: null });
    } catch (e) {
      setSync({ status: 'save-failed', error: e.message });
    } finally {
      busyRef.current = false;
    }
  }, []);

  // Offline, changes wait on this screen; they go out as soon as the connection is back.
  useEffect(() => {
    if (shared && online && state && state !== savedRef.current) flush();
  }, [shared, online, state, flush]);

  // Other viewers' changes. Skipped while this viewer has unsaved changes, so nothing they did is lost.
  const live = shared && state !== null;
  useEffect(() => {
    if (!live) return undefined;
    const timer = setInterval(async () => {
      const settled = () => !busyRef.current && stateRef.current === savedRef.current;
      if (!settled() || !navigator.onLine || document.visibilityState !== 'visible') return;
      try {
        if (!(await changedElsewhere())) return;
        const loaded = await loadRecord();
        if (!settled() || !loaded.record) return;
        applyLoaded(loaded);
        savedRef.current = loaded.record;
        setState(loaded.record);
      } catch { /* try again on the next tick */ }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [live]);

  const resetRecord = useCallback(async () => {
    const seed = createSeed();
    if (!shared) {
      setState(seed);
      return;
    }
    busyRef.current = true;
    setSync({ status: 'resetting', error: null });
    try {
      await replaceRecord(seed);
      savedRef.current = seed;
      setState(seed);
      setSync({ status: 'ready', error: null });
    } catch (e) {
      setSync({ status: 'save-failed', error: e.message });
    } finally {
      busyRef.current = false;
    }
  }, [shared]);

  const actor = useMemo(() => ({ name: role.person, role: role.name }), [role]);

  // Every change goes through here: copy, change, log.
  const change = useCallback(
    (fn) =>
      setState((prev) => {
        const next = structuredClone(prev);
        const log = (text, record, source = 'IBMS', by = actor) => {
          next.seq += 1;
          next.events.unshift({ id: `E-${next.seq}`, at: new Date().toISOString(), text, record, by: by.name, role: by.role, source });
        };
        const id = (prefix) => {
          next.seq += 1;
          return `${prefix}-${next.seq}`;
        };
        fn(next, { log, id });
        return next;
      }),
    [actor],
  );

  const value = useMemo(() => {
    if (!state) return null;
    const s = state;
    const manifest = (id) => s.manifests.find((m) => m.id === id);
    const allLines = () => s.manifests.flatMap((m) => m.lines);
    const lineById = (id) => allLines().find((l) => l.id === id);
    const visit = (id) => s.visits.find((v) => v.id === id);
    const boe = (id) => s.boes.find((b) => b.id === id);
    const boeOfLine = (lineId) => s.boes.find((b) => b.lines.includes(lineId));
    const dr = (id) => s.deliveryRequests.find((d) => d.id === id);
    const pass = (id) => s.passes.find((p) => p.id === id);
    const bill = (id) => s.bills.find((b) => b.id === id);
    const activeHolds = s.holds.filter((h) => !h.lifted);
    const licenceOf = (ain) => s.licences?.[ain] ?? agencyOf(ain)?.licence;
    const licenceProblem = (ain) => licenceProblemOf(ain, s.licences);

    const linesOfVisit = (v) => v.manifests.flatMap((mid) => manifest(mid)?.lines ?? []);
    const declaredKgOfVisit = (v) => linesOfVisit(v).reduce((sum, l) => sum + l.declaredKg, 0);

    // Holds that touch a record, however they were placed (on the manifest, a line, the Bill of Entry, the request or the truck).
    const holdsOnManifest = (mid) => {
      const m = manifest(mid);
      const lineIds = m?.lines.map((l) => l.id) ?? [];
      const boeIds = s.boes.filter((b) => b.manifest === mid).map((b) => b.id);
      return activeHolds.filter((h) => (h.target.kind === 'manifest' && h.target.id === mid) || (h.target.kind === 'line' && lineIds.includes(h.target.id)) || (h.target.kind === 'boe' && boeIds.includes(h.target.id)));
    };
    const holdsOnVisit = (v) => {
      const own = activeHolds.filter((h) => h.target.kind === 'truck' && (h.target.id === v.id || h.target.id === v.plate));
      return [...own, ...v.manifests.flatMap(holdsOnManifest)];
    };
    const holdsOnBoe = (b) =>
      activeHolds.filter(
        (h) =>
          (h.target.kind === 'boe' && h.target.id === b.id) ||
          (h.target.kind === 'manifest' && h.target.id === b.manifest) ||
          (h.target.kind === 'line' && b.lines.includes(h.target.id)) ||
          (h.target.kind === 'dr' && s.deliveryRequests.some((d) => d.id === h.target.id && d.boe === b.id)),
      );
    const holdsOnPlate = (plate) => activeHolds.filter((h) => h.target.kind === 'truck' && h.target.id === plate);

    const boeKg = (b) => b.lines.reduce((sum, lid) => sum + receiptKgOfLine(lid), 0);
    function receiptKgOfLine(lineId) {
      const v = s.visits.find((x) => x.receipt?.lines?.[lineId]);
      return v ? v.receipt.lines[lineId].receiptKg : lineById(lineId)?.declaredKg ?? 0;
    }
    const inFlightKg = (b) =>
      s.deliveryRequests.filter((d) => d.boe === b.id && !d.closed).reduce((sum, d) => sum + d.slots.reduce((x, sl) => x + (sl.load && !pass(sl.pass)?.used ? sl.load.kg : 0), 0), 0);
    const releasedBalance = (b) => (b.release ? b.release.kg - b.deliveredKg : 0);

    const visitOfManifest = (mid) => s.visits.find((v) => v.manifests.includes(mid));

    const passStatus = (p) => {
      if (!p) return null;
      if (p.used) return 'Pass used';
      if (p.invalidatedBy) return 'Pass invalidated';
      if (dayKey(p.validDay) !== dayKey()) return 'Superseded';
      const signed = Object.values(p.approvals).filter(Boolean).length;
      return signed === 3 ? 'Pass valid' : 'Waiting approval';
    };

    // Border gate admission (Annex 7.3): the checklist the bench shows, each with its reason.
    const admissionChecks = (v) => {
      if (v.late) {
        return [
          { label: 'Manifest in IBMS', state: 'info', text: `Manifest ${v.carPassManifest} on the Car Pass is not in IBMS yet. Admit on plate and Car Pass; the truck waits in the holding area until it is matched.` },
          { label: 'Car Pass number', state: 'pass', text: v.carPass },
        ];
      }
      const lines = linesOfVisit(v);
      const untagged = lines.filter((l) => !manifest(l.manifest).tags[l.importer]);
      const checks = [
        { label: 'Manifest from BNSW', state: 'pass', text: v.manifests.join(', ') },
        untagged.length
          ? { label: 'Importer has tagged a C&F agency', state: 'fail', text: `${importerName(untagged[0].importer)} has not tagged a C&F agency to line ${untagged[0].no}. The importer tags one in its portal.` }
          : { label: 'Importer has tagged a C&F agency', state: 'pass', text: lines.map((l) => agencyName(manifest(l.manifest).tags[l.importer])).filter((x, i, a) => a.indexOf(x) === i).join(', ') },
        v.enteredBy
          ? { label: 'Truck entered by the tagged agency', state: 'pass', text: `${agencyName(v.enteredBy)}` }
          : { label: 'Truck entered by the tagged agency', state: 'fail', text: 'No tagged agency has entered this truck. It waits outside until the agency enters it.' },
        { label: 'Car Pass number matches the entry', state: v.enteredBy ? 'pass' : 'info', text: v.carPass },
        { label: 'Vehicle class', state: 'info', text: `${v.vehicleClass}, ${v.axles} axles. Count the axles before admitting.` },
      ];
      const holds = holdsOnVisit(v);
      if (holds.length) checks.push({ label: 'Holds', state: 'info', text: `${holds.length} hold attached to this visit; it travels with the truck.` });
      return checks;
    };

    // Exit check for a foreign truck leaving empty at the border (Annex 7.10, table 56).
    const borderExitChecks = (v) => {
      const aboard = v.receipt?.locked ? [] : linesOfVisit(v);
      const holds = holdsOnVisit(v).filter((h) => h.target.kind === 'truck' || h.target.kind === 'manifest');
      const needEmpty = !tareValid(v.plate) && !v.emptyWeighed;
      return [
        { label: 'Nothing left aboard', state: aboard.length ? 'fail' : 'pass', text: aboard.length ? `${aboard.length} line still aboard.` : 'Every line received or transferred.' },
        { label: 'Empty weighing', state: needEmpty ? 'fail' : 'pass', text: needEmpty ? 'No valid tare on file. Weigh the truck empty first.' : tareValid(v.plate) ? 'Stored tare still valid.' : 'Weighed empty.' },
        { label: 'No hold, BGB stop or re-weigh', state: holds.length || v.reweigh ? 'fail' : 'pass', text: holds.length ? `${holds[0].body} hold: ${holds[0].reason}` : v.reweigh ? 'Re-weigh open.' : 'None open.' },
        { label: 'Exit check service', state: s.exitCheckDown ? 'fail' : 'pass', text: s.exitCheckDown ? 'The exit check is down. Every truck is held at the barrier.' : 'Running.' },
      ];
    };

    // Exit check for a loaded local truck at the inland gate.
    const inlandExitChecks = (plate) => {
      const p = s.passes.find((x) => x.plate === plate && !x.used && !x.invalidatedBy) ?? s.passes.find((x) => x.plate === plate);
      const d = p && dr(p.dr);
      const b = d && boe(d.boe);
      const slot = d?.slots.find((sl) => sl.pass === p.id);
      const holds = b ? [...holdsOnBoe(b), ...holdsOnPlate(plate)] : holdsOnPlate(plate);
      const status = passStatus(p);
      return {
        pass: p,
        checks: [
          { label: 'Exit Pass valid today', state: status === 'Pass valid' ? 'pass' : 'fail', text: !p ? 'No Exit Pass for this plate.' : status === 'Pass valid' ? p.id : status === 'Waiting approval' ? `${p.id}: waiting for ${3 - Object.values(p.approvals).filter(Boolean).length} of 3 approvals.` : `${p.id}: ${status}.` },
          { label: 'Plate matches the locked load', state: slot?.load?.lockedAt ? 'pass' : 'fail', text: slot?.load?.lockedAt ? `${slot.load.kg.toLocaleString('en-US')} kg locked` : 'No locked load for this plate.' },
          { label: "Customs' exit note", state: b?.release?.exitNotes?.[plate] ? 'pass' : 'fail', text: b?.release?.exitNotes?.[plate] ? 'Received from BNSW' : b?.release ? 'No exit note for this truck yet. A release alone is not enough.' : 'Not released.' },
          { label: 'No hold or BGB stop', state: holds.length ? 'fail' : 'pass', text: holds.length ? `${holds[0].body} hold: ${holds[0].reason}` : 'None open.' },
          { label: 'Exit check service', state: s.exitCheckDown ? 'fail' : 'pass', text: s.exitCheckDown ? 'The exit check is down. Every truck is held at the barrier.' : 'Running.' },
        ],
      };
    };

    // Why a record is still open (Annex 7.2).
    const openReasons = (mid) => {
      const m = manifest(mid);
      const reasons = [];
      const v = visitOfManifest(mid);
      if (!v) reasons.push('No truck visit yet.');
      else if (v.stage !== 'Exited') reasons.push(`Foreign truck ${v.plate} has not exited.`);
      const importers = [...new Set(m.lines.map((l) => l.importer))];
      importers.forEach((bin) => {
        if (!m.tags[bin]) reasons.push(`${importerName(bin)} has not tagged a C&F agency.`);
      });
      m.lines.forEach((l) => {
        const b = boeOfLine(l.id);
        if (!b) reasons.push(`Line ${l.no}: no Bill of Entry recorded.`);
        else if (!b.release) reasons.push(`Line ${l.no}: awaiting Customs' release of ${formatBoe(b)}.`);
        else if (releasedBalance(b) > 0) reasons.push(`Line ${l.no}: ${releasedBalance(b).toLocaleString('en-US')} kg released but not delivered.`);
      });
      holdsOnManifest(mid).forEach((h) => reasons.push(`${h.body} hold by ${h.person}: ${h.reason}.`));
      s.bills.filter((b) => b.status === 'Payment due').forEach((bl) => {
        const d = bl.for.kind === 'dr' && dr(bl.for.id);
        if (d && boe(d.boe)?.manifest === mid) reasons.push(`Bill ${bl.paymentId} is unpaid.`);
      });
      return reasons;
    };

    // Lookup: plate, manifest, Bill of Entry, pass number or alias.
    const lookup = (q) => {
      const k = searchKey(q);
      if (k.length < 3) return [];
      const out = [];
      s.manifests.forEach((m) => {
        if (searchKey(m.id).includes(k) || searchKey(m.alias).includes(k)) out.push({ kind: 'Manifest', label: m.id, sub: m.alias, to: `/manifests/${encodeURIComponent(m.id)}` });
      });
      s.visits.forEach((v) => {
        if (searchKey(v.plate).includes(k)) out.push({ kind: 'Truck', label: v.plate, sub: v.manifests[0] ?? 'Manifest not yet available', to: v.manifests[0] ? `/manifests/${encodeURIComponent(v.manifests[0])}` : '/manifests' });
      });
      s.boes.forEach((b) => {
        if (searchKey(formatBoe(b)).includes(k) || searchKey(b.reg).includes(k)) out.push({ kind: 'Bill of Entry', label: formatBoe(b), sub: b.manifest, to: `/manifests/${encodeURIComponent(b.manifest)}` });
      });
      s.passes.forEach((p) => {
        const b = boe(dr(p.dr)?.boe);
        if (searchKey(p.id).includes(k) || searchKey(p.plate).includes(k)) out.push({ kind: 'Exit Pass', label: p.id, sub: p.plate, to: b ? `/manifests/${encodeURIComponent(b.manifest)}` : '/manifests' });
      });
      return out.slice(0, 8);
    };

    // ----- Actions -----

    const invalidatePassesFor = (next, hold) => {
      next.passes.forEach((p) => {
        if (p.used || p.invalidatedBy) return;
        const d = next.deliveryRequests.find((x) => x.id === p.dr);
        const b = d && next.boes.find((x) => x.id === d.boe);
        const t = hold.target;
        const hit =
          (t.kind === 'truck' && t.id === p.plate) ||
          (t.kind === 'dr' && t.id === p.dr) ||
          (b && ((t.kind === 'boe' && t.id === b.id) || (t.kind === 'manifest' && t.id === b.manifest) || (t.kind === 'line' && b.lines.includes(t.id))));
        if (hit) p.invalidatedBy = hold.id;
      });
    };

    const actions = {
      reset: resetRecord,

      // A list a screen keeps for itself (rail wagons, users, …), saved in the record under its own name.
      setStored: (name, initial, update) =>
        change((n) => {
          const current = n[name] === undefined ? structuredClone(initial) : n[name];
          n[name] = typeof update === 'function' ? update(current) : update;
        }),

      // Importer portal (M-15)
      tagAgency: (mid, bin, ain) =>
        change((n, { log }) => {
          const m = n.manifests.find((x) => x.id === mid);
          const prev = m.tags[bin];
          m.tags[bin] = ain;
          log(prev ? `${importerName(bin)} re-tagged its lines on ${mid} from ${agencyName(prev)} to ${agencyName(ain)}; ${agencyName(prev)} lost access` : `${importerName(bin)} tagged ${agencyName(ain)} to its lines on ${mid}`, mid);
        }),

      // C&F portal (M-01)
      enterTruck: ({ plate, vehicleClass, axles, driverName, driverId, carPass, mid, ain }) =>
        change((n, { log, id }) => {
          const existing = n.visits.find((v) => v.plate === plate && v.stage === 'Expected');
          if (existing) {
            Object.assign(existing, { vehicleClass, axles, carPass, driver: { name: driverName, nid: driverId }, enteredBy: ain, enteredAt: new Date().toISOString() });
            if (!existing.manifests.includes(mid)) existing.manifests.push(mid);
          } else {
            n.visits.push({ id: id('V-26'), plate, kind: 'foreign', vehicleClass, axles, driver: { name: driverName, nid: driverId }, carPass, manifests: [mid], enteredBy: ain, enteredAt: new Date().toISOString(), stage: 'Expected', events: {} });
          }
          log(`Truck ${plate} entered for ${mid} with Car Pass ${carPass}`, mid, 'Keyed by the agency');
        }),

      recordBoe: ({ mid, bin, ain, lineIds, reg, date }) =>
        change((n, { log, id }) => {
          const down = n.bnswDown;
          n.boes.push({ id: id('BOE'), type: 'C', office: PORT.stationCode, reg, date, manifest: mid, importer: bin, agency: ain, lines: lineIds, recordedAt: new Date().toISOString(), source: down ? 'Keyed by the agency' : 'BNSW', release: null, deliveredKg: 0, closed: false });
          log(`Bill of Entry C ${PORT.stationCode} ${reg} ${date} recorded against ${lineIds.length} line of ${mid}${down ? ' (keyed, BNSW down)' : '; BNSW confirmed the importer BIN and agency AIN'}`, mid, down ? 'Keyed by the agency' : 'BNSW');
        }),

      raiseDeliveryRequest: ({ boeId, kg, ceiling }) =>
        change((n, { log, id }) => {
          const b = n.boes.find((x) => x.id === boeId);
          const drId = `DR-2026-${String(n.seq + 1).padStart(4, '0')}`;
          n.seq += 1;
          const firstBill = !n.deliveryRequests.some((d) => d.boe === boeId);
          const remainingT = billableTonnes(b.release.kg - b.deliveredKg);
          const v = n.visits.find((x) => x.manifests.includes(b.manifest));
          const days = Math.max(1, daysSince(v?.receipt?.at));
          const lines = [
            { what: 'Storage', qty: remainingT * days, unit: 'tonne-day', rate: TARIFF.rates.storage.rate, note: `${remainingT} t remaining, ${days} days` },
            { what: 'Handling', qty: billableTonnes(kg), unit: 'tonne', rate: TARIFF.rates.handling.rate },
            { what: 'Entrance fee, local truck', qty: ceiling, unit: 'truck', rate: TARIFF.rates.entrance.rate },
          ];
          if (firstBill && v) {
            const nights = Math.max(0, daysSince(v.gateIn?.at, v.exitAt) - 1);
            lines.push({ what: `Truck charges, ${v.plate} (entry gate, weighbridge, ${nights} night${nights === 1 ? '' : 's'})`, qty: 1, unit: 'visit', rate: TARIFF.rates.gateEntry.rate + TARIFF.rates.weighbridge.rate + nights * TARIFF.rates.overnight.rate });
          }
          const billId = id('BILL');
          n.bills.push({ id: billId, paymentId: `PAY-601-26-${String(n.seq).padStart(4, '0')}`, party: b.agency, for: { kind: 'dr', id: drId }, raisedAt: new Date().toISOString(), lines, status: 'Payment due' });
          n.deliveryRequests.unshift({ id: drId, boe: boeId, day: new Date().toISOString(), kg, ceiling, agency: b.agency, raisedAt: new Date().toISOString(), bill: billId, slots: Array.from({ length: ceiling }, () => ({ plate: null, entryPass: null, enteredAt: null, load: null, pass: null })), closed: false });
          log(`Delivery Request ${drId} raised on ${formatBoe(b)}: ${kg.toLocaleString('en-US')} kg today, up to ${ceiling} truck${ceiling === 1 ? '' : 's'}; bill raised`, b.manifest, 'Keyed by the agency');
        }),

      payBill: (billId) =>
        change((n, { log }) => {
          const bl = n.bills.find((x) => x.id === billId);
          bl.status = 'Paid';
          bl.paidAt = new Date().toISOString();
          bl.provider = 'Online payment gateway, provider confirmation received';
          log(`Payment confirmed by the provider for ${bl.paymentId}`, bl.for.id, 'Payment provider', { name: 'Payment provider', role: 'Payment service' });
        }),

      bindPlate: (drId, slotIdx, plate) =>
        change((n, { log }) => {
          const d = n.deliveryRequests.find((x) => x.id === drId);
          d.slots[slotIdx].plate = plate;
          log(`Plate ${plate} keyed against slot ${slotIdx + 1} of ${drId}`, drId, 'Keyed by the agency');
        }),

      signPass: (passId, slot) =>
        change((n, { log }) => {
          const p = n.passes.find((x) => x.id === passId);
          p.approvals[slot] = { name: actor.name, role: actor.role, at: new Date().toISOString(), device: slot === 'shed' ? 'Shed handheld' : 'Phone, second sign-in factor' };
          log(`${actor.role} signed Exit Pass ${passId} for ${p.plate}`, passId);
        }),

      proposeTruckChange: (passId, newPlate, reason) =>
        change((n, { log, id }) => {
          const p = n.passes.find((x) => x.id === passId);
          n.truckChanges.unshift({ id: id('TC'), pass: passId, from: p.plate, to: newPlate, reason, proposedBy: actor.name, at: new Date().toISOString(), shed: null, aro: null, done: false });
          log(`Truck change proposed on ${passId}: ${p.plate} to ${newPlate}. Reason: ${reason}`, passId);
        }),

      approveTruckChange: (tcId, slot) =>
        change((n, { log }) => {
          const tc = n.truckChanges.find((x) => x.id === tcId);
          tc[slot] = { name: actor.name, at: new Date().toISOString() };
          if (tc.shed && tc.aro && !tc.done) {
            tc.done = true;
            const p = n.passes.find((x) => x.id === tc.pass);
            const d = n.deliveryRequests.find((x) => x.id === p.dr);
            d.slots.forEach((sl) => { if (sl.plate === tc.from) sl.plate = tc.to; });
            p.plate = tc.to;
          }
          log(`${actor.role} approved the truck change ${tc.from} to ${tc.to}`, tc.pass);
        }),

      // Gates (M-03, M-10)
      admitAtBorder: (visitId, { typedReason } = {}) =>
        change((n, { log }) => {
          const v = n.visits.find((x) => x.id === visitId);
          v.gateIn = { at: new Date().toISOString(), gate: 'Border gate 1', lane: 'Lane 2', by: actor.name, typedReason };
          v.stage = v.late ? 'Manifest not yet available' : 'Admitted';
          v.charges = [{ what: 'Entry gate, foreign truck', qty: 1, rate: TARIFF.rates.gateEntry.rate }];
          log(v.late ? `Truck ${v.plate} admitted on plate and Car Pass ${v.carPass}; manifest not yet available` : `Truck ${v.plate} admitted at Border gate 1, Lane 2`, v.manifests[0] ?? v.carPassManifest, typedReason ? 'Typed by hand' : 'Device');
        }),

      exitAtBorder: (visitId) =>
        change((n, { log }) => {
          const v = n.visits.find((x) => x.id === visitId);
          v.stage = 'Exited';
          v.exitAt = new Date().toISOString();
          log(`Foreign truck ${v.plate} left empty through the border gate; visit closed`, v.manifests[0], 'Device');
        }),

      admitLocal: (plate) =>
        change((n, { log }) => {
          const d = n.deliveryRequests.find((x) => x.slots.some((sl) => sl.plate === plate && !sl.enteredAt));
          const sl = d.slots.find((x) => x.plate === plate && !x.enteredAt);
          n.seq += 1;
          sl.entryPass = `EP-26-${55000 + n.seq}`;
          sl.enteredAt = new Date().toISOString();
          log(`Local truck ${plate} admitted on Entry Pass ${sl.entryPass} against ${d.id}`, d.id, 'Device');
        }),

      exitInland: (passId) =>
        change((n, { log }) => {
          const p = n.passes.find((x) => x.id === passId);
          p.used = new Date().toISOString();
          const d = n.deliveryRequests.find((x) => x.id === p.dr);
          const b = n.boes.find((x) => x.id === d.boe);
          b.deliveredKg += p.kg;
          if (d.slots.every((sl) => !sl.plate || (sl.pass && n.passes.find((x) => x.id === sl.pass)?.used))) d.closed = true;
          if (b.release && b.deliveredKg >= b.release.kg) b.closed = true;
          log(`Truck ${p.plate} left through the inland gate on ${p.id}; pass consumed`, b.manifest, 'Device');
        }),

      // Weighbridge (M-04)
      captureWeight: (visitId, kg, { typedReason, empty } = {}) =>
        change((n, { log }) => {
          const v = n.visits.find((x) => x.id === visitId);
          if (empty) {
            v.emptyWeighed = true;
            v.tareKg = kg;
            log(`Empty weighing of ${v.plate}: ${kg.toLocaleString('en-US')} kg; new tare stored`, v.manifests[0], typedReason ? 'Typed by hand' : 'Device');
            return;
          }
          const declaredKg = v.manifests.flatMap((mid) => n.manifests.find((m) => m.id === mid)?.lines ?? []).reduce((sum, l) => sum + l.declaredKg, 0);
          const overTolerance = !v.late && declaredKg > 0 && Math.abs(kg - declaredKg) / declaredKg > PORT.tolerancePct / 100;
          v.weigh = { kg, at: new Date().toISOString(), scale: 'Scale 2', source: typedReason ? 'Typed by hand' : 'Device', typedReason, declaredKg, overTolerance, toleranceVersion: PORT.toleranceVersion };
          v.stage = v.late ? 'Manifest not yet available' : 'Weighed';
          v.charges = [...(v.charges ?? []), { what: 'Weighbridge', qty: 1, rate: TARIFF.rates.weighbridge.rate }];
          log(`Weight captured for ${v.plate}: ${kg.toLocaleString('en-US')} kg${overTolerance ? `, Weight over tolerance (declared ${declaredKg.toLocaleString('en-US')} kg)` : ''}`, v.manifests[0] ?? v.carPassManifest, typedReason ? 'Typed by hand' : 'Device');
        }),

      // Posting (M-05)
      sendToHolding: (visitId, reason) =>
        change((n, { log }) => {
          const v = n.visits.find((x) => x.id === visitId);
          v.holding = { since: new Date().toISOString(), reason };
          log(`${v.plate} placed in the holding area: ${reason}`, v.manifests[0] ?? v.carPassManifest);
        }),
      callForward: (visitId) =>
        change((n, { log }) => {
          const v = n.visits.find((x) => x.id === visitId);
          v.holding = null;
          log(`${v.plate} called forward from the holding area; ${agencyName(v.enteredBy)} alerted`, v.manifests[0]);
        }),
      proposePosting: (visitId, shed) =>
        change((n, { log }) => {
          const v = n.visits.find((x) => x.id === visitId);
          v.posting = { shed, accepted: null, proposedBy: actor.name, at: new Date().toISOString() };
          v.holding = null;
          log(`Posting proposed for ${v.plate}: ${shed}`, v.manifests[0]);
        }),

      // Warehousing (M-06)
      decidePosting: (visitId, accept, reason) =>
        change((n, { log }) => {
          const v = n.visits.find((x) => x.id === visitId);
          v.posting.accepted = accept;
          v.posting.by = actor.name;
          v.posting.reason = reason;
          if (accept) v.stage = 'Posted';
          log(accept ? `${v.posting.shed} accepted the posting of ${v.plate}; drop point sent to the agency` : `${v.posting.shed} rejected the posting of ${v.plate}: ${reason}`, v.manifests[0]);
        }),
      tagAssociation: (visitId, association) =>
        change((n, { log }) => {
          const v = n.visits.find((x) => x.id === visitId);
          v.receipt = { ...(v.receipt ?? {}), association };
          log(`${association} tagged to the unloading of ${v.plate}; association notified`, v.manifests[0]);
        }),
      setJobTimes: (visitId, start, end) =>
        change((n, { log }) => {
          const v = n.visits.find((x) => x.id === visitId);
          v.receipt = { ...(v.receipt ?? {}), times: { start, end, by: actor.name } };
          log(`Warehouse manager entered unloading times for ${v.plate}`, v.manifests[0]);
        }),
      lockReceipt: (visitId, counts) =>
        change((n, { log }) => {
          const v = n.visits.find((x) => x.id === visitId);
          const lines = v.manifests.flatMap((mid) => n.manifests.find((m) => m.id === mid).lines);
          const single = lines.length === 1;
          const out = {};
          lines.forEach((l) => {
            // Single line: the higher of declared and weighbridge net. Several lines: each keeps its own declared weight.
            const receiptKg = single ? Math.max(l.declaredKg, v.weigh?.kg ?? 0) : l.declaredKg;
            out[l.id] = { packages: counts[l.id]?.packages ?? l.packages, counted: counts[l.id]?.counted ?? true, receiptKg };
          });
          const diffKg = single ? 0 : (v.weigh?.kg ?? 0) - lines.reduce((sum, l) => sum + l.declaredKg, 0);
          v.receipt = { ...(v.receipt ?? {}), lines: out, locked: true, by: actor.name, at: new Date().toISOString(), truckDiffKg: diffKg };
          v.stage = 'Unloaded';
          log(`Receipt of ${v.plate} recorded and locked${diffKg ? `; truck-level difference of ${diffKg.toLocaleString('en-US')} kg flagged, not spread over the lines` : ''}`, v.manifests[0]);
        }),
      lockLoad: (drId, slotIdx, kg) =>
        change((n, { log }) => {
          const d = n.deliveryRequests.find((x) => x.id === drId);
          const sl = d.slots[slotIdx];
          const b = n.boes.find((x) => x.id === d.boe);
          const l = n.manifests.find((m) => m.id === b.manifest).lines.find((x) => x.id === b.lines[0]);
          const passId = `BEN-PASS-${String(4400 + n.seq).padStart(6, '0')}`;
          n.seq += 1;
          sl.load = { kg, lockedAt: new Date().toISOString(), lockedBy: actor.name, aro: null };
          sl.pass = passId;
          n.passes.unshift({ id: passId, dr: drId, plate: sl.plate, goods: l.goods, kg, validDay: new Date().toISOString(), approvals: { shed: { name: actor.name, role: actor.role, at: new Date().toISOString(), device: 'Shed handheld' }, aro: null, signer: null }, used: null, invalidatedBy: null });
          log(`Load of ${kg.toLocaleString('en-US')} kg locked on ${sl.plate}; Exit Pass ${passId} prepared, approved by the shed in-charge`, b.manifest);
        }),
      aroCoApprove: (drId, slotIdx) =>
        change((n, { log }) => {
          const d = n.deliveryRequests.find((x) => x.id === drId);
          const sl = d.slots[slotIdx];
          sl.load.aro = { name: actor.name, at: new Date().toISOString() };
          const p = n.passes.find((x) => x.id === sl.pass);
          p.approvals.aro = { name: actor.name, role: actor.role, at: new Date().toISOString(), device: 'Phone, second sign-in factor' };
          log(`Customs ARO co-approved the load on ${sl.plate} and signed Exit Pass ${p.id}`, drId);
        }),

      // Holds (M-20 and every agency)
      placeHold: ({ target, body, reason, ref, source = 'IBMS', person }) =>
        change((n, { log, id }) => {
          const hold = { id: id('H'), target, body, person: person ?? actor.name, reason, ref, source, at: new Date().toISOString(), lifted: null };
          n.holds.unshift(hold);
          invalidatePassesFor(n, hold);
          log(`${body} hold placed on ${target.kind === 'line' ? 'line' : target.kind === 'boe' ? 'Bill of Entry' : target.kind} ${target.label ?? target.id}: ${reason}`, target.manifest ?? target.id, source === 'BNSW' ? 'BNSW' : 'IBMS');
        }),
      liftHold: (holdId, ref) =>
        change((n, { log }) => {
          const h = n.holds.find((x) => x.id === holdId);
          h.lifted = { by: actor.name, at: new Date().toISOString(), ref };
          log(`${h.body} hold lifted on ${h.target.label ?? h.target.id}. Passes it invalidated stay invalid.`, h.target.manifest ?? h.target.id);
        }),

      flagReweigh: (visitId, reason) =>
        change((n, { log }) => {
          const v = n.visits.find((x) => x.id === visitId);
          v.reweigh = { reason, by: actor.name, role: actor.role, at: new Date().toISOString() };
          v.emptyWeighed = false;
          log(`Re-weigh flagged on ${v.plate} by ${actor.role}: ${reason}. An empty weighing is now mandatory.`, v.manifests[0]);
        }),
      recordInspection: (visitId, outcome) =>
        change((n, { log }) => {
          const v = n.visits.find((x) => x.id === visitId);
          v.weigh.inspection = { outcome, by: actor.name, at: new Date().toISOString() };
          log(`Inspection outcome on the weight flag of ${v.plate}: ${outcome}`, v.manifests[0]);
        }),

      // Billing (M-09): BNSW-down mode, the revenue desk keys the release from Customs' reference.
      keyReleaseFromReference: (boeId, ref) =>
        change((n, { log }) => {
          const b = n.boes.find((x) => x.id === boeId);
          b.release = { at: new Date().toISOString(), source: "Keyed from Customs' reference", ref, kg: b.lines.reduce((sum, lid) => sum + (n.visits.find((v) => v.receipt?.lines?.[lid])?.receipt.lines[lid].receiptKg ?? 0), 0), exitNotes: {} };
          log(`Release keyed from Customs' reference ${ref} for ${formatBoe(b)}; to be reconciled when BNSW returns`, b.manifest, "Keyed from Customs' reference");
        }),

      // Licences (M-18): a new document is unverified until a named verifier checks it.
      recordLicence: (ain, { number, validTo }) =>
        change((n, { log }) => {
          n.licences = n.licences ?? {};
          const prev = n.licences[ain] ?? agencyOf(ain).licence;
          n.licences[ain] = { ...prev, number, validTo, status: 'Unverified', verifiedBy: null };
          log(`New licence evidence recorded for ${agencyName(ain)}: ${number}, valid to ${validTo}. Unverified until checked.`, ain);
        }),
      verifyLicence: (ain) =>
        change((n, { log }) => {
          n.licences = n.licences ?? {};
          const prev = n.licences[ain] ?? agencyOf(ain).licence;
          n.licences[ain] = { ...prev, status: 'Verified', verifiedBy: `${actor.name}, ${actor.role}` };
          log(`Licence ${prev.number} of ${agencyName(ain)} verified`, ain);
        }),

      // Corrections (M-13)
      requestCorrection: ({ record, field, from, to, reason }) =>
        change((n, { log, id }) => {
          n.corrections.unshift({ id: id('COR'), record, field, from, to, reason, by: actor.name, role: actor.role, at: new Date().toISOString(), decision: null });
          log(`Correction requested on ${record}: ${field} from ${from} to ${to}. Reason: ${reason}`, record);
        }),
      decideCorrection: (corId, approve, remarks) =>
        change((n, { log }) => {
          const c = n.corrections.find((x) => x.id === corId);
          c.decision = { approve, remarks, by: actor.name, at: new Date().toISOString() };
          log(`Correction on ${c.record} ${approve ? 'approved' : 'rejected'}${remarks ? `: ${remarks}` : ''}`, c.record);
        }),

      // BNSW simulator (M-14). Demo only; every message says it is simulated.
      bnsw: {
        setDown: (down) =>
          change((n, { log }) => {
            n.bnswDown = down;
            log(down ? 'BNSW down (simulated). The port works in BNSW-down mode.' : 'BNSW back (simulated). Keyed values are compared with BNSW.', 'BNSW', 'BNSW', { name: 'BNSW simulator', role: 'Demo tool' });
            if (!down) {
              n.boes.forEach((b) => {
                if (b.source === 'Keyed by the agency') b.source = 'Keyed, confirmed by BNSW';
              });
            }
          }),
        setExitCheckDown: (down) =>
          change((n, { log }) => {
            n.exitCheckDown = down;
            log(down ? 'Exit check down (simulated). Every truck at the exit lanes is held.' : 'Exit check running again (simulated).', 'Exit check', 'IBMS', { name: 'BNSW simulator', role: 'Demo tool' });
          }),
        sendManifest: (mid) =>
          change((n, { log }) => {
            const idx = n.pendingManifests.findIndex((m) => m.id === mid);
            const m = { ...n.pendingManifests[idx], receivedAt: new Date().toISOString() };
            n.pendingManifests.splice(idx, 1);
            n.manifests.unshift(m);
            const v = n.visits.find((x) => x.late && x.carPassManifest === mid);
            if (v) {
              v.manifests = [mid];
              v.late = false;
              v.enteredBy = m.tags[m.lines[0].importer] ?? null;
              if (v.stage === 'Manifest not yet available') v.stage = v.weigh ? 'Weighed' : 'Admitted';
              if (v.weigh) {
                const declaredKg = m.lines.reduce((sum, l) => sum + l.declaredKg, 0);
                v.weigh.declaredKg = declaredKg;
                v.weigh.overTolerance = Math.abs(v.weigh.kg - declaredKg) / declaredKg > PORT.tolerancePct / 100;
              }
            }
            log(`Manifest ${mid} received from BNSW (simulated)${v ? `; waiting visit ${v.plate} tied to it` : ''}`, mid, 'BNSW', { name: 'BNSW', role: 'Customs system' });
          }),
        sendRelease: (boeId) =>
          change((n, { log }) => {
            const b = n.boes.find((x) => x.id === boeId);
            n.seq += 1;
            const kg = b.lines.reduce((sum, lid) => sum + (n.visits.find((v) => v.receipt?.lines?.[lid])?.receipt.lines[lid].receiptKg ?? 0), 0);
            b.release = { at: new Date().toISOString(), source: 'BNSW', ref: `RO 601/2026/${19000 + n.seq}`, kg, exitNotes: b.release?.exitNotes ?? {} };
            log(`Customs release received for ${formatBoe(b)}: ${kg.toLocaleString('en-US')} kg (simulated)`, b.manifest, 'BNSW', { name: 'BNSW', role: 'Customs system' });
          }),
        sendExitNote: (boeId, plate) =>
          change((n, { log }) => {
            const b = n.boes.find((x) => x.id === boeId);
            b.release.exitNotes[plate] = new Date().toISOString();
            log(`Customs exit note received for ${plate} on ${formatBoe(b)} (simulated)`, b.manifest, 'BNSW', { name: 'BNSW', role: 'Customs system' });
          }),
        sendHold: (target, reason) =>
          change((n, { log, id }) => {
            const hold = { id: id('H'), target, body: 'Customs', person: 'Customs (ASYCUDA)', reason, ref: `ASY/HOLD/${n.seq}`, source: 'BNSW', at: new Date().toISOString(), lifted: null };
            n.holds.unshift(hold);
            invalidatePassesFor(n, hold);
            log(`Customs hold received from BNSW on ${target.label ?? target.id}: ${reason} (simulated)`, target.manifest ?? target.id, 'BNSW', { name: 'BNSW', role: 'Customs system' });
          }),
      },
    };

    return {
      state: s,
      actor,
      port: PORT,
      tariff: TARIFF,
      parties: PARTIES,
      manifest,
      lineById,
      visit,
      boe,
      boeOfLine,
      dr,
      pass,
      bill,
      activeHolds,
      licenceOf,
      licenceProblem,
      linesOfVisit,
      declaredKgOfVisit,
      holdsOnManifest,
      holdsOnVisit,
      holdsOnBoe,
      holdsOnPlate,
      boeKg,
      inFlightKg,
      releasedBalance,
      visitOfManifest,
      passStatus,
      admissionChecks,
      borderExitChecks,
      inlandExitChecks,
      openReasons,
      lookup,
      receiptKgOfLine,
      ...actions,
      sync: { ...sync, shared, online, retry: flush },
    };
  }, [state, change, actor, resetRecord, sync, shared, online, flush]);

  if (!state) {
    if (sync.status === 'load-failed') {
      return (
        <FullScreen>
          <Alert severity="error">{`Couldn't load the demo port from Blocks. ${online ? sync.error ?? '' : 'You are offline.'}`}</Alert>
          <Button variant="contained" onClick={loadShared}>Try again</Button>
        </FullScreen>
      );
    }
    return <Waiting text="Loading the demo port" />;
  }
  return <PortContext.Provider value={value}>{children}</PortContext.Provider>;
}

export const usePort = () => useContext(PortContext);

// useState for data a screen owns, kept in the shared record so it survives a reload and reaches every
// viewer. `initial` is what the screen shows until someone changes it, and again after Reset demo.
export function useStoredState(name, initial) {
  const { state, setStored } = usePort();
  const value = state[name] === undefined ? initial : state[name];
  const set = useCallback((update) => setStored(name, initial, update), [setStored, name, initial]);
  return [value, set];
}
