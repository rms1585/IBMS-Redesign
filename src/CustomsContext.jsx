import { createContext, useContext, useMemo, useState } from 'react';
import { currentUser } from './data/mock';
import { useManifests } from './ManifestsContext';
import { useCfAlerts } from './CfAlertsContext';
import { useAudit } from './AuditContext';

// One Customs status per consignment, read by every screen so none can disagree (Phase 9, #80). In IBMS each step
// arrives through BNSW; here a demo control stands in for it. Demo state only: it resets on refresh.
const CustomsContext = createContext(null);

export const STEP = { filed: 'Bill of Entry filed', examined: 'Examined', assessed: 'Assessed', paid: 'Duty paid', released: 'Released' };
const examinedChannels = ['Yellow', 'Red'];
const clock = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const bnsw = (name, at) => ({ name, at, source: 'BNSW' });
const seeded = {
  'BEN-IGM-2026-08841': { boe: 'C-48102', channel: 'Green', steps: [bnsw(STEP.filed, '26 Oct, 16:40'), bnsw(STEP.assessed, '26 Oct, 17:55'), bnsw(STEP.paid, '27 Oct, 07:30'), bnsw(STEP.released, '27 Oct, 07:52')] },
  'BEN-IGM-2026-08852': { boe: 'C-48177', channel: 'Green', steps: [bnsw(STEP.filed, '27 Oct, 08:10'), bnsw(STEP.assessed, '27 Oct, 09:05'), bnsw(STEP.paid, '27 Oct, 09:48')] },
  'BEN-IGM-2026-08860': { boe: 'C-48190', channel: 'Red', steps: [bnsw(STEP.filed, '26 Oct, 15:20')], hold: { at: 'Yesterday', reason: 'Red channel: goods held for physical examination' } },
  'BEN-IGM-2026-08799': { boe: 'C-47950', channel: 'Green', steps: [bnsw(STEP.filed, '25 Oct, 11:02'), bnsw(STEP.assessed, '25 Oct, 12:15'), bnsw(STEP.paid, '25 Oct, 14:40'), bnsw(STEP.released, '25 Oct, 15:05')] },
  'BEN-EGM-2026-01204': { boe: null, channel: null, steps: [bnsw(STEP.released, '27 Oct, 08:20')] },
  'BEN-IGM-2026-08829': { boe: 'C-48211', channel: 'Green', steps: [bnsw(STEP.filed, '27 Oct, 09:30')] },
  'BEN-IGM-2026-08866': { boe: 'C-48230', channel: 'Yellow', steps: [bnsw(STEP.filed, '27 Oct, 09:44')] },
};

// A paper release waits for a second officer in the Inbox before it counts (F5, #84).
const seededPaper = [
  { id: 'REQ-1046', manifest: 'BEN-IGM-2026-08852', ro: 'RO-BEN-2026-1187', reason: 'BNSW feed down since 09:50, consent ref CNS-118', requester: 'Shahidul Islam', at: '27 Oct, 10:33', status: 'Waiting' },
];

// The next step BNSW would send, or null when there is nothing left to send.
const nextStep = (record) => {
  const names = record.steps.map((s) => s.name);
  if (names.includes(STEP.released)) return null;
  if (!record.boe) return STEP.filed;
  if (examinedChannels.includes(record.channel) && !names.includes(STEP.examined)) return STEP.examined;
  if (!names.includes(STEP.assessed)) return STEP.assessed;
  if (!names.includes(STEP.paid)) return STEP.paid;
  return STEP.released;
};

// Everything a screen shows about one consignment's Customs status.
const describe = (record, paper) => {
  const last = record.steps[record.steps.length - 1];
  const released = record.steps.some((s) => s.name === STEP.released);
  const onHold = Boolean(record.hold);
  let label = 'No Bill of Entry';
  if (onHold) label = 'On hold';
  else if (released) label = 'Released';
  else if (last) label = last.name;
  return {
    ...record,
    released,
    onHold,
    label,
    color: onHold ? 'error' : released ? 'success' : 'warning',
    next: onHold ? null : nextStep(record),
    paperRequest: paper.find((p) => p.status === 'Waiting'),
  };
};

