import { useState } from 'react';
import {
  Button, Tabs, Tab, Typography, Alert, Snackbar, Stack, Grid2 as Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
} from '@mui/material';
import { PageHeader, KpiCard, AssumptionNote, formatBDT } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { AddRoundedIcon } from '../components/icons';

// Demo charges only.
const FACILITY_FEE = 50;
const BUS_TERMINAL_CHARGE = 200;
const categories = ['Standard', 'Illiterate (assisted)', 'Disabled', 'Sick', 'Exempt under the Customs Act'];
const initialReceipts = [
  { id: 'PF-BEN-55102', passengers: 4, category: 'Standard', at: 'Today, 10:42', by: 'Counter 2' },
  { id: 'PF-BEN-55101', passengers: 1, category: 'Disabled', at: 'Today, 10:36', by: 'Counter 1' },
  { id: 'PF-BEN-55100', passengers: 12, category: 'Standard', at: 'Today, 10:21', by: 'Counter 2' },
];
const initialBuses = [
  { id: 'BT-BEN-2210', plate: 'DHAKA-METRO-BA-14-2207', operator: 'Green Line', at: 'Today, 09:50' },
  { id: 'BT-BEN-2209', plate: 'JESSORE-BA-11-0482', operator: 'Sohag Paribahan', at: 'Today, 09:15' },
];

function FeeDialog({ onClose, onSave }) {
  const [passengers, setPassengers] = useState('');
  const [category, setCategory] = useState('Standard');
  const count = Number(passengers);
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Record passenger fee</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField fullWidth required label="Passengers" value={passengers} onChange={(e) => setPassengers(e.target.value.replace(/\D/g, ''))} helperText={`Fee ${formatBDT(count * FACILITY_FEE)} (demo rate)`} />
          <TextField select fullWidth label="Passenger category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={count <= 0} onClick={() => onSave(count, category)}>Record fee</Button>
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
  const passengers = receipts.reduce((sum, r) => sum + r.passengers, 0);

  return (
    <>
      <PageHeader
        title="Passenger"
        links={[{ name: 'Operations' }, { name: 'Passenger' }]}
        subtitle="BLPA's passenger facility fee and bus terminal payments."
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog(true)}>{tab === 'fees' ? 'Record passenger fee' : 'Record bus payment'}</Button>}
      />
      <Alert severity="info" sx={{ mb: 2 }}>IBMS records BLPA's own fee only and has no link to Immigration's system.</Alert>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <AssumptionNote code="F52">Whether Immigration's daily totals are entered in IBMS goes to the next Steering Committee.</AssumptionNote>
        <AssumptionNote code="F53">How these passenger categories are treated is still to be reviewed with BLPA. Here the category is recorded and the fee stays the same.</AssumptionNote>
      </Stack>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}><KpiCard title="Passengers today" value={passengers} caption={formatBDT(passengers * FACILITY_FEE)} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><KpiCard title="Buses today" value={buses.length} caption={formatBDT(buses.length * BUS_TERMINAL_CHARGE)} color="info" /></Grid>
      </Grid>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="fees" label="Passenger fee" />
        <Tab value="buses" label="Bus terminal" />
      </Tabs>
      {tab === 'fees' ? (
        <DataTable rows={receipts} searchKeys={['id', 'category']} searchPlaceholder="Search receipt or category" rowKey={(r) => r.id} columns={[
          { key: 'id', label: 'Receipt', render: (r) => <Typography variant="subtitle2">{r.id}</Typography> },
          { key: 'at', label: 'Recorded' },
          { key: 'passengers', label: 'Passengers' },
          { key: 'category', label: 'Category', render: (r) => <Label color={r.category === 'Standard' ? 'default' : 'info'}>{r.category}</Label> },
          { key: 'fee', label: 'Fee', render: (r) => formatBDT(r.passengers * FACILITY_FEE) },
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
        <FeeDialog
          onClose={() => setDialog(false)}
          onSave={(count, category) => {
            setReceipts((rs) => [{ id: `PF-BEN-${55103 + rs.length}`, passengers: count, category, at: 'Just now', by: 'Counter 1' }, ...rs]);
            setDialog(false);
            setToast(`${formatBDT(count * FACILITY_FEE)} recorded for ${count} ${count === 1 ? 'passenger' : 'passengers'}.`);
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
