import { useState } from 'react';
import { Alert, Box, Button, Card, MenuItem, Stack, TextField, Typography } from '@mui/material';
import Label from '../components/Label';
import { importerName, usePort, useStoredState } from '../demo/PortStore';
import { formatBoe, formatDateTime, formatKg } from '../demo/format';
import { Id, ResponsiveTable, SectionTitle } from '../demo/ui';
import { tr } from '../i18n/LanguageContext';

// M2 M-01 (C&F portal) flows the consignment page lacked: tying a waiting truck, a transfer request for
// perishables, documents checked field by field, and a download of the consignment record.

const NO_LIST = [];

// A truck admitted on its Car Pass before the manifest reached IBMS waits until the agency enters its plate.
export function TieWaitingTruck({ m, ain, onDone }) {
  const p = usePort();
  const waiting = p.state.visits.find((v) => v.late && v.carPassManifest === m.id);
  const [plate, setPlate] = useState('');
  const [error, setError] = useState('');
  if (!waiting) return null;
  const tie = () => {
    const refused = p.tieVisit(m.id, plate, ain);
    if (refused) setError(refused);
    else onDone(`${waiting.plate} is now tied to ${m.id}`);
  };
  return (
    <Alert severity="warning" sx={{ alignItems: 'flex-start' }}>
      <Typography variant="subtitle2">{tr('A truck admitted on this manifest is waiting')}</Typography>
      <Typography variant="body2" sx={{ mb: 1.5 }}>{tr('It was admitted on its Car Pass before the manifest reached IBMS and waits in the holding area. Enter its plate to tie it to this manifest.')}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }}>
        <TextField size="small" label={tr('Plate of the waiting truck')} value={plate} onChange={(e) => { setPlate(e.target.value); setError(''); }} error={Boolean(error)} helperText={error || ' '} />
        <Button variant="contained" disabled={!plate.trim()} onClick={tie}>{tr('Tie the truck')}</Button>
      </Stack>
    </Alert>
  );
}

// Perishables go truck to truck against a transfer request with the receiving trucks' plates (M-01, M-07).
export function TransferRequest({ m, lines, ain, onDone }) {
  const p = usePort();
  const [requests, setRequests] = useStoredState('transferRequests', NO_LIST);
  const perishable = lines.filter((l) => l.category === 'perishable');
  const [picked, setLine] = useState('');
  const line = perishable.some((l) => l.id === picked) ? picked : perishable[0]?.id ?? '';
  const [plates, setPlates] = useState('');
  const mine = requests.filter((r) => r.mid === m.id);
  if (!perishable.length) return null;
  const list = plates.split(',').map((x) => x.trim()).filter(Boolean);
  const foreign = p.visitOfManifest(m.id);
  const why = !line ? 'Choose the line to transfer.' : !list.length ? 'Enter at least one receiving-truck plate.' : list.length > 3 ? 'Up to three receiving trucks per request.' : !foreign ? 'The foreign truck for this manifest has not been admitted yet.' : '';
  const raise = () => {
    const id = `TR-2026-${String(91 + requests.length).padStart(4, '0')}`;
    setRequests((r) => [...r, { id, mid: m.id, line, plates: list, foreign: foreign.plate, ain, at: new Date().toISOString(), status: 'Requested' }]);
    setPlates('');
    onDone(`Transfer request ${id} raised for ${list.length} receiving truck${list.length === 1 ? '' : 's'}`);
  };
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle>{tr('Transfer request (perishables)')}</SectionTitle>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{tr('Perishable lines go straight from the foreign truck to local receiving trucks. Key the receiving trucks here; each enters at the inland gate against this request and cannot leave before the foreign truck.')}</Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0,1fr))' } }}>
        <TextField select label={tr('Line')} value={line} onChange={(e) => setLine(e.target.value)}>{perishable.map((l) => <MenuItem key={l.id} value={l.id}>Line {l.no}: {l.goods}, {formatKg(l.declaredKg)}</MenuItem>)}</TextField>
        <TextField label={tr('Receiving-truck plates')} placeholder="Jessore-TA 14-2207, Khulna-TA 11-5530" value={plates} onChange={(e) => setPlates(e.target.value)} helperText={tr('Separate plates with commas; up to three')} />
      </Box>
      <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center" sx={{ mt: 2 }}>
        {why && <Typography variant="caption" color="text.secondary" role="status" sx={{ flex: 1 }}>{tr(why)}</Typography>}
        <Button variant="contained" disabled={Boolean(why)} onClick={raise}>{tr('Raise transfer request')}</Button>
      </Stack>
      {mine.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <ResponsiveTable rowKey={(r) => r.id} rows={mine} columns={[
            { label: 'Request', render: (r) => <Id>{r.id}</Id> },
            { label: 'Receiving trucks', render: (r) => r.plates.join(', ') },
            { label: 'Raised', priority: 'low', render: (r) => formatDateTime(r.at) },
            { label: 'Status', align: 'right', render: (r) => <Label color="info">{r.status}</Label> },
          ]} />
        </Box>
      )}
    </Card>
  );
}

