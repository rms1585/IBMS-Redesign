import { useState } from 'react';
import {
  Box, Card, Stack, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Grid2 as Grid, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Tooltip,
} from '@mui/material';
import { PageHeader, SectionCard, KpiCard, formatBDT } from '../components/common';
import Label from '../components/Label';
import { billLines, payments as initialPayments, currentUser } from '../data/mock';
import { AddRoundedIcon } from '../components/icons';

const statusColor = { Confirmed: 'success', Dishonored: 'error', 'Pending confirmation': 'warning' };

function BankFallbackDialog({ open, onClose, onSave }) {
  const [f, setF] = useState({ amount: '', ref: '', bank: '' });
  const amount = Number(f.amount);
  const valid = amount > 0 && f.ref.trim() && f.bank.trim();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Record bank fallback payment</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Use only when the bank counter cannot use IBMS. The payment stays <b>pending</b> and does not reduce the balance until a second officer confirms it against the same bank reference.
        </Alert>
        <Grid container spacing={2}>
          <Grid size={6}><TextField fullWidth required label="Amount (BDT)" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/[^\d.]/g, '') })} /></Grid>
          <Grid size={6}><TextField fullWidth required label="Bank reference" value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} /></Grid>
          <Grid size={12}><TextField fullWidth required label="Bank and branch" value={f.bank} onChange={(e) => setF({ ...f, bank: e.target.value })} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!valid} onClick={() => { onSave({ ...f, amount }); setF({ amount: '', ref: '', bank: '' }); }}>Record as pending</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Billing() {
  const [payments, setPayments] = useState(initialPayments);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');

  const billed = billLines.reduce((s, l) => s + l.amount, 0);
  const counted = payments.filter((p) => p.status === 'Confirmed').reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter((p) => p.status === 'Pending confirmation').reduce((s, p) => s + p.amount, 0);
  const balance = billed - counted;

  const confirm = (p) => {
    setPayments((ps) => ps.map((x) => (x.receipt === p.receipt ? { ...x, status: 'Confirmed' } : x)));
    setToast(`${p.receipt} confirmed. Balance reduced by ${formatBDT(p.amount)}.`);
  };

  return (
    <>
      <PageHeader
        title="Billing & payment"
        links={[{ name: 'Operations' }, { name: 'Billing' }, { name: 'BEN-IGM-2026-08841' }]}
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>Record bank fallback</Button>}
      />
      <Alert severity="info" sx={{ mb: 3 }}>Demonstration tariff (TO-2026-03, invented reference). These are not legal rates.</Alert>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Billed" value={formatBDT(billed)} caption={`${billLines.length} bill lines`} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Counted" value={formatBDT(counted)} caption="Cash, online and cleared cheques" color="success" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Pending confirmation" value={formatBDT(pending)} caption="Not yet counted" color="warning" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Balance due" value={formatBDT(balance)} caption="Blocks loaded local departure" color="error" /></Grid>
      </Grid>

      <SectionCard title="Bill breakdown" subheader="Every line comes from a recorded event and the tariff version in force at that time." sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>Source event</TableCell>
              <TableCell>Recorded</TableCell>
              <TableCell>Tariff</TableCell>
              <TableCell>Calculation</TableCell>
              <TableCell sx={{ pr: 3 }}>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {billLines.map((l) => (
              <TableRow key={l.event} hover>
                <TableCell sx={{ pl: 3, fontWeight: 600 }}>{l.event}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{l.at}</TableCell>
                <TableCell><Label>{l.tariff}</Label></TableCell>
                <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{l.calc}</TableCell>
                <TableCell sx={{ pr: 3, fontVariantNumeric: 'tabular-nums' }}>{formatBDT(l.amount)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={4} sx={{ pl: 3, typography: 'subtitle1' }}>Total</TableCell>
              <TableCell sx={{ pr: 3, typography: 'subtitle1', fontVariantNumeric: 'tabular-nums' }}>{formatBDT(billed)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard title="Payments">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>Receipt</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Payer · method</TableCell>
              <TableCell>Recorded by</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell sx={{ pr: 3 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((p) => {
              const ownRecord = p.by === currentUser.name;
              return (
                <TableRow key={p.receipt} hover>
                  <TableCell sx={{ pl: 3, fontWeight: 600, whiteSpace: 'nowrap' }}>{p.receipt}<Typography variant="caption" color="text.disabled" component="div">{p.at}</Typography></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 13, whiteSpace: 'nowrap' }}>{p.ref}</TableCell>
                  <TableCell>{p.payer}<Typography variant="caption" color="text.secondary" component="div">{p.method}</Typography></TableCell>
                  <TableCell>{p.by}</TableCell>
                  <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatBDT(p.amount)}</TableCell>
                  <TableCell><Label color={statusColor[p.status]}>{p.status}</Label></TableCell>
                  <TableCell sx={{ pr: 3 }}>
                    {p.status === 'Pending confirmation' && (
                      <Tooltip title={ownRecord ? 'A different officer must confirm a payment you recorded.' : ''}>
                        <span><Button size="small" variant="outlined" disabled={ownRecord} onClick={() => confirm(p)}>Confirm</Button></span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="caption" color="text.disabled">Dishonored cheques are never counted. Pay online by card, bKash or Nagad from the C&amp;F portal.</Typography>
        </Box>
      </SectionCard>

      <BankFallbackDialog
        open={open}
        onClose={() => setOpen(false)}
        onSave={(f) => {
          setOpen(false);
          setPayments((ps) => [
            { receipt: `RCPT-BEN-${22025 + ps.length}`, ref: f.ref, amount: f.amount, by: currentUser.name, payer: 'Rupsha Clearing & Forwarding', method: `Bank fallback · ${f.bank}`, status: 'Pending confirmation', at: 'Just now' },
            ...ps,
          ]);
          setToast('Recorded as pending. Another officer must confirm it before it counts.');
        }}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
