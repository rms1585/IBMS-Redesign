import { useMemo, useState } from 'react';
import { Alert, Box, Button, Card, Checkbox, FormControlLabel, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import Label from '../components/Label';
import { usePort, useStoredState } from '../demo/PortStore';
import { formatBDT, formatDateTime } from '../demo/format';
import { ResponsiveTable, SectionTitle } from '../demo/ui';
import { tr } from '../i18n/LanguageContext';

// M-13 back-entry and reconciliation (M2 Report 4.16, Annex 7.13 Table 60, Annex 24.10). When a port cannot
// reach NDC Agargaon it works on pre-numbered paper forms; afterwards the forms are back-entered (holds first,
// then oldest first), each checked by a second person, the exceptions sorted into classes A–E, and the port
// in-charge declares normal working only when the three counts agree and every D and E case has an owner.

export const FORM_TYPES = [
  { key: 'hold', name: 'Hold form', checkpoint: 'Gate (agency officer)' },
  { key: 'entry', name: 'Entry form', checkpoint: 'Border gate' },
  { key: 'weigh', name: 'Weighing form', checkpoint: 'Weighbridge' },
  { key: 'posting', name: 'Posting form', checkpoint: 'Posting' },
  { key: 'warehouse', name: 'Warehouse form', checkpoint: 'Warehouse' },
  { key: 'exit', name: 'Exit form', checkpoint: 'Inland gate' },
  { key: 'receipt', name: 'Passenger receipt', checkpoint: 'Passenger counter' },
];
const formName = (key) => FORM_TYPES.find((f) => f.key === key)?.name ?? key;

const DEFAULT_RANGES = {
  hold: { from: 1, to: 50, issued: 'Gate office' },
  entry: { from: 1001, to: 1200, issued: 'Border gate, lanes B1 and B2' },
  weigh: { from: 2001, to: 2200, issued: 'Scale 1 and Scale 2' },
  posting: { from: 3001, to: 3100, issued: 'Posting desk' },
  warehouse: { from: 4001, to: 4200, issued: 'Shed 7, 12 and 31' },
  exit: { from: 5001, to: 5200, issued: 'Inland gate, lanes I1 and I2' },
  receipt: { from: 9001, to: 9500, issued: 'Passenger counter 1 and 2' },
};

const CLASS_INFO = {
  A: { name: 'Duplicate', owner: 'Automatic', tone: 'default' },
  B: { name: 'Record match', owner: 'Port supervisor', tone: 'info' },
  C: { name: 'Value difference', owner: 'Revenue desk', tone: 'warning' },
  D: { name: 'Status contradiction', owner: 'Port supervisor', tone: 'error' },
  E: { name: 'Enforcement breach', owner: 'Customs and BLPA', tone: 'error' },
};

const NO_OUTAGE = { phase: 'normal' };
const NO_LIST = [];
const NO_MAP = {};
const nowIso = () => new Date().toISOString();
const hoursFromNow = (h) => new Date(Date.now() + h * 3600000).toISOString();

function useOutageData() {
  const p = usePort();
  const s = p.state;
  return {
    p,
    outage: s.outage ?? NO_OUTAGE,
    ranges: s.formRanges ?? DEFAULT_RANGES,
    entries: s.backEntries ?? NO_LIST,
    cases: s.outageCases ?? NO_LIST,
    set: (name, initial, update) => p.setStored(name, initial, update),
  };
}

// ----- Declarations -----

function Declarations({ data, counts }) {
  const { p, outage, cases, set } = data;
  const setOutage = (change) => set('outage', NO_OUTAGE, (o) => ({ ...o, ...change }));
  const openDE = cases.filter((c) => (c.cls === 'D' || c.cls === 'E') && !c.referred);
  const countsDiffer = counts.some((c) => c.issuedUsed !== c.entered || c.entered !== c.checked);
  const normalBlock = outage.phase !== 'recovery' ? 'Normal working is declared from recovery.'
    : countsDiffer ? 'The three counts differ at a checkpoint: every used form must be entered and checked.'
      : openDE.length ? `${openDE.length} class D or E case${openDE.length === 1 ? ' is' : 's are'} not yet referred to an owner.` : '';
  const steps = [
    { phase: 'lost', label: 'Both links lost', at: outage.lostAt },
    { phase: 'manual', label: 'Manual procedure declared', at: outage.declaredAt },
    { phase: 'linkBack', label: 'Link returned', at: outage.linkBackAt },
    { phase: 'recovery', label: 'Port declared in recovery', at: outage.recoveryAt },
    { phase: 'normal', label: 'Normal working declared', at: outage.normalAt },
  ];
  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <SectionTitle>{tr('Where Benapole stands')}</SectionTitle>
        <ResponsiveTable
          rowKey={(r) => r.label}
          rows={steps}
          columns={[
            { label: 'Step', render: (r) => r.label },
            { label: 'Recorded', align: 'right', render: (r) => (r.at ? formatDateTime(r.at) : '–') },
          ]}
        />
      </Card>
      <Card sx={{ p: 3 }}>
        <SectionTitle>{tr('Port in-charge declarations')}</SectionTitle>
        <Stack spacing={2}>
          <Row
            text="Declare the manual procedure. Staff take the pre-numbered forms at each checkpoint."
            why={outage.phase !== 'lost' ? 'Only while both links to NDC Agargaon are down (External status > Connection).' : ''}
            action="Declare manual procedure"
            onClick={() => setOutage({ phase: 'manual', declaredAt: nowIso(), by: p.actor.name })}
          />
          <Row
            text="Declare the port in recovery. Every screen then shows it, and paper records are back-entered."
            why={!outage.linkBackAt || outage.phase === 'recovery' || outage.phase === 'normal' ? 'After the link has returned (External status > Connection > Restore).' : ''}
            action="Declare recovery"
            onClick={() => setOutage({ phase: 'recovery', recoveryAt: nowIso() })}
          />
          <Row
            text="Declare normal working and sign the reconciliation report."
            why={normalBlock}
            action="Declare normal working"
            onClick={() => setOutage({ phase: 'normal', normalAt: nowIso(), signedBy: p.actor.name })}
            primary
          />
        </Stack>
      </Card>
    </Stack>
  );
}

