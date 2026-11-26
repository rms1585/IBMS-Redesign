import { useState } from 'react';
import { Alert, Box, Button, Card, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common';
import { useRole } from '../RoleContext';
import { agencyOf, importerName, usePort, useStoredState, billTotals } from '../demo/PortStore';
import { formatBDT, formatKg } from '../demo/format';
import { Id, ResponsiveTable, StatusPill } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// Which agency the portal shows: the signed-in agent's, or (for the demo presenter) one picked here.
export function useAgency() {
  const { role } = useRole();
  const [picked, setPicked] = useState(() => sessionStorage.getItem('ibms-demo-agency') ?? '301045');
  const ain = role.agency ?? picked;
  const pick = (v) => { setPicked(v); try { sessionStorage.setItem('ibms-demo-agency', v); } catch { /* storage unavailable */ } };
  return { ain, canPick: !role.agency, pick };
}

export function AgencyPicker({ ain, pick }) {
  const { parties } = usePort();
  return (
    <TextField select size="small" label="Viewing as agency (demo)" value={ain} onChange={(e) => pick(e.target.value)} sx={{ minWidth: 260 }}>
      {parties.agencies.map((a) => <MenuItem key={a.ain} value={a.ain}>{a.name}</MenuItem>)}
    </TextField>
  );
}

export function LicenceBanner({ ain }) {
  const p = usePort();
  const problem = p.licenceProblem(ain);
  if (!problem) return null;
  return (
    <Alert severity="error" variant="outlined" sx={{ mb: 3 }}>
      <Typography variant="subtitle2">Operations blocked</Typography>
      <Typography variant="body2">{problem} Truck entry, Bills of Entry, Delivery Requests and pass approvals are refused until BLPA verifies a valid licence.</Typography>
    </Alert>
  );
}

// ----- Exports and re-export (M-01) -----

const INITIAL_EXPORTS = [
  { id: 'E 601 E-20417 2026-11-25', exporter: 'Northern Textiles PLC', goods: 'Jute yarn', kg: 36800, mode: 'Road', status: 'Valid', trucks: ['WB 19 F 0719'], wagons: [] },
  { id: 'E 601 E-20431 2026-11-26', exporter: 'Delta Agro Foods Ltd.', goods: 'Rice bran', kg: 120000, mode: 'Rail', status: 'Valid', trucks: [], wagons: [] },
  { id: 'E 601 E-20388 2026-11-23', exporter: 'Coastal Chemicals Ltd.', goods: 'Garments', kg: 6100, mode: 'Road', status: 'Cancelled by Customs', trucks: ['WB 07 E 3310'], wagons: [] },
];
const INITIAL_LOTS = [
  { id: 'TI-2026-0007', goods: 'Exhibition machinery', kg: 4200, until: '2026-12-05' },
  { id: 'TI-2026-0011', goods: 'Film equipment', kg: 860, until: '2027-01-20' },
];
const NO_LIST = [];

function Exports({ ain, blocked }) {
  const [exportsList, setExports] = useStoredState('exportDeclarations', INITIAL_EXPORTS);
  const [boe, setBoe] = useState(INITIAL_EXPORTS[0].id);
  const [plate, setPlate] = useState('');
  const [wagons, setWagons] = useState('');
  const [msg, setMsg] = useState('');
  const chosen = exportsList.find((x) => x.id === boe);
  const plateWhy = blocked ? 'Operations are blocked until the licence is verified.' : chosen.status !== 'Valid' ? `${chosen.status}: no truck can be entered against it.` : chosen.mode !== 'Road' ? 'This Bill of Export goes by rail: use the wagon list.' : !plate.trim() ? 'Enter the plate of the export truck.' : '';
  const list = wagons.split(',').map((w) => w.trim()).filter(Boolean);
  const wagonWhy = blocked ? 'Operations are blocked until the licence is verified.' : chosen.status !== 'Valid' ? `${chosen.status}.` : chosen.mode !== 'Rail' ? 'This Bill of Export goes by road: enter trucks instead.' : !list.length ? 'Enter at least one wagon number.' : '';
  const update = (change) => setExports((l) => l.map((x) => (x.id === boe ? { ...x, ...change(x) } : x)));
  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>Bills of Export</Typography>
        <ResponsiveTable rowKey={(r) => r.id} rows={exportsList} columns={[
          { label: 'Bill of Export', render: (r) => <Id>{r.id}</Id> },
          { label: 'Exporter', priority: 'low', render: (r) => r.exporter },
          { label: 'Goods', render: (r) => `${r.goods}, ${formatKg(r.kg)}` },
          { label: 'By', render: (r) => r.mode },
          { label: 'Trucks or wagons', render: (r) => [...r.trucks, ...r.wagons].join(', ') || '–' },
          { label: 'Status', align: 'right', render: (r) => <StatusPill word={r.status === 'Valid' ? 'Open' : 'Refused'} /> },
        ]} />
      </Card>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>Enter an export truck or a wagon list</Typography>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0,1fr))' } }}>
          <TextField select label="Bill of Export" value={boe} onChange={(e) => { setBoe(e.target.value); setMsg(''); }}>{exportsList.map((x) => <MenuItem key={x.id} value={x.id}>{x.id} · {x.mode}</MenuItem>)}</TextField>
          {chosen.mode === 'Road'
            ? <TextField label="Export truck plate" value={plate} onChange={(e) => setPlate(e.target.value)} />
            : <TextField label="Wagon numbers" placeholder="BR-40211, BR-40212" value={wagons} onChange={(e) => setWagons(e.target.value)} helperText="Separate with commas" />}
        </Box>
        <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center" sx={{ mt: 2 }}>
          {(chosen.mode === 'Road' ? plateWhy : wagonWhy) && <Typography variant="caption" color="text.secondary" role="status" sx={{ flex: 1 }}>{chosen.mode === 'Road' ? plateWhy : wagonWhy}</Typography>}
          {chosen.mode === 'Road'
            ? <Button variant="contained" disabled={Boolean(plateWhy)} onClick={() => { update((x) => ({ trucks: [...x.trucks, plate.trim().toUpperCase()] })); setMsg(`${plate.trim().toUpperCase()} entered against ${boe}.`); setPlate(''); }}>Enter export truck</Button>
            : <Button variant="contained" disabled={Boolean(wagonWhy)} onClick={() => { update((x) => ({ wagons: [...x.wagons, ...list] })); setMsg(`Wagon list of ${list.length} sent for ${boe}.`); setWagons(''); }}>Send the wagon list</Button>}
        </Stack>
        {msg && <Alert severity="success" sx={{ mt: 2 }} onClose={() => setMsg('')}>{msg}</Alert>}
      </Card>
    </Stack>
  );
}

