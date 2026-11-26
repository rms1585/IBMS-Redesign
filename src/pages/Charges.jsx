import { Card, Stack, Typography, Grid2 as Grid, Alert, Box } from '@mui/material';
import { PageHeader, formatBDT, DetailRow, AssumptionNote } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { tariffLines, truckClassRates } from '../data/mock';
import { tr } from '../i18n/LanguageContext';
import { usePort } from '../demo/PortStore';
import { chargesFor } from '../demo/tariff';

const classRows = Object.entries(truckClassRates).map(([cls, rates]) => ({ cls, ...rates }));

export default function Charges() {
  const { tariff, port } = usePort();
  // RC-2: every charge the port's switched-on modules can create, and whether the order in force prices it.
  const moduleCharges = chargesFor(port.modules, tariff);
  const unpriced = moduleCharges.filter((c) => c.rate == null);
  const billed = tariffLines.filter((t) => t.billedHere);
  // The rates bills are raised with now: the order head office activated last (Platform setup > Tariff orders).
  const inForce = Object.entries(tariff.rates).map(([key, r]) => ({ key, ...r }));
  return (
    <>
      <PageHeader title={tr("What this port charges")} links={[{ name: 'Administration' }, { name: 'What this port charges' }]} subtitle={tr("Read-only. Rates are set centrally on the tariff order; turning a module on adds its charges.")} />
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}><Typography variant="h6">{tariff.ref ?? 'TO-2026-03'}</Typography><Label color="success">{tr('In force')}</Label></Stack>
            <DetailRow label={tr("Reference")}>Invented reference (demo)</DetailRow>
            <DetailRow label={tr("Effective")}>{tariff.effective ?? '1 March 2026 · version 2'}</DetailRow>
            <DetailRow label={tr("Enabled modules")}>{[...new Set(moduleCharges.map((c) => c.module))].join(', ')}</DetailRow>
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
      <AssumptionNote code="F40" sx={{ mb: 3 }}>
        Haltage on a shared truck is under review. Today each importer is charged, so one truck can be billed many times. BLPA still has to approve one rule for all ports.
      </AssumptionNote>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>{tr('Charges the switched-on modules can create')}</Typography>
      {unpriced.length > 0 && <Alert severity="error" sx={{ mb: 2 }}>{unpriced.map((c) => c.what).join(', ')}: {tr('the order in force has no rate. Go-live is refused until head office adds one.')}</Alert>}
      <DataTable rows={moduleCharges} rowKey={(r) => r.key} pageSize={25} columns={[
        { key: 'what', label: 'Charge', render: (r) => <Typography variant="subtitle2">{r.what}</Typography> },
        { key: 'module', label: 'Module' },
        { key: 'rate', label: 'Rate in the order in force', render: (r) => (r.rate == null ? <Label color="error">{tr('No rate')}</Label> : `${formatBDT(r.rate)} per ${r.unit}`) },
      ]} />
      <Typography variant="h6" component="h2" sx={{ mt: 4, mb: 2 }}>{tr('Rates the bills use now')}</Typography>
      <DataTable rows={inForce} rowKey={(r) => r.key} pageSize={25} columns={[
        { key: 'what', label: 'Charge', render: (r) => <Typography variant="subtitle2">{r.what}</Typography> },
        { key: 'unit', label: 'Per', render: (r) => r.unit },
        { key: 'rate', label: 'Rate', render: (r) => formatBDT(r.rate) },
      ]} />
      <Typography variant="h6" component="h2" sx={{ mt: 4, mb: 2 }}>{tr('Full tariff order')}</Typography>
      <DataTable rows={tariffLines} pageSize={25} columns={[
        { key: 'charge', label: 'Charge', render: (r) => <Typography variant="subtitle2">{r.charge}</Typography> },
        { key: 'basis', label: 'Basis' },
        { key: 'rate', label: 'Rate', render: (r) => formatBDT(r.rate) },
        { key: 'billedHere', label: 'At this port', render: (r) => (r.billedHere ? <Label color="success">Billed here</Label> : <Label>Priced only</Label>) },
      ]} />
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Rates by truck class</Typography>
      <DataTable rows={classRows} pageSize={25} columns={[
        { key: 'cls', label: 'Truck class', render: (r) => <Typography variant="subtitle2">{r.cls}</Typography> },
        { key: 'borderEntrance', label: 'Entrance, border gate', render: (r) => formatBDT(r.borderEntrance) },
        { key: 'inlandEntrance', label: 'Entrance, inland gate', render: (r) => formatBDT(r.inlandEntrance) },
        { key: 'weighing', label: 'Weighment', render: (r) => formatBDT(r.weighing) },
      ]} />
    </>
  );
}