// Upload a document; IBMS reads its fields and shows each against the record, so the agent confirms or fixes a
// difference before relying on it (M-01). The reading is simulated in the demo.
const DOC_TYPES = ['Bill of Entry copy', 'Commercial invoice', 'Packing list'];

export function Documents({ m, lines }) {
  const p = usePort();
  const [docs, setDocs] = useStoredState('cfDocuments', NO_LIST);
  const [type, setType] = useState(DOC_TYPES[0]);
  const [reading, setReading] = useState(null);
  const mine = docs.filter((d) => d.mid === m.id);
  const boe = p.state.boes.find((b) => b.manifest === m.id);
  const read = (file) => {
    const declared = lines.reduce((sum, l) => sum + l.declaredKg, 0);
    // The demo reads one field wrong on purpose, so the check shows what a difference looks like.
    const fields = [
      { field: 'Manifest number', read: m.id, record: m.id },
      { field: 'Importer', read: importerName(lines[0]?.importer), record: importerName(lines[0]?.importer) },
      { field: 'Bill of Entry', read: boe ? formatBoe(boe) : 'Not recorded', record: boe ? formatBoe(boe) : 'Not recorded' },
      { field: 'Gross weight', read: formatKg(declared + 120), record: formatKg(declared) },
    ];
    setReading({ name: file.name, type, fields });
  };
  const keep = () => {
    setDocs((d) => [...d, { id: `DOC-${d.length + 1}`, mid: m.id, name: reading.name, type: reading.type, at: new Date().toISOString(), differences: reading.fields.filter((f) => f.read !== f.record).map((f) => f.field) }]);
    setReading(null);
  };
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle>{tr('Documents')}</SectionTitle>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        <TextField select size="small" label={tr('Document')} value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 220 }}>{DOC_TYPES.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}</TextField>
        <Button component="label" variant="outlined" color="inherit">
          {tr('Upload and read')}
          <input hidden type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { if (e.target.files?.[0]) read(e.target.files[0]); e.target.value = ''; }} />
        </Button>
        <Typography variant="caption" color="text.secondary">{tr('PDF or photo. Nothing leaves this browser in the demo.')}</Typography>
      </Stack>
      {reading && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>{reading.type}: {reading.name}</Typography>
          <ResponsiveTable rowKey={(r) => r.field} rows={reading.fields} columns={[
            { label: 'Field', render: (r) => r.field },
            { label: 'Read from the document', render: (r) => r.read },
            { label: 'In IBMS', render: (r) => r.record },
            { label: 'Check', align: 'right', render: (r) => (r.read === r.record ? <Label color="success">{tr('Same')}</Label> : <Label color="warning">{tr('Differs')}</Label>) },
          ]} />
          {reading.fields.some((f) => f.read !== f.record) && <Alert severity="warning" sx={{ mt: 1.5 }}>{tr('A field differs from the record. The record does not change; raise a correction if the document is right.')}</Alert>}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 1.5 }}>
            <Button variant="outlined" color="inherit" onClick={() => setReading(null)}>{tr('Discard')}</Button>
            <Button variant="contained" onClick={keep}>{tr('Keep the document')}</Button>
          </Stack>
        </Box>
      )}
      {mine.length ? (
        <ResponsiveTable rowKey={(r) => r.id} rows={mine} columns={[
          { label: 'Document', render: (r) => <><Typography variant="subtitle2">{r.type}</Typography><Typography variant="caption" color="text.secondary">{r.name}</Typography></> },
          { label: 'Uploaded', priority: 'low', render: (r) => formatDateTime(r.at) },
          { label: 'Check', align: 'right', render: (r) => (r.differences.length ? <Label color="warning">{tr('Differs')}: {r.differences.join(', ')}</Label> : <Label color="success">{tr('Matches the record')}</Label>) },
        ]} />
      ) : !reading && <Typography variant="body2" color="text.secondary">{tr('No document uploaded yet.')}</Typography>}
    </Card>
  );
}

// The consignment record as a file the agent keeps: lines, trucks, Bills of Entry and events.
export function downloadRecord(m, lines, visits, boes, events) {
  const rows = [
    ['Consignment record', m.id], ['Alias', m.alias], ['Downloaded', new Date().toISOString()], [],
    ['Line', 'Goods', 'Importer', 'Declared kg'], ...lines.map((l) => [l.no, l.goods, importerName(l.importer), l.declaredKg]), [],
    ['Truck', 'Stage', 'Car Pass'], ...visits.map((v) => [v.plate, v.stage, v.carPass]), [],
    ['Bill of Entry', 'Released', 'Delivered kg'], ...boes.map((b) => [formatBoe(b), b.release ? 'Yes' : 'No', b.deliveredKg]), [],
    ['Event time', 'Event', 'By'], ...events.map((e) => [e.at, e.text, e.by]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${m.id.replace(/\//g, '-')}_consignment-record.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
