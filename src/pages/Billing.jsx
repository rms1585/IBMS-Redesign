import { useState } from 'react';
import Label from '../components/Label';
import { Alert, Box, Button, Card, Divider, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { useRole } from '../RoleContext';
import { agencyName, billTotals, importerName, usePort } from '../demo/PortStore';
import { formatBDT, formatBoe, formatDateTime, searchKey } from '../demo/format';
import { Confirmation, Id, ReasonField, Refusal, ResponsiveTable, SectionTitle, SourceMarker, StatusPill } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-09: bills built from recorded events and the tariff in force. Paid comes only from the provider; paid never means released.

// Right edge lines up with the Amount column: table cells pad 16px, phone row cards pad 12px.
function BillTotals({ bill, tot }) {
  const rows = [
    ['Net', formatBDT(tot.net)],
    ['VAT', formatBDT(tot.vat)],
    ['Total', formatBDT(tot.total), true],
    ['Paid', formatBDT(tot.paid)],
    ['Balance', formatBDT(tot.total - tot.paid), true],
  ];
  // The bill table runs edge to edge with 24px inside its last cell, so totals at the card's padding line up with Amount.
  return (
    <Stack alignItems="flex-end" sx={{ mt: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto', columnGap: 4, rowGap: 0.75, textAlign: 'right' }}>
        {rows.map(([label, value, strong]) => (
          <Box key={label} sx={{ display: 'contents', typography: strong ? 'subtitle2' : 'body2', color: strong ? 'text.primary' : 'text.secondary' }}>
            <Box>{label}</Box>
            <Box sx={{ color: 'text.primary' }}>{value}</Box>
          </Box>
        ))}
      </Box>
      {bill.paidAt && <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5 }}>{bill.provider}, {formatDateTime(bill.paidAt)}</Typography>}
    </Stack>
  );
}

function BillDetail({ bill, onDone }) {
  const p = usePort();
  const tot = billTotals(bill);
  const [correcting, setCorrecting] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  return (
    <Card variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="subtitle1">Payment ID <Id sx={{ typography: 'subtitle1' }}>{bill.paymentId}</Id></Typography>
          <Typography variant="body2" color="text.secondary">{agencyName(bill.party)} · {bill.for.id} · raised {formatDateTime(bill.raisedAt)} · {p.tariff.version}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>{bill.adjustment && <Label color="warning">Adjustment bill after outage</Label>}<StatusPill word={bill.status} /></Stack>
      </Stack>
      <ResponsiveTable
        rowKey={(l) => l.what}
        rows={bill.lines}
        columns={[
          { label: 'For', render: (l) => l.what },
          { label: 'Quantity × rate', nowrap: true, render: (l) => `${l.qty} ${l.unit} × ${formatBDT(l.rate)}` },
          { label: 'VAT', align: 'right', priority: 'low', render: (l) => formatBDT(l.qty * l.rate * p.tariff.vat) },
          { label: 'Amount', align: 'right', render: (l) => formatBDT(l.qty * l.rate) },
        ]}
      />
      <BillTotals bill={bill} tot={tot} />
      <Divider sx={{ mt: 2.5, mb: 2 }} />
      <Typography variant="body2" color="text.secondary">A billed line never changes. A correcting line is approved by a different person.</Typography>
      {correcting ? (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          <TextField type="number" label="Correcting amount (BDT, negative for a credit)" value={amount} onChange={(e) => setAmount(e.target.value)} sx={{ maxWidth: 320 }} />
          <ReasonField value={reason} onChange={setReason} />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" disabled={!Number(amount) || !reason.trim()} onClick={() => { p.requestCorrection({ record: bill.paymentId, field: 'Correcting line', from: '–', to: formatBDT(Number(amount)), reason: reason.trim() }); setCorrecting(false); setAmount(''); setReason(''); onDone('Correcting line sent for approval'); }}>Send for approval</Button>
            <Button variant="outlined" color="inherit" onClick={() => setCorrecting(false)}>Cancel</Button>
          </Stack>
        </Stack>
      ) : <Button size="small" variant="outlined" sx={{ mt: 1.5 }} onClick={() => setCorrecting(true)}>Add a correcting line</Button>}
    </Card>
  );
}

function ReleaseFromReference({ onDone }) {
  const p = usePort();
  const waiting = p.state.boes.filter((b) => !b.release);
  const [boeId, setBoeId] = useState('');
  const [ref, setRef] = useState('');
  const b = p.boe(boeId);
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">Only in BNSW-down mode. Check Customs' release against the Bill of Entry number, importer and lines, then record its reference. It is marked "Keyed from Customs' reference" and reconciled when BNSW returns. A keyed release is not a per-truck exit note: a loaded truck without one is still held.</Typography>
      {!p.state.bnswDown && <Refusal title="Not available now" items={['BNSW is live, so releases arrive from Customs through BNSW. This screen is used only in BNSW-down mode.']} />}
      <TextField select label="Bill of Entry" value={boeId} onChange={(e) => setBoeId(e.target.value)} disabled={!p.state.bnswDown} sx={{ maxWidth: 420 }}>
        {waiting.map((x) => <MenuItem key={x.id} value={x.id}>{formatBoe(x)} · {importerName(x.importer)}</MenuItem>)}
      </TextField>
      {b && <Typography variant="body2">Importer {importerName(b.importer)} · {b.lines.length} line · agency {agencyName(b.agency)}</Typography>}
      <TextField label="Customs' release reference" value={ref} onChange={(e) => setRef(e.target.value)} disabled={!p.state.bnswDown} sx={{ maxWidth: 420 }} />
      <Box><Button variant="contained" disabled={!p.state.bnswDown || !b || !ref.trim()} onClick={() => { p.keyReleaseFromReference(b.id, ref.trim()); setBoeId(''); setRef(''); onDone('Release recorded from Customs\' reference'); }}>Record the release</Button></Box>
    </Stack>
  );
}

