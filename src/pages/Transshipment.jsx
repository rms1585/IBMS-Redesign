import { useState } from 'react';
import { Alert, Box, Button, Card, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { useRole } from '../RoleContext';
import { usePort, useStoredState } from '../demo/PortStore';
import { formatDateTime, formatKg } from '../demo/format';
import { Confirmation, Fact, Facts, HoldRow, LockedValue, Plate, ReasonField, SectionTitle, StatusPill } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-07: truck-to-truck transfer of perishable lines against the agency's transfer request.
// The transfer request is demo data local to this screen; its locked moves and the holds live in the shared record.

const REQUEST = {
  id: 'TR-2026-0088', manifest: '2026/601/08841', importer: 'Delta Foods Ltd', agency: 'Jamuna C&F Services',
  foreign: 'WB 37 C 5512', line: 'Line 2: Lentils, red, split', totalKg: 8000,
  slots: ['Jessore-TA 11-4418', 'Jessore-TA 11-5021', null],
};

// The first receiving truck is already loaded when the screen opens.
const FIRST_MOVES = [
  { truck: 'Jessore-TA 11-4418', kg: 4000, by: 'Shahidul Islam', at: new Date(Date.now() - 40 * 60000).toISOString(), assoc: 'Benapole Port Labour Association No. 1' },
];
const NO_LIST = [];
const EXCEPTION_KINDS = ['Damaged', 'Short', 'Refused by the receiver'];
const MANAGERS = ['warehouse-manager', 'super-admin', 'port-incharge'];
const toLocalInput = (iso) => (iso ? new Date(new Date(iso).getTime() + 6 * 3600000).toISOString().slice(0, 16) : '');
const fromLocalInput = (v) => new Date(`${v}:00+06:00`).toISOString();

const ASSOCIATIONS = ['Benapole Port Labour Association No. 1', 'Benapole Port Labour Association No. 2'];

export default function Transshipment() {
  const p = usePort();
  const t = useT();
  const { role } = useRole();
  const [moves, setMoves] = useStoredState('transshipmentMoves', FIRST_MOVES);
  const [truck, setTruck] = useState('');
  const [kg, setKg] = useState('');
  const [assoc, setAssoc] = useState('');
  const [msg, setMsg] = useState('');
  const [exceptions, setExceptions] = useStoredState('transshipmentExceptions', NO_LIST);
  const [closed, setClosed] = useStoredState('transshipmentClosed', false);
  const [raising, setRaising] = useState(false);
  const [excKind, setExcKind] = useState(EXCEPTION_KINDS[0]);
  const [excKg, setExcKg] = useState('');
  const [excNote, setExcNote] = useState('');
  const updateMove = (truckPlate, change) => setMoves((all) => all.map((m) => (m.truck === truckPlate ? { ...m, ...change } : m)));
  const explainedKg = exceptions.reduce((s, e) => s + e.kg, 0);
  const moved = moves.reduce((s, m) => s + m.kg, 0);
  const left = REQUEST.totalKg - moved;
  const holds = p.holdsOnManifest(REQUEST.manifest);
  const admitted = REQUEST.slots.filter(Boolean);
  const n = Number(kg);
  const blockers = [holds.length && `${holds[0].body} hold: ${holds[0].reason}. The transfer stops until it is lifted.`, n > left && `Only ${formatKg(left)} is left on the foreign truck.`, !assoc && 'Tag the labour association first.'].filter(Boolean);
  const lock = () => {
    setMoves([...moves, { truck, kg: n, by: role.person, at: new Date().toISOString(), assoc }]);
    setMsg(`Transfer to ${truck} locked`);
    setTruck(''); setKg('');
  };
  return (
    <>
      <PageHeader title={t('Transshipment')} subtitle="Only perishables go truck to truck. Customs assesses the goods during the transfer, outside IBMS." />
      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
            <Typography variant="h6">Transfer request {REQUEST.id}</Typography>
            <StatusPill word={closed ? 'Closed' : 'Open'} />
          </Stack>
          <Facts cols={4}>
            <Fact label="Foreign truck"><Plate>{REQUEST.foreign}</Plate></Fact>
            <Fact label="Importer">{REQUEST.importer}</Fact>
            <Fact label="C&F agency">{REQUEST.agency}</Fact>
            <Fact label="Line">{REQUEST.line}</Fact>
            <Fact label="Moved">{formatKg(moved)}</Fact>
            <Fact label="Left on the foreign truck">{formatKg(left)}</Fact>
            <Fact label="Receiving trucks admitted">{admitted.length} of {REQUEST.slots.length} slots</Fact>
            <Fact label="Explained by an exception">{formatKg(explainedKg)}</Fact>
          </Facts>
          {holds.map((h) => <Box key={h.id} sx={{ mt: 2 }}><HoldRow hold={h} /></Box>)}
          {!closed && (
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end" sx={{ mt: 2 }}>
              {left - explainedKg > 0 && <Typography variant="caption" color="text.secondary" role="status" sx={{ flex: 1 }}>{formatKg(left - explainedKg)} is left unexplained. Move it or raise an exception before closing.</Typography>}
              <Button variant="outlined" color="inherit" disabled={left - explainedKg > 0} onClick={() => { setClosed(true); setMsg(`Transfer request ${REQUEST.id} closed`); }}>Close the request</Button>
            </Stack>
          )}
        </Card>

        <Card sx={{ p: 3 }}>
          <SectionTitle>Record a transfer</SectionTitle>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
            <TextField select label="Receiving truck" value={truck} onChange={(e) => setTruck(e.target.value)}>
              {admitted.filter((x) => !moves.some((m) => m.truck === x)).map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}
            </TextField>
            <TextField type="number" label="Quantity moved (kg)" value={kg} onChange={(e) => setKg(e.target.value)} helperText="What this truck actually took, never an even split" />
            <TextField select label="Labour association" value={assoc} onChange={(e) => setAssoc(e.target.value)}>
              {ASSOCIATIONS.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
          </Box>
          {blockers.length > 0 && truck && <Alert severity="error" variant="outlined" sx={{ mt: 2 }}>{blockers.join(' ')}</Alert>}
          <Button variant="contained" sx={{ mt: 2 }} disabled={!truck || !n || blockers.length > 0} onClick={lock}>Lock transfer</Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>The warehouse manager enters the start and end times of each transfer under Transfers. Each receiving truck leaves on its own Customs exit note, once the foreign truck's exit is recorded and its bill is paid.</Typography>
        </Card>

        <Card sx={{ p: 3 }}>
          <SectionTitle>Transfers</SectionTitle>
          {moves.length === 0 && <Typography variant="body2" color="text.secondary">No transfer locked yet.</Typography>}
          {moves.map((m) => (
            <Stack key={m.truck} spacing={1.5} sx={{ py: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <Plate>{m.truck}</Plate>
                <LockedValue>{formatKg(m.kg)}</LockedValue>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{m.assoc} · {m.by}, {formatDateTime(m.at)}</Typography>
                {m.pass
                  ? <Typography variant="body2">Exit Pass {m.pass} approved by {m.passBy}</Typography>
                  : <Button size="small" variant="outlined" color="inherit" onClick={() => { const pass = `BEN-PASS-0${44 + moves.indexOf(m)}7${moves.indexOf(m)}`; updateMove(m.truck, { pass, passBy: role.person }); setMsg(`Exit Pass ${pass} approved for ${m.truck}`); }}>Approve Exit Pass</Button>}
              </Stack>
              <TransferTimes move={m} canEnter={MANAGERS.includes(role.id)} onEnter={(times) => { updateMove(m.truck, { times: { ...times, by: role.person } }); setMsg(`Transfer times entered for ${m.truck}`); }} />
            </Stack>
          ))}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>The Exit Pass covers only the goods this receiving truck took; the Customs officer co-approves it in the Customs workspace.</Typography>
        </Card>

        <Card sx={{ p: 3 }}>
          <SectionTitle>Exceptions</SectionTitle>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Cargo damaged, short or refused by the receiver. The C&F agency is told at once.</Typography>
          {exceptions.length > 0 && (
            <Stack spacing={1} sx={{ mb: 2 }}>
              {exceptions.map((e) => <Typography key={e.id} variant="body2">{e.kind}: {formatKg(e.kg)} · {e.note} · {e.by}, {formatDateTime(e.at)} · {REQUEST.agency} told</Typography>)}
            </Stack>
          )}
          {raising ? (
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <TextField select label="What happened" value={excKind} onChange={(e) => setExcKind(e.target.value)}>{EXCEPTION_KINDS.map((k) => <MenuItem key={k} value={k}>{k}</MenuItem>)}</TextField>
                <TextField label="Quantity affected (kg)" inputMode="numeric" value={excKg} onChange={(e) => setExcKg(e.target.value.replace(/\D/g, ''))} error={Number(excKg) > left} helperText={Number(excKg) > left ? `Only ${formatKg(left)} is left on the foreign truck.` : ' '} />
              </Box>
              <ReasonField label="What you saw" value={excNote} onChange={setExcNote} />
              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                <Button variant="outlined" color="inherit" onClick={() => setRaising(false)}>Cancel</Button>
                <Button variant="contained" disabled={!Number(excKg) || Number(excKg) > left || !excNote.trim()} onClick={() => { setExceptions((all) => [...all, { id: `TX-${all.length + 1}`, kind: excKind, kg: Number(excKg), note: excNote.trim(), by: role.person, at: new Date().toISOString() }]); setRaising(false); setExcKg(''); setExcNote(''); setMsg(`Exception raised; ${REQUEST.agency} told`); }}>Raise exception</Button>
              </Stack>
            </Stack>
          ) : <Button variant="outlined" color="inherit" disabled={closed} onClick={() => setRaising(true)}>Raise an exception</Button>}
        </Card>
      </Stack>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}

// Only the warehouse manager enters a transfer's start and end; the end may not be earlier than the start.
function TransferTimes({ move, canEnter, onEnter }) {
  const [start, setStart] = useState(toLocalInput(move.times?.start));
  const [end, setEnd] = useState(toLocalInput(move.times?.end));
  const bad = start && end && end < start;
  if (move.times && !canEnter) return <Typography variant="body2" color="text.secondary">Transfer {formatDateTime(move.times.start)} to {formatDateTime(move.times.end)} · entered by {move.times.by}</Typography>;
  if (!canEnter) return <Typography variant="body2" color="text.secondary">Start and end times: the warehouse manager enters them.</Typography>;
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }}>
      <TextField size="small" type="datetime-local" label="Transfer started" value={start} onChange={(e) => setStart(e.target.value)} InputLabelProps={{ shrink: true }} />
      <TextField size="small" type="datetime-local" label="Transfer ended" value={end} onChange={(e) => setEnd(e.target.value)} InputLabelProps={{ shrink: true }} error={Boolean(bad)} helperText={bad ? 'The end cannot be earlier than the start.' : ' '} />
      <Button size="small" variant="outlined" color="inherit" disabled={!start || !end || Boolean(bad)} onClick={() => onEnter({ start: fromLocalInput(start), end: fromLocalInput(end) })}>{move.times ? 'Update times' : 'Enter times'}</Button>
    </Stack>
  );
}
