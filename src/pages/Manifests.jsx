import { useState } from 'react';
import {
  Box, Card, Stack, Typography, Table, TableHead, TableRow, TableCell, TableBody, Drawer, IconButton, Divider,
  Tabs, Tab, LinearProgress, MenuItem, TextField,
} from '@mui/material';
import { PageHeader, SearchField, DetailRow, EmptyState, formatBDT, formatKg } from '../components/common';
import Label from '../components/Label';
import { manifests } from '../data/mock';
import { CloseRoundedIcon } from '../components/icons';

const customsColor = { Released: 'success', Pending: 'warning', Hold: 'error' };

const timeline = [
  ['27 Oct, 10:55', 'Kamal Hasan recorded loaded weight 43,310 kg for WB-19-C-0803 on Scale 1.'],
  ['27 Oct, 10:48', 'Nasima Akter admitted WB-19-C-0803 at Border gate 1, lane B2.'],
  ['27 Oct, 09:02', 'Gateway confirmed payment BDT 1,500.00 from Rupsha Clearing & Forwarding.'],
  ['27 Oct, 08:40', 'Inland gate admitted JESSORE-TA-11-2034 to receive cargo.'],
  ['26 Oct, 17:20', 'Ayesha Siddiqua assigned 2 foreign and 3 receiving trucks.'],
  ['26 Oct, 16:05', 'Manifest received from National Single Window and matched to Benapole Customs House.'],
];

function ManifestDrawer({ m, onClose }) {
  const [tab, setTab] = useState('trucks');
  if (!m) return null;
  const pct = m.declaredKg ? ((m.declaredKg - m.remainingKg) / m.declaredKg) * 100 : 0;
  const blockers = [
    m.remainingKg > 0 && `${formatKg(m.remainingKg)} of cargo still in port`,
    m.balance > 0 && `${formatBDT(m.balance)} balance unpaid`,
    m.customs === 'Hold' && 'Customs hold in place',
  ].filter(Boolean);

  return (
    <Box sx={{ width: 560 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 3, pb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>{m.id}</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            <Label color={m.status === 'Open' ? 'info' : 'default'}>{m.status}</Label>
            <Label color={customsColor[m.customs]}>Customs: {m.customs}</Label>
            <Label>{m.direction}</Label>
          </Stack>
        </Box>
        <IconButton onClick={onClose}><CloseRoundedIcon /></IconButton>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 3 }}>
        <DetailRow label="Agency">{m.agency}</DetailRow>
        <DetailRow label="Importer">{m.trader}</DetailRow>
        <DetailRow label="Linked bill">BILL-{m.id.slice(-5)} · {formatBDT(m.balance)} due</DetailRow>
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography variant="body2" color="text.secondary">Cargo cleared from port</Typography>
            <Typography variant="subtitle2">{Math.round(pct)}%</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={pct} />
        </Box>
      </Box>
      <Box sx={{ mx: 3, p: 2, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Before it can close</Typography>
        {blockers.length ? (
          blockers.map((b) => <Typography key={b} variant="body2" color="text.secondary">• {b}</Typography>)
        ) : (
          <Typography variant="body2" color="success.main">Nothing outstanding.</Typography>
        )}
      </Box>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ px: 3, mt: 2 }}>
        <Tab value="trucks" label="Trucks" />
        <Tab value="cargo" label="Cargo" />
        <Tab value="timeline" label="Timeline" />
        <Tab value="docs" label="Documents" />
      </Tabs>
      <Divider />
      {tab === 'trucks' && (
        <Table size="small">
          <TableHead><TableRow><TableCell sx={{ pl: 3 }}>Truck</TableCell><TableCell>Status</TableCell><TableCell>Where</TableCell><TableCell sx={{ pr: 3 }}>Pass</TableCell></TableRow></TableHead>
          <TableBody>
            {[['WB-19-C-0803', 'Foreign', 'Weighed', 'Scale 1', '—'], ['WB-19-C-0791', 'Foreign', 'Empty, leaving', 'Yard T1', '—'], ['JESSORE-TA-11-2034', 'Local', 'Loaded', 'Inland gate', 'BEN-PASS-004412']].map(([p, k, s, w, pass]) => (
              <TableRow key={p}>
                <TableCell sx={{ pl: 3 }}><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{p}</Typography><Typography variant="caption" color="text.secondary">{k}</Typography></TableCell>
                <TableCell><Label color="info">{s}</Label></TableCell>
                <TableCell>{w}</TableCell>
                <TableCell sx={{ pr: 3, fontFamily: 'monospace', fontSize: 12 }}>{pass}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {tab === 'cargo' && (
        <Table size="small">
          <TableHead><TableRow><TableCell sx={{ pl: 3 }}>Line</TableCell><TableCell>Product</TableCell><TableCell>Declared</TableCell><TableCell sx={{ pr: 3 }}>Remaining</TableCell></TableRow></TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>1</TableCell><TableCell>{m.product}</TableCell>
              <TableCell>{formatKg(m.declaredKg)}</TableCell><TableCell sx={{ pr: 3 }}>{formatKg(m.remainingKg)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
      {tab === 'timeline' && (
        <Stack sx={{ p: 3 }}>
          {timeline.map(([t, s], i) => (
            <Stack key={t} direction="row" spacing={2}>
              <Stack alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: i === 0 ? 'primary.main' : 'grey.400', mt: 0.75 }} />
                {i < timeline.length - 1 && <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.5 }} />}
              </Stack>
              <Box sx={{ pb: 2.5 }}>
                <Typography variant="body2">{s}</Typography>
                <Typography variant="caption" color="text.disabled">{t}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      )}
      {tab === 'docs' && <EmptyState title="No reference documents" description="The C&F agency can attach invoices and packing lists." />}
    </Box>
  );
}

export default function Manifests() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [open, setOpen] = useState(null);
  const rows = manifests.filter(
    (m) => (status === 'All' || m.status === status) && `${m.id} ${m.agency} ${m.product}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Manifest tracking"
        links={[{ name: 'Operations' }, { name: 'Manifest tracking' }]}
        subtitle="Read-only view of cargo, money and trucks for each manifest at this port."
      />
      <Card>
        <Stack direction="row" spacing={2} sx={{ p: 2.5 }}>
          <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ width: 160 }}>
            {['All', 'Open', 'Closed'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <SearchField placeholder="Search manifest, agency or product" value={search} onChange={setSearch} sx={{ flex: 1 }} />
        </Stack>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>Manifest</TableCell>
              <TableCell>Direction</TableCell>
              <TableCell>Agency</TableCell>
              <TableCell>Foreign trucks</TableCell>
              <TableCell>Customs</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell sx={{ pr: 3 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((m) => (
              <TableRow key={m.id} hover onClick={() => setOpen(m)} sx={{ cursor: 'pointer' }}>
                <TableCell sx={{ pl: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{m.id}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.product}</Typography>
                </TableCell>
                <TableCell>{m.direction}</TableCell>
                <TableCell>{m.agency}</TableCell>
                <TableCell>{m.foreignTrucks}</TableCell>
                <TableCell><Label color={customsColor[m.customs]}>{m.customs}</Label></TableCell>
                <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatBDT(m.balance)}</TableCell>
                <TableCell sx={{ pr: 3 }}><Label color={m.status === 'Open' ? 'info' : 'default'}>{m.status}</Label></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 && <EmptyState title="No manifests match" description="Try a different search or status." />}
      </Card>
      <Drawer anchor="right" open={Boolean(open)} onClose={() => setOpen(null)}>
        <ManifestDrawer m={open} onClose={() => setOpen(null)} />
      </Drawer>
    </>
  );
}
