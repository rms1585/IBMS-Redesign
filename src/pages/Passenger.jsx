import { useState } from 'react';
import {
  Box, Button, Tabs, Tab, Typography, Alert, Snackbar, Stack, Grid2 as Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Autocomplete, Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import { PageHeader, KpiCard, AssumptionNote, formatBDT } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { AddRoundedIcon } from '../components/icons';

// Benapole charges as shown on BLPA's passenger site (passenger.blpa.gov.bd), read 10 Nov 2026.
const FACILITY_CHARGE = 52.27;
const VAT_RATE = 0.15;
const CONVENIENCE_FEE = 0;
const VAT = Math.round(FACILITY_CHARGE * VAT_RATE * 100) / 100;
const PASSENGER_TOTAL = FACILITY_CHARGE + VAT + CONVENIENCE_FEE;
// Demo charge only.
const BUS_TERMINAL_CHARGE = 200;
const ports = ['Benapole Land Port', 'Banglabandha Land Port', 'Burimari Land Port', 'Nakugaon Land Port'];
// Neighbouring countries first, as on the BLPA site; the rest is a short demo list.
const countries = [
  'BGD-Bangladesh', 'BTN-Bhutan', 'IND-India', 'NPL-Nepal',
  'ARE-United Arab Emirates', 'AUS-Australia', 'CAN-Canada', 'CHN-China', 'DEU-Germany', 'FRA-France', 'GBR-United Kingdom',
  'JPN-Japan', 'KOR-Korea, Republic of', 'LKA-Sri Lanka', 'MMR-Myanmar', 'MYS-Malaysia', 'PAK-Pakistan', 'SAU-Saudi Arabia',
  'SGP-Singapore', 'THA-Thailand', 'USA-United States',
];
const paymentMethods = [
  'Cash at counter', 'bKash', 'Nagad', 'Upay', 'Rocket', 'Tap', 'MeghnaPay', 'OK Wallet', 'Modhumoti Bank Internet Banking',
  'NEXUS-DBBL', 'AMEX-City', 'MASTER-Brac', 'VISA-Brac',
];
const categories = ['Standard', 'Illiterate (assisted)', 'Disabled', 'Sick', 'Exempt under the Customs Act'];
const today = () => new Date().toISOString().slice(0, 10);
const initialReceipts = [
  { id: 'PF-BEN-55104', name: 'Anirban Ghosh', phone: '', passport: 'Z4827713', country: 'IND-India', port: ports[0], date: today(), category: 'Standard', method: 'Cash at counter', at: 'Today, 10:48', by: 'Counter 2' },
  { id: 'PF-BEN-55103', name: 'Rafiqul Islam', phone: '01711234567', passport: 'A09451820', country: 'BGD-Bangladesh', port: ports[0], date: today(), category: 'Standard', method: 'bKash', at: 'Today, 10:42', by: 'Counter 2' },
  { id: 'PF-BEN-55102', name: 'Mita Rani Das', phone: '', passport: 'T6631954', country: 'IND-India', port: ports[0], date: today(), category: 'Disabled', method: 'Cash at counter', at: 'Today, 10:36', by: 'Counter 1' },
  { id: 'PF-BEN-55101', name: 'Sabina Yasmin', phone: '01819876543', passport: 'B01277364', country: 'BGD-Bangladesh', port: ports[0], date: today(), category: 'Standard', method: 'Nagad', at: 'Today, 10:21', by: 'Counter 2' },
];
const initialBuses = [
  { id: 'BT-BEN-2210', plate: 'DHAKA-METRO-BA-14-2207', operator: 'Green Line', at: 'Today, 09:50' },
  { id: 'BT-BEN-2209', plate: 'JESSORE-BA-11-0482', operator: 'Sohag Paribahan', at: 'Today, 09:15' },
];

const ones = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
function wholeInWords(n) {
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ` ${ones[n % 10]}` : '');
  if (n < 1000) return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${wholeInWords(n % 100)}` : ''}`;
  return `${wholeInWords(Math.floor(n / 1000))} Thousand${n % 1000 ? ` ${wholeInWords(n % 1000)}` : ''}`;
}
// Same style as the BLPA site's receipt: 60.11 reads "Sixty Point One One".
function amountInWords(amount) {
  const [whole, fraction] = amount.toFixed(2).split('.');
  const digits = fraction === '00' ? '' : ` Point ${fraction.split('').map((d) => ones[Number(d)]).join(' ')}`;
  return `${wholeInWords(Number(whole))}${digits}`;
}
const maskPassport = (p) => `•••• ${p.slice(-4)}`;
const phoneProblem = (phone) => (phone && !/^01\d{9}$/.test(phone) ? 'Use 11 digits starting with 01' : '');

