import { useState } from 'react';
import {
  Button, Typography, Alert, Snackbar, Stack, Grid2 as Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
} from '@mui/material';
import { PageHeader, KpiCard, AssumptionNote } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { AddRoundedIcon } from '../components/icons';

const SLOT_CAPACITY = 3;
const slots = ['11:00–12:00', '12:00–13:00', '14:00–15:00'];
const statusColor = { Booked: 'default', Waiting: 'info', Called: 'success' };
const initialAppointments = [
  { token: 'Q-018', plate: 'JESSORE-TA-11-2101', manifest: 'BEN-IGM-2026-08841', slot: '11:00–12:00', status: 'Waiting' },
  { token: 'Q-019', plate: 'KHULNA-DA-14-0587', manifest: 'BEN-IGM-2026-08860', slot: '11:00–12:00', status: 'Waiting' },
  { token: 'Q-020', plate: 'JESSORE-TA-11-1987', manifest: 'BEN-IGM-2026-08841', slot: '12:00–13:00', status: 'Booked' },
];
const bookedIn = (appointments, slot) => appointments.filter((a) => a.slot === slot).length;

function BookDialog({ appointments, onClose, onSave }) {
  const [plate, setPlate] = useState('');
  const [manifest, setManifest] = useState('');
  const [slot, setSlot] = useState('');
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Book an appointment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField fullWidth required label="Vehicle number" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} />
          <TextField fullWidth required label="Manifest" value={manifest} onChange={(e) => setManifest(e.target.value.toUpperCase())} />
          <TextField select fullWidth required label="Arrival slot" value={slot} onChange={(e) => setSlot(e.target.value)}>
            {slots.map((s) => {
              const left = SLOT_CAPACITY - bookedIn(appointments, s);
              return <MenuItem key={s} value={s} disabled={left === 0}>{s} · {left === 0 ? 'full' : `${left} left`}</MenuItem>;
            })}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!plate.trim() || !manifest.trim() || !slot} onClick={() => onSave({ plate: plate.trim(), manifest: manifest.trim(), slot })}>Book slot</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TruckQueue() {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [booking, setBooking] = useState(false);
  const [toast, setToast] = useState('');
  const next = appointments.find((a) => a.status === 'Waiting');
  const count = (status) => appointments.filter((a) => a.status === status).length;

  const callNext = () => {
    setAppointments((as) => as.map((a) => (a.token === next.token ? { ...a, status: 'Called' } : a)));
    setToast(`${next.token}: ${next.plate} called to the inland gate.`);
  };

  return (
    <>
      <PageHeader
        title="Truck queue"
        links={[{ name: 'Operations' }, { name: 'Truck queue' }]}
        subtitle="Arrival slots for Bangladeshi trucks and a token queue for the inland gate."
        action={
          <>
            <Button variant="outlined" color="inherit" disabled={!next} onClick={callNext}>Call next</Button>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setBooking(true)}>Book appointment</Button>
          </>
        }
      />
      <AssumptionNote code="F34" sx={{ mb: 3 }}>A proposal: the design presented had no queuing or appointments. Slot length and capacity are placeholders for BLPA to review.</AssumptionNote>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}><KpiCard title="Booked" value={count('Booked')} /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><KpiCard title="Waiting at the port" value={count('Waiting')} color="info" /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><KpiCard title="Called" value={count('Called')} color="success" /></Grid>
      </Grid>
      <DataTable rows={appointments} searchKeys={['token', 'plate', 'manifest']} searchPlaceholder="Search token, plate or manifest" rowKey={(r) => r.token} columns={[
        { key: 'token', label: 'Token', render: (r) => <Typography variant="subtitle2">{r.token}</Typography> },
        { key: 'plate', label: 'Truck', render: (r) => <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{r.plate}</Typography> },
        { key: 'manifest', label: 'Manifest' },
        { key: 'slot', label: 'Arrival slot' },
        { key: 'status', label: 'Status', render: (r) => <Label color={statusColor[r.status]}>{r.status}</Label> },
      ]} />
      {booking && (
        <BookDialog
          appointments={appointments}
          onClose={() => setBooking(false)}
          onSave={(a) => {
            const token = `Q-${String(18 + appointments.length).padStart(3, '0')}`;
            setAppointments((as) => [...as, { ...a, token, status: 'Booked' }]);
            setBooking(false);
            setToast(`${a.plate} booked for ${a.slot}. Token ${token}.`);
          }}
        />
      )}
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
