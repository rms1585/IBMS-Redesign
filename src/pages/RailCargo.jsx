import { useState } from 'react';
import { Button, Typography, Alert, Snackbar, Grid2 as Grid } from '@mui/material';
import { PageHeader, KpiCard, AssumptionNote, formatKg } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';

const stages = ['Awaiting entry', 'Entered', 'Weighed', 'Unloaded'];
const stageColor = { 'Awaiting entry': 'default', Entered: 'info', Weighed: 'primary', Unloaded: 'success' };
const nextAction = { 'Awaiting entry': 'Record entry', Entered: 'Record weight', Weighed: 'Record unloading' };
const initialWagons = [
  { wagon: 'WGN-40217', manifest: 'BEN-IGM-2026-08902', goods: 'Fly ash', declaredKg: 58000, liveKg: 58240, stage: 'Weighed' },
  { wagon: 'WGN-40218', manifest: 'BEN-IGM-2026-08902', goods: 'Fly ash', declaredKg: 58000, liveKg: 57910, stage: 'Entered' },
  { wagon: 'WGN-40219', manifest: 'BEN-IGM-2026-08902', goods: 'Fly ash', declaredKg: 58000, liveKg: 58120, stage: 'Awaiting entry' },
  { wagon: 'WGN-40220', manifest: 'BEN-IGM-2026-08902', goods: 'Fly ash', declaredKg: 58000, liveKg: 57990, stage: 'Awaiting entry' },
];
const nextStage = (stage) => stages[stages.indexOf(stage) + 1];

export default function RailCargo() {
  const [wagons, setWagons] = useState(initialWagons);
  const [toast, setToast] = useState('');
  const count = (stage) => wagons.filter((w) => w.stage === stage).length;
  const advance = (row) => {
    const stage = nextStage(row.stage);
    setWagons((ws) => ws.map((w) => (w.wagon === row.wagon ? { ...w, stage, measuredKg: stage === 'Weighed' ? w.liveKg : w.measuredKg } : w)));
    setToast(`${row.wagon}: ${stage.toLowerCase()}.`);
  };

  return (
    <>
      <PageHeader title="Rail cargo" links={[{ name: 'Operations' }, { name: 'Rail cargo' }]} subtitle="Rake RK-BEN-112: each wagon moves through entry, weighing and unloading." />
      <AssumptionNote code="F51" sx={{ mb: 3 }}>Draft design, to be shared with BLPA first.</AssumptionNote>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}><KpiCard title="Awaiting entry" value={count('Awaiting entry')} /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><KpiCard title="In the port" value={count('Entered') + count('Weighed')} color="info" /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><KpiCard title="Unloaded" value={count('Unloaded')} color="success" /></Grid>
      </Grid>
      <DataTable rows={wagons} searchKeys={['wagon', 'manifest']} searchPlaceholder="Search wagon or manifest" rowKey={(r) => r.wagon} columns={[
        { key: 'wagon', label: 'Wagon', render: (r) => <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{r.wagon}</Typography> },
        { key: 'manifest', label: 'Manifest' },
        { key: 'goods', label: 'Goods' },
        { key: 'declaredKg', label: 'Declared', render: (r) => formatKg(r.declaredKg) },
        { key: 'measuredKg', label: 'Weighed', render: (r) => (r.measuredKg ? formatKg(r.measuredKg) : '—') },
        { key: 'stage', label: 'Stage', render: (r) => <Label color={stageColor[r.stage]}>{r.stage}</Label> },
        { key: 'a', label: '', render: (r) => nextAction[r.stage] && <Button size="small" variant="outlined" onClick={() => advance(r)}>{nextAction[r.stage]}</Button> },
      ]} />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
