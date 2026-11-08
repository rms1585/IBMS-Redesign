import { useState } from 'react';
import {
  Box, Stack, Typography, Button, IconButton, Divider, Drawer, Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert, Grid2 as Grid,
} from '@mui/material';
import { AssumptionNote, EmptyState } from './common';
import Label from './Label';
import { truckDataStatus, vehicleTypes } from '../data/mock';
import { AddRoundedIcon, CloseRoundedIcon } from './icons';

const statusColor = {
  [truckDataStatus.entered]: 'warning',
  [truckDataStatus.validated]: 'success',
  [truckDataStatus.inPort]: 'default',
};
const roadClasses = vehicleTypes.filter((v) => v.mode === 'Road');
const emptyTruck = { plate: '', driver: '', driverCard: '', cls: '' };

function TruckForm({ open, truck, takenPlates, onClose, onSave }) {
  const [f, setF] = useState(truck ?? emptyTruck);
  const set = (k) => (e) => setF({ ...f, [k]: k === 'plate' ? e.target.value.toUpperCase() : e.target.value });
  const editing = Boolean(truck);
  const duplicate = f.plate.trim() && takenPlates.includes(f.plate.trim()) && f.plate.trim() !== truck?.plate;
  const valid = f.plate.trim() && f.driver.trim() && f.cls && !duplicate;
  const resetsValidation = editing && truck.status === truckDataStatus.validated;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{editing ? `Edit ${truck.plate}` : 'Add foreign truck'}</DialogTitle>
      <DialogContent>
        <AssumptionNote code="F9" sx={{ mb: 3 }}>
          Your agency is known before the Bill of Entry. Customs has not yet agreed how a C&amp;F agency is fixed at entry.
        </AssumptionNote>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth required label="Vehicle number" value={f.plate} onChange={set('plate')}
              error={Boolean(duplicate)} helperText={duplicate ? 'This truck is already on this manifest' : ' '}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth required label="Truck class" value={f.cls} onChange={set('cls')} helperText="Sets the entrance and weighing charges">
              {roadClasses.map((v) => <MenuItem key={v.code} value={v.name}>{v.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Driver name" value={f.driver} onChange={set('driver')} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Driver card" value={f.driverCard} onChange={set('driverCard')} /></Grid>
        </Grid>
        {resetsValidation && (
          <Alert severity="warning" sx={{ mt: 1 }}>Customs has validated this truck. Saving a change sends it back to Customs to validate again.</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!valid}
          onClick={() => onSave({ ...f, plate: f.plate.trim(), driver: f.driver.trim(), status: truckDataStatus.entered })}
        >
          {editing ? 'Save changes' : 'Add truck'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Foreign trucks a C&F agency registers against one manifest (or pre-arrival reference) before
// they reach the border gate. A truck can be changed until it enters the port; after that it is locked.
export default function ForeignTrucksDrawer({ consignment, trucks, onChange, onClose }) {
  const [form, setForm] = useState(null);
  const [removing, setRemoving] = useState(null);
  if (!consignment) return null;

  const closed = consignment.status === 'Closed';
  const plates = trucks.map((t) => t.plate);
  const save = (truck) => {
    const next = form.truck ? trucks.map((t) => (t.plate === form.truck.plate ? truck : t)) : [...trucks, truck];
    onChange(next, form.truck ? `${truck.plate} updated. Waiting for Customs to validate it.` : `${truck.plate} added. Waiting for Customs to validate it.`);
    setForm(null);
  };

  return (
    <Box sx={{ width: 560, maxWidth: '100vw' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ p: 3, pb: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6">Foreign trucks</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{consignment.id}</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
            <Label>{consignment.product}</Label>
            {consignment.preArrival && <Label color="error">No IGM yet</Label>}
            {closed && <Label>Closed</Label>}
          </Stack>
        </Box>
        <IconButton onClick={onClose} aria-label="Close"><CloseRoundedIcon /></IconButton>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Stack spacing={1.5} sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Add each Indian truck before it reaches the border gate. The gate admits a truck only after Customs validates its details.
        </Typography>
        <AssumptionNote code="F6">How Customs validates truck details is not designed yet. Here it is a status only.</AssumptionNote>
        {consignment.preArrival && (
          <AssumptionNote code="F4">
            Customs keys the IGM when the goods reach zero point. Until then this consignment uses an IBMS pre-arrival reference.
          </AssumptionNote>
        )}
      </Stack>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, pb: 2 }}>
        <Typography variant="subtitle2">{trucks.length} {trucks.length === 1 ? 'truck' : 'trucks'}</Typography>
        <Button variant="contained" startIcon={<AddRoundedIcon />} disabled={closed} onClick={() => setForm({ truck: null })}>Add truck</Button>
      </Stack>
      {trucks.length === 0 ? (
        <EmptyState title="No trucks yet" description="Add the trucks that will carry this consignment." />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>Truck</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Status</TableCell>
              <TableCell sx={{ pr: 3 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {trucks.map((t) => {
              const locked = closed || t.status === truckDataStatus.inPort;
              return (
                <TableRow key={t.plate}>
                  <TableCell sx={{ pl: 3 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{t.plate}</Typography>
                    <Typography variant="caption" color="text.secondary">{t.driver}</Typography>
                  </TableCell>
                  <TableCell>{t.cls}</TableCell>
                  <TableCell><Label color={statusColor[t.status]}>{t.status}</Label></TableCell>
                  {/* Fixed-width slot so rows line up whether or not the truck can still be changed. */}
                  <TableCell sx={{ pr: 3, width: 148 }}>
                    {locked ? (
                      <Typography variant="caption" color="text.disabled">Locked</Typography>
                    ) : (
                      <Stack direction="row" gap={0.5}>
                        <Button size="small" color="inherit" onClick={() => setForm({ truck: t })}>Edit</Button>
                        <Button size="small" color="error" onClick={() => setRemoving(t)}>Remove</Button>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {form && (
        <TruckForm
          open
          truck={form.truck}
          takenPlates={plates}
          onClose={() => setForm(null)}
          onSave={save}
        />
      )}
      <Dialog open={Boolean(removing)} onClose={() => setRemoving(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove {removing?.plate}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">The border gate will no longer expect this truck for {consignment.id}.</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={() => setRemoving(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onChange(trucks.filter((t) => t.plate !== removing.plate), `${removing.plate} removed from ${consignment.id}.`);
              setRemoving(null);
            }}
          >
            Remove truck
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
