import { useState } from 'react';
import { Alert, Box, Button, Card, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { formatDateTime, formatKg } from '../demo/format';
import { Checklist, Confirmation, Fact, Facts, ResponsiveTable, SectionTitle, SourceMarker, StatusPill } from '../demo/ui';
import { useT, tr } from '../i18n/LanguageContext';
import { usePort, useStoredState } from '../demo/PortStore';

// M-16: a train is known by its train and wagon numbers and its railway receipt, not by a plate.
// The rake record opens when the train is on record and closes when the wagons leave. Demo data local to this screen.

const INITIAL = [
  { wagon: 'WGN-40217', seal: 'RS-883102', handling: 'Unload to Shed 7', goods: 'Fly ash', kg: 58000, checked: null },
  { wagon: 'WGN-40218', seal: 'RS-883103', handling: 'Transfer to road trucks', goods: 'Fly ash', kg: 58000, checked: null },
  { wagon: 'WGN-40219', seal: 'RS-883104', handling: 'Self-driven vehicles (6)', goods: 'Tractors', kg: 21600, checked: null },
  { wagon: 'WGN-40220', seal: 'RS-883105', handling: 'Pass-through, no unloading', goods: 'Sealed containers', kg: 40000, checked: null },
];

export default function RailCargo() {
  const t = useT();
  const [wagons, setWagons] = useStoredState('railWagons', INITIAL);
  const [rep, setRep] = useState('');
  const [signed, setSigned] = useStoredState('railWagonListSignedBy', null);
  const [msg, setMsg] = useState('');
  const check = (wagon, ok) => {
    setWagons((ws) => ws.map((w) => (w.wagon === wagon ? { ...w, checked: ok ? 'Seal intact' : 'Difference recorded, photo attached' } : w)));
    setMsg(ok ? `${wagon}: seal matches the wagon list` : `${wagon}: difference recorded with a photo`);
  };
  const allChecked = wagons.every((w) => w.checked);
  const [released, setReleased] = useStoredState('railEmptyRelease', null);
  return (
    <>
      <PageHeader title={t('Rail cargo')} subtitle={tr("Rail module is on at Benapole and Bhomra. BLPA bills storage and handling only; freight and demurrage are settled outside IBMS.")} />
      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
            <Typography variant="h6">{tr("Rake record RK-BEN-112")}</Typography>
            <StatusPill word={signed ? 'Closed' : 'Open'} />
          </Stack>
          <Facts cols={4}>
            <Fact label={tr("Train")}>{tr("Up goods 4417, Petrapole to Benapole")}</Fact>
            <Fact label={tr("Railway receipt")}>{tr("RR-ER-2026-558120")}</Fact>
            <Fact label={tr("Manifest")}>{tr("2026/601/08902 · from BNSW")}</Fact>
            <Fact label={tr("Wagons")}>{wagons.length}</Fact>
          </Facts>
        </Card>
        <Card sx={{ p: 3 }}>
          <SectionTitle>{tr("Joint check at the hand-over")}</SectionTitle>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{tr("BLPA and the railway check each wagon's seal and condition against the wagon list. Any difference is recorded with a photo.")}</Typography>
          <ResponsiveTable
            rowKey={(w) => w.wagon}
            rows={wagons}
            columns={[
              { label: 'Wagon', render: (w) => w.wagon },
              { label: 'Seal', render: (w) => w.seal },
              { label: 'Goods', priority: 'low', render: (w) => `${w.goods} · ${formatKg(w.kg)}` },
              { label: 'Handling', render: (w) => w.handling },
              {
                label: 'Check',
                render: (w) => (w.checked ? <Typography variant="body2">{w.checked}</Typography> : (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => check(w.wagon, true)}>{tr("Seal intact")}</Button>
                    <Button size="small" variant="outlined" color="inherit" onClick={() => check(w.wagon, false)}>{tr("Record a difference")}</Button>
                  </Stack>
                )),
              },
            ]}
          />
        </Card>
        <Card sx={{ p: 3 }}>
          <SectionTitle>{tr("Sign the joint wagon list")}</SectionTitle>
          {signed ? (
            <Typography variant="body2">Signed by Anwar Hossain, rail siding officer, and {signed}, railway representative, on the officer's device with a signature image.</Typography>
          ) : (
            <Stack spacing={2}>
              {!allChecked && <Alert severity="info">{tr("Check every wagon before the hand-over is signed. The rake record cannot close while a wagon is unaccounted for.")}</Alert>}
              <TextField label={tr("Railway representative's name and organisation")} value={rep} onChange={(e) => setRep(e.target.value)} sx={{ maxWidth: 480 }} helperText={tr("The representative has no IBMS account and countersigns on the officer's device.")} />
              <Box><Button variant="contained" disabled={!allChecked || !rep.trim()} onClick={() => { setSigned(rep.trim()); setMsg('Joint wagon list signed'); }}>{tr("Sign wagon list")}</Button></Box>
            </Stack>
          )}
        </Card>
        <Card sx={{ p: 3 }}>
          <SectionTitle>{tr("Release of empty wagons")}</SectionTitle>
          {released ? (
            <Typography variant="body2">Notice {released.id} sent to Bangladesh Railway, {formatDateTime(released.at)}: {released.count} empty wagons released. The rake record closes when they leave.</Typography>
          ) : (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{signed ? 'Unloading and pass-through are recorded. Send the railway the release notice for the empty wagons.' : 'Available once the joint wagon list is signed.'}</Typography>
              <Button variant="outlined" color="inherit" disabled={!signed} onClick={() => { setReleased({ id: 'ERN-BEN-2026-0218', count: wagons.filter((w) => !w.handling.startsWith('Pass-through')).length, at: new Date().toISOString() }); setMsg('Empty wagon release notice sent to the railway'); }}>{tr("Release empty wagons")}</Button>
            </Stack>
          )}
        </Card>
        <TrainArrivals onDone={setMsg} />
        <ExportTrain onDone={setMsg} />
      </Stack>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}

// A train arrives on record from BNSW. In BNSW-down mode the siding officer keys it from the railway receipt,
// marked keyed and reconciled when BNSW returns (M-16).
const NO_LIST = [];

function TrainArrivals({ onDone }) {
  const p = usePort();
  const [keyed, setKeyed] = useStoredState('railKeyedTrains', NO_LIST);
  const [train, setTrain] = useState('');
  const [rr, setRr] = useState('');
  const [count, setCount] = useState('');
  const down = p.state.bnswDown;
  const why = !down ? 'BNSW is live: train arrivals come from BNSW.' : !train.trim() ? 'Enter the train number.' : !rr.trim() ? 'Enter the railway receipt number.' : !Number(count) ? 'Enter the number of wagons.' : '';
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle>{tr("Train arrivals")}</SectionTitle>
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center"><Typography variant="body2" sx={{ flex: 1 }}>{tr("Up goods 4417 · RR-ER-2026-558120 · 4 wagons")}</Typography><SourceMarker source="BNSW" always /></Stack>
        {keyed.map((k) => <Stack key={k.rr} direction="row" spacing={1.5} alignItems="center"><Typography variant="body2" sx={{ flex: 1 }}>{k.train} · {k.rr} · {k.count} wagons · {formatDateTime(k.at)}</Typography><SourceMarker source="Keyed at the gate" /></Stack>)}
      </Stack>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{tr("Key a train arrival (BNSW-down mode)")}</Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0,1fr))' } }}>
        <TextField size="small" label={tr("Train number")} value={train} onChange={(e) => setTrain(e.target.value)} disabled={!down} />
        <TextField size="small" label={tr("Railway receipt")} value={rr} onChange={(e) => setRr(e.target.value)} disabled={!down} />
        <TextField size="small" label={tr("Wagons")} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value.replace(/\D/g, ''))} disabled={!down} />
      </Box>
      <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center" sx={{ mt: 2 }}>
        {why && <Typography variant="caption" color="text.secondary" role="status" sx={{ flex: 1 }}>{tr(why)}</Typography>}
        <Button variant="contained" disabled={Boolean(why)} onClick={() => { setKeyed((l) => [...l, { train: train.trim(), rr: rr.trim(), count: Number(count), at: new Date().toISOString() }]); setTrain(''); setRr(''); setCount(''); onDone('Train arrival keyed; it is checked against BNSW when BNSW returns'); }}>{tr("Record the arrival")}</Button>
      </Stack>
    </Card>
  );
}