function ReExport({ ain, blocked }) {
  const [decls, setDecls] = useStoredState('reExportDeclarations', NO_LIST);
  const [lot, setLot] = useState(INITIAL_LOTS[0].id);
  const [no, setNo] = useState('');
  const [kg, setKg] = useState('');
  const chosen = INITIAL_LOTS.find((l) => l.id === lot);
  const why = blocked ? 'Operations are blocked until the licence is verified.' : !/^R 601 R-\d{5} \d{4}-\d{2}-\d{2}$/.test(no.trim()) ? 'Enter the declaration as Customs prints it, for example R 601 R-30112 2026-11-26.' : !/^\d+$/.test(kg) ? 'Enter the quantity declared, in kg.' : '';
  const record = () => {
    const differs = Number(kg) !== chosen.kg;
    setDecls((d) => [...d, { id: no.trim(), lot, kg: Number(kg), ain, at: new Date().toISOString(), differs }]);
    setNo(''); setKg('');
  };
  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>Record a re-export declaration</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Goods brought in temporarily leave again against a re-export declaration. One that does not match its lot is flagged for Customs (EXC-38); IBMS never extends, converts or forfeits a lot.</Typography>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0,1fr))' } }}>
          <TextField select label="Temporary-import lot" value={lot} onChange={(e) => setLot(e.target.value)}>{INITIAL_LOTS.map((l) => <MenuItem key={l.id} value={l.id}>{l.id} · {l.goods}, {formatKg(l.kg)} · until {l.until}</MenuItem>)}</TextField>
          <TextField label="Re-export declaration" placeholder="R 601 R-30112 2026-11-26" value={no} onChange={(e) => setNo(e.target.value)} />
          <TextField label="Quantity declared (kg)" inputMode="numeric" value={kg} onChange={(e) => setKg(e.target.value.replace(/\D/g, ''))} />
        </Box>
        <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center" sx={{ mt: 2 }}>
          {why && <Typography variant="caption" color="text.secondary" role="status" sx={{ flex: 1 }}>{why}</Typography>}
          <Button variant="contained" disabled={Boolean(why)} onClick={record}>Record the declaration</Button>
        </Stack>
      </Card>
      {decls.length > 0 && (
        <Card sx={{ p: 3 }}>
          <ResponsiveTable rowKey={(r) => r.id} rows={decls} columns={[
            { label: 'Declaration', render: (r) => <Id>{r.id}</Id> },
            { label: 'Lot', render: (r) => r.lot },
            { label: 'Declared', align: 'right', render: (r) => formatKg(r.kg) },
            { label: 'Check', align: 'right', render: (r) => (r.differs ? <StatusPill word="Refused" /> : <StatusPill word="Open" />) },
          ]} />
          {decls.some((d) => d.differs) && <Alert severity="warning" sx={{ mt: 2 }}>A declaration differs from its lot: a case is open for Customs (EXC-38).</Alert>}
        </Card>
      )}
    </Stack>
  );
}

