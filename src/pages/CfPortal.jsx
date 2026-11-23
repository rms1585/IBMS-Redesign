import { useState } from 'react';
import {
  Box, Stack, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Grid2 as Grid,
  Divider, Alert, Snackbar, Drawer,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader, KpiCard, SectionCard, SearchField, formatBDT } from '../components/common';
import Label from '../components/Label';
import PayDialog from '../components/PayDialog';
import ForeignTrucksDrawer from '../components/ForeignTrucksDrawer';
import LocalTrucksDrawer from '../components/LocalTrucksDrawer';
import { preArrivals } from '../data/mock';
import { useManifests } from '../ManifestsContext';
import { useCfTrucks } from '../CfTrucksContext';
import { useCfAlerts } from '../CfAlertsContext';
import { CustomsLabel } from '../components/CustomsSteps';
import { useCustoms } from '../CustomsContext';
import { LocalShippingRoundedIcon, NotificationsActiveRoundedIcon, PaymentsRoundedIcon, ReceiptLongRoundedIcon } from '../components/icons';

const AGENCY = 'Rupsha Clearing & Forwarding';

// Expected consignments with no IGM yet sit above the agency's manifests, so their trucks can be added in advance.
const preArrivalRows = preArrivals
  .filter((p) => p.agency === AGENCY)
  .map((p) => ({ ...p, preArrival: true, status: 'Open', balance: 0, localTrucks: 0 }));

export default function CfPortal() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [pay, setPay] = useState(null);
  const [toast, setToast] = useState('');
  const { foreign: trucks, local: locals, setForeignFor, setLocalFor } = useCfTrucks();
  const [trucksFor, setTrucksFor] = useState(null);
  const [localsFor, setLocalsFor] = useState(null);
  const { manifests } = useManifests();
  const { customsFor } = useCustoms();
  const own = manifests.filter((m) => m.agency === AGENCY);
  const consignments = [...preArrivalRows, ...own];
  const rows = consignments.filter((m) => {
    const plates = (trucks[m.id] ?? []).map((t) => t.plate).join(' ');
    return `${m.id} ${plates}`.toLowerCase().includes(search.toLowerCase());
  });
  const dues = own.reduce((s, m) => s + m.balance, 0);
  // Seeded alerts have no agency; alerts sent from other screens name the agency they are for.
  const alerts = useCfAlerts().alerts.filter((a) => !a.agency || a.agency === AGENCY);

  return (
    <>
      <PageHeader title="C&F portal" links={[{ name: 'Operations' }, { name: AGENCY }]} subtitle="Your agency's manifests, trucks, bills and alerts at Benapole." />
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Dues across active manifests" value={formatBDT(dues)} icon={<PaymentsRoundedIcon />} color="warning" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Active manifests" value={own.filter((m) => m.status === 'Open').length} icon={<ReceiptLongRoundedIcon />} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Trucks in port" value="4" icon={<LocalShippingRoundedIcon />} color="info" note="View queue" noteTo="/border-gate" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Unread alerts" value={alerts.length} icon={<NotificationsActiveRoundedIcon />} color="error" /></Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid size={12}>
          <SectionCard title="Manifests" action={<SearchField placeholder="Search manifest or vehicle" value={search} onChange={setSearch} />}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 3 }}>Manifest</TableCell>
                  <TableCell>Indian vehicles</TableCell>
                  <TableCell>BD vehicles</TableCell>
                  <TableCell>Customs</TableCell>
                  <TableCell>Land-port bill</TableCell>
                  <TableCell />
                  <TableCell sx={{ pr: 3 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell sx={{ pl: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{m.id}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {m.product}{m.preArrival && ` · expected ${m.expected}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {/* The count opens the agency's truck list for this consignment. */}
                      <Button size="small" variant="outlined" color="inherit" onClick={() => setTrucksFor(m)}>
                        {(trucks[m.id] ?? []).length} {(trucks[m.id] ?? []).length === 1 ? 'truck' : 'trucks'}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" color="inherit" onClick={() => setLocalsFor(m)}>
                        {(locals[m.id] ?? []).length} {(locals[m.id] ?? []).length === 1 ? 'truck' : 'trucks'}
                      </Button>
                    </TableCell>
                    <TableCell>{m.preArrival ? <Label color="error">No IGM yet</Label> : <CustomsLabel customs={customsFor(m.id)} />}</TableCell>
                    <TableCell>
                      {m.preArrival ? (
                        <Typography variant="body2" color="text.disabled">Not billed yet</Typography>
                      ) : m.balance > 0 ? <Label color="warning">{formatBDT(m.balance)} due</Label> : <Label color="success">Paid</Label>}
                    </TableCell>
                    {/* One column per action so each stays in place whether or not the others are shown. */}
                    <TableCell>
                      {m.balance > 0 && <Button size="small" variant="contained" onClick={() => setPay(m)}>Pay now</Button>}
                    </TableCell>
                    <TableCell sx={{ pr: 3 }}>
                      <Button size="small" color="inherit" onClick={() => navigate(`/cf-portal/${m.id}`)}>View details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Billing summary">
            <Stack spacing={1.25} sx={{ px: 3, pb: 3 }}>
              {[['Billed', 8790.2], ['Paid', 4494.74], ['Due', 4295.46], ['Overdue', 0]].map(([l, v]) => (
                <Stack key={l} direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{l}</Typography>
                  <Typography variant="subtitle2">{formatBDT(v)}</Typography>
                </Stack>
              ))}
            </Stack>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Alerts" subheader="Newest first">
            <Stack sx={{ px: 3, pb: 2 }} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
              {alerts.map((a) => (
                <Box key={`${a.at}-${a.text}`} sx={{ py: 1.5 }}>
                  <Typography variant="body2">{a.text}</Typography>
                  {a.dropPoints && (
                    <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
                      {a.dropPoints.map((d) => (
                        <Typography key={d.bay} component="li" variant="body2" color="text.secondary">
                          {d.facility} · <Box component="span" sx={{ fontFamily: 'monospace' }}>{d.bay}</Box> · {d.m3} m³
                        </Typography>
                      ))}
                    </Box>
                  )}
                  <Typography variant="caption" color="text.disabled">{a.at} · {a.manifest}</Typography>
                </Box>
              ))}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
      <Drawer anchor="right" open={Boolean(trucksFor)} onClose={() => setTrucksFor(null)}>
        <ForeignTrucksDrawer
          consignment={trucksFor}
          trucks={trucksFor ? trucks[trucksFor.id] ?? [] : []}
          onChange={(next, message) => { setForeignFor(trucksFor.id, next); setToast(message); }}
          onClose={() => setTrucksFor(null)}
        />
      </Drawer>
      <Drawer anchor="right" open={Boolean(localsFor)} onClose={() => setLocalsFor(null)}>
        {localsFor && (
          <LocalTrucksDrawer
            key={localsFor.id}
            consignment={localsFor}
            trucks={locals[localsFor.id] ?? []}
            onChange={(next, message) => { setLocalFor(localsFor.id, next); setToast(message); }}
            onClose={() => setLocalsFor(null)}
          />
        )}
      </Drawer>
      <PayDialog open={Boolean(pay)} amount={pay?.balance ?? 0} onClose={() => setPay(null)} onPaid={() => { setPay(null); setToast('Payment sent to the gateway. You will get an alert when it is confirmed.'); }} />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="info" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
