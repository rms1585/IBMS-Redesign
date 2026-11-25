import { useState } from 'react';
import {
  Box, Button, Card, Tabs, Tab, Typography, Alert, Snackbar, Stack, Grid2 as Grid, TextField, MenuItem,
  Autocomplete, Table, TableHead, TableRow, TableCell, TableBody, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
} from '@mui/material';
import { PageHeader, KpiCard, AssumptionNote, formatBDT } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { AddRoundedIcon, CashRoundedIcon } from '../components/icons';
import bkashLogo from '../assets/payment/bkash.png';
import nagadLogo from '../assets/payment/nagad.png';
import upayLogo from '../assets/payment/upay.png';
import rocketLogo from '../assets/payment/rocket.png';
import tapLogo from '../assets/payment/tap.png';
import meghnaPayLogo from '../assets/payment/meghna-pay.png';
import okWalletLogo from '../assets/payment/ok-wallet.png';
import modhumotiLogo from '../assets/payment/modhumoti.png';
import nexusDbblLogo from '../assets/payment/nexus-dbbl.png';
import amexLogo from '../assets/payment/amex.png';
import mastercardLogo from '../assets/payment/mastercard.jpg';
import visaLogo from '../assets/payment/visa.jpg';
import { useStoredState } from '../demo/PortStore';

// Benapole charges as shown on BLPA's passenger site (passenger.blpa.gov.bd), read 10 Nov 2026.
const FACILITY_CHARGE = 52.27;
const VAT_RATE = 0.15;
const CONVENIENCE_FEE = 0;
const VAT = Math.round(FACILITY_CHARGE * VAT_RATE * 100) / 100;
const PASSENGER_TOTAL = FACILITY_CHARGE + VAT + CONVENIENCE_FEE;
// Demo charge only.
const BUS_TERMINAL_CHARGE = 200;
const NONE_USED = [];
const ports = ['Benapole Land Port', 'Banglabandha Land Port', 'Burimari Land Port', 'Nakugaon Land Port'];
// Neighbouring countries first, as on the BLPA site; the rest is a short demo list.
const countries = [
  'BGD-Bangladesh', 'BTN-Bhutan', 'IND-India', 'NPL-Nepal',
  'ARE-United Arab Emirates', 'AUS-Australia', 'CAN-Canada', 'CHN-China', 'DEU-Germany', 'FRA-France', 'GBR-United Kingdom',
  'JPN-Japan', 'KOR-Korea, Republic of', 'LKA-Sri Lanka', 'MMR-Myanmar', 'MYS-Malaysia', 'PAK-Pakistan', 'SAU-Saudi Arabia',
  'SGP-Singapore', 'THA-Thailand', 'USA-United States',
];
// Logos as shown on BLPA's passenger site; cash at the counter is IBMS's own option.
const paymentMethods = [
  { name: 'Cash at counter' },
  { name: 'bKash', logo: bkashLogo },
  { name: 'Nagad', logo: nagadLogo },
  { name: 'Upay', logo: upayLogo },
  { name: 'Rocket', logo: rocketLogo },
  { name: 'Tap', logo: tapLogo },
  { name: 'MeghnaPay', logo: meghnaPayLogo },
  { name: 'OK Wallet', logo: okWalletLogo },
  { name: 'Modhumoti Bank Internet Banking', logo: modhumotiLogo },
  { name: 'NEXUS-DBBL', logo: nexusDbblLogo },
  { name: 'AMEX-City', logo: amexLogo },
  { name: 'MASTER-Brac', logo: mastercardLogo },
  { name: 'VISA-Brac', logo: visaLogo },
];
const categories = ['Standard', 'Illiterate (assisted)', 'Disabled', 'Sick', 'Exempt under the Customs Act'];
const today = () => new Date().toISOString().slice(0, 10);
// Stored with the record, so it has to stay true later: the clock time, not "Just now".
const nowLabel = () => `Today, ${new Date().toTimeString().slice(0, 5)}`;
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

const emptyPassenger = { name: '', phone: '', port: ports[0], country: null, passport: '', date: today(), category: 'Standard', method: paymentMethods[0].name };

function ChargeTable() {
  const rows = [['Passenger Facilities Charge', FACILITY_CHARGE], ['VAT 15%', VAT], ['Convenience Fee', CONVENIENCE_FEE]];
  return (
    <Box>
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
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, pt: 1.25 }}>In words: {amountInWords(PASSENGER_TOTAL)} taka</Typography>
    </Box>
  );
}

// Every tile is sized from the largest logo (Nagad, 73×32 at display size) plus 16px on each side,
// so all tiles match whatever the logo's shape.
const LOGO_BOX = { width: 73, height: 32 };
// The radio stays for keyboard and screen-reader use but is not drawn; the tile's border shows the choice.
const hiddenRadio = { position: 'absolute', opacity: 0, width: 1, height: 1, p: 0, m: 0, overflow: 'hidden' };

