import { usePort, useStoredState } from './PortStore';

// Plates typed by hand at an exit lane (EXC-01, SV-8): each keeps the camera still, the typed plate, the reason,
// the operator and the time. The supervisor reviews the day's list and marks each one reviewed or a mismatch; a
// mismatch is flagged to the port in-charge.
const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();
const SEED = [
  { id: 'TP-1', plate: 'Jessore-TA 11-4418', typed: 'Jessore-TA 11-4418', lane: 'Inland gate 1 · Lane 4', reason: 'Mud on the plate', operator: 'Ruhul Amin', at: hoursAgo(5), still: 'IG1-L4-0612.jpg', review: null },
  { id: 'TP-2', plate: 'Khulna-TA 12-4410', typed: 'Khulna-TA 12-4416', lane: 'Inland gate 1 · Lane 3', reason: 'Reader timed out', operator: 'Ruhul Amin', at: hoursAgo(2.5), still: 'IG1-L3-0907.jpg', review: null },
];

export function useTypedPlates() {
  const p = usePort();
  const [list, setList] = useStoredState('typedExitPlates', SEED);
  const record = (entry) => {
    setList((l) => [...l, { id: `TP-${l.length + 1}`, at: new Date().toISOString(), operator: p.actor.name, review: null, ...entry }]);
    p.logEvent(`Plate ${entry.typed} typed by hand at ${entry.lane}: ${entry.reason}`, entry.typed, 'Typed by hand');
  };
  const review = (id, mismatch, reason) => {
    const e = list.find((x) => x.id === id);
    setList((l) => l.map((x) => (x.id === id ? { ...x, review: { mismatch, reason, by: p.actor.name, at: new Date().toISOString() } } : x)));
    p.logEvent(mismatch ? `Typed plate ${e.typed} marked a mismatch: ${reason}. Flagged to the port in-charge` : `Typed plate ${e.typed} reviewed`, e.typed);
  };
  return { list, record, review };
}
