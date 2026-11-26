import { useState } from 'react';
import { Alert, Box, Button, Card, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { useRole } from '../RoleContext';
import { agencyName, billTotals, importerName, usePort, useStoredState } from '../demo/PortStore';
import { downloadRecord } from './CfExtras';
import { searchKey } from '../demo/format';
import { formatBDT, formatKg } from '../demo/format';
import { Confirmation, Id, Plate, SectionTitle, StatusPill } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-15: the importer sees only its own lines, by consignee BIN, and tags the agency that acts on them.
function TagControl({ m, bin, onDone }) {
  const p = usePort();
  const current = m.tags[bin] ?? '';
  const [ain, setAin] = useState(current);
  const v = p.visitOfManifest(m.id);
  const retag = Boolean(current);
  const unloaded = v?.receipt?.locked;
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
      <TextField select size="small" label={retag ? 'Re-tag to another agency' : 'Tag a C&F agency'} value={ain} onChange={(e) => setAin(e.target.value)} sx={{ minWidth: 260 }}>
        {p.parties.agencies.map((a) => <MenuItem key={a.ain} value={a.ain}>{a.name} · AIN {a.ain}</MenuItem>)}
      </TextField>
      <Button
        variant="contained"
        disabled={!ain || ain === current}
        onClick={() => { p.tagAgency(m.id, bin, ain); onDone(retag ? `Re-tagged to ${agencyName(ain)}` : `Tagged ${agencyName(ain)}`); }}
      >
        {retag ? 'Re-tag lines' : 'Tag agency'}
      </Button>
      {retag && <Typography variant="caption" color="text.secondary">{unloaded ? 'Every line moves at once; the previous agency loses access.' : 'Re-tagging moves every line at once and the previous agency loses access.'}</Typography>}
    </Stack>
  );
}

const NO_LIST = [];

// An importer that cannot find its consignment keys the manifest number. If the manifest names another importer's
// BIN on its lines, a case goes to Customs through BNSW; IBMS never changes the consignee itself (M-15).
function FindManifest({ bin, onDone }) {
  const p = usePort();
  const [cases, setCases] = useStoredState('binCases', NO_LIST);
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const m = q.trim() ? p.state.manifests.find((x) => searchKey(x.id) === searchKey(q)) : null;
  const theirs = m && !m.lines.some((l) => l.importer === bin) ? [...new Set(m.lines.map((l) => l.importer))] : [];
  const mine = cases.filter((c) => c.bin === bin);
  const raise = () => {
    const id = `BM-BEN-2026-${String(cases.length + 17).padStart(4, '0')}`;
    setCases((l) => [...l, { id, bin, manifest: m.id, named: theirs.map(importerName).join(', '), note: note.trim(), at: new Date().toISOString(), status: 'With Customs' }]);
    p.logEvent(`BIN mismatch case ${id} raised by ${importerName(bin)} on ${m.id}: ${note.trim()}`, m.id);
    setQ(''); setNote('');
    onDone(`Case ${id} sent to Customs through BNSW`);
  };
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle>Can't find your consignment?</SectionTitle>
      <TextField size="small" label="Manifest number on your papers" placeholder="2026/601/08852" value={q} onChange={(e) => setQ(e.target.value)} sx={{ maxWidth: 360 }} fullWidth />
      {q.trim() && !m && <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Not in IBMS yet. It appears here when Customs' manifest reaches IBMS through BNSW; at the gate it can be keyed from the Car Pass as an "Other" manifest until then.</Typography>}
      {m && !theirs.length && <Typography variant="body2" sx={{ mt: 1.5 }}>{m.id} already names your BIN; it is listed below.</Typography>}
      {m && theirs.length > 0 && (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          <Alert severity="warning">{m.id} names {theirs.map(importerName).join(', ')} as consignee, not your BIN {bin}. Only Customs can correct a manifest; raise a case and Customs answers through BNSW.</Alert>
          <TextField size="small" label="What is wrong" placeholder="Our LC 0417-26-0133 covers line 1" value={note} onChange={(e) => setNote(e.target.value)} />
          <Box><Button variant="contained" disabled={!note.trim()} onClick={raise}>Raise a BIN mismatch case</Button></Box>
        </Stack>
      )}
      {mine.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {mine.map((c) => <Typography key={c.id} variant="body2">{c.id}: {c.manifest} names {c.named}. {c.note} · <strong>{c.status}</strong></Typography>)}
        </Stack>
      )}
    </Card>
  );
}

