import { useState } from 'react';
import { Box, Card, Stack, Typography, Button, Divider, Alert, Snackbar, LinearProgress, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader, DetailRow, formatKg, EmptyState } from '../components/common';
import { Workbench, QueueCard } from '../components/Workbench';
import { BayGrid, BayLegend } from '../components/BayGrid';
import Label from '../components/Label';
import { facilities, bayState, storageRules } from '../data/mock';

const cargoLines = [
  { key: 'L1', plate: 'WB-19-C-0803', manifest: 'BEN-IGM-2026-08841', product: 'Rice (non-basmati)', category: 'Food', packages: 640, declaredKg: 32000, grossKg: 32070, outstandingKg: 32000, wait: '18m', agency: 'Rupsha Clearing & Forwarding' },
  { key: 'L2', plate: 'WB-41-B-1192', manifest: 'BEN-IGM-2026-08871', product: 'Detergent', category: 'Chemical', packages: 520, declaredKg: 13000, grossKg: 12960, outstandingKg: 13000, wait: '6m', agency: 'Padma Border Agents' },
];

// Applies active storage-separation rules (symmetric) for the cargo category being placed.
function makeDisallowed(category) {
  const active = storageRules.filter((r) => r.state === 'Active');
  const conflicts = active
    .filter((r) => r.a === category || r.b === category)
    .map((r) => ({ other: r.a === category ? r.b : r.a, scope: r.scope, gap: r.gap ?? 0 }));
  return (code, zone, r, c) => {
    if (!zone.categories.includes('Any') && !zone.categories.includes(category)) return true;
    return conflicts.some((cf) => {
      if (cf.scope === 'zone') {
        for (let rr = 0; rr < zone.rows; rr += 1) for (let cc = 0; cc < zone.cols; cc += 1) if (bayState(zone.code, rr, cc).category === cf.other) return true;
        return false;
      }
      if (cf.scope !== 'adjacent') return false;
      for (let dr = -cf.gap; dr <= cf.gap; dr += 1) {
        for (let dc = -cf.gap; dc <= cf.gap; dc += 1) {
          const rr = r + dr; const cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= zone.rows || cc >= zone.cols || (dr === 0 && dc === 0)) continue;
          if (bayState(zone.code, rr, cc).category === cf.other) return true;
        }
      }
      return false;
    });
  };
}

export default function Posting() {
  const [lines, setLines] = useState(cargoLines);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('L1');
  const [bay, setBay] = useState(null);
  const [toast, setToast] = useState('');
  const current = lines.find((l) => l.key === selected);
  const filtered = lines.filter((l) => `${l.plate} ${l.manifest} ${l.product}`.toLowerCase().includes(search.toLowerCase()));
  const storage = facilities.filter((f) => f.zones.length);

  return (
    <>
      <PageHeader
        title="Posting"
        links={[{ name: 'Operations' }, { name: 'Posting / bay allocation' }]}
        action={
          <>
            <Button component={RouterLink} to="/warehouse-layout" color="inherit">Warehouse layout</Button>
            <Button component={RouterLink} to="/storage-rules" color="inherit">Storage-rule overrides</Button>
          </>
        }
      />
      <Workbench
        queue={
          <QueueCard
            title="Warehouse cargo"
            count={filtered.length}
            search={search}
            onSearch={setSearch}
            placeholder="Search plate, manifest or product"
            items={filtered}
            getKey={(l) => l.key}
            selectedKey={selected}
            onSelect={(k) => { setSelected(k); setBay(null); }}
            renderItem={(l) => (
              <>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{l.plate}</Typography>
                  <Typography variant="caption" color="text.secondary">waiting {l.wait}</Typography>
                </Stack>
                <Typography variant="body2" noWrap>{l.product}</Typography>
                <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
                  <Label color="primary">{l.category}</Label>
                  <Label>{formatKg(l.outstandingKg)} outstanding</Label>
                </Stack>
              </>
            )}
          />
        }
        center={
          current ? (
            <Card>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 1.5 }}>Choose a bay for {current.product}</Typography>
                <Box sx={{ mb: 2 }}><BayLegend /></Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Bays that break an active separation rule or zone category for <b>{current.category}</b> are marked as not allowed. Rules are checked again when you allocate.
                </Alert>
                <Stack spacing={4}>
                  {storage.map((f) => (
                    <Box key={f.id}>
                      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>{f.name} <Typography component="span" variant="body2" color="text.secondary">· {f.kind}</Typography></Typography>
                      <Stack spacing={3}>
                        {f.zones.map((z) => (
                          <Box key={z.code}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="subtitle2">Zone {z.code}</Typography>
                              <Typography variant="caption" color="text.secondary">{z.capacityT} t per bay · accepts {z.categories.join(', ')}</Typography>
                            </Stack>
                            <Box sx={{ overflowX: 'auto', pb: 1 }}>
                              <BayGrid zone={z} selected={bay} onSelect={setBay} isDisallowed={makeDisallowed(current.category)} />
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Card>
          ) : (
            <Card><EmptyState title="Select cargo to allocate" sx={{ py: 12 }} /></Card>
          )
        }
        rail={
          current
            ? [
                <Card key="ctx" sx={{ p: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>BL / manifest</Typography>
                  <DetailRow labelWidth={96} label="Manifest">{current.manifest}</DetailRow>
                  <DetailRow labelWidth={96} label="Agency">{current.agency}</DetailRow>
                  <DetailRow labelWidth={96} label="Packages">{current.packages}</DetailRow>
                  <DetailRow labelWidth={96} label="Declared">{formatKg(current.declaredKg)}</DetailRow>
                  <DetailRow labelWidth={96} label="Gross measured">{formatKg(current.grossKg)}</DetailRow>
                  <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Selected bay</Typography>
                  <Typography variant="h6" sx={{ fontFamily: 'monospace', mb: 2 }}>{bay ?? '—'}</Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!bay}
                    onClick={() => {
                      setToast(`${formatKg(current.outstandingKg)} of ${current.product} allocated to ${bay}.`);
                      setLines((ls) => ls.filter((l) => l.key !== current.key));
                      setSelected(null);
                      setBay(null);
                    }}
                  >
                    {bay ? `Allocate ${bay}` : 'Allocate bay'}
                  </Button>
                </Card>,
                <Card key="free" sx={{ p: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Free space</Typography>
                  <Stack spacing={2}>
                    {[['Shed 5', 212, 1100], ['Shed 9', 280, 600], ['Open yard 1', 640, 1200]].map(([n, free, cap]) => (
                      <Box key={n}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                          <Typography variant="body2">{n}</Typography>
                          <Typography variant="body2" color="text.secondary">{free} t free</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={((cap - free) / cap) * 100} />
                      </Box>
                    ))}
                  </Stack>
                  <Link component={RouterLink} to="/warehouse-layout" variant="body2" sx={{ display: 'block', mt: 2 }}>Open free space view</Link>
                </Card>,
              ]
            : null
        }
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