const emptyPassenger = { name: '', phone: '', port: ports[0], country: null, passport: '', date: today(), category: 'Standard', method: paymentMethods[0] };

function ChargeTable() {
  const rows = [['Passenger Facilities Charge', FACILITY_CHARGE], ['VAT 15%', VAT], ['Convenience Fee', CONVENIENCE_FEE]];
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
      <Table size="small">
        <TableHead>
          <TableRow><TableCell>Charge</TableCell><TableCell align="right">Per passenger (BDT)</TableCell></TableRow>
        </TableHead>
        <TableBody>
          {rows.map(([label, amount]) => (
            <TableRow key={label}><TableCell>{label}</TableCell><TableCell align="right">{amount.toFixed(2)}</TableCell></TableRow>
          ))}
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Grand Total</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>{PASSENGER_TOTAL.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.25 }}>In words: {amountInWords(PASSENGER_TOTAL)} taka</Typography>
    </Box>
  );
}

// Same fields as BLPA's online passenger form, plus the category the minutes ask for (F53).
function PassengerDialog({ paidToday, onClose, onSave }) {
  const [f, setF] = useState(emptyPassenger);
  const set = (k) => (e) => setF({ ...f, [k]: k === 'passport' ? e.target.value.toUpperCase() : e.target.value });
  const passport = f.passport.trim();
  const phone = phoneProblem(f.phone.trim());
  const alreadyPaid = passport && paidToday.includes(passport);
  const valid = f.name.trim() && passport && f.country && f.port && f.date && !phone;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Record passenger</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth required label="Passenger name" value={f.name} onChange={set('name')} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Phone number" placeholder="01XXXXXXXXX" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '') })} error={Boolean(phone)} helperText={phone || ' '} slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 11 } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField select fullWidth required label="Departure/arrival port" value={f.port} onChange={set('port')}>
              {ports.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Autocomplete
              options={countries} value={f.country} onChange={(e, v) => setF({ ...f, country: v })}
              renderInput={(params) => <TextField {...params} required label="Country code" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth required label="Passport number" value={f.passport} onChange={set('passport')}
              helperText={alreadyPaid ? 'This passport already paid today. Online fees stay valid for several days.' : ' '}
              slotProps={{ formHelperText: { sx: { color: alreadyPaid ? 'warning.main' : undefined } } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth required type="date" label="Departure date" value={f.date} onChange={set('date')} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth label="Passenger category" value={f.category} onChange={set('category')}>
              {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth label="Payment method" value={f.method} onChange={set('method')}>
              {paymentMethods.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={12}><ChargeTable /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!valid} onClick={() => onSave({ ...f, name: f.name.trim(), phone: f.phone.trim(), passport })}>
          Record passenger
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BusDialog({ onClose, onSave }) {
  const [plate, setPlate] = useState('');
  const [operator, setOperator] = useState('');
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Record bus terminal payment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField fullWidth required label="Vehicle number" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} helperText={`Charge ${formatBDT(BUS_TERMINAL_CHARGE)} (demo rate)`} />
          <TextField fullWidth label="Operator" value={operator} onChange={(e) => setOperator(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!plate.trim()} onClick={() => onSave(plate.trim(), operator.trim() || '—')}>Record payment</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Passenger() {
  const [tab, setTab] = useState('fees');
  const [receipts, setReceipts] = useState(initialReceipts);
  const [buses, setBuses] = useState(initialBuses);
  const [dialog, setDialog] = useState(false);
  const [toast, setToast] = useState('');
  const passengers = receipts.length;

  return (
    <>
      <PageHeader
        title="Passenger"
        links={[{ name: 'Operations' }, { name: 'Passenger' }]}
        subtitle="BLPA's passenger facility fee and bus terminal payments."
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog(true)}>{tab === 'fees' ? 'Record passenger' : 'Record bus payment'}</Button>}
      />
      <Alert severity="info" sx={{ mb: 2 }}>IBMS records BLPA's own fee only and has no link to Immigration's system.</Alert>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <AssumptionNote code="F52">Whether Immigration's daily totals are entered in IBMS goes to the next Steering Committee.</AssumptionNote>
        <AssumptionNote code="F53">How these passenger categories are treated is still to be reviewed with BLPA. Here the category is recorded and the fee stays the same.</AssumptionNote>
      </Stack>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}><KpiCard title="Passengers today" value={passengers} caption={formatBDT(passengers * PASSENGER_TOTAL)} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><KpiCard title="Buses today" value={buses.length} caption={formatBDT(buses.length * BUS_TERMINAL_CHARGE)} color="info" /></Grid>
      </Grid>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="fees" label="Passengers" />
        <Tab value="buses" label="Bus terminal" />
      </Tabs>
      {tab === 'fees' ? (
        <DataTable rows={receipts} searchKeys={['id', 'name', 'passport']} searchPlaceholder="Search name, passport or receipt" rowKey={(r) => r.id} columns={[
          { key: 'id', label: 'Receipt', render: (r) => <Typography variant="subtitle2">{r.id}</Typography> },
          { key: 'name', label: 'Passenger', render: (r) => <><Typography variant="body2">{r.name}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{maskPassport(r.passport)}</Typography></> },
          { key: 'country', label: 'Country', render: (r) => r.country.split('-')[0] },
          { key: 'at', label: 'Recorded' },
          { key: 'category', label: 'Category', render: (r) => <Label color={r.category === 'Standard' ? 'default' : 'info'}>{r.category}</Label> },
          { key: 'method', label: 'Payment' },
          { key: 'fee', label: 'Fee', render: () => formatBDT(PASSENGER_TOTAL) },
          { key: 'by', label: 'Counter' },
        ]} />
      ) : (
        <DataTable rows={buses} searchKeys={['plate', 'operator']} searchPlaceholder="Search vehicle number or operator" rowKey={(r) => r.id} columns={[
          { key: 'id', label: 'Receipt', render: (r) => <Typography variant="subtitle2">{r.id}</Typography> },
          { key: 'plate', label: 'Vehicle number', render: (r) => <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{r.plate}</Typography> },
          { key: 'operator', label: 'Operator' },
          { key: 'at', label: 'Recorded' },
          { key: 'charge', label: 'Charge', render: () => formatBDT(BUS_TERMINAL_CHARGE) },
        ]} />
      )}
      {dialog && tab === 'fees' && (
        <PassengerDialog
          paidToday={receipts.filter((r) => r.date === today()).map((r) => r.passport)}
          onClose={() => setDialog(false)}
          onSave={(p) => {
            const id = `PF-BEN-${55101 + receipts.length}`;
            setReceipts((rs) => [{ ...p, id, at: 'Just now', by: 'Counter 1' }, ...rs]);
            setDialog(false);
            setToast(`${formatBDT(PASSENGER_TOTAL)} recorded for ${p.name}. Receipt ${id}.`);
          }}
        />
      )}
      {dialog && tab === 'buses' && (
        <BusDialog
          onClose={() => setDialog(false)}
          onSave={(plate, operator) => {
            setBuses((bs) => [{ id: `BT-BEN-${2211 + bs.length}`, plate, operator, at: 'Just now' }, ...bs]);
            setDialog(false);
            setToast(`Bus terminal payment recorded for ${plate}.`);
          }}
        />
      )}
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