export default function TraderPortal() {
  const p = usePort();
  const t = useT();
  const { role } = useRole();
  const [picked, setPicked] = useState('000234567-0202');
  const bin = role.importer ?? picked;
  const [msg, setMsg] = useState('');
  const mine = p.state.manifests.filter((m) => m.lines.some((l) => l.importer === bin));
  return (
    <>
      <PageHeader
        title={t('Importer portal')}
        subtitle={`${importerName(bin)} · BIN ${bin}`}
        action={!role.importer && (
          <TextField select size="small" label="Viewing as importer (demo)" value={bin} onChange={(e) => setPicked(e.target.value)} sx={{ minWidth: 260 }}>
            {p.parties.importers.map((i) => <MenuItem key={i.bin} value={i.bin}>{i.name}</MenuItem>)}
          </TextField>
        )}
      />
      <Stack spacing={2.5}>
        <FindManifest bin={bin} onDone={setMsg} />
        {mine.length === 0 && <Alert severity="info">No manifest names your BIN yet. When Customs' manifest reaches IBMS through BNSW it appears here, and you tag your C&F agency.</Alert>}
        {mine.map((m) => {
          const lines = m.lines.filter((l) => l.importer === bin);
          const v = p.visitOfManifest(m.id);
          const bills = p.state.bills.filter((b) => b.for.kind === 'dr' && p.boe(p.dr(b.for.id)?.boe)?.importer === bin && p.boe(p.dr(b.for.id)?.boe)?.manifest === m.id);
          return (
            <Card key={m.id} sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                <Typography variant="h6"><Id sx={{ typography: 'h6' }}>{m.id}</Id></Typography>
                <Typography variant="body2" color="text.secondary">{m.alias}</Typography>
                {!m.tags[bin] && <StatusPill word="Open" />}
                <Box sx={{ flex: 1 }} />
                <Button size="small" variant="outlined" color="inherit" onClick={() => { const v = p.visitOfManifest(m.id); downloadRecord(m, lines, v ? [v] : [], p.state.boes.filter((b) => b.manifest === m.id && b.importer === bin), p.state.events.filter((e) => e.record === m.id)); }}>Download the record</Button>
              </Stack>
              {!m.tags[bin] && <Alert severity="warning" sx={{ mb: 2 }}>No agency is tagged to your lines. Until you tag one, no agency can act and the truck is not admitted.</Alert>}
              <SectionTitle>Your lines</SectionTitle>
              {lines.map((l) => (
                <Stack key={l.id} direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.75, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="body2">Line {l.no}: {l.goods}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{formatKg(l.declaredKg)} declared</Typography>
                </Stack>
              ))}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1.5 }}>Tagged agency: <strong>{m.tags[bin] ? agencyName(m.tags[bin]) : 'None'}</strong></Typography>
                <TagControl m={m} bin={bin} onDone={setMsg} />
              </Box>
              {v && (
                <>
                  <SectionTitle>Truck</SectionTitle>
                  <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                    <Plate>{v.plate}</Plate>
                    <StatusPill word={v.stage} />
                    {v.posting?.accepted && <Typography variant="body2" color="text.secondary">Drop point {v.posting.shed}</Typography>}
                  </Stack>
                </>
              )}
              {bills.length > 0 && (
                <>
                  <SectionTitle>Bills</SectionTitle>
                  {bills.map((b) => (
                    <Stack key={b.id} direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ py: 0.5 }}>
                      <Id>{b.paymentId}</Id>
                      <Typography variant="body2">{formatBDT(billTotals(b).total)}</Typography>
                      <StatusPill word={b.status} />
                      {b.status === 'Payment due' && <Button size="small" variant="contained" onClick={() => { p.payBill(b.id); setMsg('Paid. The provider confirmed the payment'); }}>Pay online</Button>}
                    </Stack>
                  ))}
                </>
              )}
            </Card>
          );
        })}
      </Stack>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
