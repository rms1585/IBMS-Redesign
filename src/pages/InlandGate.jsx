import { useCallback, useState } from 'react';
import { Alert, Box, Button, Card, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import ExportCargo from './ExportCargo';
import { PageHeader } from '../components/common';
import { agencyName, usePort, useStoredState } from '../demo/PortStore';
import { useTransferRequests } from '../demo/transfers';
import { dayKey, formatBoe, formatDateTime, formatKg, searchKey } from '../demo/format';
import { ActionFoot, ApprovalRow, Bench, CameraStill, Checklist, Confirmation, Fact, Facts, Id, Plate, QueueList, Refusal, SectionTitle, StatusPill, useKeyAction } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-10: local trucks enter on an Entry Pass against a paid Delivery Request slot and leave on one automated check.

function EntryBench({ onDone }) {
  const p = usePort();
  const t = useT();
  const { fromPortal, admit: admitReceiving } = useTransferRequests();
  // Local trucks on a paid Delivery Request slot, and receiving trucks keyed on a transfer request (M-10).
  const slots = [
    ...p.state.deliveryRequests.flatMap((d) => d.slots.map((sl, i) => ({ d, sl, i, id: `${d.id}-${i}` }))).filter((x) => x.sl.plate && !x.sl.enteredAt),
    ...fromPortal.flatMap((r) => r.plates.filter((pl) => !r.admitted[pl]).map((pl) => ({ r, sl: { plate: pl }, id: `${r.id}-${pl}` }))),
  ];
  const [sel, setSel] = useState(slots[0]?.id);
  const [typed, setTyped] = useState('');
  const item = slots.find((x) => x.id === sel) ?? slots[0];
  const typedMatch = typed && slots.find((x) => searchKey(x.sl.plate) === searchKey(typed));
  // An extra truck above the ceiling enters only on its own paid top-up bill (EXC-16).
  const bill = item?.d && p.bill(item.sl.extraBill ?? item.d.bill);
  const foreignVisit = item?.r && p.state.visits.find((v) => v.plate === item.r.foreign && v.stage !== 'Exited');
  const foreignHolds = item?.r ? p.holdsOnPlate(item.r.foreign) : [];
  const checks = item?.r ? [
    { label: 'Plate on a transfer request', state: 'pass', text: `${item.r.id}, ${item.r.agency}` },
    { label: 'Foreign truck inside the port', state: foreignVisit ? 'pass' : 'fail', text: foreignVisit ? `${item.r.foreign} is inside (${foreignVisit.stage}).` : `${item.r.foreign} is not inside the port, so there is nothing to transfer from.` },
    { label: 'No hold on the foreign truck', state: foreignHolds.length ? 'fail' : 'pass', text: foreignHolds.length ? `${foreignHolds[0].body} hold: ${foreignHolds[0].reason}` : 'None open.' },
  ] : item ? [
    { label: 'Plate bound to an open slot', state: 'pass', text: `Slot ${item.i + 1} of ${item.d.id}` },
    { label: item.sl.extraBill ? 'Top-up bill for the extra truck paid' : 'Delivery Request paid', state: bill.status === 'Paid' ? 'pass' : 'fail', text: bill.status === 'Paid' ? `${bill.paymentId}, provider confirmed` : `Bill ${bill.paymentId} is unpaid. The truck waits until the agency pays.` },
    ...(item.d.closed ? [{ label: 'Delivery Request open', state: 'fail', text: `${item.d.id} was closed for the day.` }] : []),
    { label: 'Delivery day', state: dayKey(item.d.day) === dayKey() ? 'pass' : 'fail', text: dayKey(item.d.day) === dayKey() ? 'Today' : `The request is for ${dayKey(item.d.day)}.` },
  ] : [];
  const admit = useCallback(() => {
    if (!item || checks.some((c) => c.state === 'fail')) return;
    if (item.r) {
      const pass = admitReceiving(item.r.id, item.sl.plate);
      onDone(`Admitted ${item.sl.plate} for ${item.r.id}. Entry Pass ${pass} issued`);
      return;
    }
    p.admitLocal(item.sl.plate);
    onDone(`Admitted ${item.sl.plate}. Entry Pass issued`);
  }, [item, checks, p, onDone, admitReceiving]);
  useKeyAction('a', admit, Boolean(item));
  return (
    <Bench
      context={[{ label: 'Port', value: 'Benapole' }, { label: 'Gate', value: 'Inland gate 1' }, { label: 'Lane', value: 'Lane 1 (entry)' }, { label: 'Expected local trucks', value: slots.length }]}
      queue={
        <Stack spacing={2}>
          <TextField size="small" label="Plate at the lane" value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && typedMatch) setSel(typedMatch.id); }} helperText="Type a plate and press Enter" />
          {typed && !typedMatch && <Refusal title="Not admitted" items={[`${typed} is not bound to an open slot of a paid Delivery Request. The agency keys the plate in its portal first.`]} />}
          <QueueList title="Expected local trucks" items={slots} selected={item?.id} onSelect={setSel} empty="No local truck expected. Plates appear once an agency keys them against a paid Delivery Request." render={(x) => <><Plate>{x.sl.plate}</Plate><Typography variant="caption" color="text.secondary" component="div">{x.d ? x.d.id : `Receiving truck · ${x.r.id}`}</Typography></>} />
        </Stack>
      }
      center={item ? (
        <Stack spacing={2}>
          <Plate size="hero">{item.sl.plate}</Plate>
          {item.r ? (
            <Facts cols={2}>
              <Fact label="Transfer request">{item.r.id}</Fact>
              <Fact label="Foreign truck"><Plate>{item.r.foreign}</Plate></Fact>
              <Fact label="C&F agency">{item.r.agency}</Fact>
              <Fact label="Line">{item.r.line}</Fact>
            </Facts>
          ) : (
          <Facts cols={2}>
            <Fact label="Delivery Request">{item.d.id}</Fact>
            <Fact label="Bill of Entry"><Id>{formatBoe(p.boe(item.d.boe))}</Id></Fact>
            <Fact label="C&F agency">{agencyName(item.d.agency)}</Fact>
            <Fact label="Quantity">{formatKg(item.d.kg)}</Fact>
            <Fact label="Trucks">{item.d.slots.filter((s) => s.enteredAt).length} of {item.d.ceiling} entered</Fact>
          </Facts>
          )}
        </Stack>
      ) : <Typography variant="body2" color="text.secondary">No truck selected.</Typography>}
      right={item ? (<><CameraStill lane="Lane 1" read={item.sl.plate} expected={item.sl.plate} /><Checklist checks={checks} /><ActionFoot checks={checks} label={t('Admit truck')} keyHint="A" onClick={admit} /></>) : null}
    />
  );
}

