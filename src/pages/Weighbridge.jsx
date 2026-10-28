import { useState, useEffect } from 'react';
import {
  Box, Card, Stack, Typography, Button, Tabs, Tab, Divider, Grid2 as Grid, Alert, Snackbar, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { PageHeader, DetailRow, formatKg, EmptyState } from '../components/common';
import { Workbench, QueueCard, CameraCard } from '../components/Workbench';
import Label from '../components/Label';
import { weighQueue } from '../data/mock';

function ManualWeight({ open, onClose, onConfirm }) {
  const [kg, setKg] = useState('');
  const [reason, setReason] = useState('');
  const n = Number(kg);
  const valid = Number.isFinite(n) && n > 0 && n < 80000 && reason.trim();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Enter weight manually</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Use only when the scale cannot provide a reading. The manual method is kept in the audit log, tracking and the weighbridge register.
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Weight"
            required
            value={kg}
            onChange={(e) => setKg(e.target.value.replace(/[^\d]/g, ''))}
            error={kg !== '' && !(n > 0 && n < 80000)}
            helperText={kg !== '' && !(n > 0 && n < 80000) ? 'Enter a weight between 1 and 79,999 kg' : ' '}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> } }}
          />
          <TextField label="Reason" required multiline minRows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Scale link failure" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!valid} onClick={() => { onConfirm(n, reason); setKg(''); setReason(''); }}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}

function WeighRecord({ truck, onConfirmed }) {
  const [live, setLive] = useState(truck.live);
  const [captured, setCaptured] = useState(null);
  const [manual, setManual] = useState(false);

  // Simulated scale jitter until a weight is captured.
  useEffect(() => {
    if (captured) return undefined;
    const id = setInterval(() => setLive(truck.live + Math.round((Math.random() - 0.5) * 30)), 900);
    return () => clearInterval(id);
  }, [captured, truck.live]);

  const loaded = truck.reason.startsWith('Loaded');
  const tareValid = truck.tare && !truck.tareAge.includes('expired');
  const net = captured && loaded && tareValid ? captured.kg - truck.tare : null;

  return (
    <Card>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ p: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'monospace' }}>{truck.plate}</Typography>
          <Typography variant="body2" color="text.secondary">{truck.reason} · Scale 1, position A</Typography>
        </Box>
        {captured ? <Label color="info">Captured</Label> : <Label color="success">Ready to weigh</Label>}
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 3 }}>
        <Box sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 2, textAlign: 'center', containerType: 'inline-size', bgcolor: (t) => alpha(t.palette.primary.main, 0.06), border: (t) => `1px dashed ${alpha(t.palette.primary.main, 0.3)}` }}>
          <Typography variant="overline" color="text.secondary">{captured ? `Captured weight (${captured.method})` : 'Live scale reading'}</Typography>
          <Typography sx={{ fontSize: 'clamp(32px, 13cqi, 56px)', fontWeight: 800, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums', color: 'text.primary', whiteSpace: 'nowrap' }}>
            {(captured?.kg ?? live).toLocaleString('en-US')} <Typography component="span" variant="h4" color="text.secondary">kg</Typography>
          </Typography>
          {net != null && <Typography variant="subtitle1" color="primary.main">Net cargo {formatKg(net)} (gross − stored tare)</Typography>}
        </Box>
        {!tareValid && loaded && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Stored tare: {truck.tareAge}. This truck must be weighed empty before it leaves, so net weight is not calculated yet.
          </Alert>
        )}
        {!loaded && !tareValid && (
          <Alert severity="info" sx={{ mt: 2 }}>Tare age: {truck.tareAge}. This empty weighing replaces the stored tare.</Alert>
        )}
      </Box>
      <Grid container spacing={{ xs: 0, xl: 4 }} sx={{ px: 3, pb: 2 }}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <DetailRow label="Manifest">{truck.manifest}</DetailRow>
          <DetailRow label="Agency">{truck.agency}</DetailRow>
          <DetailRow label="Declared cargo">{truck.declaredKg ? formatKg(truck.declaredKg) : '—'}</DetailRow>
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <DetailRow label="Driver">{truck.driver}</DetailRow>
          <DetailRow label="Class">{truck.cls}</DetailRow>
          <DetailRow label="Stored tare">{truck.tare ? `${formatKg(truck.tare)} · ${truck.tareAge}` : truck.tareAge}</DetailRow>
        </Grid>
      </Grid>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5} sx={{ p: 3 }}>
        <Button color="inherit" size="large" onClick={() => setManual(true)}>Scale not working? Enter manually</Button>
        <Stack direction="row" spacing={1.5}>
          {captured ? (
            <>
              <Button variant="outlined" color="inherit" size="large" onClick={() => setCaptured(null)}>Re-weigh</Button>
              <Button variant="contained" size="large" onClick={() => onConfirmed(truck, captured)}>Confirm weight</Button>
            </>
          ) : (
            <Button variant="contained" size="large" onClick={() => setCaptured({ kg: live, method: 'scale' })}>Capture weight</Button>
          )}
        </Stack>
      </Stack>
      <ManualWeight open={manual} onClose={() => setManual(false)} onConfirm={(kg) => { setManual(false); setCaptured({ kg, method: 'manual' }); }} />
    </Card>
  );
}

export default function Weighbridge() {
  const [tab, setTab] = useState('entry');
  const [queue, setQueue] = useState(weighQueue);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(weighQueue[0].plate);
  const [toast, setToast] = useState('');

  const tabQueue = queue.filter((t) => (tab === 'entry' ? t.reason.startsWith('Loaded') : !t.reason.startsWith('Loaded')));
  const filtered = tabQueue.filter((t) => `${t.plate} ${t.manifest}`.toLowerCase().includes(search.toLowerCase()));
  const current = tabQueue.find((t) => t.plate === selected);

  return (
    <>
      <PageHeader title="Weighbridge" links={[{ name: 'Operations' }, { name: 'Weighbridge' }]} />
      <Tabs value={tab} onChange={(e, v) => { setTab(v); setSelected(null); }} sx={{ mb: 3 }}>
        <Tab value="entry" label="Waiting for entry" />
        <Tab value="empty" label="Empty & returned" />
      </Tabs>
      <Workbench
        queue={
          <QueueCard
            title="Weighing queue"
            count={filtered.length}
            search={search}
            onSearch={setSearch}
            placeholder="Search plate or manifest"
            items={filtered}
            getKey={(t) => t.plate}
            selectedKey={selected}
            onSelect={setSelected}
            renderItem={(t) => (
              <>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{t.plate}</Typography>
                  <Typography variant="caption" color="text.secondary">{t.admitted}</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" component="div">{t.manifest}</Typography>
                <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
                  <Label color={t.reason.startsWith('Loaded') ? 'primary' : 'info'}>{t.reason}</Label>
                  {(!t.tare || t.tareAge.includes('expired')) && <Label color="warning">Tare needed</Label>}
                </Stack>
              </>
            )}
          />
        }
        center={
          current ? (
            <WeighRecord
              key={current.plate}
              truck={current}
              onConfirmed={(t, c) => {
                setQueue((q) => q.filter((x) => x.plate !== t.plate));
                setSelected(null);
                setToast(`${formatKg(c.kg)} recorded for ${t.plate} (${c.method}). Weighment charge added.`);
              }}
            />
          ) : (
            <Card><EmptyState title="Select a truck to weigh" sx={{ py: 12 }} /></Card>
          )
        }
        rail={[<CameraCard key="cam" lane="Scale 1" plate={current?.plate} expected={current?.plate} />]}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
