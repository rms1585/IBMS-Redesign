import { Card, Typography, Table, TableHead, TableRow, TableCell, TableBody, Grid2 as Grid, Button, LinearProgress, Stack } from '@mui/material';
import { PageHeader, KpiCard, formatBDT } from '../components/common';
import Label from '../components/Label';
import { manifests } from '../data/mock';

const TRADER = 'Delta Agro Foods Ltd.';

export default function TraderPortal() {
  const own = manifests.filter((m) => m.trader === TRADER);
  return (
    <>
      <PageHeader
        title="Importer / exporter portal"
        links={[{ name: 'Operations' }, { name: TRADER }]}
        subtitle="Progress and charges for your own manifests at this port. Operational actions are done by your appointed C&F agency."
      />
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Balance due" value={formatBDT(own.reduce((s, m) => s + m.balance, 0))} color="warning" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Active manifests" value={own.filter((m) => m.status === 'Open').length} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Trucks inside" value="3" color="info" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Alerts" value="2" color="error" /></Grid>
      </Grid>
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>Manifest</TableCell>
              <TableCell>Goods</TableCell>
              <TableCell>Appointed agency</TableCell>
              <TableCell>Trucks</TableCell>
              <TableCell sx={{ width: 200 }}>Progress</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell sx={{ pr: 3 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {own.map((m) => {
              const pct = ((m.declaredKg - m.remainingKg) / m.declaredKg) * 100;
              return (
                <TableRow key={m.id} hover>
                  <TableCell sx={{ pl: 3 }}><Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{m.id}</Typography><Typography variant="caption" color="text.secondary">{m.direction}</Typography></TableCell>
                  <TableCell>{m.product}</TableCell>
                  <TableCell>{m.agency}</TableCell>
                  <TableCell>{m.foreignTrucks + m.localTrucks}</TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <LinearProgress variant="determinate" value={pct} sx={{ flex: 1 }} />
                      <Typography variant="caption">{Math.round(pct)}%</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{m.balance > 0 ? formatBDT(m.balance) : <Label color="success">Paid</Label>}</TableCell>
                  <TableCell sx={{ pr: 3 }}><Button size="small" color="inherit">Open</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
