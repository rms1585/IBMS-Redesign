import { Card, Stack, Typography, Grid2 as Grid, Alert, Box } from '@mui/material';
import { PageHeader, formatBDT, DetailRow } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { tariffLines } from '../data/mock';

export default function Charges() {
  const billed = tariffLines.filter((t) => t.billedHere);
  return (
    <>
      <PageHeader title="What this port charges" links={[{ name: 'Administration' }, { name: 'What this port charges' }]} subtitle="Read-only. Rates are set centrally on the tariff order; turning a module on adds its charges." />
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}><Typography variant="h6">TO-2026-03</Typography><Label color="success">In force</Label></Stack>
            <DetailRow label="Reference">Invented reference (demo)</DetailRow>
            <DetailRow label="Effective">1 March 2026 · version 2</DetailRow>
            <DetailRow label="Enabled modules">Gates, weighing, billing, warehousing, transshipment</DetailRow>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary">Priced charges billed here</Typography>
            <Typography variant="h3" sx={{ my: 1 }}>{billed.length} <Box component="span" sx={{ typography: 'h6', color: 'text.secondary' }}>of {tariffLines.length}</Box></Typography>
            <Typography variant="body2" color="text.secondary">Haltage is priced on this order but not billed at Benapole.</Typography>
          </Card>
        </Grid>
      </Grid>
      <Alert severity="info" sx={{ mb: 3 }}>Demonstration values, not legal rates.</Alert>
      <DataTable rows={tariffLines} pageSize={25} columns={[
        { key: 'charge', label: 'Charge', render: (r) => <Typography variant="subtitle2">{r.charge}</Typography> },
        { key: 'basis', label: 'Basis' },
        { key: 'rate', label: 'Rate', render: (r) => formatBDT(r.rate) },
        { key: 'billedHere', label: 'At this port', render: (r) => (r.billedHere ? <Label color="success">Billed here</Label> : <Label>Priced only</Label>) },
      ]} />
    </>
  );
}
