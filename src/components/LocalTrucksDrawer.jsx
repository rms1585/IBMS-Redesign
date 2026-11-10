import { useState } from 'react';
import {
  Box, Stack, Typography, Button, IconButton, Divider, Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid2 as Grid,
} from '@mui/material';
import { AssumptionNote, EmptyState, ReasonDialog, TableScroll } from './common';
import Label from './Label';
import { localBookingStatus as status, vehicleTypes } from '../data/mock';
import { AddRoundedIcon, CloseRoundedIcon } from './icons';

export const statusColor = { [status.booked]: 'info', [status.entered]: 'primary', [status.loaded]: 'success', [status.changeRequested]: 'warning' };
const roadClasses = vehicleTypes.filter((v) => v.mode === 'Road');
const compactAction = { minWidth: 0, px: 1 };
const tightColumns = { '& .MuiTableCell-root': { px: 1 }, '& .MuiTableCell-root:first-of-type': { pl: 3 }, '& .MuiTableCell-root:last-of-type': { pr: 3 } };

// A booking must name a real truck: placeholders such as "TBA" or "XXXX" are refused (F32).
function plateProblem(plate) {
  const value = plate.trim();
  if (!value) return '';
  if (!/[A-Z]/.test(value) || !/\d/.test(value) || /^(TBA|TBD|NA|N\/A|X+|UNKNOWN|DUMMY)\b/.test(value)) return 'Enter the real vehicle number, not a placeholder';
  return '';
}