function Row({ text, why, action, onClick, primary }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2">{tr(text)}</Typography>
        {why && <Typography variant="caption" color="text.secondary" role="status">{tr(why)}</Typography>}
      </Box>
      <Button variant={primary ? 'contained' : 'outlined'} color={primary ? 'primary' : 'inherit'} disabled={Boolean(why)} onClick={onClick} sx={{ flexShrink: 0 }}>{tr(action)}</Button>
    </Stack>
  );
}

// ----- Form ranges -----

function Ranges({ data }) {
  const { ranges, entries } = data;
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle>{tr('Pre-issued form ranges')}</SectionTitle>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{tr('Issued by BLPA in advance and recorded here. A form number outside its range, or entered twice, is refused.')}</Typography>
      <ResponsiveTable
        rowKey={(r) => r.key}
        rows={FORM_TYPES}
        columns={[
          { label: 'Form', render: (r) => <Typography variant="subtitle2">{r.name}</Typography> },
          { label: 'Range', nowrap: true, render: (r) => `${ranges[r.key].from}–${ranges[r.key].to}` },
          { label: 'Handed to', priority: 'low', render: (r) => ranges[r.key].issued },
          { label: 'Entered', align: 'right', render: (r) => entries.filter((e) => e.form === r.key).length },
        ]}
      />
    </Card>
  );
}

// ----- Back-entry -----

const EMPTY_ENTRY = { form: 'hold', no: '', eventAt: '', plate: '', what: '', charge: '', spoiled: false };

