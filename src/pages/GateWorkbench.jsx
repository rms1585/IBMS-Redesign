import { useCallback, useState } from 'react';
import { Alert, Box, Button, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { agencyName, importerName, usePort } from '../demo/PortStore';
import { formatDateTime, formatDuration, formatKg } from '../demo/format';
import { ActionFoot, Bench, CameraStill, Checklist, Confirmation, Fact, Facts, HoldRow, Plate, QueueList, ReasonField, SectionTitle, SourceMarker, useKeyAction } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-03 Border gate: admit by plate against the agency's entry and the BNSW manifest; exit lanes run the automated check.

function EntryBench({ onDone }) {
  const p = usePort();
  const t = useT();
  const queue = p.state.visits.filter((v) => v.stage === 'Expected');
  const [sel, setSel] = useState(queue[0]?.id);
  const [typing, setTyping] = useState(false);
  const [typedPlate, setTypedPlate] = useState('');
  const [reason, setReason] = useState('');
  const v = p.visit(sel) ?? queue[0];
  const checks = v ? p.admissionChecks(v) : [];
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
        <QueueList
          title="Expected trucks"
          items={queue}
          selected={v?.id}
          onSelect={(id) => { setSel(id); setTyping(false); }}
          empty="No truck expected. Trucks appear here once a tagged agency enters them, or when one arrives with a Car Pass."
          render={(x) => (
            <>
              <Plate>{x.plate}</Plate>
              <Typography variant="caption" color="text.secondary" component="div">{x.late ? `Car Pass ${x.carPass} · manifest not in IBMS` : x.enteredAt ? `Entered ${formatDuration(x.enteredAt)} ago` : 'Not entered by an agency'}</Typography>
            </>
          )}
        />
      }
      center={v ? (
        <Stack spacing={2.5}>
          <Plate size="hero">{v.plate}</Plate>
          {v.late && <Alert severity="warning">The manifest {v.carPassManifest} on the Car Pass is not in IBMS yet. Admit on plate and Car Pass number: the visit is marked "manifest not yet available", is weighed and waits in the holding area until it is matched (EXC-04).</Alert>}
          <Facts cols={3}>
            <Fact label="Car Pass number">{v.carPass}</Fact>
            <Fact label="Vehicle class">{v.vehicleClass}, {v.axles} axles</Fact>
            <Fact label="Driver (from the Car Pass)">{v.driver.name}<br />{v.driver.nid}</Fact>
            <Fact label="Entered by">{v.enteredBy ? agencyName(v.enteredBy) : '–'}</Fact>
            <Fact label="Manifests">{v.manifests.join(', ') || v.carPassManifest}</Fact>
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
          {p.holdsOnVisit(v).map((h) => <HoldRow key={h.id} hold={h} />)}
          {typing ? (
            <Stack spacing={1.5} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2">Type the plate the camera could not read</Typography>
              <TextField label="Plate" value={typedPlate} onChange={(e) => setTypedPlate(e.target.value)} />
              <ReasonField value={reason} onChange={setReason} helper="The failed read and the typed plate are logged." />
              {typedPlate && typedPlate.replace(/\s/g, '').toUpperCase() !== v.plate.replace(/\s/g, '') && <Alert severity="error">The typed plate does not match the selected truck.</Alert>}
              <Box><Button onClick={() => setTyping(false)}>Use the camera read</Button></Box>
            </Stack>
          ) : (
            <Box><Button size="small" onClick={() => setTyping(true)}>Camera could not read the plate</Button></Box>
          )}
        </Stack>
      ) : <Typography variant="body2" color="text.secondary">Select a truck from the queue.</Typography>}
      right={v ? (
        <>
          <CameraStill lane="Lane 2" read={typing ? null : v.plate} expected={v.plate} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Checks</Typography>
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
      queue={<QueueList title="At the exit lane" items={queue} selected={v?.id} onSelect={setSel} empty="No foreign truck is waiting to leave." render={(x) => <><Plate>{x.plate}</Plate><Typography variant="caption" color="text.secondary" component="div">Unloaded {formatDateTime(x.receipt?.at)}</Typography></>} />}
      center={v ? (
        <Stack spacing={2}>
          <Plate size="hero">{v.plate}</Plate>
          <Typography variant="body2" color="text.secondary">The system decides; the operator watches. Payment is not checked for a foreign truck that unloaded here: its charges are finalized on the visit and carried on its importers' bills.</Typography>
          {checks.some((c) => c.state === 'fail') && <Alert severity="error">Held at the barrier: {checks.find((c) => c.state === 'fail').text}</Alert>}
        </Stack>
      ) : <Typography variant="body2" color="text.secondary">No truck at the exit lane.</Typography>}
      right={v ? (
        <>
          <CameraStill lane="Lane 4" read={v.plate} expected={v.plate} />
          <Checklist checks={checks} />
          <ActionFoot checks={checks} label="Run the exit check" keyHint="E" onClick={read} />
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
            <ToggleButton value="entry">Entry</ToggleButton>
            <ToggleButton value="exit">Exit lanes</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      {tab === 'entry' ? <EntryBench onDone={setMsg} /> : <ExitBench onDone={setMsg} />}
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