export function TruckDialog({ replacing, takenPlates, onClose, onSave }) {
  const [f, setF] = useState({ plate: '', driver: '', cls: replacing?.cls ?? '' });
  const set = (k) => (e) => setF({ ...f, [k]: k === 'plate' ? e.target.value.toUpperCase() : e.target.value });
  const plate = f.plate.trim();
  const problem = takenPlates.includes(plate) ? 'This truck is already booked on this manifest' : plateProblem(f.plate);
  const valid = plate && !problem && f.driver.trim() && f.cls;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{replacing ? `Replace ${replacing.plate}` : 'Add local truck'}</DialogTitle>
      <DialogContent>
        {replacing && <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Use this when a booked truck breaks down before it enters the port.</Typography>}
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Vehicle number" value={f.plate} onChange={set('plate')} error={Boolean(problem)} helperText={problem || ' '} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth required label="Truck class" value={f.cls} onChange={set('cls')} helperText=" ">
              {roadClasses.map((v) => <MenuItem key={v.code} value={v.name}>{v.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={12}><TextField fullWidth required label="Driver name" value={f.driver} onChange={set('driver')} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!valid} onClick={() => onSave({ plate, driver: f.driver.trim(), cls: f.cls, trips: replacing?.trips ?? 1, status: status.booked })}>
          {replacing ? 'Replace truck' : 'Add truck'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TruckActions({ truck, onReplace, onCancel, onRepeat, onRequestChange }) {
  if (truck.status === status.changeRequested) return <Typography variant="caption" color="text.secondary">Waiting for Customs and BLPA</Typography>;
  if (truck.status === status.booked) {
    return (
      <Stack direction="row" gap={0.5}>
        <Button size="small" color="inherit" sx={compactAction} onClick={onRepeat}>Add trip</Button>
        <Button size="small" color="inherit" sx={compactAction} onClick={onReplace}>Replace</Button>
        <Button size="small" color="error" sx={compactAction} onClick={onCancel}>Cancel</Button>
      </Stack>
    );
  }
  return (
    <Stack direction="row" gap={0.5}>
      <Button size="small" color="inherit" sx={compactAction} onClick={onRepeat}>Add trip</Button>
      <Button size="small" color="inherit" sx={compactAction} onClick={onRequestChange}>Request change</Button>
    </Stack>
  );
}

// Bangladeshi trucks a C&F agency books to collect a consignment. Before entry the agency changes
// them freely; after entry or loading a change needs named approval from Customs and BLPA.
export default function LocalTrucksDrawer({ consignment, trucks, onChange, onClose }) {
  const [declared, setDeclared] = useState(String(trucks.length));
  const [dialog, setDialog] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [changing, setChanging] = useState(null);
  const closed = consignment.status === 'Closed';
  const replaceWith = (plate, next, message) => onChange(trucks.map((t) => (t.plate === plate ? next : t)), message);

  return (
    <Box sx={{ width: 560, maxWidth: '100vw' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ p: 3, pb: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6">Local trucks</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{consignment.id}</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
            <Label>{consignment.product}</Label>
            {closed && <Label>Closed</Label>}
          </Stack>
        </Box>
        <IconButton onClick={onClose} aria-label="Close"><CloseRoundedIcon /></IconButton>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Stack spacing={1.5} sx={{ p: 3 }}>
        <TextField
          label="Declared number of trucks" size="small" value={declared} disabled={closed} sx={{ maxWidth: 240 }}
          onChange={(e) => setDeclared(e.target.value.replace(/\D/g, ''))}
          helperText={`${trucks.length} of ${declared || 0} named`}
        />
        <AssumptionNote code="F32">Booking rules differ by port. BLPA still has to approve one rule set for all ports.</AssumptionNote>
        <AssumptionNote code="F35">Whether Customs officers approve truck changes in IBMS is still to be confirmed with NBR.</AssumptionNote>
      </Stack>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, pb: 2 }}>
        <Typography variant="subtitle2">{trucks.length} {trucks.length === 1 ? 'truck' : 'trucks'}</Typography>
        <Button variant="contained" startIcon={<AddRoundedIcon />} disabled={closed} onClick={() => setDialog({})}>Add truck</Button>
      </Stack>
      {trucks.length === 0 ? (
        <EmptyState title="No trucks yet" description="Add the trucks that will collect this consignment." />
      ) : (
        <TableScroll>
          <Table size="small" sx={tightColumns}>
            <TableHead>
              <TableRow>
                <TableCell>Truck</TableCell>
                <TableCell>Trips</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {trucks.map((t) => (
                <TableRow key={t.plate}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{t.plate}</Typography>
                    <Typography variant="caption" color="text.secondary">{t.driver} · {t.cls}</Typography>
                  </TableCell>
                  <TableCell>{t.trips}</TableCell>
                  <TableCell><Label color={statusColor[t.status]}>{t.status}</Label></TableCell>
                  <TableCell>
                    {closed ? <Typography variant="caption" color="text.disabled">Locked</Typography> : (
                      <TruckActions
                        truck={t}
                        onRepeat={() => replaceWith(t.plate, { ...t, trips: t.trips + 1 }, `Trip added for ${t.plate}.`)}
                        onReplace={() => setDialog({ replacing: t })}
                        onCancel={() => setCancelling(t)}
                        onRequestChange={() => setChanging(t)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScroll>
      )}
      {dialog && (
        <TruckDialog
          replacing={dialog.replacing}
          takenPlates={trucks.map((t) => t.plate)}
          onClose={() => setDialog(null)}
          onSave={(truck) => {
            if (dialog.replacing) replaceWith(dialog.replacing.plate, truck, `${dialog.replacing.plate} replaced by ${truck.plate}.`);
            else onChange([...trucks, truck], `${truck.plate} booked on ${consignment.id}.`);
            setDialog(null);
          }}
        />
      )}
      <ReasonDialog
        open={Boolean(cancelling)}
        title={`Cancel ${cancelling?.plate ?? ''}?`}
        description="The inland gate will no longer expect this truck."
        confirmLabel="Cancel booking"
        confirmColor="error"
        onClose={() => setCancelling(null)}
        onConfirm={() => { onChange(trucks.filter((t) => t.plate !== cancelling.plate), `${cancelling.plate} cancelled.`); setCancelling(null); }}
      />
      <ReasonDialog
        open={Boolean(changing)}
        title={`Request a change to ${changing?.plate ?? ''}`}
        description="This truck has already entered or loaded. The change needs named approval from Customs and BLPA."
        confirmLabel="Send request"
        onClose={() => setChanging(null)}
        onConfirm={() => { replaceWith(changing.plate, { ...changing, status: status.changeRequested }, 'Change request sent to Customs and BLPA.'); setChanging(null); }}
      />
    </Box>
  );
}