function BackEntry({ data }) {
  const { p, outage, ranges, entries, set } = data;
  const [f, setF] = useState(EMPTY_ENTRY);
  const field = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const range = ranges[f.form];
  const no = Number(f.no);
  const holdsLeft = entries.length === 0 && f.form !== 'hold';
  const problem = outage.phase !== 'recovery' ? 'Back-entry opens once the port is declared in recovery.'
    : !/^\d+$/.test(f.no) ? 'Enter the form number printed on the form.'
      : no < range.from || no > range.to ? `Form number ${f.no} is outside this port's ${formName(f.form)} range (${range.from}–${range.to}).`
        : entries.some((e) => e.form === f.form && e.no === no) ? `${formName(f.form)} ${f.no} is already entered.`
          : !f.spoiled && !f.eventAt ? 'Enter the time of the event written on the form.'
            : !f.spoiled && !f.plate.trim() ? 'Enter the plate written on the form.' : '';

  const save = () => {
    const plate = f.plate.trim().toUpperCase();
    const visit = p.state.visits.find((v) => v.plate.replace(/\s/g, '') === plate.replace(/\s/g, ''));
    const holds = visit ? p.holdsOnVisit(visit) : [];
    const id = `BE-${String(entries.length + 1).padStart(3, '0')}`;
    const entry = { id, form: f.form, no, eventAt: f.spoiled ? null : new Date(f.eventAt).toISOString(), enteredAt: nowIso(), enteredBy: p.actor.name, plate, what: f.what.trim(), charge: f.charge ? Number(f.charge) : null, spoiled: f.spoiled, checkedBy: null };
    // Sort what IBMS cannot settle into the five classes (Annex 7.13).
    const found = [];
    if (!f.spoiled) {
      if (f.form === 'weigh' && visit?.weigh && new Date(visit.weigh.at) > new Date(outage.lostAt ?? 0)) found.push({ cls: 'A', text: `${formName(f.form)} ${no}: the scale reading also reached IBMS. The paper copy is discarded and logged.` });
      if (f.form === 'entry') found.push(visit ? { cls: 'B', text: `${plate} on ${formName(f.form)} ${no} matched the truck its C&F agent pre-registered (${visit.id}); linked.`, closed: true } : { cls: 'B', text: `${plate} on ${formName(f.form)} ${no} matches no pre-registered truck.` });
      if (f.charge && f.form === 'weigh' && Number(f.charge) !== p.tariff.rates.weighbridge.rate) found.push({ cls: 'C', text: `${formName(f.form)} ${no} noted ${formatBDT(Number(f.charge))}; the tariff in force at the time is ${formatBDT(p.tariff.rates.weighbridge.rate)}. An adjustment bill is raised for the difference.`, adjust: p.tariff.rates.weighbridge.rate - Number(f.charge) });
      if ((f.form === 'posting' || f.form === 'warehouse') && holds.length) found.push({ cls: 'D', text: `${formName(f.form)} ${no} says ${plate} moved on, but IBMS holds a ${holds[0].body} hold on it. The hold stands.` });
      if (f.form === 'exit' && holds.length) found.push({ cls: 'E', text: `${plate} left on ${formName(f.form)} ${no} while under a ${holds[0].body} hold. Security incident for Customs and BLPA.` });
    }
    set('backEntries', NO_LIST, (l) => [...l, entry]);
    if (found.length) {
      set('outageCases', NO_LIST, (l) => [...l, ...found.map((c, i) => ({ id: `OC-${l.length + i + 1}`, ...c, owner: CLASS_INFO[c.cls].owner, reason: `R-${c.cls}${l.length + i + 1}`, deadline: hoursFromNow(c.cls === 'E' ? 4 : 24), referred: c.cls === 'A' || Boolean(c.closed), entry: id }))]);
    }
    const adjust = found.find((c) => c.adjust);
    if (adjust && visit) {
      set('bills', [], (bills) => [...bills, {
        id: `BILL-ADJ-${no}`, paymentId: `PAY-601-26-ADJ${no}`, party: visit.agency ?? '301045', for: { kind: 'visit', id: visit.id }, raisedAt: nowIso(), adjustment: true,
        lines: [{ what: `Adjustment after outage: weighbridge, ${formName(f.form)} ${no}`, qty: 1, unit: 'adjustment', rate: adjust.adjust }],
        status: 'Payment due',
      }]);
    }
    setF({ ...EMPTY_ENTRY, form: f.form });
  };

  const ordered = [...entries].sort((a, b) => (a.form === 'hold' ? -1 : 0) - (b.form === 'hold' ? -1 : 0) || String(a.eventAt).localeCompare(String(b.eventAt)));
  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <SectionTitle>{tr('Back-enter a paper form')}</SectionTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{tr('Hold forms first, then every other form oldest first. The event time written on the form decides the order, never the entry time.')}</Typography>
        {holdsLeft && <Alert severity="info" sx={{ mb: 2 }}>{tr('Enter the hold forms first, so the more restrictive status applies at once.')}</Alert>}
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0,1fr))' } }}>
          <TextField select label={tr('Form')} value={f.form} onChange={field('form')}>{FORM_TYPES.map((t) => <MenuItem key={t.key} value={t.key}>{t.name}</MenuItem>)}</TextField>
          <TextField label={tr('Form number')} inputMode="numeric" value={f.no} onChange={field('no')} helperText={`${tr('Range')} ${range.from}–${range.to}`} />
          <TextField type="datetime-local" label={tr('Time of the event (on the form)')} value={f.eventAt} onChange={field('eventAt')} disabled={f.spoiled} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label={tr('Plate on the form')} value={f.plate} onChange={field('plate')} disabled={f.spoiled} placeholder="WB 41 B 2240" />
          <TextField label={tr('What the form records')} value={f.what} onChange={field('what')} disabled={f.spoiled} />
          {f.form === 'weigh' && <TextField label={tr('Charge noted on the form (BDT)')} inputMode="decimal" value={f.charge} onChange={(e) => setF((x) => ({ ...x, charge: e.target.value.replace(/[^\d.]/g, '') }))} disabled={f.spoiled} helperText={tr('Left empty if none was noted')} />}
        </Box>
        <FormControlLabel sx={{ mt: 1 }} control={<Checkbox checked={f.spoiled} onChange={(e) => setF((x) => ({ ...x, spoiled: e.target.checked }))} />} label={tr('Spoiled form: enter it as void')} />
        <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center" sx={{ mt: 1 }}>
          {problem && <Typography variant="caption" color="text.secondary" role="status" sx={{ flex: 1 }}>{tr(problem)}</Typography>}
          <Button variant="contained" disabled={Boolean(problem)} onClick={save}>{tr(f.spoiled ? 'Enter as void' : 'Enter the form')}</Button>
        </Stack>
      </Card>
      <Card sx={{ p: 3 }}>
        <SectionTitle>{tr('Back-entered records')}</SectionTitle>
        <ResponsiveTable
          rowKey={(r) => r.id}
          rows={ordered}
          empty={tr('Nothing back-entered yet.')}
          columns={[
            { label: 'Form', render: (r) => <><Typography variant="subtitle2">{formName(r.form)} {r.no}</Typography>{r.spoiled ? <Label>{tr('Void')}</Label> : <Typography variant="caption" color="text.secondary">{r.plate}{r.what ? ` · ${r.what}` : ''}</Typography>}</> },
            { label: 'Event (on the form)', nowrap: true, render: (r) => (r.eventAt ? formatDateTime(r.eventAt) : '–') },
            { label: 'Entered', priority: 'low', render: (r) => `${formatDateTime(r.enteredAt)} · ${r.enteredBy}` },
            { label: 'Check', align: 'right', render: (r) => (r.checkedBy ? <Label color="success">{tr('Checked by')} {r.checkedBy}</Label> : <CheckButton entry={r} data={data} />) },
          ]}
        />
      </Card>
    </Stack>
  );
}

