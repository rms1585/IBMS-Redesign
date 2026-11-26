import { agencyName, importerName, usePort, useStoredState } from './PortStore';

// Transfer requests (M-01, M-07, M-10): the demo request plus every request a C&F agency raises in its portal
// ('transferRequests'). Transshipment works them and the inland gate admits their receiving trucks.
const NO_LIST = [];

export const DEMO_REQUEST = {
  id: 'TR-2026-0088', manifest: '2026/601/08841', importer: 'Delta Foods Ltd', agency: 'Jamuna C&F Services',
  foreign: 'WB 37 C 5512', line: 'Line 2: Lentils, red, split', totalKg: 8000,
  slots: ['Jessore-TA 11-4418', 'Jessore-TA 11-5021', null], demo: true,
};

export function useTransferRequests() {
  const p = usePort();
  const [raised, setRaised] = useStoredState('transferRequests', NO_LIST);
  const fromPortal = raised.map((r) => {
    const line = p.manifest(r.mid)?.lines.find((l) => l.id === r.line);
    return {
      id: r.id,
      manifest: r.mid,
      importer: importerName(line?.importer),
      agency: agencyName(r.ain),
      foreign: r.foreign,
      line: line ? `Line ${line.no}: ${line.goods}` : r.line,
      totalKg: line?.declaredKg ?? 0,
      plates: r.plates,
      // A slot holds the plate once the inland gate has admitted that receiving truck.
      slots: r.plates.map((plate) => (r.admitted?.[plate] ? plate : null)),
      admitted: r.admitted ?? {},
    };
  });
  // Admits a receiving truck at the inland gate against its request's slot.
  const admit = (id, plate) => {
    const entryPass = `EP-26-${String(56000 + Math.floor(Math.random() * 900)).padStart(5, '0')}`;
    setRaised((l) => l.map((r) => (r.id === id ? { ...r, status: 'Trucks arriving', admitted: { ...r.admitted, [plate]: { entryPass, at: new Date().toISOString() } } } : r)));
    p.logEvent(`Receiving truck ${plate} admitted on Entry Pass ${entryPass} against transfer request ${id}`, id, 'Device');
    return entryPass;
  };
  return { requests: [DEMO_REQUEST, ...fromPortal], fromPortal, admit };
}