export default function CfPortal() {
  const p = usePort();
  const navigate = useNavigate();
  const t = useT();
  const { ain, canPick, pick } = useAgency();
  const agency = agencyOf(ain);
  // The agency sees only consignments with a line an importer has tagged it to (Annex 7.1).
  const mine = p.state.manifests.filter((m) => Object.values(m.tags).includes(ain));
  const rows = mine.map((m) => {
    const lines = m.lines.filter((l) => m.tags[l.importer] === ain);
    const v = p.visitOfManifest(m.id);
    const owed = p.state.bills.filter((b) => b.party === ain && b.status === 'Payment due' && p.boe(p.dr(b.for.id)?.boe)?.manifest === m.id).reduce((s, b) => s + billTotals(b).total, 0);
    const waiting = p.openReasons(m.id)[0];
    return { m, lines, v, owed, waiting, holds: p.holdsOnManifest(m.id) };
  });
  const [tab, setTab] = useState('open');
  const blocked = Boolean(p.licenceProblem(ain));
  // Closed: nothing is waiting on the consignment any more (every line released and delivered).
  const shown = rows.filter((r) => (tab === 'closed' ? !r.waiting : r.waiting));
  return (
    <>
      <PageHeader title={t('C&F portal')} subtitle={`${agency.name} · AIN ${agency.ain}`} action={canPick && <AgencyPicker ain={ain} pick={pick} />} />
      <LicenceBanner ain={ain} />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 3 }}>
        <Tab value="open" label={`Open (${rows.filter((r) => r.waiting).length})`} />
        <Tab value="closed" label={`Closed (${rows.filter((r) => !r.waiting).length})`} />
        <Tab value="exports" label="Exports" />
        <Tab value="reexport" label="Re-export" />
      </Tabs>
      {tab === 'exports' && <Exports ain={ain} blocked={blocked} />}
      {tab === 'reexport' && <ReExport ain={ain} blocked={blocked} />}
      {(tab === 'open' || tab === 'closed') && (
      <Card sx={{ p: { xs: 1.5, sm: 3 } }}>
        <ResponsiveTable
          rowKey={(r) => r.m.id}
          onRowClick={(r) => navigate(`/cf-portal/${encodeURIComponent(r.m.id)}`)}
          rows={shown}
          empty={tab === 'closed' ? 'No consignment is closed yet.' : 'No open consignment is tagged to this agency. An importer tags its agency in its own portal.'}
          columns={[
            { label: 'Manifest', render: (r) => <Id>{r.m.id}</Id> },
            { label: 'Importer', render: (r) => [...new Set(r.lines.map((l) => importerName(l.importer)))].join(', ') },
            { label: 'Truck', render: (r) => (r.v ? <Stack direction="row" spacing={1} alignItems="center"><Typography variant="body2" fontWeight={700}>{r.v.plate}</Typography><StatusPill word={r.v.stage} /></Stack> : '–') },
            { label: 'Holds', priority: 'low', render: (r) => (r.holds.length ? <StatusPill word="Customs hold" /> : '–') },
            { label: 'Owed', align: 'right', render: (r) => (r.owed ? formatBDT(r.owed) : '–') },
            { label: 'Waiting for', priority: 'low', render: (r) => <Typography variant="body2" color="text.secondary">{r.waiting ?? 'Nothing'}</Typography> },
                    ]}
        />
      </Card>
      )}
    </>
  );
}