// The second person compares the record with its form; the person who entered it cannot confirm it.
function CheckButton({ entry, data }) {
  const { p, set } = data;
  const own = entry.enteredBy === p.actor.name;
  return (
    <Stack alignItems="flex-end" spacing={0.5}>
      <Button size="small" variant="outlined" color="inherit" disabled={own} onClick={() => set('backEntries', NO_LIST, (l) => l.map((e) => (e.id === entry.id ? { ...e, checkedBy: p.actor.name, checkedAt: nowIso() } : e)))}>{tr('Confirm against the form')}</Button>
      {own && <Typography variant="caption" color="text.secondary">{tr('You entered it: another person confirms.')}</Typography>}
    </Stack>
  );
}

// ----- Missing form numbers -----

function Missing({ data }) {
  const { ranges, entries } = data;
  const rows = FORM_TYPES.map((t) => {
    const used = entries.filter((e) => e.form === t.key).map((e) => e.no).sort((a, b) => a - b);
    const top = used[used.length - 1];
    const missing = top ? Array.from({ length: top - ranges[t.key].from + 1 }, (_, i) => ranges[t.key].from + i).filter((n) => !used.includes(n)) : [];
    return { ...t, used: used.length, missing };
  });
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle>{tr('Missing form numbers')}</SectionTitle>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{tr('Numbers below the highest entered form that have not been entered. Each is found, entered or explained before normal working.')}</Typography>
      <ResponsiveTable
        rowKey={(r) => r.key}
        rows={rows}
        columns={[
          { label: 'Form', render: (r) => r.name },
          { label: 'Entered', align: 'right', render: (r) => r.used },
          { label: 'Missing', render: (r) => (r.missing.length ? <Box component="span" sx={{ whiteSpace: 'normal' }}><Label color="warning">{r.missing.length}</Label> {r.missing.slice(0, 12).join(', ')}{r.missing.length > 12 ? ' …' : ''}</Box> : <Label color="success">{tr('None')}</Label>) },
        ]}
      />
    </Card>
  );
}

