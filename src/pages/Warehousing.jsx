import { useCallback, useState } from 'react';
import { Alert, Box, Button, Card, Checkbox, FormControlLabel, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { useRole } from '../RoleContext';
import { importerName, usePort } from '../demo/PortStore';
import { daysSince, formatBoe, formatDateTime, formatKg } from '../demo/format';
import { ActionFoot, ApprovalRow, Bench, Checklist, Confirmation, Fact, Facts, HoldRow, Id, Plate, QueueList, ReasonField, ResponsiveTable, SectionTitle, SourceMarker, StatusPill, useKeyAction } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-06: shed work on the handheld; the warehouse manager enters job times; loads lock with the Customs ARO's co-approval.

const ASSOCIATIONS = ['Benapole Port Labour Association No. 1', 'Benapole Port Labour Association No. 2', 'Benapole Port Labour Association No. 3'];

const toLocalInput = (iso) => (iso ? new Date(new Date(iso).getTime() + 6 * 3600000).toISOString().slice(0, 16) : '');
const fromLocalInput = (v) => new Date(`${v}:00+06:00`).toISOString();

function JobTimes({ v, onDone }) {
  const p = usePort();
  const { role } = useRole();
  const canEnter = role.id === 'warehouse-manager' || role.id === 'super-admin' || role.id === 'port-incharge';
  const [start, setStart] = useState(toLocalInput(v.receipt?.times?.start));
  const [end, setEnd] = useState(toLocalInput(v.receipt?.times?.end));
  const bad = start && end && end < start;
  if (v.receipt?.times && !canEnter) return <Typography variant="body2">Unloading {formatDateTime(v.receipt.times.start)} to {formatDateTime(v.receipt.times.end)} · entered by {v.receipt.times.by}</Typography>;
  if (!canEnter) return <Typography variant="body2" color="text.secondary">The warehouse manager enters the start and end times of the unloading. The handheld has no Start or End button.</Typography>;
  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <TextField type="datetime-local" label="Unloading started" value={start} onChange={(e) => setStart(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField type="datetime-local" label="Unloading ended" value={end} onChange={(e) => setEnd(e.target.value)} InputLabelProps={{ shrink: true }} error={Boolean(bad)} helperText={bad ? 'The end cannot be earlier than the start.' : ' '} />
      </Box>
      <Box><Button variant="outlined" disabled={!start || !end || Boolean(bad)} onClick={() => { p.setJobTimes(v.id, fromLocalInput(start), fromLocalInput(end)); onDone('Unloading times entered'); }}>Enter times</Button></Box>
    </Stack>
  );
}

function UnloadingBench({ onDone }) {
  const p = usePort();
  const queue = p.state.visits.filter((v) => (v.posting && v.posting.accepted === null) || (v.stage === 'Posted' && !v.receipt?.locked));
  const [sel, setSel] = useState(queue[0]?.id);
  const v = queue.find((x) => x.id === sel) ?? queue[0];
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [counts, setCounts] = useState({});
  const lines = v ? p.linesOfVisit(v) : [];
  const deciding = v && v.posting.accepted === null;
  const checks = v && !deciding ? [
    { label: 'Labour association tagged', state: v.receipt?.association ? 'pass' : 'fail', text: v.receipt?.association ?? 'Tag the labour association to the job first.' },
    { label: 'Each line counted or taken from the declaration', state: 'pass', text: `${lines.length} line${lines.length === 1 ? '' : 's'}` },
    { label: 'Unloading times', state: 'info', text: v.receipt?.times ? 'Entered by the warehouse manager' : 'The warehouse manager can enter them after the lock.' },
  ] : [];
  const lock = useCallback(() => {
    if (!v || deciding || checks.some((c) => c.state === 'fail')) return;
    p.lockReceipt(v.id, counts);
    onDone(`Receipt of ${v.plate} locked`);
    setCounts({});
  }, [v, deciding, checks, counts, p, onDone]);
  useKeyAction('l', lock, Boolean(v) && !deciding);
  const accept = useCallback(() => {
    if (!v || !deciding) return;
    p.decidePosting(v.id, true);
    onDone('Posting accepted. The agency has the drop point');
  }, [v, deciding, p, onDone]);
  useKeyAction('a', accept, Boolean(v) && deciding && !rejecting);
  const single = lines.length === 1;
  const diff = v?.weigh ? v.weigh.kg - lines.reduce((s, l) => s + l.declaredKg, 0) : 0;
  return (
    <Bench
      context={[{ label: 'Port', value: 'Benapole' }, { label: 'Shed', value: 'All sheds (demo)' }, { label: 'Arriving', value: queue.length }]}
      queue={<QueueList title="Proposed to this shed" items={queue} selected={v?.id} onSelect={(id) => { setSel(id); setRejecting(false); }} empty="No truck is posted to this shed." render={(x) => <><Plate>{x.plate}</Plate><Typography variant="caption" color="text.secondary" component="div">{x.posting.shed} · {x.posting.accepted === null ? 'Proposal to decide' : 'Accepted, to receive'}</Typography></>} />}
      center={v ? (
        <Stack spacing={2.5}>
          <Plate size="hero">{v.plate}</Plate>
          <Facts cols={2}>
            <Fact label="Proposed place">{v.posting.shed}</Fact>
            <Fact label="Weighbridge net">{formatKg(v.weigh?.kg)}</Fact>
            <Fact label="Proposed by">{v.posting.proposedBy ?? '–'}</Fact>
          </Facts>
          {p.holdsOnVisit(v).map((h) => <HoldRow key={h.id} hold={h} />)}
          {deciding ? (
            rejecting ? (
              <Stack spacing={1.5}>
                <ReasonField value={reason} onChange={setReason} label="Reason for the rejection" />
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" color="error" disabled={!reason.trim()} onClick={() => { p.decidePosting(v.id, false, reason.trim()); setRejecting(false); setReason(''); onDone('Posting rejected'); }}>Reject posting</Button>
                  <Button onClick={() => setRejecting(false)}>Cancel</Button>
                </Stack>
              </Stack>
            ) : <Box><Button onClick={() => setRejecting(true)}>Reject with a reason</Button></Box>
          ) : (
            <>
              <SectionTitle>Labour association</SectionTitle>
              <TextField select label="Tag the labour association to this job" value={v.receipt?.association ?? ''} onChange={(e) => { p.tagAssociation(v.id, e.target.value); onDone('Labour association tagged and notified'); }} helperText="The association chooses who comes. IBMS never tags individual labourers." sx={{ maxWidth: 420 }}>
                {ASSOCIATIONS.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </TextField>
              <SectionTitle>Receipt per line</SectionTitle>
              {lines.map((l) => {
                const c = counts[l.id] ?? { packages: l.packages, counted: true };
                const receiptKg = single ? Math.max(l.declaredKg, v.weigh?.kg ?? 0) : l.declaredKg;
                return (
                  <Card key={l.id} variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Line {l.no}: {l.goods} · {importerName(l.importer)}</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mt: 1.5 }}>
                      <TextField size="small" type="number" label="Packages counted" value={c.packages} disabled={!c.counted} onChange={(e) => setCounts({ ...counts, [l.id]: { ...c, packages: Number(e.target.value) } })} sx={{ width: 180 }} />
                      <FormControlLabel control={<Checkbox checked={!c.counted} onChange={(e) => setCounts({ ...counts, [l.id]: { packages: l.packages, counted: !e.target.checked } })} />} label="Taken from the declaration" />
                      {!c.counted && <SourceMarker source="Declared" />}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Receipt weight {formatKg(receiptKg)}: {single ? 'the higher of the declared weight and the weighbridge net.' : 'this line\'s own declared weight.'}</Typography>
                  </Card>
                );
              })}
              {!single && diff !== 0 && <Alert severity="warning">The truck weighed {formatKg(Math.abs(diff))} {diff > 0 ? 'more' : 'less'} than its lines declare. The difference is flagged on the truck and never spread over the lines; each importer pays on its own line's weight.</Alert>}
              <SectionTitle>Job times</SectionTitle>
              <JobTimes v={v} onDone={onDone} />
            </>
          )}
        </Stack>
      ) : <Typography variant="body2" color="text.secondary">Nothing to receive.</Typography>}
      right={v ? (
        deciding ? (
          <>
            <Checklist checks={[{ label: 'Free space confirmed by posting', state: 'pass', text: v.posting.shed }]} />
            <ActionFoot label="Accept posting" keyHint="A" onClick={accept} />
          </>
        ) : (<><Checklist checks={checks} /><ActionFoot checks={checks} label="Lock receipt" keyHint="L" onClick={lock} /></>)
      ) : null}
    />
  );
}

function LoadingBench({ onDone }) {
  const p = usePort();
  const queue = p.state.deliveryRequests.flatMap((d) => d.slots.map((s, i) => ({ d, s, i, id: `${d.id}-${i}` }))).filter((x) => x.s.enteredAt && !x.s.load);
  const [sel, setSel] = useState(queue[0]?.id);
  const item = queue.find((x) => x.id === sel) ?? queue[0];
  const [kg, setKg] = useState('');
  const b = item && p.boe(item.d.boe);
  const lockedOnDr = item ? item.d.slots.reduce((s, x) => s + (x.load?.kg ?? 0), 0) : 0;
  const drLeft = item ? item.d.kg - lockedOnDr : 0;
  const balance = b ? p.releasedBalance(b) - p.inFlightKg(b) : 0;
  const holds = b ? [...p.holdsOnBoe(b), ...p.holdsOnPlate(item.s.plate)] : [];
  const n = Number(kg);
  const checks = item ? [
    { label: 'Entry Pass scanned', state: 'pass', text: item.s.entryPass },
    { label: 'Paid Delivery Request', state: p.bill(item.d.bill).status === 'Paid' ? 'pass' : 'fail', text: item.d.id },
    { label: 'No hold on the goods', state: holds.length ? 'fail' : 'pass', text: holds.length ? `${holds[0].body} hold: ${holds[0].reason}` : 'None open.' },
    { label: 'Within the request and the released balance', state: !n ? 'info' : n <= Math.min(drLeft, balance) ? 'pass' : 'fail', text: `Up to ${formatKg(Math.min(drLeft, balance))} on this truck.` },
  ] : [];
  const lockLoad = useCallback(() => {
    if (!item || !n || checks.some((c) => c.state === 'fail')) return;
    p.lockLoad(item.d.id, item.i, n);
    onDone(`Load locked on ${item.s.plate}. Exit Pass prepared and approved by the shed`);
    setKg('');
  }, [item, n, checks, p, onDone]);
  const changes = p.state.truckChanges.filter((tc) => !tc.done && !tc.shed);
  return (
    <>
      <Bench
        context={[{ label: 'Port', value: 'Benapole' }, { label: 'Local trucks to load', value: queue.length }]}
        queue={<QueueList title="Local trucks inside" items={queue} selected={item?.id} onSelect={setSel} empty="No local truck is waiting to load. Trucks appear once admitted at the inland gate on an Entry Pass." render={(x) => <><Plate>{x.s.plate}</Plate><Typography variant="caption" color="text.secondary" component="div">{x.s.entryPass}</Typography></>} />}
        center={item ? (
          <Stack spacing={2.5}>
            <Plate size="hero">{item.s.plate}</Plate>
            <Facts cols={2}>
              <Fact label="Delivery Request">{item.d.id}</Fact>
              <Fact label="Bill of Entry"><Id>{formatBoe(b)}</Id></Fact>
              <Fact label="Left on the request">{formatKg(drLeft)}</Fact>
            </Facts>
            <TextField type="number" label="Quantity loaded (kg)" value={kg} onChange={(e) => setKg(e.target.value)} sx={{ maxWidth: 260 }} />
            <Typography variant="body2" color="text.secondary">Locking the load approves the Exit Pass for these goods as shed in-charge. The Customs Assistant Revenue Officer co-approves it in the Customs workspace.</Typography>
          </Stack>
        ) : <Typography variant="body2" color="text.secondary">No truck selected.</Typography>}
        right={item ? (<><Checklist checks={checks} /><ActionFoot checks={checks} label="Lock load" keyHint="L" onClick={lockLoad} disabled={!n} /></>) : null}
      />
      {changes.length > 0 && (
        <Card sx={{ p: 3, mt: 3 }}>
          <SectionTitle>Truck changes waiting for the shed in-charge</SectionTitle>
          {changes.map((tc) => (
            <Box key={tc.id} sx={{ mb: 2 }}>
              <Typography variant="body2">{tc.pass}: {tc.from} to {tc.to}. {tc.reason} (proposed by {tc.proposedBy})</Typography>
              <ApprovalRow title="Shed in-charge" approval={tc.shed} action={<Button size="small" variant="contained" onClick={() => { p.approveTruckChange(tc.id, 'shed'); onDone('Truck change approved'); }}>Approve truck change</Button>} />
            </Box>
          ))}
        </Card>
      )}
    </>
  );
}

function Custody() {
  const p = usePort();
  const lots = p.state.visits.filter((v) => v.receipt?.locked).flatMap((v) => p.linesOfVisit(v).map((l) => ({ v, l, b: p.boeOfLine(l.id) }))).filter(({ b }) => !b?.closed);
  return (
    <Card sx={{ p: 3 }}>
      <ResponsiveTable
        rowKey={(r) => r.l.id}
        rows={lots}
        empty="No cargo in custody."
        columns={[
          { label: 'Line', render: (r) => <Id>{r.l.id}</Id> },
          { label: 'Goods', render: (r) => r.l.goods },
          { label: 'Place', render: (r) => r.v.posting?.shed },
          { label: 'In custody', align: 'right', render: (r) => formatKg(r.v.receipt.lines[r.l.id].receiptKg - (r.b?.deliveredKg ?? 0)) },
          { label: 'Storage', align: 'right', priority: 'low', render: (r) => `${daysSince(r.v.receipt.at)} days` },
          { label: 'Status', render: (r) => { const h = p.holdsOnManifest(r.l.manifest); const d = daysSince(r.v.receipt.at); return <StatusPill word={h.length ? 'Customs hold' : d > 30 ? 'Overdue' : r.b?.release ? 'Released' : 'Awaiting Customs'} />; } },
        ]}
      />
    </Card>
  );
}

export default function Warehousing() {
  const t = useT();
  const [tab, setTab] = useState('unload');
  const [msg, setMsg] = useState('');
  return (
    <>
      <PageHeader
        title={t('Warehousing')}
        action={
          <ToggleButtonGroup exclusive size="small" value={tab} onChange={(_, v) => v && setTab(v)} aria-label="Warehousing view">
            <ToggleButton value="unload">Unloading</ToggleButton>
            <ToggleButton value="load">Loading</ToggleButton>
            <ToggleButton value="custody">Custody</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      {tab === 'unload' && <UnloadingBench onDone={setMsg} />}
      {tab === 'load' && <LoadingBench onDone={setMsg} />}
      {tab === 'custody' && <Custody />}
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
