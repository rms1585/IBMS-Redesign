import { useState } from 'react';
import {
  Button, Tabs, Tab, Typography, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack, Grid2 as Grid,
} from '@mui/material';
import { PageHeader, AssumptionNote, KpiCard, formatBDT } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { AddRoundedIcon } from '../components/icons';
import {
  useWarehouse, EQUIPMENT, GANGS, gangByName, CONTRACTOR_RATES,
} from '../WarehouseContext';

const statusColor = { Requested: 'warning', 'Gang assigned': 'info', Completed: 'success' };
const emptyRequest = { shed: 'Shed 5', truck: '', work: 'Unloading', workers: '', requested: [] };
export const sameEquipment = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
export const equipmentText = (items) => (items.length ? items.join(', ') : 'None (manual)');
// For use inside a sentence.
export const equipmentPhrase = (items) => (items.length ? items.join(', ') : 'no equipment');
const tonnes = (t) => t.toLocaleString('en-US', { maximumFractionDigits: 1 });

export function EquipmentSelect({ label, value, onChange }) {
  return (
    <TextField
      select fullWidth label={label} value={value} onChange={(e) => onChange(e.target.value)}
      SelectProps={{ multiple: true, displayEmpty: true, renderValue: (v) => equipmentText(v) }}
      InputLabelProps={{ shrink: true }}
    >
      {EQUIPMENT.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
    </TextField>
  );
}

// The shed asks for labour and equipment; the contractor and labour union decide who goes (Item 8, Benapole).
export function RaiseDialog({ open, initial, onClose, onSave }) {
  const [f, setF] = useState({ ...emptyRequest, ...initial });
  const set = (k) => (e) => setF({ ...f, [k]: k === 'workers' ? e.target.value.replace(/\D/g, '') : e.target.value });
  const valid = f.truck.trim() && Number(f.workers) > 0;
  const close = () => { setF({ ...emptyRequest, ...initial }); onClose(); };
  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Raise labour requisition</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth label="Shed or yard" value={f.shed} onChange={set('shed')}>
              {['Shed 5', 'Shed 9', 'Open yard 1', 'Transshipment yard T1'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Truck" value={f.truck} onChange={set('truck')} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth label="Work" value={f.work} onChange={set('work')}>
              {['Unloading', 'Loading', 'Transshipment'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Workers needed" value={f.workers} onChange={set('workers')} /></Grid>
          <Grid size={12}><EquipmentSelect label="Equipment needed" value={f.requested} onChange={(requested) => setF({ ...f, requested })} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={close}>Cancel</Button>
        <Button variant="contained" disabled={!valid} onClick={() => { onSave({ ...f, truck: f.truck.trim().toUpperCase(), workers: Number(f.workers) }); setF({ ...emptyRequest, ...initial }); }}>Send to contractor</Button>
      </DialogActions>
    </Dialog>
  );
}

// Stands in for the contractor and labour union: they pick the gang, which names its labourers, and the equipment sent.
function AssignDialog({ requisition, onClose, onSave }) {
  const [gang, setGang] = useState('');
  const [sent, setSent] = useState(requisition.requested);
  const named = gang ? gangByName(gang).labourers.length : 0;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Assign gang to {requisition.id}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {requisition.shed} needs {requisition.workers} workers and {equipmentPhrase(requisition.requested)} for {requisition.work.toLowerCase()} {requisition.truck}.
        </Typography>
        <Stack spacing={2}>
          <TextField
            select fullWidth required label="Labour gang" value={gang} onChange={(e) => setGang(e.target.value)}
            helperText={gang ? `${named} labourers named by the contractor${named < requisition.workers ? `, ${requisition.workers - named} fewer than needed` : ''}` : ' '}
          >
            {GANGS.map((g) => <MenuItem key={g.name} value={g.name}>{g.name} · {g.labourers.length} labourers</MenuItem>)}
          </TextField>
          <EquipmentSelect label="Equipment sent" value={sent} onChange={setSent} />
          {!sameEquipment(sent, requisition.requested) && <Alert severity="info">The equipment sent differs from the request. The shed sees both.</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!gang} onClick={() => onSave(gang, sent)}>Assign gang</Button>
      </DialogActions>
    </Dialog>
  );
}

// Totals per gang from completed requisitions. Double handling bills the equipment tonnes twice (Item 8, Benapole).
function contractorBill(requisitions) {
  const rows = GANGS.map(({ name }) => {
    const work = requisitions.filter((r) => r.status === 'Completed' && r.gang === name && r.handling);
    const manualT = work.reduce((s, r) => s + r.handling.manualT, 0);
    const equipmentT = work.reduce((s, r) => s + r.handling.equipmentT, 0);
    const doubleT = work.filter((r) => r.handling.double).reduce((s, r) => s + r.handling.equipmentT, 0);
    const lifts = work.reduce((s, r) => s + Object.values(r.handling.lifts).reduce((a, b) => a + b, 0), 0);
    const amount = manualT * CONTRACTOR_RATES.manual + (equipmentT + doubleT) * CONTRACTOR_RATES.equipment;
    return { gang: name, jobs: work.length, manualT, equipmentT, doubleT, lifts, amount };
  });
  return rows.filter((r) => r.jobs > 0);
}

export default function Labour() {
  const { requisitions, raiseRequisition, assignGang } = useWarehouse();
  const [tab, setTab] = useState('requisitions');
  const [raising, setRaising] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [toast, setToast] = useState('');
  const open = requisitions.filter((r) => r.status === 'Requested').length;
  const bill = contractorBill(requisitions);
  const billTotal = bill.reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <PageHeader
        title="Labour requisitions"
        links={[{ name: 'Operations' }, { name: 'Labour requisitions' }]}
        subtitle="The shed asks for labour and equipment, the contractor and labour union assign the gang, and the work feeds the monthly contractor bill."
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setRaising(true)}>Raise requisition</Button>}
      />
      <AssumptionNote code="F24" sx={{ mb: 3 }}>How the contractor or labour union confirms the gang assigned is for BLPA to decide (#60). Here it is one Assign gang step.</AssumptionNote>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="requisitions" label={<Stack direction="row" spacing={1} alignItems="center"><span>Requisitions</span><Label color="warning">{open}</Label></Stack>} />
        <Tab value="bill" label="Monthly contractor bill" />
      </Tabs>
      {tab === 'requisitions' ? (
        <DataTable rows={requisitions} searchKeys={['id', 'truck', 'shed']} searchPlaceholder="Search requisition, truck or shed" rowKey={(r) => r.id} columns={[
          { key: 'id', label: 'Requisition', render: (r) => <><Typography variant="subtitle2">{r.id}</Typography><Typography variant="caption" color="text.secondary">{r.at}</Typography></> },
          { key: 'shed', label: 'Shed or yard' },
          { key: 'truck', label: 'Truck', render: (r) => <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{r.truck}</Typography> },
          { key: 'need', label: 'Needed', render: (r) => <>{r.work} · {r.workers} workers<Typography variant="caption" color="text.secondary" component="div">{equipmentText(r.requested)}</Typography></> },
          {
            key: 'gang', label: 'Assigned', render: (r) => (r.gang ? (
              <>
                {r.gang} · {gangByName(r.gang).labourers.length} named
                <Typography variant="caption" color="text.secondary" component="div">{equipmentText(r.sent)}</Typography>
                {!sameEquipment(r.sent, r.requested) && <Label color="warning" sx={{ mt: 0.5 }}>Differs from request</Label>}
              </>
            ) : '—'),
          },
          { key: 'status', label: 'Status', render: (r) => <Label color={statusColor[r.status]}>{r.status}</Label> },
          { key: 'a', label: '', render: (r) => r.status === 'Requested' && <Button size="small" variant="outlined" onClick={() => setAssigning(r)}>Assign gang</Button> },
        ]} />
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}><KpiCard title="November 2026 contractor bill, to date" value={formatBDT(billTotal)} caption={`From ${bill.reduce((s, r) => s + r.jobs, 0)} completed requisitions`} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><KpiCard title="Tonnes handled" value={tonnes(bill.reduce((s, r) => s + r.manualT + r.equipmentT, 0))} caption="By hand and with equipment" /></Grid>
          </Grid>
          <Alert severity="info" sx={{ mb: 3 }}>
            Demonstration contractor rates, not contract values: by hand {formatBDT(CONTRACTOR_RATES.manual)} per tonne, equipment {formatBDT(CONTRACTOR_RATES.equipment)} per tonne. Double handling (crane and forklift) bills the equipment tonnes twice.
          </Alert>
          <DataTable rows={bill} pageSize={25} rowKey={(r) => r.gang} columns={[
            { key: 'gang', label: 'Gang', render: (r) => <><Typography variant="subtitle2">{r.gang}</Typography><Typography variant="caption" color="text.secondary">{r.jobs} {r.jobs === 1 ? 'requisition' : 'requisitions'}</Typography></> },
            { key: 'manualT', label: 'By hand (t)', render: (r) => tonnes(r.manualT) },
            { key: 'equipmentT', label: 'With equipment (t)', render: (r) => tonnes(r.equipmentT) },
            { key: 'doubleT', label: 'Double handling (t)', render: (r) => tonnes(r.doubleT) },
            { key: 'lifts', label: 'Lifts' },
            { key: 'amount', label: 'Amount', render: (r) => formatBDT(r.amount) },
          ]} />
        </>
      )}
      <RaiseDialog
        open={raising}
        onClose={() => setRaising(false)}
        onSave={(f) => {
          setRaising(false);
          raiseRequisition(f);
          setToast('Requisition sent to the contractor and labour union.');
        }}
      />
      {assigning && (
        <AssignDialog
          requisition={assigning}
          onClose={() => setAssigning(null)}
          onSave={(gang, sent) => {
            assignGang(assigning.id, gang, sent);
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

