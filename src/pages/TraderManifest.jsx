import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, Button, Grid2 as Grid, LinearProgress, Stack, Alert, Snackbar } from '@mui/material';
import { PageHeader, SectionCard, EmptyState, formatBDT, formatKg } from '../components/common';
import Label from '../components/Label';
import PayDialog from '../components/PayDialog';
import { VehiclesTable } from './CfManifest';
import { useManifests } from '../ManifestsContext';
import { useCfTrucks } from '../CfTrucksContext';
import { TRADER } from './TraderPortal';

const customsColor = { Released: 'success', Pending: 'warning', Hold: 'error' };

// What still stops the manifest from closing, in the importer's words.
function outstanding(m) {
  return [
    m.customs === 'Hold' && 'Customs has placed a hold. Your C&F agency deals with Customs.',
    m.customs === 'Pending' && 'Customs release is pending.',
    m.remainingKg > 0 && `${formatKg(m.remainingKg)} of cargo is still in the port.`,
    m.balance > 0 && `${formatBDT(m.balance)} land-port bill is unpaid.`,
  ].filter(Boolean);
}

// One of the importer's manifests: progress, what is outstanding, the trucks and the bill. Read-only apart from paying.
export default function TraderManifest() {
  const { manifestId } = useParams();
  const { manifests } = useManifests();
  const { foreign, local } = useCfTrucks();
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState('');
  const m = manifests.find((x) => x.id === manifestId && x.trader === TRADER);
  const links = [{ name: 'Operations' }, { name: 'Importer / exporter portal', href: '/trader-portal' }, { name: manifestId }];

  if (!m) {
    return (
      <>
        <PageHeader title="Manifest not found" links={links} />
        <Card><EmptyState title="No manifest with this number" description="Open one of your manifests from the importer portal." sx={{ py: 10 }} /></Card>
      </>
    );
  }

  const cleared = m.declaredKg ? ((m.declaredKg - m.remainingKg) / m.declaredKg) * 100 : 0;
  const rows = [
    ...(foreign[m.id] ?? []).map((t) => ({ ...t, side: 'foreign' })),
    ...(local[m.id] ?? []).map((t) => ({ ...t, side: 'local' })),
  ];
  const todo = outstanding(m);
  const summary = [
    ['Customs', <Label color={customsColor[m.customs]}>{m.customs}</Label>],
    ['Appointed agency', m.agency],
    ['Cargo cleared', (
      <Stack direction="row" alignItems="center" spacing={1}>
        <LinearProgress variant="determinate" value={cleared} sx={{ flex: 1, maxWidth: 120 }} />
        <span>{Math.round(cleared)}%</span>
      </Stack>
    )],
    ['Land-port bill', m.balance > 0 ? <Label color="warning">{formatBDT(m.balance)} due</Label> : <Label color="success">Paid</Label>],
    ['Status', m.status],
  ];

  return (
    <>
      <PageHeader
        title={<Typography component="span" variant="h4" sx={{ fontFamily: 'monospace' }}>{m.id}</Typography>}
        links={links}
        subtitle={`${m.product} · ${m.direction}`}
        action={m.balance > 0 && <Button variant="contained" onClick={() => setPaying(true)}>Pay now</Button>}
      />
      <Card sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {summary.map(([label, value]) => (
            <Grid key={label} size={{ xs: 6, sm: 4, md: 'grow' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{label}</Typography>
              <Typography variant="subtitle2" component="div">{value}</Typography>
            </Grid>
          ))}
        </Grid>
      </Card>
      <SectionCard title="Before it can close" sx={{ mb: 3 }}>
        <Stack spacing={1} sx={{ px: 3, pb: 3 }}>
          {todo.length
            ? todo.map((t) => <Typography key={t} variant="body2">• {t}</Typography>)
            : <Typography variant="body2" color="success.main">Nothing outstanding.</Typography>}
          <Typography variant="caption" color="text.secondary">Trucks, Customs and the shed are handled by your appointed C&amp;F agency.</Typography>
        </Stack>
      </SectionCard>
      <SectionCard title="Vehicles" subheader={`${(foreign[m.id] ?? []).length} Indian · ${(local[m.id] ?? []).length} Bangladeshi`}>
        <VehiclesTable rows={rows} />
      </SectionCard>
      <PayDialog
        open={paying}
        amount={m.balance}
        onClose={() => setPaying(false)}
        onPaid={() => { setPaying(false); setToast('Payment sent to the gateway. You will get an alert when it is confirmed.'); }}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
