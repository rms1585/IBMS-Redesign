import { useState } from 'react';
import Label from '../components/Label';
import { Alert, Box, Button, Card, Divider, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { useRole } from '../RoleContext';
import { agencyName, billTotals, importerName, usePort, useStoredState } from '../demo/PortStore';
import { formatBDT, formatBoe, formatDateTime, searchKey } from '../demo/format';
import { Confirmation, Id, ReasonField, Refusal, ResponsiveTable, SectionTitle, SourceMarker, StatusPill } from '../demo/ui';
import { useT, tr } from '../i18n/LanguageContext';
import { MISSING_PAYMENTS } from '../data/finance';

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
          <Typography variant="subtitle1">{tr("Payment ID")} <Id sx={{ typography: 'subtitle1' }}>{bill.paymentId}</Id></Typography>
          <Typography variant="body2" color="text.secondary">{agencyName(bill.party)} · {bill.for.id} · raised {formatDateTime(bill.raisedAt)} · {p.tariff.version}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>{bill.adjustment && <Label color="warning">{tr("Adjustment bill after outage")}</Label>}<StatusPill word={bill.status} /></Stack>
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
      <Typography variant="body2" color="text.secondary">{tr("A billed line never changes. A correcting line is approved by a different person.")}</Typography>
      {correcting ? (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          <TextField type="number" label={tr("Correcting amount (BDT, negative for a credit)")} value={amount} onChange={(e) => setAmount(e.target.value)} sx={{ maxWidth: 320 }} />
          <ReasonField value={reason} onChange={setReason} />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" disabled={!Number(amount) || !reason.trim()} onClick={() => { p.requestCorrection({ record: bill.paymentId, field: 'Correcting line', from: '–', to: formatBDT(Number(amount)), reason: reason.trim() }); setCorrecting(false); setAmount(''); setReason(''); onDone('Correcting line sent for approval'); }}>{tr("Send for approval")}</Button>
            <Button variant="outlined" color="inherit" onClick={() => setCorrecting(false)}>{tr("Cancel")}</Button>
          </Stack>
        </Stack>
      ) : <Button size="small" variant="outlined" sx={{ mt: 1.5 }} onClick={() => setCorrecting(true)}>{tr("Add a correcting line")}</Button>}
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
      <Typography variant="body2" color="text.secondary">{tr("Only in BNSW-down mode. Check Customs' release against the Bill of Entry number, importer and lines, then record its reference. It is marked \"Keyed from Customs' reference\" and reconciled when BNSW returns. A keyed release is not a per-truck exit note: a loaded truck without one is still held.")}</Typography>
      {!p.state.bnswDown && <Refusal title="Not available now" items={['BNSW is live, so releases arrive from Customs through BNSW. This screen is used only in BNSW-down mode.']} />}
      <TextField select label={tr("Bill of Entry")} value={boeId} onChange={(e) => setBoeId(e.target.value)} disabled={!p.state.bnswDown} sx={{ maxWidth: 420 }}>
        {waiting.map((x) => <MenuItem key={x.id} value={x.id}>{formatBoe(x)} · {importerName(x.importer)}</MenuItem>)}
      </TextField>
      {b && <Typography variant="body2">Importer {importerName(b.importer)} · {b.lines.length} line · agency {agencyName(b.agency)}</Typography>}
      <TextField label={tr("Customs' release reference")} value={ref} onChange={(e) => setRef(e.target.value)} disabled={!p.state.bnswDown} sx={{ maxWidth: 420 }} />
      <Box><Button variant="contained" disabled={!p.state.bnswDown || !b || !ref.trim()} onClick={() => { p.keyReleaseFromReference(b.id, ref.trim()); setBoeId(''); setRef(''); onDone('Release recorded from Customs\' reference'); }}>{tr("Record the release")}</Button></Box>
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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{tr("Find a bill by payment ID or Delivery Request. Payment is recorded through the bank interface; the receipt prints once the bank confirms.")}</Typography>
      <TextField label={tr("Payment ID or request")} value={q} onChange={(e) => setQ(e.target.value)} sx={{ maxWidth: 420, mb: 2 }} fullWidth />
      {k.length >= 3 && !found.length && <Typography variant="body2" color="text.secondary">{tr("Nothing matches. Check the payment ID on the C&F agent's bill.")}</Typography>}
      <Stack spacing={1.5}>
        {found.map((b) => (
          <Stack key={b.id} direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Id>{b.paymentId}</Id>
            <Typography variant="body2">{formatBDT(billTotals(b).total)}</Typography>
            <StatusPill word={b.status} />
            {b.status === 'Payment due' && <Button variant="contained" onClick={() => { p.payBill(b.id); onDone('Payment recorded. The bank confirmed it'); }}>{tr("Take payment")}</Button>}
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}

const NO_LIST = [];

// A reconciliation case that is resolved with money owed either way becomes a supplementary bill or a credit,
// raised from the case and approved by a second person (Annex 7.9; RC-3). Demo cases.
const RESOLVED_CASES = [
  { id: 'RC-BEN-2026-031', what: 'Storage counted 4 days short during the 21 Nov outage', record: 'C 601 C-48211 2026-11-12', party: '301112', amount: 3840 },
  { id: 'RC-BEN-2026-034', what: 'Weighbridge charged twice for WB 11 C 4420', record: 'V-26-4420', party: '301112', amount: -150 },
];

function Supplementary({ onDone }) {
  const { role } = useRole();
  const [raised, setRaised] = useStoredState('supplementaryBills', NO_LIST);
  const [approving, setApproving] = useState(null);
  const raise = (c) => {
    const credit = c.amount < 0;
    const id = `${credit ? 'CR' : 'SB'}-BEN-2026-${String(41 + raised.length).padStart(4, '0')}`;
    setRaised((all) => [...all, { id, caseId: c.id, amount: c.amount, by: role.person, at: new Date().toISOString(), status: 'Waiting for approval' }]);
    onDone(`${credit ? 'Credit' : 'Supplementary bill'} ${id} raised from ${c.id}; a second person approves it`);
  };
  const approve = (r) => {
    setRaised((all) => all.map((x) => (x.id === r.id ? { ...x, status: r.amount < 0 ? 'Credited' : 'Payment due', approvedBy: 'Nasrin Akter (revenue supervisor)', paymentId: r.amount < 0 ? undefined : `BLPA-BEN-${r.id.slice(-4)}-7` } : x)));
    setApproving(null);
    onDone(`${r.id} approved`);
  };
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle>{tr("Resolved reconciliation cases")}</SectionTitle>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{tr("A billed line never changes. When a case closes with money owed, raise a supplementary bill; when BLPA owes, raise a credit. Someone other than the person who raised it approves.")}</Typography>
      <ResponsiveTable rowKey={(c) => c.id} rows={RESOLVED_CASES} columns={[
        { label: 'Case', render: (c) => <><Id>{c.id}</Id><Typography variant="caption" color="text.secondary" component="div">{c.record} · {agencyName(c.party)}</Typography></> },
        { label: 'Finding', render: (c) => c.what },
        { label: 'Amount', align: 'right', nowrap: true, render: (c) => `${c.amount < 0 ? 'Credit ' : ''}${formatBDT(Math.abs(c.amount))}` },
        { label: '', align: 'right', render: (c) => { const r = raised.find((x) => x.caseId === c.id); return r ? <Label color={r.status === 'Waiting for approval' ? 'warning' : 'success'}>{r.id}: {r.status}</Label> : <Button size="small" variant="outlined" color="inherit" sx={{ whiteSpace: 'nowrap' }} onClick={() => raise(c)}>{c.amount < 0 ? 'Raise credit' : 'Raise supplementary bill'}</Button>; } },
      ]} />
      {raised.some((r) => r.status === 'Waiting for approval') && (
        <Box sx={{ mt: 3 }}>
          <SectionTitle>{tr("Waiting for a second person")}</SectionTitle>
          {raised.filter((r) => r.status === 'Waiting for approval').map((r) => (
            <Stack key={r.id} direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ py: 1 }}>
              <Id>{r.id}</Id>
              <Typography variant="body2" sx={{ flex: 1 }}>{formatBDT(Math.abs(r.amount))}{r.amount < 0 ? ' credit' : ''} · raised by {r.by}</Typography>
              {approving === r.id
                ? <Typography variant="caption" color="text.secondary">{tr("Approving as the revenue supervisor (demo: a different person)")}</Typography>
                : null}
              <Button size="small" variant="contained" onClick={() => (approving === r.id ? approve(r) : setApproving(r.id))}>{approving === r.id ? 'Confirm approval' : 'Approve as revenue supervisor'}</Button>
            </Stack>
          ))}
        </Box>
      )}
    </Card>
  );
}