function ExitBench({ onDone }) {
  const p = usePort();
  const queue = p.state.passes.filter((x) => !x.used).map((x) => ({ ...x }));
  const [sel, setSel] = useState(queue[0]?.id);
  const pass = queue.find((x) => x.id === sel) ?? queue[0];
  const result = pass ? p.inlandExitChecks(pass.plate) : null;
  const checks = result?.checks ?? [];
  const blocked = checks.some((c) => c.state === 'fail');
  const run = useCallback(() => {
    if (!pass || blocked) return;
    p.exitInland(pass.id);
    onDone(`${pass.plate} left. Exit Pass ${pass.id} consumed`);
  }, [pass, blocked, p, onDone]);
  useKeyAction('e', run, Boolean(pass) && !blocked);
  return (
    <Bench
      context={[{ label: 'Port', value: 'Benapole' }, { label: 'Gate', value: 'Inland gate 1' }, { label: 'Lane', value: 'Lane 3 (exit, automated)' }, { label: 'Loaded trucks inside', value: queue.length }]}
      queue={<QueueList title="At the exit lane" items={queue} selected={pass?.id} onSelect={setSel} empty="No loaded truck is waiting to leave." render={(x) => <><Plate>{x.plate}</Plate><Typography variant="caption" color="text.secondary" component="div">{x.id}</Typography></>} />}
      center={pass ? (
        <Stack spacing={2}>
          <Plate size="hero">{pass.plate}</Plate>
          <Typography variant="body2" color="text.secondary">The plate is read and IBMS checks the pass, the plate against the locked load, Customs' exit note and every hold in one step. No one keys anything.</Typography>
          {blocked && <Alert severity="error"><Typography variant="subtitle2">Held at the barrier</Typography>{checks.find((c) => c.state === 'fail').text}</Alert>}
          <Facts cols={2}>
            <Fact label="Exit Pass"><Id>{pass.id}</Id></Fact>
            <Fact label="Goods">{pass.goods}</Fact>
            <Fact label="Locked load">{formatKg(pass.kg)}</Fact>
          </Facts>
        </Stack>
      ) : <Typography variant="body2" color="text.secondary">No truck at the exit lane.</Typography>}
      right={pass ? (<><CameraStill lane="Lane 3" read={pass.plate} expected={pass.plate} /><Checklist checks={checks} /><ActionFoot checks={checks} label="Run the exit check" keyHint="E" onClick={run} /></>) : null}
    />
  );
}