export function CustomsProvider({ children }) {
  const { manifests } = useManifests();
  const { addAlert } = useCfAlerts();
  const { addEvent } = useAudit();
  const [records, setRecords] = useState(seeded);
  const [paper, setPaper] = useState(seededPaper);
  const [notices, setNotices] = useState([]);

  const value = useMemo(() => {
    const recordOf = (id) => records[id] ?? { boe: null, channel: null, steps: [] };
    const customsFor = (id) => describe(recordOf(id), paper.filter((p) => p.manifest === id));
    const agencyOf = (id) => manifests.find((m) => m.id === id)?.agency;
    const save = (id, change) => setRecords((all) => ({ ...all, [id]: change(all[id] ?? { boe: null, channel: null, steps: [] }) }));

    // A release or hold reaches the C&F agency and the BLPA bell, and the audit log (#82).
    const announce = (id, text) => {
      setNotices((all) => [{ at: clock(), text, path: '/manifests', ref: id }, ...all]);
      addAlert({ agency: agencyOf(id), manifest: id, text });
    };
    const addStep = (id, step) => {
      save(id, (r) => ({
        ...r,
        ...(step.name === STEP.filed ? { boe: `C-${48300 + Object.keys(records).length}`, channel: 'Green' } : {}),
        steps: [...r.steps, step],
      }));
      if (step.name === STEP.released) {
        announce(id, step.source === 'Paper'
          ? `Customs release for ${id} recorded from paper Release Order ${step.ref}. The goods can be delivered.`
          : `Customs released ${id}. The goods can be delivered.`);
      }
    };

    return {
      customsFor,
      notices,
      paperRequests: paper,
      // Demo stand-in for BNSW sending the next status.
      receiveNext: (id) => {
        const name = nextStep(recordOf(id));
        if (!name) return null;
        addStep(id, { name, at: clock(), source: 'BNSW' });
        addEvent({ actor: 'BNSW', role: 'System', module: 'Customs', type: 'Record', text: `${name} for ${id} received from BNSW` });
        return name;
      },
      placeHold: (id, reason) => {
        save(id, (r) => ({ ...r, hold: { at: clock(), reason } }));
        announce(id, `Customs hold placed on ${id} (${reason}). Delivery and departure are blocked until it is lifted.`);
        addEvent({ actor: 'BNSW', role: 'System', module: 'Customs', type: 'Exception', text: `Customs hold placed on ${id}: ${reason}` });
      },
      liftHold: (id) => {
        save(id, (r) => ({ ...r, hold: null }));
        announce(id, `Customs hold lifted on ${id}.`);
        addEvent({ actor: 'BNSW', role: 'System', module: 'Customs', type: 'Record', text: `Customs hold lifted on ${id}` });
      },
      requestPaperRelease: (id, ro, reason) => {
        const reqId = `REQ-${1048 + paper.length - seededPaper.length}`;
        setPaper((all) => [{ id: reqId, manifest: id, ro, reason, requester: currentUser.name, at: 'Just now', status: 'Waiting', mine: true }, ...all]);
        addEvent({ actor: currentUser.name, role: currentUser.role, module: 'Customs', type: 'Exception', text: `Asked to record the Customs release of ${id} from paper Release Order ${ro} (${reason})` });
        return reqId;
      },
      // The second officer's decision. Only an approval records the release, marked as from paper.
      decidePaperRelease: (reqId, decision, remarks) => {
        const req = paper.find((p) => p.id === reqId);
        setPaper((all) => all.map((p) => (p.id === reqId ? { ...p, status: decision, decider: currentUser.name, remarks } : p)));
        if (decision === 'Approved') addStep(req.manifest, { name: STEP.released, at: clock(), source: 'Paper', ref: req.ro, by: currentUser.name });
        return req;
      },
    };
  }, [records, paper, notices, manifests, addAlert, addEvent]);

  return <CustomsContext.Provider value={value}>{children}</CustomsContext.Provider>;
}

export const useCustoms = () => useContext(CustomsContext);