// ----- Exceptions -----

function Exceptions({ data }) {
  const { cases, set } = data;
  const refer = (c) => set('outageCases', NO_LIST, (l) => l.map((x) => (x.id === c.id ? { ...x, referred: true } : x)));
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle>{tr('Exception list')}</SectionTitle>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{tr('A duplicate is discarded and logged; one match is linked. Everything else has an owner, a reason code and a deadline. A class E case is a security incident and is never closed as a data correction.')}</Typography>
      <ResponsiveTable
        rowKey={(r) => r.id}
        rows={cases}
        empty={tr('No exceptions.')}
        columns={[
          { label: 'Class', nowrap: true, render: (r) => <Label color={CLASS_INFO[r.cls].tone}>{r.cls} · {tr(CLASS_INFO[r.cls].name)}</Label> },
          { label: 'What', render: (r) => <Box component="span" sx={{ whiteSpace: 'normal' }}>{r.text}</Box> },
          { label: 'Owner', priority: 'low', render: (r) => `${r.owner} · ${r.reason}` },
          { label: 'Deadline', priority: 'low', nowrap: true, render: (r) => formatDateTime(r.deadline) },
          { label: 'State', align: 'right', render: (r) => (r.referred ? <Label color="success">{tr(r.cls === 'A' ? 'Logged' : r.cls === 'B' && r.closed ? 'Linked' : 'With owner')}</Label> : <Button size="small" variant="outlined" color="inherit" onClick={() => refer(r)}>{tr(r.cls === 'E' ? 'Refer to Customs and BLPA' : 'Refer to owner')}</Button>) },
        ]}
      />
    </Card>
  );
}