function BankCounter({ onDone }) {
  const p = usePort();
  const [q, setQ] = useState('');
  const k = searchKey(q);
  const found = k.length >= 3 ? p.state.bills.filter((b) => searchKey(b.paymentId).includes(k) || searchKey(b.for.id).includes(k)) : [];
  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Find a bill by payment ID or Delivery Request. Payment is recorded through the bank interface; the receipt prints once the bank confirms.</Typography>
      <TextField label="Payment ID or request" value={q} onChange={(e) => setQ(e.target.value)} sx={{ maxWidth: 420, mb: 2 }} fullWidth />
      {k.length >= 3 && !found.length && <Typography variant="body2" color="text.secondary">Nothing matches. Check the payment ID on the C&F agent's bill.</Typography>}
      <Stack spacing={1.5}>
        {found.map((b) => (
          <Stack key={b.id} direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Id>{b.paymentId}</Id>
            <Typography variant="body2">{formatBDT(billTotals(b).total)}</Typography>
            <StatusPill word={b.status} />
            {b.status === 'Payment due' && <Button variant="contained" onClick={() => { p.payBill(b.id); onDone('Payment recorded. The bank confirmed it'); }}>Take payment</Button>}
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}

export default function Billing() {
  const p = usePort();
  const t = useT();
  const { role } = useRole();
  const [tab, setTab] = useState(0);
  const [msg, setMsg] = useState('');
  if (role.id === 'bank') {
    return (<><PageHeader title="Take payment" subtitle="Bank counter, Benapole" /><BankCounter onDone={setMsg} /><Confirmation text={msg} onClose={() => setMsg('')} /></>);
  }
  const tabs = ['Bills', 'Lines not priced', 'Release from Customs\' reference', 'Bank counter'];
  return (
    <>
      <PageHeader title={t('Billing and payment')} subtitle={`${p.tariff.version} · VAT 15% per line. No bill is computed from papers and no one marks a bill paid by hand.`} />
      <Card sx={{ px: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>{tabs.map((x) => <Tab key={x} label={x} />)}</Tabs>
      </Card>
      <Box sx={{ mt: 2 }}>
        {tab === 0 && <Stack spacing={2}>{p.state.bills.map((b) => <BillDetail key={b.id} bill={b} onDone={setMsg} />)}</Stack>}
        {tab === 1 && <Card sx={{ p: 3 }}><SectionTitle>Lines the system could not price</SectionTitle><Typography variant="body2" color="text.secondary">None. A line appears here with its plain reason when no tariff rate applies, and no pass is issued while it sits on a bill.</Typography></Card>}
        {tab === 2 && <Card sx={{ p: 3 }}><ReleaseFromReference onDone={setMsg} />{p.state.boes.filter((b) => b.release?.source === "Keyed from Customs' reference").map((b) => <Alert key={b.id} severity="warning" sx={{ mt: 2 }}>{formatBoe(b)}: release {b.release.ref} <SourceMarker source={b.release.source} /></Alert>)}</Card>}
        {tab === 3 && <BankCounter onDone={setMsg} />}
      </Box>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
