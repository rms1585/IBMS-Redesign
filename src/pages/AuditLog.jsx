import { useState } from 'react';
import { Alert, Box, Button, Card, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { usePort } from '../demo/PortStore';
import { formatDateTime, searchKey } from '../demo/format';
import { ResponsiveTable, SectionTitle, SourceMarker } from '../demo/ui';
import { SELF_APPROVAL_PREFIX } from '../demo/inbox';
import { useT, tr } from '../i18n/LanguageContext';

// M-13: every action as a plain sentence. No screen offers to edit or delete an entry, for any role.
// Filters by how a value was recorded, by person, by role and by period; an export is itself written to the trail.

const SOURCES = ['Every source', 'BNSW', 'Device', 'IBMS', 'Keyed by the agency', 'Keyed at the gate', "Keyed from Customs' reference", 'Typed by hand', 'Back-entered from form', 'Payment provider'];
// The values an auditor checks first: anything keyed at the port, typed while a device was down, or back-entered.
const NOT_FROM_SOURCE = ['Keyed by the agency', 'Keyed at the gate', "Keyed from Customs' reference", 'Typed by hand', 'Back-entered from form'];
const PERIODS = { 'Any time': Infinity, 'Last hour': 1, 'Today': 24, 'Last 7 days': 24 * 7 };
const EVERYONE = 'Everyone';
const ALL_ROLES = 'Every role';

function downloadCsv(rows) {
  const csv = [['Time', 'Person', 'Role', 'Entry', 'Record', 'How recorded'], ...rows.map((e) => [e.at, e.by, e.role, e.text, e.record, e.source])]
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log_benapole_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditLog() {
  const p = usePort();
  const t = useT();
  const [q, setQ] = useState('');
  const [source, setSource] = useState('Every source');
  const [person, setPerson] = useState(EVERYONE);
  const [role, setRole] = useState(ALL_ROLES);
  const [period, setPeriod] = useState('Any time');
  const [onlyKeyed, setOnlyKeyed] = useState(false);
  const [onlyRefused, setOnlyRefused] = useState(false);
  const [samePerson, setSamePerson] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const events = p.state.events;
  const people = [EVERYONE, ...new Set(events.map((e) => e.by))];
  const roleNames = [ALL_ROLES, ...new Set(events.map((e) => e.role))];
  const k = searchKey(q);
  const since = Date.now() - PERIODS[period] * 3600000;
  const rows = events.filter((e) => (source === 'Every source' || e.source === source)
    && (!onlyKeyed || NOT_FROM_SOURCE.includes(e.source))
    && (!onlyRefused || e.text.startsWith(SELF_APPROVAL_PREFIX))
    && (person === EVERYONE || e.by === person)
    && (role === ALL_ROLES || e.role === role)
    && new Date(e.at).getTime() >= since
    && (!k || searchKey(`${e.text} ${e.record} ${e.by}`).includes(k)));
  const filtered = q || source !== 'Every source' || person !== EVERYONE || role !== ALL_ROLES || period !== 'Any time' || onlyKeyed || onlyRefused;
  const clear = () => { setQ(''); setSource('Every source'); setPerson(EVERYONE); setRole(ALL_ROLES); setPeriod('Any time'); setOnlyKeyed(false); setOnlyRefused(false); };
  // AU-2: every two-person item with who asked and who decided. "Same person did both" is expected to be empty.
  const s = p.state;
  const pairs = [
    ...s.corrections.filter((c) => c.decision).map((c) => ({ id: c.id, what: `Correction on ${c.record}: ${c.field}`, asked: c.by, decided: c.decision.by, outcome: c.decision.approve ? 'Approved' : 'Rejected', at: c.decision.at })),
    ...(s.overrideRequests ?? []).filter((o) => o.decision).map((o) => ({ id: o.id, what: `Override: ${o.rule} on ${o.record}`, asked: o.by, decided: o.decision.by, outcome: o.decision.approve ? 'Approved' : 'Rejected', at: o.decision.at })),
    ...(s.tariffOrders ?? []).filter((o) => o.approval).map((o) => ({ id: o.ref, what: `Tariff order ${o.ref}`, asked: o.sentBy, decided: o.approval.by, outcome: o.approval.approve ? 'Approved' : 'Rejected', at: o.approval.at })),
    ...(s.supplementaryBills ?? []).filter((b) => b.approvedBy).map((b) => ({ id: b.id, what: `${b.amount < 0 ? 'Credit' : 'Supplementary bill'} ${b.id}`, asked: b.by, decided: b.approvedBy, outcome: 'Approved', at: b.at })),
    ...(s.backEntries ?? []).filter((e) => e.checkedBy).map((e) => ({ id: e.id, what: `Back-entered form ${e.no}`, asked: e.enteredBy, decided: e.checkedBy, outcome: 'Confirmed', at: e.checkedAt })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));
  const pairRows = samePerson ? pairs.filter((x) => x.asked === x.decided) : pairs;
  const exportRows = () => {
    downloadCsv(rows);
    const used = [q && `search "${q}"`, source !== 'Every source' && source, onlyKeyed && 'only keyed, typed or back-entered', person !== EVERYONE && person, role !== ALL_ROLES && role, period !== 'Any time' && period].filter(Boolean);
    p.logEvent(`Audit log exported: ${rows.length} entr${rows.length === 1 ? 'y' : 'ies'}${used.length ? `, filters: ${used.join('; ')}` : ', no filter'}`, 'Audit log');
    setConfirming(false);
  };
  return (
    <>
      <PageHeader
        title={t('Audit log')}
        subtitle={tr("Who, in which role, did what, to which record, and how each value was recorded. Entries cannot be changed or deleted.")}
        action={<Button variant="outlined" color="inherit" disabled={!rows.length} onClick={() => setConfirming(true)}>{t('Export')}</Button>}
      />
      {confirming && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={(
            <Stack direction="row" spacing={1}>
              <Button size="small" color="inherit" onClick={() => setConfirming(false)}>{tr("Cancel")}</Button>
              <Button size="small" variant="contained" onClick={exportRows}>Export {rows.length} entries</Button>
            </Stack>
          )}
        >
          The export is recorded in the audit trail with your name, the time and the filters used. The file leaves IBMS; keep it as BLPA records policy requires.
        </Alert>
      )}
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'grid', gap: 2, mb: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,1fr))', lg: 'repeat(3, minmax(0,1fr))' } }}>
          <TextField size="small" label={tr("Search records, people or words")} value={q} onChange={(e) => setQ(e.target.value)} />
          <TextField select size="small" label={tr("How the value was recorded")} value={source} onChange={(e) => setSource(e.target.value)}>
            {SOURCES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select size="small" label={tr("Period")} value={period} onChange={(e) => setPeriod(e.target.value)}>
            {Object.keys(PERIODS).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select size="small" label={tr("Person")} value={person} onChange={(e) => setPerson(e.target.value)}>
            {people.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select size="small" label={tr("Role")} value={role} onChange={(e) => setRole(e.target.value)}>
            {roleNames.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          <Button size="small" variant={onlyKeyed ? 'contained' : 'outlined'} color={onlyKeyed ? 'primary' : 'inherit'} aria-pressed={onlyKeyed} onClick={() => setOnlyKeyed((v) => !v)}>{tr("Only keyed, typed or back-entered values")}</Button>
          <Button size="small" variant={onlyRefused ? 'contained' : 'outlined'} color={onlyRefused ? 'primary' : 'inherit'} aria-pressed={onlyRefused} onClick={() => setOnlyRefused((v) => !v)}>{tr('Refused self-approvals')}</Button>
          {filtered && <Button size="small" color="inherit" onClick={clear}>{tr("Clear filters")}</Button>}
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{rows.length} of {events.length} entries</Typography>
        </Stack>
        {rows.length === 0 && <Typography variant="body2" color="text.secondary">{tr("Nothing matches. Clear the filters or search for a plate or manifest number.")}</Typography>}
        <Stack spacing={1.5}>
          {rows.map((e) => (
            <Box key={e.id} sx={{ pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="body2">{e.by}, {e.role}: {e.text}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="caption" color="text.secondary">{formatDateTime(e.at)} · Benapole · {e.record}</Typography>
                <SourceMarker source={e.source} always />
              </Stack>
            </Box>
          ))}
        </Stack>
      </Card>
      <Card sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          <SectionTitle>{tr('Two-person decisions')}</SectionTitle>
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant={samePerson ? 'contained' : 'outlined'} color={samePerson ? 'primary' : 'inherit'} aria-pressed={samePerson} onClick={() => setSamePerson((v) => !v)}>{tr('Same person did both')}</Button>
        </Stack>
        <ResponsiveTable rowKey={(x) => x.id} rows={pairRows} empty={samePerson ? tr('None. No one decided their own request, as expected.') : tr('No two-person decision yet.')} columns={[
          { label: 'Item', render: (x) => x.what },
          { label: 'Asked by', render: (x) => x.asked },
          { label: 'Decided by', render: (x) => x.decided },
          { label: 'Outcome', render: (x) => x.outcome },
          { label: 'When', priority: 'low', render: (x) => formatDateTime(x.at) },
        ]} />
      </Card>
    </>
  );
}