// Customs decisions taken outside IBMS are recorded by the revenue desk with their reference (Annex 7.9).
const DECISION_KINDS = ['Temporary-import terms', 'Disposal decision', "Settlement of BLPA's dues on a lot"];
const SEED_DECISIONS = [
  { id: 'CD-1', kind: 'Temporary-import terms', record: 'C 601 C-47920 2026-10-30', ref: 'Customs TI-BEN-2026-118', terms: 'Re-export by 2027-01-28; bank guarantee BDT 420,000', by: 'Rokeya Begum', at: new Date(Date.now() - 6 * 86400000).toISOString() },
];

function CustomsDecisions({ onDone }) {
  const { role } = useRole();
  const [decisions, setDecisions] = useStoredState('customsDecisions', SEED_DECISIONS);
  const [kind, setKind] = useState(DECISION_KINDS[0]);
  const [record, setRecord] = useState('');
  const [ref, setRef] = useState('');
  const [terms, setTerms] = useState('');
  const why = !record.trim() ? 'Enter the Bill of Entry or lot.' : !ref.trim() ? "Enter Customs' reference." : !terms.trim() ? 'Enter the terms or decision.' : '';
  const save = () => {
    setDecisions((all) => [...all, { id: `CD-${all.length + 1}`, kind, record: record.trim(), ref: ref.trim(), terms: terms.trim(), by: role.person, at: new Date().toISOString() }]);
    setRecord(''); setRef(''); setTerms('');
    onDone(`${kind} recorded against ${record.trim()}`);
  };
  return (
    <Stack spacing={2}>
      <Card sx={{ p: 3 }}>
        <SectionTitle>{tr("Record a Customs decision")}</SectionTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{tr("For decisions Customs takes outside IBMS. Each is marked \"Keyed from Customs' reference\" and the bills on that record follow it.")}</Typography>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0,1fr))' } }}>
          <TextField select label={tr("Decision")} value={kind} onChange={(e) => setKind(e.target.value)}>{DECISION_KINDS.map((k) => <MenuItem key={k} value={k}>{k}</MenuItem>)}</TextField>
          <TextField label={tr("Bill of Entry or lot")} placeholder="C 601 C-48211 2026-11-12" value={record} onChange={(e) => setRecord(e.target.value)} />
          <TextField label={tr("Customs' reference")} value={ref} onChange={(e) => setRef(e.target.value)} />
          <TextField label={kind === 'Temporary-import terms' ? 'Terms (re-export date, guarantee)' : 'Decision'} value={terms} onChange={(e) => setTerms(e.target.value)} />
        </Box>
        <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center" sx={{ mt: 2 }}>
          {why && <Typography variant="caption" color="text.secondary" role="status" sx={{ flex: 1 }}>{tr(why)}</Typography>}
          <Button variant="contained" disabled={Boolean(why)} onClick={save}>{tr("Record the decision")}</Button>
        </Stack>
      </Card>
      <Card sx={{ p: 3 }}>
        <ResponsiveTable rowKey={(d) => d.id} rows={[...decisions].reverse()} columns={[
          { label: 'Decision', render: (d) => <><Typography variant="subtitle2">{d.kind}</Typography><Typography variant="caption" color="text.secondary">{d.record}</Typography></> },
          { label: 'Terms', render: (d) => d.terms },
          { label: 'Reference', render: (d) => <Stack spacing={0.5} alignItems="flex-start">{d.ref}<SourceMarker source="Keyed from Customs' reference" /></Stack> },
          { label: 'Recorded', priority: 'low', render: (d) => `${d.by}, ${formatDateTime(d.at)}` },
        ]} />
      </Card>
    </Stack>
  );
}

