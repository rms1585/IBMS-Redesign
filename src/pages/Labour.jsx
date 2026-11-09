import { useState } from 'react';
import {
  Button, Tabs, Tab, Typography, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack, Grid2 as Grid,
} from '@mui/material';
import { PageHeader, AssumptionNote, KpiCard, formatBDT } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { AddRoundedIcon } from '../components/icons';

const gangs = ['Gang 1', 'Gang 2', 'Gang 3', 'Gang 4'];
const equipmentOptions = ['None (manual)', 'Forklift FL-01', 'Forklift FL-02', 'Mobile crane MC-01'];
const statusColor = { Requested: 'warning', 'Gang assigned': 'info', Completed: 'success' };
const initialRequisitions = [
  { id: 'LR-BEN-2041', shed: 'Shed 5', truck: 'WB-19-C-0803', work: 'Unloading', workers: 12, equipment: 'Forklift FL-01', status: 'Requested', gang: '—', at: 'Today, 10:58' },
  { id: 'LR-BEN-2040', shed: 'Shed 5', truck: 'WB-23-K-4402', work: 'Unloading', workers: 10, equipment: 'None (manual)', status: 'Gang assigned', gang: 'Gang 2', at: 'Today, 09:12' },
  { id: 'LR-BEN-2038', shed: 'Open yard 1', truck: 'JESSORE-TA-11-2034', work: 'Loading', workers: 12, equipment: 'Mobile crane MC-01', status: 'Completed', gang: 'Gang 1', at: 'Today, 07:40' },
];
// Demo contractor rates, per tonne. Not the charges BLPA bills to traders.
const contractorBill = [
  { gang: 'Gang 1', manualT: 412, equipmentT: 268, rate: 'Manual 42.50 · equipment 18.00', amount: 22334 },
  { gang: 'Gang 2', manualT: 365, equipmentT: 190, rate: 'Manual 42.50 · equipment 18.00', amount: 18932.5 },
  { gang: 'Gang 3', manualT: 298, equipmentT: 244, rate: 'Manual 42.50 · equipment 18.00', amount: 17057 },
  { gang: 'Gang 4', manualT: 176, equipmentT: 92, rate: 'Manual 42.50 · equipment 18.00', amount: 9136 },
];
const billTotal = contractorBill.reduce((sum, row) => sum + row.amount, 0);
const emptyRequest = { shed: 'Shed 5', truck: '', work: 'Unloading', workers: '', equipment: 'None (manual)' };

