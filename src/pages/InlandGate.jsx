import { useCallback, useState } from 'react';
import { Alert, Card, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { agencyName, usePort } from '../demo/PortStore';
import { dayKey, formatBoe, formatDateTime, formatKg, searchKey } from '../demo/format';
import { ActionFoot, ApprovalRow, Bench, CameraStill, Checklist, Confirmation, Fact, Facts, Id, Plate, QueueList, Refusal, SectionTitle, StatusPill, useKeyAction } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-10: local trucks enter on an Entry Pass against a paid Delivery Request slot and leave on one automated check.

function EntryBench({ onDone }) {
  const p = usePort();
  const t = useT();
  const slots = p.state.deliveryRequests.flatMap((d) => d.slots.map((sl, i) => ({ d, sl, i, id: `${d.id}-${i}` }))).filter((x) => x.sl.plate && !x.sl.enteredAt);
  const [sel, setSel] = useState(slots[0]?.id);
  const [typed, setTyped] = useState('');
  const item = slots.find((x) => x.id === sel) ?? slots[0];
  const typedMatch = typed && slots.find((x) => searchKey(x.sl.plate) === searchKey(typed));
  const bill = item && p.bill(item.d.bill);
  const checks = item ? [
    { label: 'Plate bound to an open slot', state: 'pass', text: `Slot ${item.i + 1} of ${item.d.id}` },
    { label: 'Delivery Request paid', state: bill.status === 'Paid' ? 'pass' : 'fail', text: bill.status === 'Paid' ? `${bill.paymentId}, provider confirmed` : `Bill ${bill.paymentId} is unpaid. The truck waits until the agency pays.` },
    { label: 'Delivery day', state: dayKey(item.d.day) === dayKey() ? 'pass' : 'fail', text: dayKey(item.d.day) === dayKey() ? 'Today' : `The request is for ${dayKey(item.d.day)}.` },
  ] : [];
  const admit = useCallback(() => {
    if (!item || checks.some((c) => c.state === 'fail')) return;
    p.admitLocal(item.sl.plate);
    onDone(`Admitted ${item.sl.plate}. Entry Pass issued`);
  }, [item, checks, p, onDone]);
  useKeyAction('a', admit, Boolean(item));
  return (
    <Bench
      context={[{ label: 'Port', value: 'Benapole' }, { label: 'Gate', value: 'Inland gate 1' }, { label: 'Lane', value: 'Lane 1 (entry)' }, { label: 'Expected local trucks', value: slots.length }]}
      queue={
        <Stack spacing={2}>
          <TextField size="small" label="Plate at the lane" value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && typedMatch) setSel(typedMatch.id); }} helperText="Type a plate and press Enter" />
          {typed && !typedMatch && <Refusal title="Not admitted" items={[`${typed} is not bound to an open slot of a paid Delivery Request. The agency keys the plate in its portal first.`]} />}
          <QueueList title="Expected local trucks" items={slots} selected={item?.id} onSelect={setSel} empty="No local truck expected. Plates appear once an agency keys them against a paid Delivery Request." render={(x) => <><Plate>{x.sl.plate}</Plate><Typography variant="caption" color="text.secondary" component="div">{x.d.id}</Typography></>} />
        </Stack>
      }
      center={item ? (
        <Stack spacing={2}>
          <Plate size="hero">{item.sl.plate}</Plate>
          <Facts cols={2}>
            <Fact label="Delivery Request">{item.d.id}</Fact>
            <Fact label="Bill of Entry"><Id>{formatBoe(p.boe(item.d.boe))}</Id></Fact>
            <Fact label="C&F agency">{agencyName(item.d.agency)}</Fact>
            <Fact label="Quantity">{formatKg(item.d.kg)}</Fact>
            <Fact label="Trucks">{item.d.slots.filter((s) => s.enteredAt).length} of {item.d.ceiling} entered</Fact>
          </Facts>
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
  const [tab, setTab] = useState('entry');
  const [msg, setMsg] = useState('');
  return (
    <>
      <PageHeader
        title={t('Inland gate')}
        action={
          <ToggleButtonGroup exclusive size="small" value={tab} onChange={(_, v) => v && setTab(v)} aria-label="Inland gate view">
            <ToggleButton value="entry">Entry</ToggleButton>
            <ToggleButton value="exit">Exit lanes</ToggleButton>
            <ToggleButton value="passes">Exit Passes</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      {tab === 'entry' && <EntryBench onDone={setMsg} />}
      {tab === 'exit' && <ExitBench onDone={setMsg} />}
      {tab === 'passes' && <PassRegister />}
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