// ----- Other exits (M2 Annex 3.7 Table 31, Annex 7.10) -----

// Demo vehicles for the exits besides local trucks on an Exit Pass. Each exit type checks only its own
// conditions; gate staff never key anything except a plate the reader failed to read, with a reason (EXC-01).
const OTHER_EXITS = [
  { id: 'OX-1', plate: 'Jessore-TA 14-2207', type: 'receiving', title: 'Receiving truck, perishable transfer', detail: 'Transfer TR-2026-0091 from WB 27 C 5512 · onion 9,800 kg', pass: 'EP-2026-0418', passPaid: true, exitNote: true, foreignLeft: true },
  { id: 'OX-2', plate: 'Khulna-TA 11-5530', type: 'receiving', title: 'Receiving truck, perishable transfer', detail: 'Transfer TR-2026-0092 from WB 33 A 6630 · apple 7,200 kg', pass: 'EP-2026-0419', passPaid: true, exitNote: true, foreignLeft: false, foreignPlate: 'WB 33 A 6630' },
  { id: 'OX-3', plate: 'WB 19 F 0719', type: 'export', title: 'Loaded export truck', detail: 'Bill of Export E 601 E-20417 2026-11-25 · jute yarn 18,400 kg', pass: 'XP-2026-0077', passPaid: true, exitNote: true, boeStatus: 'Valid' },
  { id: 'OX-4', plate: 'WB 07 E 3310', type: 'export', title: 'Loaded export truck', detail: 'Bill of Export E 601 E-20388 2026-11-23 · garments 6,100 kg', pass: 'XP-2026-0071', passPaid: true, exitNote: false, boeStatus: 'Cancelled by Customs' },
  { id: 'OX-5', plate: 'Jessore-TA 12-8841', type: 'stone', title: 'Stone truck to the outside yard', detail: 'Outside-delivery order OD-2026-0031 · boulders 24,000 kg', exitNote: false, controlledMovement: true },
  { id: 'OX-6', plate: 'WB 15 C 2210', type: 'emptyExport', title: 'Empty export truck leaving inland', detail: 'Unloaded at the border for consignment E-20402 · return fee BDT 230', feeOwed: 230, feePaid: false },
  { id: 'OX-7', plate: 'WB 21 D 6618', type: 'emptyExport', title: 'Empty export truck leaving inland', detail: 'Unloaded at the border for consignment E-20402 · return fee paid', feeOwed: 230, feePaid: true },
  { id: 'OX-8', plate: 'WB 29 B 4471', type: 'returned', title: 'Returned export truck leaving inland', detail: 'Refused at the zero line · return bill BDT 460 paid', returnPass: 'RIP-2026-0012', returnPassValid: true },
  { id: 'OX-9', plate: 'DHAKA-METRO-GA-22-1180', type: 'selfDriven', title: 'Self-driven vehicle off a train', detail: 'Rail consignment RC-2026-0044 · new tractor', pass: 'EP-2026-0420', passPaid: true, exitNote: true },
];