// Finance: collections by channel, bills raised against payments received each day, and payments that did not
// arrive. Demo figures for the past days; today adds the live record.
const DAYS = [
  { day: '20 Nov', raised: 2184300, received: 2102650 },
  { day: '21 Nov', raised: 1406900, received: 1311200 },
  { day: '22 Nov', raised: 2311750, received: 2298400 },
  { day: '23 Nov', raised: 2057600, received: 2061900 },
  { day: '24 Nov', raised: 2245100, received: 2190350 },
  { day: '25 Nov', raised: 1987420, received: 1950800 },
];
const CHANNELS = [
  { channel: 'Sonali Bank e-payment', bills: 412, amount: 8423100 },
  { channel: 'Bank counter at the port', bills: 167, amount: 2611850 },
  { channel: 'Online payment gateway', bills: 88, amount: 1210350 },
];


function Finance() {
  const p = usePort();
  const today = p.state.bills.reduce((acc, b) => {
    const tot = billTotals(b);
    return { raised: acc.raised + tot.total, received: acc.received + tot.paid };
  }, { raised: 0, received: 0 });
  const days = [...DAYS, { day: 'Today so far (demo record)', ...today }];
  return (
    <Stack spacing={2}>
      <Card sx={{ p: 3 }}>
        <SectionTitle>{tr("Collections by channel, this month")}</SectionTitle>
        <ResponsiveTable rowKey={(c) => c.channel} rows={CHANNELS} columns={[
          { label: 'Channel', render: (c) => c.channel },
          { label: 'Bills paid', align: 'right', render: (c) => c.bills.toLocaleString('en-US') },
          { label: 'Collected', align: 'right', nowrap: true, render: (c) => formatBDT(c.amount) },
        ]} />
      </Card>
      <Card sx={{ p: 3 }}>
        <SectionTitle>{tr("Bills raised against payments received")}</SectionTitle>
        <ResponsiveTable rowKey={(d) => d.day} rows={days} columns={[
          { label: 'Day', render: (d) => d.day },
          { label: 'Raised', align: 'right', nowrap: true, render: (d) => formatBDT(d.raised) },
          { label: 'Received', align: 'right', nowrap: true, render: (d) => formatBDT(d.received) },
          { label: 'Difference', align: 'right', nowrap: true, render: (d) => formatBDT(d.received - d.raised) },
        ]} />
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1.5 }}>{tr("A payment can arrive the day after its bill, so a day's difference is not a loss on its own.")}</Typography>
      </Card>
      <Card sx={{ p: 3 }}>
        <SectionTitle>{tr("Payments that did not arrive")}</SectionTitle>
        <ResponsiveTable rowKey={(m) => m.id} rows={MISSING_PAYMENTS} columns={[
          { label: 'Case', render: (m) => <><Id>{m.id}</Id><Typography variant="caption" color="text.secondary" component="div">Payment ID {m.paymentId}</Typography></> },
          { label: 'Provider', priority: 'low', render: (m) => m.provider },
          { label: 'Amount', align: 'right', nowrap: true, render: (m) => formatBDT(m.amount) },
          { label: 'Open since', priority: 'low', render: (m) => m.since },
          { label: 'Status', render: (m) => m.status },
        ]} />
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1.5 }}>{tr("The bill stays unpaid until the provider confirms; no one marks it paid by hand.")}</Typography>
      </Card>
    </Stack>
  );
}