// ----- Reconciliation report -----

function Report({ data, counts }) {
  const { outage, cases } = data;
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle>{tr('Reconciliation report')}</SectionTitle>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {tr('Manual procedure')} {outage.declaredAt ? formatDateTime(outage.declaredAt) : '–'} → {tr('normal working')} {outage.normalAt ? formatDateTime(outage.normalAt) : tr('not yet declared')}
        {outage.signedBy ? ` · ${tr('signed by')} ${outage.signedBy}` : ''}
      </Typography>
      <ResponsiveTable
        rowKey={(r) => r.key}
        rows={counts}
        columns={[
          { label: 'Checkpoint', render: (r) => <><Typography variant="subtitle2">{r.checkpoint}</Typography><Typography variant="caption" color="text.secondary">{r.name}</Typography></> },
          { label: 'Forms used', align: 'right', render: (r) => r.issuedUsed },
          { label: 'Entered (void included)', align: 'right', render: (r) => `${r.entered}${r.void ? ` (${r.void} void)` : ''}` },
          { label: 'Checked', align: 'right', render: (r) => r.checked },
          { label: 'Agree', align: 'right', render: (r) => (r.issuedUsed === r.entered && r.entered === r.checked ? <Label color="success">{tr('Yes')}</Label> : <Label color="warning">{tr('Not yet')}</Label>) },
        ]}
      />
      <Typography variant="body2" sx={{ mt: 2 }}>
        {tr('Exceptions')}: {Object.keys(CLASS_INFO).map((k) => `${k} ${cases.filter((c) => c.cls === k).length}`).join(' · ')}
      </Typography>
    </Card>
  );
}

