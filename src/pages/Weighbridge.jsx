import { useCallback, useState } from 'react';
import { Alert, Box, Button, Card, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { tareValid, usePort } from '../demo/PortStore';
import { billableTonnes, formatDateTime, formatDuration, formatKg, formatTonnes } from '../demo/format';
import { ActionFoot, Bench, CameraStill, Checklist, Confirmation, Fact, Facts, HoldRow, Plate, QueueList, ReasonField, ResponsiveTable, SectionTitle, SourceMarker, StatusPill, useKeyAction } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

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
            empty="No truck to weigh. Admitted trucks appear here in order."
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
              <Typography variant="h2">{kg ? kg.toLocaleString('en-US') : '–'} <Typography component="span" variant="h5">kg</Typography></Typography>
              {item.job !== 'empty' && <Typography variant="body2" color="text.secondary">Billable {formatTonnes(billableTonnes(kg))} (rounded up to the next whole tonne)</Typography>}
            </Card>
            {item.job !== 'empty' && !v.late && (
              <Facts cols={3}>
                <Fact label="Declared weight">{formatKg(declared)}</Fact>
                <Fact label="Difference">{kg ? `${(kg - declared).toLocaleString('en-US')} kg (${(((kg - declared) / declared) * 100).toFixed(1)}%)` : '–'}</Fact>
                <Fact label="Tolerance">{p.port.tolerancePct}%</Fact>
              </Facts>
            )}
            {over && <Alert severity="warning">Weight over tolerance. Capturing it flags the reading to the BLPA and Customs officials; IBMS places no hold of its own. An authorized official may place one.</Alert>}
            {p.holdsOnVisit(v).map((h) => <HoldRow key={h.id} hold={h} />)}
            {typing ? (
              <Stack spacing={1.5} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2">Scale down: type the weight</Typography>
                <TextField label="Weight (kg)" type="number" value={typedKg} onChange={(e) => setTypedKg(e.target.value)} />
                <ReasonField value={reason} onChange={setReason} helper="The weight is flagged for review; the failed reading and the typed entry are logged." />
                <Box><Button variant="outlined" color="inherit" onClick={() => setTyping(false)}>Use the scale reading</Button></Box>
              </Stack>
            ) : (
              <Box><Button size="small" variant="outlined" color="inherit" onClick={() => setTyping(true)}>Scale or plate reader down</Button></Box>
            )}
          </Stack>
        ) : <Typography variant="body2" color="text.secondary">Select a truck from the worklist.</Typography>}
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
      <Card sx={{ p: 3, mt: 3 }}>
        <SectionTitle>Weighing history</SectionTitle>
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