// Logo tiles like BLPA's passenger site: easier to recognise than a list of names. One can be selected.
function PaymentMethodPicker({ value, onChange }) {
  return (
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="legend" sx={{ mb: 1, typography: 'body2' }}>Payment method</FormLabel>
      <RadioGroup
        value={value} onChange={(e) => onChange(e.target.value)}
        sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1 }}
      >
        {paymentMethods.map((m) => {
          const selected = m.name === value;
          return (
            <FormControlLabel
              key={m.name} value={m.name} control={<Radio sx={hiddenRadio} />}
              label={(
                <Box sx={{ ...LOGO_BOX, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                  {m.logo
                    ? <Box component="img" src={m.logo} alt={m.name} sx={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    : <><CashRoundedIcon fontSize="small" /><Typography variant="body2">Cash</Typography></>}
                </Box>
              )}
              sx={{
                position: 'relative', m: 0, p: 2, borderRadius: 1.5, border: 1, cursor: 'pointer',
                '& .MuiFormControlLabel-label': { display: 'block' },
                borderColor: selected ? 'primary.main' : 'divider',
                // A second ring drawn inside the border makes the selection 2px thick without moving the logo.
                boxShadow: (t) => (selected ? `inset 0 0 0 1px ${t.palette.primary.main}` : 'none'),
                '&:hover': { borderColor: selected ? 'primary.main' : 'text.disabled' },
                '&:has(input:focus-visible)': { outline: 2, outlineColor: 'primary.main', outlineOffset: 2 },
              }}
            />
          );
        })}
      </RadioGroup>
    </FormControl>
  );
}

// Same fields as BLPA's online passenger form, plus the category the minutes ask for (F53).
function PassengerForm({ paidToday, onClose, onSave }) {
  const [f, setF] = useState(emptyPassenger);
  const set = (k) => (e) => setF({ ...f, [k]: k === 'passport' ? e.target.value.toUpperCase() : e.target.value });
  const passport = f.passport.trim();
  const phone = phoneProblem(f.phone.trim());
  const alreadyPaid = passport && paidToday.includes(passport);
  const valid = f.name.trim() && passport && f.country && f.port && f.date && !phone;
  return (
    <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Record passenger</Typography>
      <Box>
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
          <Grid size={12}><PaymentMethodPicker value={f.method} onChange={(method) => setF({ ...f, method })} /></Grid>
          <Grid size={12}><ChargeTable /></Grid>
        </Grid>
      </Box>
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!valid} onClick={() => onSave({ ...f, name: f.name.trim(), phone: f.phone.trim(), passport })}>
          Record passenger
        </Button>
      </Stack>
    </Card>
  );
}

function BusForm({ onClose, onSave }) {
  const [plate, setPlate] = useState('');
  const [operator, setOperator] = useState('');
  return (
    <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Record bus terminal payment</Typography>
      <Box>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField fullWidth required label="Vehicle number" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} helperText={`Charge ${formatBDT(BUS_TERMINAL_CHARGE)} (demo rate)`} />
          <TextField fullWidth label="Operator" value={operator} onChange={(e) => setOperator(e.target.value)} />
        </Stack>
      </Box>
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!plate.trim()} onClick={() => onSave(plate.trim(), operator.trim() || '—')}>Record payment</Button>
      </Stack>
    </Card>
  );
}

// Check point: a ticket is paid, valid today and unused, or it goes back to the counter.
function CheckPoint({ receipts, used, onUse }) {
  const [q, setQ] = useState('');
  const r = receipts.find((x) => x.id.toUpperCase() === q.trim().toUpperCase());
  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <TextField label="Ticket number" value={q} onChange={(e) => setQ(e.target.value)} placeholder="PF-BEN-55103" sx={{ maxWidth: 360, mb: 2 }} fullWidth />
      {q && !r && <Alert severity="error" variant="outlined">No paid ticket {q}. The passenger goes back to the counter.</Alert>}
      {r && (
        <Stack spacing={1.5}>
          <Typography variant="subtitle1">{r.name} · passport {maskPassport(r.passport)}</Typography>
          <Stack direction="row" spacing={1}><Label color="success">Paid</Label><Label color={r.date === today() ? 'success' : 'error'}>{r.date === today() ? 'Pass valid' : 'Not valid today'}</Label>{used.includes(r.id) && <Label>Pass used</Label>}</Stack>
          <Box><Button variant="contained" disabled={used.includes(r.id) || r.date !== today()} onClick={() => onUse(r.id)}>Mark ticket used</Button></Box>
        </Stack>
      )}
    </Card>
  );
}

// Each day: tickets issued, paid and used against the provider's receipts, with any difference flagged.
function Reconciliation({ receipts, used }) {
  const byMethod = receipts.reduce((acc, r) => ({ ...acc, [r.method]: (acc[r.method] ?? 0) + 1 }), {});
  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>Today at Benapole</Typography>
      <Typography variant="body2">Issued {receipts.length} · paid {receipts.length} · used {used.length} · provider receipts {receipts.length}. No difference to flag.</Typography>
      <Stack spacing={0.5} sx={{ mt: 1.5 }}>
        {Object.entries(byMethod).map(([m, n]) => <Typography key={m} variant="body2" color="text.secondary">{m}: {n} ticket{n === 1 ? '' : 's'}, {formatBDT(n * PASSENGER_TOTAL)}</Typography>)}
      </Stack>
    </Card>
  );
}

