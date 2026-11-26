import { useCallback, useState } from 'react';
import { Alert, Box, Button, Card, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { tareValid, usePort, useStoredState } from '../demo/PortStore';
import Label from '../components/Label';
import { usePortRules } from '../demo/portRules';
import { billableTonnes, formatDateTime, formatDuration, formatKg, formatTonnes } from '../demo/format';
import { ActionFoot, Bench, CameraStill, Checklist, Confirmation, Fact, Facts, HoldRow, Plate, QueueList, ReasonField, ResponsiveTable, SectionTitle, SourceMarker, StatusPill, useKeyAction } from '../demo/ui';
import { useT, tr } from '../i18n/LanguageContext';

// M-04: the reading comes from the scale against the visit opened at the gate. Over tolerance is a flag, never a hold.

// What the demo scale sends: a seeded reading, or the declared weight plus a small variance.
const scaleReading = (v, declared) => v.pendingReadingKg ?? Math.round((declared || 12000) * 1.012 + 380);

export default function Weighbridge() {
  const p = usePort();
  const t = useT();
  const [msg, setMsg] = useState('');
  const loaded = p.state.visits.filter((v) => v.gateIn && !v.weigh && v.stage !== 'Exited');
  const empty = p.state.visits.filter((v) => v.receipt?.locked && v.stage !== 'Exited' && !tareValid(v.plate) && !v.emptyWeighed);
  const queue = [...loaded.map((v) => ({ ...v, job: 'loaded' })), ...empty.map((v) => ({ ...v, job: 'empty' }))];
  const [sel, setSel] = useState(queue[0]?.id);
  const [typing, setTyping] = useState(false);
  const [typedKg, setTypedKg] = useState('');
  const [reason, setReason] = useState('');
  const [rules] = usePortRules();
  const [seal, setSeal] = useState('');
  const item = queue.find((x) => x.id === sel) ?? queue[0];
  const v = item && p.visit(item.id);
  const declared = v ? p.declaredKgOfVisit(v) : 0;
  const live = v ? (item.job === 'empty' ? 7420 : scaleReading(v, declared)) : null;
  const kg = typing ? Number(typedKg) : live;
  const checks = v ? [
    { label: 'Truck fully on the scale', state: 'pass', text: 'In position, deck camera confirms.' },
    { label: 'Plate read at the scale matches the visit', state: typing ? 'info' : 'pass', text: typing ? 'Plate typed by hand.' : v.plate },
    item.job === 'empty'
      ? { label: 'Empty weighing required', state: 'info', text: 'No valid tare on file under BLPA\'s tare rule.' }
      : { label: 'Declared weight', state: 'info', text: v.late ? 'Manifest not yet available: the tolerance check runs once it is matched.' : `${formatKg(declared)} from BNSW${v.manifests.length > 1 ? `, ${v.manifests.length} manifests added together` : ''}.` },
  ] : [];
  const capture = useCallback(() => {
    if (!v || !kg) return;
    p.captureWeight(v.id, kg, { typedReason: typing ? reason : undefined, empty: item.job === 'empty' });
    setMsg(`Weight captured for ${v.plate}`);
    setTyping(false); setTypedKg(''); setReason('');
    setSel(queue.find((x) => x.id !== v.id)?.id);
  }, [v, kg, typing, reason, item, p, queue]);
  useKeyAction('c', capture, Boolean(v) && !typing);
  const over = !v?.late && item?.job !== 'empty' && declared > 0 && kg && Math.abs(kg - declared) / declared > p.port.tolerancePct / 100;
  const history = p.state.visits.filter((x) => x.weigh).sort((a, b) => (a.weigh.at < b.weigh.at ? 1 : -1));

  return (
    <>
      <PageHeader title={t('Weighbridge')} subtitle={`Tolerance ${p.port.tolerancePct}% (${p.port.toleranceVersion}). Tare rule for every port: ${p.port.tareRule}.`} />
      <Bench
        context={[
          { label: 'Port', value: 'Benapole' },
          { label: 'Scale', value: 'Scale 2' },
          { label: 'To weigh', value: queue.length },
          { label: 'Weighed today', value: history.filter((x) => formatDateTime(x.weigh.at).startsWith('Today')).length },
        ]}
        queue={
          <QueueList
            title="Worklist"
            items={queue}
            selected={item?.id}
            onSelect={(id) => { setSel(id); setTyping(false); }}
            empty={tr("No truck to weigh. Admitted trucks appear here in order.")}
            render={(x) => (
              <>
                <Plate>{x.plate}</Plate>
                <Typography variant="caption" color="text.secondary" component="div">{x.job === 'empty' ? 'Empty weighing' : `${x.manifests.length || 'No'} manifest · waiting ${formatDuration(x.gateIn.at)}`}</Typography>
              </>
            )}
          />
        }
        center={v ? (
          <Stack spacing={2.5}>
            <Plate size="hero">{v.plate}</Plate>
            <Card variant="outlined" sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">{typing ? 'Weight typed by hand' : 'Live weight from Scale 2'}</Typography>
              <Typography variant="h2">{kg ? kg.toLocaleString('en-US') : '–'} <Typography component="span" variant="h5">{tr("kg")}</Typography></Typography>
              {item.job !== 'empty' && <Typography variant="body2" color="text.secondary">Billable {formatTonnes(billableTonnes(kg))} (rounded up to the next whole tonne)</Typography>}
            </Card>
            {item.job !== 'empty' && !v.late && (
              <Facts cols={3}>
                <Fact label={tr("Declared weight")}>{formatKg(declared)}</Fact>
                <Fact label={tr("Difference")}>{kg ? `${(kg - declared).toLocaleString('en-US')} kg (${(((kg - declared) / declared) * 100).toFixed(1)}%)` : '–'}</Fact>
                <Fact label={tr("Tolerance")}>{p.port.tolerancePct}%</Fact>
              </Facts>
            )}
            {rules.fields.sealNumber && item.job !== 'empty' && <TextField size="small" label={tr("Seal number")} value={seal} onChange={(e) => setSeal(e.target.value)} helperText={tr("Shown because this port records seal numbers (Port setup)")} sx={{ maxWidth: 280 }} />}
            {over && <Alert severity="warning">{tr("Weight over tolerance. Capturing it flags the reading to the BLPA and Customs officials; IBMS places no hold of its own. An authorized official may place one.")}</Alert>}
            {p.holdsOnVisit(v).map((h) => <HoldRow key={h.id} hold={h} />)}
            {typing ? (
              <Stack spacing={1.5} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2">{tr("Scale down: type the weight")}</Typography>
                <TextField label={tr("Weight (kg)")} type="number" value={typedKg} onChange={(e) => setTypedKg(e.target.value)} />
                <ReasonField value={reason} onChange={setReason} helper="The weight is flagged for review; the failed reading and the typed entry are logged." />
                <Box><Button variant="outlined" color="inherit" onClick={() => setTyping(false)}>{tr("Use the scale reading")}</Button></Box>
              </Stack>
            ) : (
              <Box><Button size="small" variant="outlined" color="inherit" onClick={() => setTyping(true)}>{tr("Scale or plate reader down")}</Button></Box>
            )}
          </Stack>
        ) : <Typography variant="body2" color="text.secondary">{tr("Select a truck from the worklist.")}</Typography>}
        right={v ? (
          <>
            <CameraStill lane="Scale 2" read={typing ? null : v.plate} expected={v.plate} />
            <Checklist checks={checks} />
            <ActionFoot
              checks={checks}
              label={t('Capture weight')}
              keyHint="C"
              onClick={capture}
              extraBlocker={typing && (!Number(typedKg) || !reason.trim()) ? { label: 'Typed weight', text: 'Type the weight and give a reason.' } : undefined}
            />
          </>
        ) : null}
      />
      <UnmatchedReadings visits={queue} onDone={setMsg} />
      <StoneWeighBack onDone={setMsg} />
      <Card sx={{ p: 3, mt: 3 }}>
        <SectionTitle>{tr("Weighing history")}</SectionTitle>
        <ResponsiveTable
          rowKey={(x) => x.id}
          rows={history}
          columns={[
            { label: 'Time', render: (x) => formatDateTime(x.weigh.at) },
            { label: 'Plate', render: (x) => <Plate>{x.plate}</Plate> },
            { label: 'Weight', align: 'right', render: (x) => formatKg(x.weigh.kg) },
            { label: 'Declared weight', align: 'right', priority: 'low', render: (x) => (x.weigh.declaredKg ? formatKg(x.weigh.declaredKg) : '–') },
            { label: 'Billable', align: 'right', priority: 'low', render: (x) => formatTonnes(billableTonnes(x.weigh.kg)) },
            { label: 'Status', render: (x) => <Stack direction="row" spacing={1}>{x.weigh.overTolerance ? <StatusPill word="Weight over tolerance" /> : <StatusPill word="Weighed" />}<SourceMarker source={x.weigh.source} /></Stack> },
          ]}
        />
      </Card>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}

// A reading the scale sent with no plate that matches an open visit (plate unread, truck not admitted, a second
// pass). It never becomes a weight on its own: the supervisor ties it to a visit or voids it with a reason (M-04).
const SEED_UNMATCHED = [
  { id: 'RAW-2026-0418', at: new Date(Date.now() - 42 * 60000).toISOString(), kg: 18640, plateRead: 'WB 2? D 11??', status: 'Waiting' },
  { id: 'RAW-2026-0421', at: new Date(Date.now() - 12 * 60000).toISOString(), kg: 7380, plateRead: 'No plate read', status: 'Waiting' },
];

function UnmatchedReadings({ visits, onDone }) {
  const p = usePort();
  const [readings, setReadings] = useStoredState('unmatchedReadings', SEED_UNMATCHED);
  const [open, setOpen] = useState(null);
  const [visitId, setVisitId] = useState('');
  const [reason, setReason] = useState('');
  const close = () => { setOpen(null); setVisitId(''); setReason(''); };
  const settle = (r, status, note) => {
    setReadings((all) => all.map((x) => (x.id === r.id ? { ...x, status, note } : x)));
    close();
  };
  const tie = (r) => {
    const v = p.visit(visitId);
    p.captureWeight(v.id, r.kg, { typedReason: `Tied by the supervisor from unmatched reading ${r.id}: ${reason}` });
    settle(r, 'Tied', `${v.plate}`);
    onDone(`Reading ${r.id} tied to ${v.plate}`);
  };
  const waiting = readings.filter((r) => r.status === 'Waiting');
  return (
    <Card sx={{ p: 3, mt: 3 }}>
      <SectionTitle>{tr("Unmatched readings · supervisor")}</SectionTitle>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{tr("The scale sent these readings with no plate that matches an open visit. A reading becomes a weight only when the supervisor ties it to a visit; otherwise it is voided with a reason. Both are logged.")}</Typography>
      {readings.length === 0 ? <Typography variant="body2" color="text.secondary">{tr("No unmatched reading.")}</Typography> : (
        <ResponsiveTable rowKey={(r) => r.id} rows={readings} columns={[
          { label: 'Reading', render: (r) => <><Typography variant="subtitle2">{r.id}</Typography><Typography variant="caption" color="text.secondary">{formatDateTime(r.at)}</Typography></> },
          { label: 'Plate read', render: (r) => r.plateRead },
          { label: 'Weight', align: 'right', render: (r) => formatKg(r.kg) },
          { label: 'Status', align: 'right', render: (r) => (r.status === 'Waiting' ? (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" variant="outlined" color="inherit" onClick={() => { setOpen({ r, act: 'tie' }); setVisitId(visits.find((v) => v.job === 'loaded')?.id ?? ''); }}>{tr("Tie to a visit")}</Button>
              <Button size="small" variant="outlined" color="inherit" onClick={() => setOpen({ r, act: 'void' })}>{tr("Void")}</Button>
            </Stack>
          ) : <Label color={r.status === 'Tied' ? 'success' : 'default'}>{r.status}{r.note ? `: ${r.note}` : ''}</Label>) },
        ]} />
      )}
      {open && (
        <Stack spacing={1.5} sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle2">{open.act === 'tie' ? `Tie ${open.r.id} (${formatKg(open.r.kg)}) to a visit` : `Void ${open.r.id}`}</Typography>
          {open.act === 'tie' && (
            <TextField select size="small" label={tr("Visit on the scale worklist")} value={visitId} onChange={(e) => setVisitId(e.target.value)}>
              {visits.filter((v) => v.job === 'loaded').map((v) => <MenuItem key={v.id} value={v.id}>{v.plate} · {v.carPass}</MenuItem>)}
            </TextField>
          )}
          <ReasonField value={reason} onChange={setReason} helper={open.act === 'tie' ? 'For example: deck camera shows the truck; plate reader missed it.' : 'For example: second pass of a truck already weighed.'} />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button variant="outlined" color="inherit" onClick={close}>{tr("Cancel")}</Button>
            <Button variant="contained" disabled={!reason.trim() || (open.act === 'tie' && !visitId)} onClick={() => (open.act === 'tie' ? tie(open.r) : (settle(open.r, 'Voided', reason.trim()), onDone(`Reading ${open.r.id} voided`)))}>{open.act === 'tie' ? 'Tie the reading' : 'Void the reading'}</Button>
          </Stack>
        </Stack>
      )}
      {waiting.length > 0 && <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>{waiting.length} waiting</Typography>}
    </Card>
  );
}

// Stone route (Bhomra and Burimari, where the port has an outside yard): the shipment is billed up front, so the
// truck back from the unloading zone is weighed empty first and only a charge above the prepaid bill goes on a
// top-up bill, paid before the final exit (I5.8, N-I8.3). The route stays disabled until NBR and BLPA decide its
// control (Section 3.4.5), so this is shown as a preview with demo trucks.
const STONE_RATE_PER_T = 140;
const SEED_STONE = [
  { id: 'ST-BHO-0091', plate: 'WB 51 K 2208', port: 'Bhomra', loadedKg: 24300, prepaidT: 13, prepaidTk: 13 * STONE_RATE_PER_T + 300, nights: 1 },
  { id: 'ST-BHO-0094', plate: 'WB 49 H 7715', port: 'Bhomra', loadedKg: 21900, prepaidT: 15, prepaidTk: 15 * STONE_RATE_PER_T + 300, nights: 0 },
];

function StoneWeighBack({ onDone }) {
  const [trucks, setTrucks] = useStoredState('stoneWeighBack', SEED_STONE);
  const weigh = (t) => setTrucks((all) => all.map((x) => (x.id === t.id ? { ...x, emptyKg: 7400 + (x.id.endsWith('1') ? 60 : -40) } : x)));
  const topUpOf = (t) => {
    const netT = Math.ceil((t.loadedKg - t.emptyKg) / 1000);
    const due = netT * STONE_RATE_PER_T + 300 + t.nights * 250;
    return { netT, due, topUp: Math.max(0, due - t.prepaidTk) };
  };
  const raise = (t) => {
    const { topUp } = topUpOf(t);
    setTrucks((all) => all.map((x) => (x.id === t.id ? { ...x, topUpRaised: topUp } : x)));
    onDone(topUp ? `Top-up bill of Tk ${topUp.toLocaleString('en-US')} raised for ${t.plate}` : `No top-up due for ${t.plate}; the exit lock waits only on Customs' release`);
  };
  return (
    <Card sx={{ p: 3, mt: 3 }}>
      <SectionTitle>{tr("Stone trucks back from the unloading zone")}</SectionTitle>
      <Alert severity="info" sx={{ mb: 2 }}>{tr("Preview for Bhomra and Burimari. The stone route stays disabled in IBMS until NBR and BLPA decide its control; Benapole has no outside yard.")}</Alert>
      <ResponsiveTable rowKey={(t) => t.id} rows={trucks} columns={[
        { label: 'Truck', render: (t) => <><Plate>{t.plate}</Plate><Typography variant="caption" color="text.secondary" component="div">{t.port} · prepaid {t.prepaidT} t, Tk {t.prepaidTk.toLocaleString('en-US')}</Typography></> },
        { label: 'Loaded weight', align: 'right', priority: 'low', render: (t) => formatKg(t.loadedKg) },
        { label: 'Empty weight', align: 'right', render: (t) => (t.emptyKg ? formatKg(t.emptyKg) : '–') },
        { label: 'Top-up', align: 'right', render: (t) => {
          if (!t.emptyKg) return <Button size="small" variant="outlined" color="inherit" onClick={() => weigh(t)}>{tr("Weigh empty")}</Button>;
          const { netT, topUp } = topUpOf(t);
          if (t.topUpRaised !== undefined) return <Label color={t.topUpRaised ? 'warning' : 'success'}>{t.topUpRaised ? `Top-up Tk ${t.topUpRaised.toLocaleString('en-US')} raised` : 'Nothing above the prepaid bill'}</Label>;
          return <Stack alignItems="flex-end" spacing={0.5}><Typography variant="caption" color="text.secondary">{netT} t net{t.nights ? `, ${t.nights} night` : ''}: Tk {topUp.toLocaleString('en-US')} above prepaid</Typography><Button size="small" variant="contained" onClick={() => raise(t)}>{topUp ? 'Raise top-up bill' : 'Confirm no top-up'}</Button></Stack>;
        } },
      ]} />
    </Card>
  );
}
