import { Box, Card, Stack, Typography, Button, Grid2 as Grid, LinearProgress, Divider } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { PageHeader, SectionCard, formatKg } from '../components/common';
import Label from '../components/Label';

const source = { plate: 'WB-19-C-0791', manifest: 'BEN-IGM-2026-08799', product: 'Onion', goodsKg: 30000, remainingKg: 12000, driver: 'Mithun Saha', location: 'Yard T1, position 3', weighing: 'Loaded weighed' };
const receivers = [
  { plate: 'JESSORE-TA-11-2034', planned: 10000, done: 10000, status: 'Completed', gang: 'Gang 1 · manual' },
  { plate: 'JESSORE-TA-11-1987', planned: 8000, done: 8000, status: 'Completed', gang: 'Gang 1 · manual' },
  { plate: 'KHULNA-DA-14-0412', planned: 12000, done: 0, status: 'In position', gang: '—' },
];

export default function Transshipment() {
  const done = receivers.reduce((s, r) => s + r.done, 0);
  return (
    <>
      <PageHeader title="Transshipment" links={[{ name: 'Operations' }, { name: 'Transshipment' }]} subtitle="Direct truck-to-truck transfer in the transshipment yard. The yard is not storage, so storage separation rules do not apply." />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionCard title="Work order WO-BEN-3381" subheader={`${source.product} · ${source.manifest}`} action={<Button variant="contained" startIcon={<AddRoundedIcon />}>Add local truck</Button>}>
            <Box sx={{ px: 3, pb: 3 }}>
              <Card variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: 'background.neutral', boxShadow: 'none' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="overline" color="text.disabled">Source foreign truck</Typography>
                    <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>{source.plate}</Typography>
                    <Typography variant="body2" color="text.secondary">{source.driver} · {source.location} · {source.weighing}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="overline" color="text.disabled">Remaining</Typography>
                    <Typography variant="h5">{formatKg(source.goodsKg - done)}</Typography>
                    <Typography variant="caption" color="text.secondary">of {formatKg(source.goodsKg)}</Typography>
                  </Box>
                </Stack>
                <LinearProgress variant="determinate" value={(done / source.goodsKg) * 100} sx={{ mt: 2 }} />
              </Card>
              <Stack spacing={2}>
                {receivers.map((r) => (
                  <Stack key={r.plate} direction="row" alignItems="center" spacing={2} sx={{ p: 2, borderRadius: 1.5, border: 1, borderColor: 'divider' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{r.plate}</Typography>
                      <Typography variant="caption" color="text.secondary">Planned share {formatKg(r.planned)} · {r.gang}</Typography>
                    </Box>
                    <Box sx={{ width: 180 }}>
                      <LinearProgress variant="determinate" value={(r.done / r.planned) * 100} color={r.done === r.planned ? 'success' : 'primary'} />
                      <Typography variant="caption" color="text.secondary">{formatKg(r.done)} / {formatKg(r.planned)}</Typography>
                    </Box>
                    <Label color={r.status === 'Completed' ? 'success' : 'info'}>{r.status}</Label>
                    {r.status !== 'Completed' && <Button variant="outlined" size="small">Start unloading</Button>}
                  </Stack>
                ))}
              </Stack>
            </Box>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Yard T1 movement">
            <Stack spacing={1.5} sx={{ px: 3, pb: 3 }} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
              {[['Work orders open', 3], ['Receivers in position', 2], ['Source trucks waiting', 1], ['Transfers completed today', 14]].map(([l, v]) => (
                <Stack key={l} direction="row" justifyContent="space-between"><Typography variant="body2">{l}</Typography><Typography variant="subtitle2">{v}</Typography></Stack>
              ))}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </>
  );
}