// Export wagons: load against the C&F agent's wagon list, record the seal, then hand over only with Customs' release,
// the bill paid and no hold; the departure closes the record (M-16). Demo wagons and statuses.
const EXPORT_WAGONS = [
  { wagon: 'WGN-51102', goods: 'Jute yarn', declaredKg: 42000 },
  { wagon: 'WGN-51103', goods: 'Jute yarn', declaredKg: 41500 },
];

function ExportTrain({ onDone }) {
  const [state, setState] = useStoredState('railExport', { loads: {}, released: false, billPaid: true, hold: false, departedAt: null });
  const [kg, setKg] = useState({});
  const [seal, setSeal] = useState({});
  const set = (change) => setState((x) => ({ ...x, ...change }));
  const lock = (w) => { set({ loads: { ...state.loads, [w.wagon]: { kg: Number(kg[w.wagon]), seal: seal[w.wagon].trim(), at: new Date().toISOString() } } }); onDone(`${w.wagon} loaded and sealed`); };
  const allLoaded = EXPORT_WAGONS.every((w) => state.loads[w.wagon]);
  const checks = [
    { label: 'Every wagon loaded and sealed', state: allLoaded ? 'pass' : 'fail', text: `${Object.keys(state.loads).length} of ${EXPORT_WAGONS.length} wagons` },
    { label: "Customs' release of the Bill of Export", state: state.released ? 'pass' : 'fail', text: state.released ? 'Received through BNSW' : 'Not received yet' },
    { label: 'Bill paid', state: state.billPaid ? 'pass' : 'fail', text: 'Paid, provider confirmation BLPA-BEN-0519-3' },
    { label: 'No hold', state: state.hold ? 'fail' : 'pass', text: state.hold ? 'Customs hold open' : 'None open' },
  ];
  const blocked = checks.some((c) => c.state === 'fail');
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle>{tr("Export train EX-BEN-031 · Bill of Export E 601 E-11208")}</SectionTitle>
      <Stack spacing={2}>
        {EXPORT_WAGONS.map((w) => {
          const l = state.loads[w.wagon];
          return (
            <Stack key={w.wagon} direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} sx={{ pb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ flex: 1 }}><Typography variant="subtitle2">{w.wagon}</Typography><Typography variant="caption" color="text.secondary">{w.goods} · declared {formatKg(w.declaredKg)}</Typography></Box>
              {l ? <Typography variant="body2">Loaded {formatKg(l.kg)} · seal {l.seal} · {formatDateTime(l.at)}</Typography> : (
                <>
                  <TextField size="small" label={tr("Loaded (kg)")} inputMode="numeric" value={kg[w.wagon] ?? ''} onChange={(e) => setKg({ ...kg, [w.wagon]: e.target.value.replace(/\D/g, '') })} />
                  <TextField size="small" label={tr("Seal number")} value={seal[w.wagon] ?? ''} onChange={(e) => setSeal({ ...seal, [w.wagon]: e.target.value })} />
                  <Button variant="outlined" color="inherit" disabled={!Number(kg[w.wagon]) || !seal[w.wagon]?.trim()} onClick={() => lock(w)}>{tr("Lock load and seal")}</Button>
                </>
              )}
            </Stack>
          );
        })}
        <Checklist checks={checks} />
        {state.departedAt ? (
          <Alert severity="success">Handed over to the railway and departed {formatDateTime(state.departedAt)}. The export rake record is closed.</Alert>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            {!state.released && <Button size="small" color="inherit" onClick={() => { set({ released: true }); onDone("Customs' release received through BNSW (simulated)"); }}>{tr("Simulate Customs' release via BNSW")}</Button>}
            <Box sx={{ flex: 1 }} />
            {blocked && <Typography variant="caption" color="error.text" role="status">Hand-over refused. {checks.find((c) => c.state === 'fail').label}: {checks.find((c) => c.state === 'fail').text}.</Typography>}
            <Button variant="contained" disabled={blocked} onClick={() => { set({ departedAt: new Date().toISOString() }); onDone('Export train handed over and departure recorded'); }}>{tr("Hand over and record departure")}</Button>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
