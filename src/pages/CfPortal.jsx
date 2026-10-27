import { useState } from 'react';
import {
  Box, Card, Stack, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Grid2 as Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, FormControlLabel, Radio, Divider, Alert, Snackbar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import { PageHeader, KpiCard, SectionCard, SearchField, formatBDT } from '../components/common';
import Label from '../components/Label';
import { manifests, alerts } from '../data/mock';

const AGENCY = 'Rupsha Clearing & Forwarding';
const customsColor = { Released: 'success', Pending: 'warning', Hold: 'error' };

function PayDialog({ open, amount, onClose, onPaid }) {
  const [method, setMethod] = useState('bkash');
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Pay land-port charges</DialogTitle>
      <DialogContent>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography color="text.secondary">Amount due</Typography>
          <Typography variant="h6">{formatBDT(amount)}</Typography>
        </Stack>
        <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
        <RadioGroup value={method} onChange={(e) => setMethod(e.target.value)}>
          {[['card', 'Card'], ['bkash', 'bKash'], ['nagad', 'Nagad']].map(([v, l]) => (
            <FormControlLabel key={v} value={v} control={<Radio />} label={l} sx={{ border: 1, borderColor: method === v ? 'primary.main' : 'divider', borderRadius: 1.5, m: 0, mb: 1, pr: 2 }} />
          ))}
        </RadioGroup>
        <Typography variant="caption" color="text.secondary">The balance updates only after the payment gateway confirms the payment.</Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onPaid}>Complete payment</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function CfPortal() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [pay, setPay] = useState(null);
  const [toast, setToast] = useState('');
  const own = manifests.filter((m) => m.agency === AGENCY);
  const rows = own.filter((m) => m.id.toLowerCase().includes(search.toLowerCase()));
  const dues = own.reduce((s, m) => s + m.balance, 0);

  return (
    <>
      <PageHeader title="C&F portal" links={[{ name: 'Operations' }, { name: AGENCY }]} subtitle="Your agency's manifests, trucks, bills and alerts at Benapole." />
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}><KpiCard title="Dues across active manifests" value={formatBDT(dues)} icon={<PaymentsRoundedIcon />} color="warning" /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><KpiCard title="Active manifests" value={own.filter((m) => m.status === 'Open').length} icon={<ReceiptLongRoundedIcon />} /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><KpiCard title="Trucks in port" value="4" icon={<LocalShippingRoundedIcon />} color="info" caption="View queue" /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><KpiCard title="Unread alerts" value={alerts.length} icon={<NotificationsActiveRoundedIcon />} color="error" /></Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <SectionCard title="Manifests" action={<SearchField placeholder="Search manifest or vehicle" value={search} onChange={setSearch} />}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 3 }}>Manifest</TableCell>
                  <TableCell align="center">Indian vehicles</TableCell>
                  <TableCell align="center">BD vehicles</TableCell>
                  <TableCell>Customs</TableCell>
                  <TableCell align="right">Land-port bill</TableCell>
                  <TableCell sx={{ pr: 3 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell sx={{ pl: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{m.id}</Typography>
                      <Typography variant="caption" color="text.secondary">{m.product}</Typography>
                    </TableCell>
                    <TableCell align="center">{m.foreignTrucks}</TableCell>
                    <TableCell align="center">{m.localTrucks}</TableCell>
                    <TableCell><Label color={customsColor[m.customs]}>{m.customs}</Label></TableCell>
                    <TableCell align="right">{m.balance > 0 ? <Label color="warning">{formatBDT(m.balance)} due</Label> : <Label color="success">Paid</Label>}</TableCell>
                    <TableCell align="right" sx={{ pr: 3, whiteSpace: 'nowrap' }}>
                      {m.balance > 0 && <Button size="small" variant="contained" onClick={() => setPay(m)} sx={{ mr: 1 }}>Pay now</Button>}
                      <Button size="small" color="inherit" onClick={() => navigate('/manifests')}>View details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Billing summary" sx={{ mb: 3 }}>
            <Stack spacing={1.25} sx={{ px: 3, pb: 3 }}>
              {[['Billed', 8790.2], ['Paid', 4494.74], ['Due', 4295.46], ['Overdue', 0]].map(([l, v]) => (
                <Stack key={l} direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{l}</Typography>
                  <Typography variant="subtitle2">{formatBDT(v)}</Typography>
                </Stack>
              ))}
            </Stack>
          </SectionCard>
          <SectionCard title="Alerts" subheader="Newest first">
            <Stack sx={{ px: 3, pb: 2 }} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
              {alerts.map((a) => (
                <Box key={a.text} sx={{ py: 1.5 }}>
                  <Typography variant="body2">{a.text}</Typography>
                  <Typography variant="caption" color="text.disabled">{a.at} · {a.manifest}</Typography>
                </Box>
              ))}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
      <PayDialog open={Boolean(pay)} amount={pay?.balance ?? 0} onClose={() => setPay(null)} onPaid={() => { setPay(null); setToast('Payment sent to the gateway. You will get an alert when it is confirmed.'); }} />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="info" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