// MG-7: every exit recorded on paper during the outage, checked after the event against holds, release and
// payment. A class E breach is a security incident owned by Customs and BLPA: the review adds a remark, never closes it.
function ExitReview({ data }) {
  const { p, entries, cases } = data;
  const [reviews, setReviews] = useStoredState('manualExitReviews', NO_MAP);
  const [remark, setRemark] = useState({});
  const exits = entries.filter((e) => e.form === 'exit' && !e.spoiled);
  const checkOf = (e) => {
    const visit = p.state.visits.find((v) => v.plate.replace(/\s/g, '') === e.plate.replace(/\s/g, ''));
    const breach = cases.find((c) => c.entry === e.id && c.cls === 'E');
    const boes = visit ? p.state.boes.filter((b) => visit.manifests.includes(b.manifest)) : [];
    const released = boes.some((b) => b.release);
    const unpaid = p.state.bills.filter((b) => b.status === 'Payment due' && visit && (b.for.id === visit.id || boes.some((x) => p.state.deliveryRequests.some((d) => d.boe === x.id && d.id === b.for.id))));
    return [
      breach ? `Hold open at the time: ${breach.text}` : 'No hold open at the time',
      visit ? (released ? 'Release on record' : 'No release on record') : 'Truck not in the record',
      unpaid.length ? `${unpaid.length} bill unpaid` : 'No bill unpaid',
    ].map((x) => tr(x)).join(' · ');
  };
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle>{tr('Exits recorded on paper')}</SectionTitle>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{tr('Each exit back-entered from the manual procedure, checked after the event against holds, release and payment.')}</Typography>
      {exits.length === 0 && <Typography variant="body2" color="text.secondary">{tr('No exit form has been back-entered.')}</Typography>}
      <Stack spacing={2}>
        {exits.map((e) => {
          const breach = cases.find((c) => c.entry === e.id && c.cls === 'E');
          // Remarks add up; a breach keeps taking remarks and never closes.
          const r = reviews[e.id]?.length ? reviews[e.id] : null;
          return (
            <Box key={e.id} sx={{ pb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle2">{e.plate}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{e.what || tr('Exit')} · {tr('form')} {e.no} · {tr('event')} {formatDateTime(e.eventAt)} · {tr('entered')} {formatDateTime(e.enteredAt)}</Typography>
                {breach ? <Label color="error">{tr('Security incident · Customs and BLPA')}</Label> : r ? <Label color="success">{tr('Reviewed')}</Label> : <Label>{tr('To review')}</Label>}
              </Stack>
              <Typography variant="body2" sx={{ mt: 0.5 }}>{checkOf(e)}</Typography>
              {(r ?? []).map((x) => <Typography key={x.at} variant="caption" color="text.secondary" component="div">{tr('Remark')}: {x.remark} · {x.by}, {formatDateTime(x.at)}</Typography>)}
              {(!r || breach) && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
                  <TextField size="small" label={tr('Remark')} value={remark[e.id] ?? ''} onChange={(ev) => setRemark({ ...remark, [e.id]: ev.target.value })} sx={{ flex: 1 }} helperText={breach ? tr('A remark is added to the incident; it cannot close it.') : ' '} />
                  <Button variant="outlined" color="inherit" disabled={!remark[e.id]?.trim()} onClick={() => { setReviews((all) => ({ ...all, [e.id]: [...(Array.isArray(all[e.id]) ? all[e.id] : []), { remark: remark[e.id].trim(), by: p.actor.name, at: nowIso() }] })); setRemark({ ...remark, [e.id]: '' }); }}>{breach ? tr('Add remark') : tr('Mark reviewed')}</Button>
                </Stack>
              )}
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}

export default function Outage() {
  const data = useOutageData();
  const [tab, setTab] = useState('declare');
  // The three counts per checkpoint: forms used (the highest number handed out and written on, here the span up
  // to the highest entered), forms entered including void, and forms checked by a second person.
  const counts = useMemo(() => FORM_TYPES.map((t) => {
    const mine = data.entries.filter((e) => e.form === t.key);
    const top = Math.max(0, ...mine.map((e) => e.no));
    return {
      ...t,
      issuedUsed: top ? top - data.ranges[t.key].from + 1 : 0,
      entered: mine.length,
      void: mine.filter((e) => e.spoiled).length,
      checked: mine.filter((e) => e.checkedBy || e.spoiled).length,
    };
  }), [data.entries, data.ranges]);
  const phaseLabel = { normal: ['Normal working', 'success'], reconnecting: ['Reconnecting', 'warning'], lost: ['Connection lost', 'error'], manual: ['Manual procedure', 'error'], recovery: ['In recovery', 'warning'] }[data.outage.phase];
  return (
    <>
      <PageHeader
        title={tr('Outage and back-entry')}
        links={[{ name: 'Access and control' }, { name: 'Outage and back-entry' }]}
        subtitle={tr('When Benapole cannot reach NDC Agargaon it works on pre-numbered paper forms; this is where they come back into IBMS.')}
        action={<Label color={phaseLabel[1]}>{tr(phaseLabel[0])}</Label>}
      />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 3 }}>
        <Tab value="declare" label={tr('Declarations')} />
        <Tab value="ranges" label={tr('Form ranges')} />
        <Tab value="entry" label={tr('Back-entry')} />
        <Tab value="missing" label={tr('Missing forms')} />
        <Tab value="cases" label={`${tr('Exceptions')} (${data.cases.filter((c) => !c.referred).length})`} />
        <Tab value="exits" label={tr('Exit review')} />
        <Tab value="report" label={tr('Reconciliation report')} />
      </Tabs>
      {tab === 'declare' && <Declarations data={data} counts={counts} />}
      {tab === 'ranges' && <Ranges data={data} />}
      {tab === 'entry' && <BackEntry data={data} />}
      {tab === 'missing' && <Missing data={data} />}
      {tab === 'cases' && <Exceptions data={data} />}
      {tab === 'exits' && <ExitReview data={data} />}
      {tab === 'report' && <Report data={data} counts={counts} />}
    </>
  );
}