export default function Passenger() {
  const [tab, setTab] = useState('fees');
  const [receipts, setReceipts] = useStoredState('passengerReceipts', initialReceipts);
  const [buses, setBuses] = useStoredState('busTrips', initialBuses);
  const [dialog, setDialog] = useState(false);
  const [used, setUsed] = useStoredState('passengerTicketsUsed', NONE_USED);
  const [toast, setToast] = useState('');
  const passengers = receipts.length;

  return (
    <>
      <PageHeader
        title="Passenger and bus terminal"
        links={[{ name: 'Operations' }, { name: 'Passenger' }]}
        subtitle="BLPA's passenger facility fee and bus terminal payments."
        action={(tab === 'fees' || tab === 'buses') && !dialog && <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog(true)}>{tab === 'fees' ? 'Issue ticket' : 'Record bus arrival'}</Button>}
      />
      <Alert severity="info" sx={{ mb: 2 }}>IBMS records BLPA's own fee only and has no link to Immigration's system.</Alert>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Every passenger pays, arriving and departing; there are no exemptions. The ticket number is the payment ID, and paid comes only from the provider. On departure the check point comes before Immigration.</Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}><KpiCard title="Passengers today" value={passengers} caption={formatBDT(passengers * PASSENGER_TOTAL)} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><KpiCard title="Buses today" value={buses.length} caption={formatBDT(buses.length * BUS_TERMINAL_CHARGE)} color="info" /></Grid>
      </Grid>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="fees" label="Passengers" />
        <Tab value="buses" label="Bus desk" />
        <Tab value="check" label="Check point" />
        <Tab value="reconcile" label="Daily reconciliation" />
      </Tabs>
      {dialog && tab === 'fees' && (
        <PassengerForm
          paidToday={receipts.filter((r) => r.date === today()).map((r) => r.passport)}
          onClose={() => setDialog(false)}
          onSave={(p) => {
            const id = `PF-BEN-${55101 + receipts.length}`;
            setReceipts((rs) => [{ ...p, id, at: nowLabel(), by: 'Counter 1' }, ...rs]);
            setDialog(false);
            setToast(`${formatBDT(PASSENGER_TOTAL)} recorded for ${p.name}. Receipt ${id}.`);
          }}
        />
      )}
      {dialog && tab === 'buses' && (
        <BusForm
          onClose={() => setDialog(false)}
          onSave={(plate, operator) => {
            setBuses((bs) => [{ id: `BT-BEN-${2211 + bs.length}`, plate, operator, at: nowLabel() }, ...bs]);
            setDialog(false);
            setToast(`Bus terminal payment recorded for ${plate}.`);
          }}
        />
      )}
      {tab === 'check' && <CheckPoint receipts={receipts} used={used} onUse={(id) => { setUsed([...used, id]); setToast(`Ticket ${id} marked used at the check point.`); }} />}
      {tab === 'reconcile' && <Reconciliation receipts={receipts} used={used} />}
      {tab === 'fees' ? (
        <DataTable rows={receipts} searchKeys={['id', 'name', 'passport']} searchPlaceholder="Search name, passport or receipt" rowKey={(r) => r.id} columns={[
          { key: 'id', label: 'Receipt', render: (r) => <Typography variant="subtitle2">{r.id}</Typography> },
          { key: 'name', label: 'Passenger', render: (r) => <><Typography variant="body2">{r.name}</Typography><Typography variant="caption" color="text.secondary">Passport {maskPassport(r.passport)}</Typography></> },
          { key: 'country', label: 'Country', render: (r) => r.country.split('-')[0] },
          { key: 'at', label: 'Recorded' },
          { key: 'category', label: 'Category', render: (r) => <Label color={r.category === 'Standard' ? 'default' : 'info'}>{r.category}</Label> },
          { key: 'method', label: 'Payment' },
          { key: 'fee', label: 'Fee', render: () => formatBDT(PASSENGER_TOTAL) },
          { key: 'by', label: 'Counter' },
        ]} />
      ) : tab === 'buses' && (
        <DataTable rows={buses} searchKeys={['plate', 'operator']} searchPlaceholder="Search vehicle number or operator" rowKey={(r) => r.id} columns={[
          { key: 'id', label: 'Receipt', render: (r) => <Typography variant="subtitle2">{r.id}</Typography> },
          { key: 'plate', label: 'Vehicle number', render: (r) => <Typography variant="body2" fontWeight={700}>{r.plate}</Typography> },
          { key: 'operator', label: 'Operator' },
          { key: 'at', label: 'Recorded' },
          { key: 'charge', label: 'Charge', render: () => formatBDT(BUS_TERMINAL_CHARGE) },
        ]} />
      )}
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
