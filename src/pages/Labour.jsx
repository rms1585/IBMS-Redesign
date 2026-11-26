import { useState } from 'react';
import { Box, Button, Card, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import Label from '../components/Label';
import { PageHeader } from '../components/common';
import { usePort, useStoredState } from '../demo/PortStore';
import { formatBDT, formatDateTime, formatKg } from '../demo/format';
import { Confirmation, Plate, ReasonField, ResponsiveTable, SectionTitle, StatusPill } from '../demo/ui';
import { useT, tr } from '../i18n/LanguageContext';

// M-19: the labour association is tagged to each job; IBMS never tags individual labourers.
// Attendance shows present or absent only; raw card reads never appear on a screen.

const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();
// Worker profiles with their RFID card. `inAt` without `outAt` means the card is in active use inside the port.
const WORKERS = [
  { card: 'RF-BEN-0412', name: 'Md. Rahim Uddin', nid: 'NID ••••3381', association: 'Association No. 1', shift: 'Morning', since: '2019', inAt: hoursAgo(3.5) },
  { card: 'RF-BEN-0413', name: 'Abul Kashem', nid: 'NID ••••0927', association: 'Association No. 1', shift: 'Morning', since: '2021', inAt: hoursAgo(3.4) },
  { card: 'RF-BEN-0588', name: 'Shah Alam', nid: 'NID ••••7710', association: 'Association No. 2', shift: 'Morning', since: '2016' },
  { card: 'RF-BEN-0590', name: 'Nurul Islam', nid: 'NID ••••4452', association: 'Association No. 2', shift: 'Evening', since: '2023' },
  { card: 'RF-BEN-0601', name: 'Jasim Mia', nid: 'NID ••••1209', association: 'Association No. 3', shift: 'Morning', since: '2024', blocked: 'Card reported lost on 18 Nov' },
];
const present = (w) => (w.inAt && !w.outAt) || Boolean(w.manual);

const CONTRACT = [
  { what: 'Labour, unloading and loading', qty: 412, unit: 'tonne', rate: 38 },
  { what: 'Forklift, 3 t', qty: 64, unit: 'hour', rate: 650 },
  { what: 'Mobile crane, 25 t', qty: 18, unit: 'lift', rate: 1200 },
];

export default function Labour() {
  const p = usePort();
  const t = useT();
  const [tab, setTab] = useState(0);
  const [workers, setWorkers] = useStoredState('labourWorkers', WORKERS);
  const [msg, setMsg] = useState('');
  const jobs = p.state.visits.filter((v) => v.receipt?.association).map((v) => ({ v, kg: Object.values(v.receipt.lines ?? {}).reduce((s, l) => s + l.receiptKg, 0) }));
  const total = CONTRACT.reduce((s, l) => s + l.qty * l.rate, 0);
  return (
    <>
      <PageHeader title={t('Labour and roster')} subtitle={tr("Labourers enter on RFID cards. The association chooses who comes; the job records the labour and equipment actually used.")} />
      <Card sx={{ px: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          {['Tagged jobs', 'Attendance', 'Workers', 'Contractor bill'].map((x) => <Tab key={x} label={x} />)}
        </Tabs>
      </Card>
      <Card sx={{ p: 3, mt: 2 }}>
        {tab === 0 && (
          <ResponsiveTable
            rowKey={(r) => r.v.id}
            rows={jobs}
            empty={tr("No job is tagged yet. The shed tags the association as soon as a consignment is posted.")}
            columns={[
              { label: 'Truck', render: (r) => <Plate>{r.v.plate}</Plate> },
              { label: 'Place', render: (r) => r.v.posting?.shed },
              { label: 'Association', render: (r) => r.v.receipt.association },
              { label: 'Handled', align: 'right', priority: 'low', render: (r) => (r.kg ? formatKg(r.kg) : '–') },
              { label: 'Job times', priority: 'low', render: (r) => (r.v.receipt.times ? `${formatDateTime(r.v.receipt.times.start)} to ${formatDateTime(r.v.receipt.times.end)}` : 'Not entered yet') },
              { label: 'Status', render: (r) => <StatusPill word={r.v.receipt.locked ? 'Locked' : 'Open'} /> },
            ]}
          />
        )}
        {tab === 1 && <Attendance workers={workers} setWorkers={setWorkers} onDone={setMsg} />}
        {tab === 2 && (
          <ResponsiveTable
            rowKey={(w) => w.card}
            rows={workers}
            columns={[
              { label: 'Worker', render: (w) => <><Typography variant="subtitle2">{w.name}</Typography><Typography variant="caption" color="text.secondary">{w.nid} · working since {w.since}</Typography></> },
              { label: 'Card', render: (w) => w.card },
              { label: 'Association', priority: 'low', render: (w) => w.association },
              { label: 'Shift', priority: 'low', render: (w) => w.shift },
              { label: 'Card status', render: (w) => (w.blocked ? <Label color="error">Blocked: {w.blocked}</Label> : <Label color="success">{tr("Active")}</Label>) },
            ]}
          />
        )}
        {tab === 3 && (
          <>
            <SectionTitle>{tr("Labour and equipment contractor · November 2026")}</SectionTitle>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{tr("Built from the association tags, requisitions and each lift and shift, at the contract rates. It is not a wage calculation; BLPA accounts approve it for payment outside IBMS.")}</Typography>
            <ResponsiveTable
              rowKey={(l) => l.what}
              rows={CONTRACT}
              columns={[
                { label: 'For', render: (l) => l.what },
                { label: 'Quantity × rate', nowrap: true, render: (l) => `${l.qty} ${l.unit} × ${formatBDT(l.rate)}` },
                { label: 'Amount', align: 'right', render: (l) => formatBDT(l.qty * l.rate) },
              ]}
            />
            <Stack alignItems="flex-end" sx={{ mt: 2 }}><Typography variant="subtitle1">Total {formatBDT(total)}</Typography></Stack>
          </>
        )}
      </Card>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}

// The card reader at the labour gate, simulated: a card is read in and out; one card has one active use at a time.
// Present without a read needs a reason, and the record says so (M-19).
function Attendance({ workers, setWorkers, onDone }) {
  const [card, setCard] = useState('');
  const [manualFor, setManualFor] = useState(null);
  const [reason, setReason] = useState('');
  const [refusal, setRefusal] = useState('');
  const update = (c, change) => setWorkers((l) => l.map((w) => (w.card === c ? { ...w, ...change } : w)));
  const read = (direction) => {
    const w = workers.find((x) => x.card.toUpperCase() === card.trim().toUpperCase());
    const inside = w && w.inAt && !w.outAt;
    const problem = !w ? `Card ${card.trim()} is not on any worker profile.`
      : w.blocked ? `${w.card} is blocked: ${w.blocked}.`
        : direction === 'in' && inside ? `${w.card} is already in active use inside the port since ${formatDateTime(w.inAt)}. A card has one active use at a time.`
          : direction === 'out' && !inside ? `${w.card} has no open entry to close.` : '';
    if (problem) { setRefusal(problem); return; }
    update(w.card, direction === 'in' ? { inAt: new Date().toISOString(), outAt: null } : { outAt: new Date().toISOString() });
    setRefusal(''); setCard('');
    onDone(`${w.name} read ${direction}`);
  };
  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{tr("From the card readers at labour points. A card has one active use at a time and is read again at exit. Nobody is marked present without a device record or a recorded reason.")}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }} sx={{ mb: 2 }}>
        <TextField size="small" label={tr("Card read at the labour gate")} placeholder="RF-BEN-0588" value={card} onChange={(e) => { setCard(e.target.value); setRefusal(''); }} error={Boolean(refusal)} helperText={refusal || 'Demo reader: type a card number'} sx={{ minWidth: 280 }} />
        <Button variant="outlined" color="inherit" disabled={!card.trim()} onClick={() => read('in')}>{tr("Read in")}</Button>
        <Button variant="outlined" color="inherit" disabled={!card.trim()} onClick={() => read('out')}>{tr("Read out")}</Button>
      </Stack>
      <ResponsiveTable
        rowKey={(r) => r.card}
        rows={workers}
        columns={[
          { label: 'Card', render: (r) => r.card },
          { label: 'Name', render: (r) => r.name },
          { label: 'Shift', priority: 'low', render: (r) => r.shift },
          { label: 'Record', priority: 'low', render: (r) => (r.manual ? `By hand: ${r.manual}` : r.inAt ? `In ${formatDateTime(r.inAt)}${r.outAt ? `, out ${formatDateTime(r.outAt)}` : ''}` : 'No read today') },
          { label: 'Status', align: 'right', render: (r) => (present(r) ? <StatusPill word="Present" /> : (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end"><StatusPill word="Absent" />{!r.blocked && <Button size="small" color="inherit" onClick={() => { setManualFor(r); setReason(''); }}>{tr("Mark present")}</Button>}</Stack>
          )) },
        ]}
      />
      {manualFor && (
        <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Mark {manualFor.name} present without a card read</Typography>
          <ReasonField value={reason} onChange={setReason} helper="For example: reader at point 2 out of order. Recorded as marked by hand." />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 1.5 }}>
            <Button variant="outlined" color="inherit" onClick={() => setManualFor(null)}>{tr("Cancel")}</Button>
            <Button variant="contained" disabled={!reason.trim()} onClick={() => { update(manualFor.card, { manual: reason.trim() }); onDone(`${manualFor.name} marked present by hand`); setManualFor(null); }}>{tr("Mark present")}</Button>
          </Stack>
        </Box>
      )}
    </>
  );
}
