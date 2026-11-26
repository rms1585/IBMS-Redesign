import { useCallback, useState } from 'react';
import { Alert, Box, Button, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { agencyName, importerName, usePort, useStoredState } from '../demo/PortStore';
import { formatDateTime, formatDuration, formatKg, searchKey } from '../demo/format';
import { usePortRules } from '../demo/portRules';

const NO_LIST = [];
const NO_MAP = {};
import { ActionFoot, Bench, CameraStill, Checklist, Confirmation, Fact, Facts, HoldRow, Plate, QueueList, ReasonField, SectionTitle, SourceMarker, useKeyAction } from '../demo/ui';
import { useT, tr } from '../i18n/LanguageContext';

// M-03 Border gate: admit by plate against the agency's entry and the BNSW manifest; exit lanes run the automated check.

function EntryBench({ onDone }) {
  const p = usePort();
  const t = useT();
  const queue = p.state.visits.filter((v) => v.stage === 'Expected');
  const [sel, setSel] = useState(queue[0]?.id);
  const [typing, setTyping] = useState(false);
  const [typedPlate, setTypedPlate] = useState('');
  const [reason, setReason] = useState('');
  const [laneRead, setLaneRead] = useState('');
  const [noPlate, setNoPlate] = useState(false);
  const [parkPass, setParkPass] = useState('');
  const [parked, setParked] = useStoredState('gateParkedNoPlate', NO_LIST);
  const [keyedLines, setKeyedLines] = useStoredState('gateKeyedLines', NO_MAP);
  const [lineGoods, setLineGoods] = useState('');
  const [lineKg, setLineKg] = useState('');
  // The read plate can match several expected trucks (two Car Passes, similar plates): a short list to pick from.
  const matches = searchKey(laneRead).length >= 2 ? queue.filter((x) => searchKey(x.plate).includes(searchKey(laneRead))) : [];
  const v = p.visit(sel) ?? queue[0];
  // EXC-03: a plate that already has an open visit is a hard stop.
  const openTwin = v ? p.state.visits.find((x) => x.id !== v.id && x.plate === v.plate && x.gateIn && x.stage !== 'Exited') : null;
  const keyedForV = v ? keyedLines[v.id] ?? NO_LIST : NO_LIST;
  const [rules] = usePortRules();
  // Optional fields this port switched on in Port setup; recorded per visit.
  const [extra, setExtra] = useStoredState('gateExtraFields', NO_MAP);
  const extraOf = (key) => (v ? extra[v.id]?.[key] ?? '' : '');
  const setExtraOf = (key) => (e) => setExtra((all) => ({ ...all, [v.id]: { ...all[v.id], [key]: e.target.value } }));
  const needKeyed = v && v.late && p.state.bnswDown;
  const otherOff = needKeyed && !rules.otherManifest;
  const checks = v ? [
    ...p.admissionChecks(v),
    ...(openTwin ? [{ label: 'One open visit per plate', state: 'fail', text: `${v.plate} already has an open visit (${openTwin.id}). Second gate-in refused and the supervisor alerted (EXC-03).` }] : []),
    ...(otherOff ? [{ label: 'Manual "Other" manifest', state: 'fail', text: 'This port does not allow "Other" manifest entry (Port setup). The truck waits until BNSW returns.' }] : needKeyed ? [{ label: 'Manifest lines keyed from the Car Pass', state: keyedForV.length ? 'pass' : 'fail', text: keyedForV.length ? `${keyedForV.length} line${keyedForV.length === 1 ? '' : 's'} keyed (BNSW-down mode).` : 'BNSW is down: key the manifest lines written on the Car Pass.' }] : []),
  ] : [];
  const blocked = checks.some((c) => c.state === 'fail');
  const admit = useCallback(() => {
    if (!v || blocked) return;
    p.admitAtBorder(v.id, typing ? { typedReason: reason } : {});
    onDone(v.late ? `Admitted ${v.plate}. Manifest not yet available; it goes to weighing, then the holding area` : `Admitted ${v.plate}`);
    setTyping(false); setReason(''); setTypedPlate('');
    setSel(queue.find((x) => x.id !== v.id)?.id);
  }, [v, blocked, typing, reason, p, onDone, queue]);
  useKeyAction('a', admit, Boolean(v) && !blocked);

  return (
    <Bench
      context={[
        { label: 'Port', value: 'Benapole' },
        { label: 'Gate', value: 'Border gate 1' },
        { label: 'Lane', value: 'Lane 2 (entry)' },
        { label: 'Expected', value: queue.length },
        { label: 'Admitted today', value: p.state.visits.filter((x) => x.gateIn && formatDateTime(x.gateIn.at).startsWith('Today')).length },
      ]}
      queue={
        <Stack spacing={2}>
        <TextField size="small" label={tr("Plate read at the lane")} value={laneRead} onChange={(e) => setLaneRead(e.target.value)} helperText={tr("Type part of a plate to find the truck")} />
        {matches.length > 1 && (
          <Alert severity="info" icon={false} sx={{ '& .MuiAlert-message': { width: '100%' } }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{matches.length} expected trucks match: pick the one on the Car Pass</Typography>
            <Stack spacing={1}>{matches.map((x) => <Button key={x.id} size="small" variant="outlined" color="inherit" onClick={() => { setSel(x.id); setLaneRead(''); }} sx={{ justifyContent: 'flex-start', textAlign: 'left' }}><Box><Box component="span" sx={{ display: 'block', fontWeight: 600 }}>{x.plate}</Box><Box component="span" sx={{ display: 'block', typography: 'caption', color: 'text.secondary' }}>{x.carPass}</Box></Box></Button>)}</Stack>
          </Alert>
        )}
        {matches.length === 1 && matches[0].id !== v?.id && <Button size="small" variant="outlined" color="inherit" onClick={() => { setSel(matches[0].id); setLaneRead(''); }}>Select {matches[0].plate}</Button>}
        <QueueList
          title="Expected trucks"
          items={queue}
          selected={v?.id}
          onSelect={(id) => { setSel(id); setTyping(false); }}
          empty={tr("No truck expected. Trucks appear here once a tagged agency enters them, or when one arrives with a Car Pass.")}
          render={(x) => (
            <>
              <Plate>{x.plate}</Plate>
              <Typography variant="caption" color="text.secondary" component="div">{x.late ? `Car Pass ${x.carPass} · manifest not in IBMS` : x.enteredAt ? `Entered ${formatDuration(x.enteredAt)} ago` : 'Not entered by an agency'}</Typography>
            </>
          )}
        />
        {/* EXC-30: a vehicle with no plate is parked until BLPA rules on it. */}
        {noPlate ? (
          <Stack spacing={1}>
            <TextField size="small" label={tr("Car Pass number")} value={parkPass} onChange={(e) => setParkPass(e.target.value)} />
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" color="inherit" onClick={() => setNoPlate(false)}>{tr("Cancel")}</Button>
              <Button size="small" variant="contained" disabled={!parkPass.trim()} onClick={() => { setParked((l) => [...l, { carPass: parkPass.trim(), at: new Date().toISOString() }]); setNoPlate(false); setParkPass(''); onDone('Vehicle with no plate parked until BLPA rules on it (EXC-30)'); }}>{tr("Park the vehicle")}</Button>
            </Stack>
          </Stack>
        ) : <Button size="small" variant="outlined" color="inherit" onClick={() => setNoPlate(true)}>{tr("Vehicle with no plate")}</Button>}
        {parked.length > 0 && <Typography variant="caption" color="text.secondary">Parked, waiting for BLPA: {parked.map((x) => `Car Pass ${x.carPass}`).join(', ')}</Typography>}
        </Stack>
      }
      center={v ? (
        <Stack spacing={2.5}>
          <Plate size="hero">{v.plate}</Plate>
          {v.late && <Alert severity="warning">The manifest {v.carPassManifest} on the Car Pass is not in IBMS yet. Admit on plate and Car Pass number: the visit is marked "manifest not yet available", is weighed and waits in the holding area until it is matched (EXC-04).</Alert>}
          <Facts cols={3}>
            <Fact label={tr("Car Pass number")}>{v.carPass}</Fact>
            <Fact label={tr("Vehicle class")}>{v.vehicleClass}, {v.axles} axles</Fact>
            <Fact label={tr("Driver (from the Car Pass)")}>{v.driver.name}<br />{v.driver.nid}</Fact>

            <Fact label={tr("Entered by")}>{v.enteredBy ? agencyName(v.enteredBy) : '–'}</Fact>
            <Fact label={tr("Manifests")}>{v.manifests.join(', ') || v.carPassManifest}</Fact>
          </Facts>
          {v.manifests.map((mid) => (
            <Box key={mid}>
              <SectionTitle>{`Manifest ${mid}`}</SectionTitle>
              {p.manifest(mid).lines.map((l) => (
                <Stack key={l.id} direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.5 }}>
                  <Typography variant="body2">Line {l.no}: {l.goods} · {importerName(l.importer)}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center"><Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>{formatKg(l.declaredKg)}</Typography>{p.state.bnswDown && <SourceMarker source="Keyed at the gate" />}</Stack>
                </Stack>
              ))}
            </Box>
          ))}
          {(rules.fields.driverMobile || rules.fields.truckColour) && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              {rules.fields.driverMobile && <TextField size="small" label={tr("Driver mobile")} inputMode="tel" value={extraOf('driverMobile')} onChange={setExtraOf('driverMobile')} />}
              {rules.fields.truckColour && <TextField size="small" label={tr("Truck colour")} value={extraOf('truckColour')} onChange={setExtraOf('truckColour')} />}
            </Stack>
          )}
          {needKeyed && !otherOff && (
            <Box>
              <SectionTitle>{tr("Manifest lines keyed from the Car Pass (BNSW down)")}</SectionTitle>
              {keyedForV.map((l, i) => <Stack key={i} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}><Typography variant="body2">Line {i + 1}: {l.goods}</Typography><Stack direction="row" spacing={1} alignItems="center"><Typography variant="body2">{formatKg(l.kg)}</Typography><SourceMarker source="Keyed at the gate" /></Stack></Stack>)}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
                <TextField size="small" label={tr("Goods")} value={lineGoods} onChange={(e) => setLineGoods(e.target.value)} />
                <TextField size="small" label={tr("Declared kg")} inputMode="numeric" value={lineKg} onChange={(e) => setLineKg(e.target.value.replace(/\D/g, ''))} />
                <Button size="small" variant="outlined" color="inherit" disabled={!lineGoods.trim() || !lineKg} onClick={() => { setKeyedLines((all) => ({ ...all, [v.id]: [...(all[v.id] ?? []), { goods: lineGoods.trim(), kg: Number(lineKg) }] })); setLineGoods(''); setLineKg(''); }}>{tr("Add the line")}</Button>
              </Stack>
            </Box>
          )}
          {p.holdsOnVisit(v).map((h) => <HoldRow key={h.id} hold={h} />)}
          {typing ? (
            <Stack spacing={1.5} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2">{tr("Type the plate the camera could not read")}</Typography>
              <TextField label={tr("Plate")} value={typedPlate} onChange={(e) => setTypedPlate(e.target.value)} />
              <ReasonField value={reason} onChange={setReason} helper="The failed read and the typed plate are logged." />
              {typedPlate && typedPlate.replace(/\s/g, '').toUpperCase() !== v.plate.replace(/\s/g, '') && <Alert severity="error">{tr("The typed plate does not match the selected truck.")}</Alert>}
              <Box><Button variant="outlined" color="inherit" onClick={() => setTyping(false)}>{tr("Use the camera read")}</Button></Box>
            </Stack>
          ) : (
            <Box><Button size="small" variant="outlined" color="inherit" onClick={() => setTyping(true)}>{tr("Camera could not read the plate")}</Button></Box>
          )}
        </Stack>
      ) : <Typography variant="body2" color="text.secondary">{tr("Select a truck from the queue.")}</Typography>}
      right={v ? (
        <>
          <CameraStill lane="Lane 2" read={typing ? null : v.plate} expected={v.plate} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>{tr("Checks")}</Typography>
          <Checklist checks={checks} />
          <ActionFoot
            checks={checks}
            label={t('Admit truck')}
            keyHint="A"
            onClick={admit}
            extraBlocker={typing && (!reason.trim() || typedPlate.replace(/\s/g, '').toUpperCase() !== v.plate.replace(/\s/g, '')) ? { label: 'Typed plate', text: 'Type the plate as it appears and give a reason.' } : undefined}
          />
        </>
      ) : null}
    />
  );
}