function RaiseDialog({ open, onClose, onSave }) {
  const [f, setF] = useState(emptyRequest);
  const set = (k) => (e) => setF({ ...f, [k]: k === 'workers' ? e.target.value.replace(/\D/g, '') : e.target.value });
  const valid = f.truck.trim() && Number(f.workers) > 0;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Raise labour requisition</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth label="Shed or yard" value={f.shed} onChange={set('shed')}>
              {['Shed 5', 'Shed 9', 'Open yard 1'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Truck" value={f.truck} onChange={set('truck')} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth label="Work" value={f.work} onChange={set('work')}>
              {['Unloading', 'Loading'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Workers needed" value={f.workers} onChange={set('workers')} /></Grid>
          <Grid size={12}>
            <TextField select fullWidth label="Equipment needed" value={f.equipment} onChange={set('equipment')}>
              {equipmentOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!valid} onClick={() => { onSave({ ...f, truck: f.truck.trim().toUpperCase(), workers: Number(f.workers) }); setF(emptyRequest); }}>Send to contractor</Button>
      </DialogActions>
    </Dialog>
  );
}

function AssignDialog({ requisition, onClose, onSave }) {
  const [gang, setGang] = useState('');
  const [equipment, setEquipment] = useState(requisition.equipment);
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Assign gang to {requisition.id}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>{requisition.shed} needs {requisition.workers} workers for {requisition.work.toLowerCase()} {requisition.truck}.</Typography>
        <Stack spacing={2}>
          <TextField select fullWidth required label="Labour gang" value={gang} onChange={(e) => setGang(e.target.value)}>
            {gangs.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
          </TextField>
          <TextField select fullWidth label="Equipment" value={equipment} onChange={(e) => setEquipment(e.target.value)}>
            {equipmentOptions.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!gang} onClick={() => onSave(gang, equipment)}>Assign gang</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Labour() {
  const [tab, setTab] = useState('requisitions');
  const [requisitions, setRequisitions] = useState(initialRequisitions);
  const [raising, setRaising] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [toast, setToast] = useState('');
  const open = requisitions.filter((r) => r.status === 'Requested').length;

  return (
    <>
      <PageHeader
        title="Labour requisitions"
        links={[{ name: 'Operations' }, { name: 'Labour requisitions' }]}
        subtitle="The shed asks for labour and equipment, the contractor and labour union assign the gang, and the work feeds the monthly contractor bill."
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setRaising(true)}>Raise requisition</Button>}
      />
      <AssumptionNote code="F24" sx={{ mb: 3 }}>How the contractor or labour union confirms the gang assigned is still to be reviewed with BLPA. Here it is one Assign gang step.</AssumptionNote>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="requisitions" label={<Stack direction="row" spacing={1} alignItems="center"><span>Requisitions</span><Label color="warning">{open}</Label></Stack>} />
        <Tab value="bill" label="Monthly contractor bill" />
      </Tabs>
      {tab === 'requisitions' ? (
        <DataTable rows={requisitions} searchKeys={['id', 'truck', 'shed']} searchPlaceholder="Search requisition, truck or shed" rowKey={(r) => r.id} columns={[
          { key: 'id', label: 'Requisition', render: (r) => <><Typography variant="subtitle2">{r.id}</Typography><Typography variant="caption" color="text.secondary">{r.at}</Typography></> },
          { key: 'shed', label: 'Shed or yard' },
          { key: 'truck', label: 'Truck', render: (r) => <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{r.truck}</Typography> },
          { key: 'need', label: 'Needed', render: (r) => <>{r.work} · {r.workers} workers<Typography variant="caption" color="text.secondary" component="div">{r.equipment}</Typography></> },
          { key: 'gang', label: 'Gang' },
          { key: 'status', label: 'Status', render: (r) => <Label color={statusColor[r.status]}>{r.status}</Label> },
          { key: 'a', label: '', render: (r) => r.status === 'Requested' && <Button size="small" variant="outlined" onClick={() => setAssigning(r)}>Assign gang</Button> },
        ]} />
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}><KpiCard title="October 2026 contractor bill" value={formatBDT(billTotal)} caption="Generated from completed requisitions" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><KpiCard title="Tonnes handled" value={contractorBill.reduce((s, r) => s + r.manualT + r.equipmentT, 0).toLocaleString('en-US')} caption="Manual and with equipment" /></Grid>
          </Grid>
          <Alert severity="info" sx={{ mb: 3 }}>Demonstration contractor rates, not contract values.</Alert>
          <DataTable rows={contractorBill} pageSize={25} rowKey={(r) => r.gang} columns={[
            { key: 'gang', label: 'Gang', render: (r) => <Typography variant="subtitle2">{r.gang}</Typography> },
            { key: 'manualT', label: 'Manual (t)' },
            { key: 'equipmentT', label: 'With equipment (t)' },
            { key: 'rate', label: 'Rate per tonne (BDT)' },
            { key: 'amount', label: 'Amount', render: (r) => formatBDT(r.amount) },
          ]} />
        </>
      )}
      <RaiseDialog
        open={raising}
        onClose={() => setRaising(false)}
        onSave={(f) => {
          setRaising(false);
          setRequisitions((rs) => [{ ...f, id: `LR-BEN-${2042 + rs.length}`, status: 'Requested', gang: '—', at: 'Just now' }, ...rs]);
          setToast('Requisition sent to the contractor and labour union.');
        }}
      />
      {assigning && (
        <AssignDialog
          requisition={assigning}
          onClose={() => setAssigning(null)}
          onSave={(gang, equipment) => {
            setRequisitions((rs) => rs.map((r) => (r.id === assigning.id ? { ...r, gang, equipment, status: 'Gang assigned' } : r)));
            setToast(`${gang} assigned to ${assigning.id}.`);
            setAssigning(null);
          }}
        />
      )}
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