export default function Billing() {
  const p = usePort();
  const t = useT();
  const { role } = useRole();
  // Finance staff start on their own view (TR-11).
  const [tab, setTab] = useState(role.id === 'finance' ? 5 : 0);
  const [msg, setMsg] = useState('');
  if (role.id === 'bank') {
    return (<><PageHeader title="Take payment" subtitle={tr("Bank counter, Benapole")} /><BankCounter onDone={setMsg} /><Confirmation text={msg} onClose={() => setMsg('')} /></>);
  }
  const tabs = ['Bills', 'Lines not priced', 'Supplementary bills and credits', 'Customs decisions by reference', 'Release from Customs\' reference', 'Finance', 'Bank counter'];
  return (
    <>
      <PageHeader title={t('Billing and payment')} subtitle={`${p.tariff.version} · VAT 15% per line. No bill is computed from papers and no one marks a bill paid by hand.`} />
      <Card sx={{ px: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>{tabs.map((x) => <Tab key={x} label={t(x)} />)}</Tabs>
      </Card>
      <Box sx={{ mt: 2 }}>
        {tab === 0 && <Stack spacing={2}>{p.state.bills.map((b) => <BillDetail key={b.id} bill={b} onDone={setMsg} />)}</Stack>}
        {tab === 1 && <Card sx={{ p: 3 }}><SectionTitle>{tr("Lines the system could not price")}</SectionTitle><Typography variant="body2" color="text.secondary">{tr("None. A line appears here with its plain reason when no tariff rate applies, and no pass is issued while it sits on a bill.")}</Typography></Card>}
        {tab === 2 && <Supplementary onDone={setMsg} />}
        {tab === 3 && <CustomsDecisions onDone={setMsg} />}
        {tab === 4 && <Card sx={{ p: 3 }}><ReleaseFromReference onDone={setMsg} />{p.state.boes.filter((b) => b.release?.source === "Keyed from Customs' reference").map((b) => <Alert key={b.id} severity="warning" sx={{ mt: 2 }}>{formatBoe(b)}: release {b.release.ref} <SourceMarker source={b.release.source} /></Alert>)}</Card>}
        {tab === 5 && <Finance />}
        {tab === 6 && <BankCounter onDone={setMsg} />}
      </Box>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