function otherExitChecks(x, p) {
  const holds = p.holdsOnPlate(x.plate);
  const noHold = { label: 'No hold or BGB stop', state: holds.length ? 'fail' : 'pass', text: holds.length ? `${holds[0].body} hold: ${holds[0].reason ?? 'placed on this truck'}.` : 'None on this truck.' };
  const pass = (label) => ({ label, state: x.passPaid ? 'pass' : 'fail', text: x.passPaid ? `${x.pass}, issued once the bill was paid, valid today and unused.` : 'No paid pass for this plate.' });
  const note = { label: "Customs' exit note for this vehicle", state: x.exitNote ? 'pass' : 'fail', text: x.exitNote ? 'Verified from BNSW.' : 'No exit note for this vehicle.' };
  switch (x.type) {
    case 'receiving':
      return [pass('Exit Pass'), note, { label: 'Foreign truck has left first', state: x.foreignLeft ? 'pass' : 'fail', text: x.foreignLeft ? 'The foreign truck of this transfer has exited.' : `${x.foreignPlate} is still inside: a receiving truck cannot leave before the foreign truck (M-10).` }, noHold];
    case 'export':
      return [{ label: 'Bill of Export', state: x.boeStatus === 'Valid' ? 'pass' : 'fail', text: x.boeStatus === 'Valid' ? 'Valid.' : `${x.boeStatus}: the truck is refused.` }, pass('Export pass'), note, noHold];
    case 'stone':
      return [
        { label: 'Outside yards switched on', state: p.port.modules.outsideYard ? 'pass' : 'fail', text: p.port.modules.outsideYard ? 'The outside-yard route is on at this port.' : 'Outside yards are switched off at Benapole (Port setup, step 2).' },
        { label: "Exit note or controlled-movement proof", state: x.exitNote || x.controlledMovement ? 'pass' : 'fail', text: x.exitNote ? "Customs' exit note verified." : x.controlledMovement ? 'Written NBR/BLPA controlled-movement procedure with contemporaneous proof.' : 'Neither: the truck stays inside the fence.' },
        noHold,
      ];
    case 'emptyExport':
      return [{ label: 'Return fee', state: !x.feeOwed || x.feePaid ? 'pass' : 'fail', text: !x.feeOwed ? 'None owed.' : x.feePaid ? `BDT ${x.feeOwed} paid.` : `BDT ${x.feeOwed} owed and not paid.` }, noHold];
    case 'returned':
      return [{ label: 'Return-inland pass', state: x.returnPassValid ? 'pass' : 'fail', text: x.returnPassValid ? `${x.returnPass}, issued once the return bill was paid, valid and unused, on this plate.` : 'No valid return-inland pass.' }, noHold];
    case 'selfDriven':
      return [{ label: 'Rail module on', state: p.port.modules.rail ? 'pass' : 'fail', text: p.port.modules.rail ? 'Rail consignment recorded at this port.' : 'Rail is switched off at Benapole.' }, pass('Exit Pass'), note, noHold];
    default:
      return [noHold];
  }
}

const NO_EXITS = [];