function ExitBench({ onDone }) {
  const p = usePort();
  const queue = p.state.visits.filter((v) => v.kind === 'foreign' && v.gateIn && v.stage !== 'Exited' && (v.receipt?.locked || v.stage === 'Unloaded'));
  const [sel, setSel] = useState(queue[0]?.id);
  const v = p.visit(sel) ?? queue[0];
  const checks = v ? p.borderExitChecks(v) : [];
  const blocked = checks.some((c) => c.state === 'fail');
  const read = useCallback(() => {
    if (!v || blocked) return;
    p.exitAtBorder(v.id);
    onDone(`Exit recorded for ${v.plate}. The barrier opened and the visit closed`);
  }, [v, blocked, p, onDone]);
  useKeyAction('e', read, Boolean(v) && !blocked);
  return (
    <Bench
      context={[
        { label: 'Port', value: 'Benapole' },
        { label: 'Gate', value: 'Border gate 1' },
        { label: 'Lane', value: 'Lane 4 (exit, automated)' },
        { label: 'Waiting to leave', value: queue.length },
      ]}
      queue={<QueueList title="At the exit lane" items={queue} selected={v?.id} onSelect={setSel} empty={tr("No foreign truck is waiting to leave.")} render={(x) => <><Plate>{x.plate}</Plate><Typography variant="caption" color="text.secondary" component="div">Unloaded {formatDateTime(x.receipt?.at)}</Typography></>} />}
      center={v ? (
        <Stack spacing={2}>
          <Plate size="hero">{v.plate}</Plate>
          <Typography variant="body2" color="text.secondary">{tr("The system decides; the operator watches. Payment is not checked for a foreign truck that unloaded here: its charges are finalized on the visit and carried on its importers' bills.")}</Typography>
          {checks.some((c) => c.state === 'fail') && <Alert severity="error">Held at the barrier: {checks.find((c) => c.state === 'fail').text}</Alert>}
        </Stack>
      ) : <Typography variant="body2" color="text.secondary">{tr("No truck at the exit lane.")}</Typography>}
      right={v ? (
        <>
          <CameraStill lane="Lane 4" read={v.plate} expected={v.plate} />
          <Checklist checks={checks} />
          <ActionFoot checks={checks} label={tr("Run the exit check")} keyHint="E" onClick={read} />
        </>
      ) : null}
    />
  );
}

export default function GateWorkbench() {
  const t = useT();
  const [tab, setTab] = useState('entry');
  const [msg, setMsg] = useState('');
  return (
    <>
      <PageHeader
        title={t('Border gate')}
        action={
          <ToggleButtonGroup exclusive size="small" value={tab} onChange={(_, v) => v && setTab(v)} aria-label="Border gate view">
            <ToggleButton value="entry">{tr("Entry")}</ToggleButton>
            <ToggleButton value="exit">{tr("Exit lanes")}</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      {tab === 'entry' ? <EntryBench onDone={setMsg} /> : <ExitBench onDone={setMsg} />}
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