function OtherExitsBench({ onDone }) {
  const p = usePort();
  const [done, setDone] = useStoredState('otherExitsDone', NO_EXITS);
  const queue = OTHER_EXITS.filter((x) => !done.some((d) => d.id === x.id));
  const [sel, setSel] = useState(queue[0]?.id);
  const x = queue.find((q) => q.id === sel) ?? queue[0];
  const [readerFailed, setReaderFailed] = useState(false);
  const [typed, setTyped] = useState('');
  const [reason, setReason] = useState('');
  const typedOk = !readerFailed || (searchKey(typed) === searchKey(x?.plate ?? '') && reason.trim().length > 3);
  const checks = x ? [
    readerFailed
      ? { label: 'Plate keyed by hand (EXC-01)', state: typedOk ? 'pass' : 'fail', text: typedOk ? `Keyed with the reason "${reason.trim()}"; the check still runs and the event is flagged.` : 'Type the plate exactly and give a reason.' }
      : { label: 'Plate read', state: 'pass', text: 'Read by the camera.' },
    ...otherExitChecks(x, p),
  ] : [];
  const blocked = checks.some((c) => c.state === 'fail');
  const run = useCallback(() => {
    if (!x || blocked) return;
    setDone((d) => [...d, { id: x.id, at: new Date().toISOString(), keyed: readerFailed ? reason.trim() : null }]);
    onDone(`${x.plate} left: ${x.title.toLowerCase()}`);
    setReaderFailed(false); setTyped(''); setReason('');
  }, [x, blocked, setDone, onDone, readerFailed, reason]);
  useKeyAction('e', run, Boolean(x) && !blocked);
  return (
    <Bench
      context={[{ label: 'Port', value: 'Benapole' }, { label: 'Gate', value: 'Inland gate 1' }, { label: 'Lane', value: 'Lane 4 (exit, automated)' }, { label: 'Waiting', value: queue.length }]}
      queue={<QueueList title="Other exits" items={queue} selected={x?.id} onSelect={(id) => { setSel(id); setReaderFailed(false); setTyped(''); setReason(''); }} empty="No other vehicle is waiting to leave." render={(q) => <><Plate>{q.plate}</Plate><Typography variant="caption" color="text.secondary" component="div">{q.title}</Typography></>} />}
      center={x ? (
        <Stack spacing={2}>
          <Plate size="hero">{x.plate}</Plate>
          <Typography variant="subtitle2">{x.title}</Typography>
          <Typography variant="body2" color="text.secondary">{x.detail}</Typography>
          {blocked && <Alert severity="error"><Typography variant="subtitle2">Held at the barrier</Typography>{checks.find((c) => c.state === 'fail').text}</Alert>}
          {readerFailed ? (
            <Stack spacing={1.5}>
              <TextField label="Plate, typed from the vehicle" value={typed} onChange={(e) => setTyped(e.target.value)} />
              <TextField label="Why the reader failed" placeholder="Mud on the plate" value={reason} onChange={(e) => setReason(e.target.value)} />
            </Stack>
          ) : (
            <Box><Button size="small" variant="outlined" color="inherit" onClick={() => setReaderFailed(true)}>Plate reader failed: type the plate</Button></Box>
          )}
        </Stack>
      ) : <Typography variant="body2" color="text.secondary">No vehicle at this lane.</Typography>}
      right={x ? (<><CameraStill lane="Lane 4" read={readerFailed ? null : x.plate} expected={x.plate} /><Checklist checks={checks} /><ActionFoot checks={checks} label="Run the exit check" keyHint="E" onClick={run} /></>) : null}
    />
  );
}

function PassRegister() {
  const p = usePort();
  return (
    <Stack spacing={2}>
      {p.state.passes.map((x) => (
        <Card key={x.id} sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
            <Typography variant="subtitle1"><Id sx={{ typography: 'subtitle1' }}>{x.id}</Id></Typography>
            <Plate>{x.plate}</Plate>
            <StatusPill word={p.passStatus(x)} />
            <Typography variant="body2" color="text.secondary">{x.goods} · {formatKg(x.kg)} · valid to the end of {dayKey(x.validDay)}{x.used ? ` · used ${formatDateTime(x.used)}` : ''}</Typography>
          </Stack>
          <SectionTitle>Three named approvals</SectionTitle>
          <ApprovalRow title="Shed in-charge" approval={x.approvals.shed} />
          <ApprovalRow title="Customs Assistant Revenue Officer" approval={x.approvals.aro} />
          <ApprovalRow title="C&F authorized signer" approval={x.approvals.signer} />
        </Card>
      ))}
    </Stack>
  );
}

export default function InlandGate() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const tab = ['exit', 'other', 'passes', 'export'].includes(params.get('view')) ? params.get('view') : 'entry';
  const setTab = (v) => setParams(v === 'entry' ? {} : { view: v }, { replace: true });
  const [msg, setMsg] = useState('');
  return (
    <>
      <PageHeader
        title={t('Inland gate')}
        action={
          <ToggleButtonGroup exclusive size="small" value={tab} onChange={(_, v) => v && setTab(v)} aria-label="Inland gate view">
            <ToggleButton value="entry">Entry</ToggleButton>
            <ToggleButton value="exit">Exit lanes</ToggleButton>
            <ToggleButton value="other">{t('Other exits')}</ToggleButton>
            <ToggleButton value="passes">Exit Passes</ToggleButton>
            <ToggleButton value="export">{t('Export')}</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      {tab === 'entry' && <EntryBench onDone={setMsg} />}
      {tab === 'exit' && <ExitBench onDone={setMsg} />}
      {tab === 'other' && <OtherExitsBench onDone={setMsg} />}
      {tab === 'passes' && <PassRegister />}
      {tab === 'export' && <ExportCargo />}
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
