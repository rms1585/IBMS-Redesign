import { useState } from 'react';
import {
  Button, Typography, Alert, Snackbar, Stack, TextField,
} from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '../demo/InPlace';
import { PageHeader, AssumptionNote } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { useStoredState } from '../demo/PortStore';

const NOT_SET = 'To be defined';
const initialExceptions = [
  { id: 'EX-01', name: 'Stone to outside yards', when: NOT_SET, decider: '', authority: NOT_SET },
  { id: 'EX-02', name: 'Cotton to outside yards', when: NOT_SET, decider: '', authority: NOT_SET },
  { id: 'EX-03', name: 'Non-perishable transshipment', when: NOT_SET, decider: '', authority: NOT_SET },
  { id: 'EX-04', name: 'Truck-to-truck transfer', when: 'When sheds are jammed', decider: '', authority: NOT_SET },
];
const isComplete = (r) => r.decider && r.when !== NOT_SET && r.authority !== NOT_SET;

function EditDialog({ exception, onClose, onSave }) {
  const clean = (value) => (value === NOT_SET ? '' : value);
  const [f, setF] = useState({ when: clean(exception.when), decider: exception.decider, authority: clean(exception.authority) });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{exception.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField fullWidth required label="Who decides" value={f.decider} onChange={set('decider')} placeholder="BLPA names this role" />
          <TextField fullWidth required label="When it applies" value={f.when} onChange={set('when')} />
          <TextField fullWidth required label="Authority" value={f.authority} onChange={set('authority')} placeholder="The order or rule that allows it" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!f.decider.trim() || !f.when.trim() || !f.authority.trim()} onClick={() => onSave({ decider: f.decider.trim(), when: f.when.trim(), authority: f.authority.trim() })}>Save for all ports</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Exceptions() {
  const [exceptions, setExceptions] = useStoredState('exceptionRules', initialExceptions);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');
  return (
    <>
      <PageHeader title="Exception catalogue" links={[{ name: 'Administration' }, { name: 'Exception catalogue' }]} subtitle="One definition of each exception, applied the same way at every port." />
      <AssumptionNote code="F62" sx={{ mb: 3 }}>BLPA still has to name who decides each exception. The minutes don't give the conditions or authority, so those are left open.</AssumptionNote>
      <DataTable rows={exceptions} searchKeys={['id', 'name']} searchPlaceholder="Search exceptions" rowKey={(r) => r.id} columns={[
        { key: 'name', label: 'Exception', render: (r) => <><Typography variant="subtitle2">{r.name}</Typography><Typography variant="caption" color="text.secondary">{r.id} · all ports</Typography></> },
        { key: 'decider', label: 'Who decides', render: (r) => r.decider || <Label color="warning">BLPA to name</Label> },
        { key: 'when', label: 'When it applies' },
        { key: 'authority', label: 'Authority' },
        { key: 'status', label: 'Status', render: (r) => (isComplete(r) ? <Label color="success">Defined</Label> : <Label color="warning">Incomplete</Label>) },
        { key: 'a', label: '', render: (r) => <Button size="small" color="inherit" onClick={() => setEditing(r)}>Edit</Button> },
      ]} />
      {editing && (
        <EditDialog
          exception={editing}
          onClose={() => setEditing(null)}
          onSave={(change) => {
            setExceptions((xs) => xs.map((x) => (x.id === editing.id ? { ...x, ...change } : x)));
            setToast(`${editing.name} saved for all ports.`);
            setEditing(null);
          }}
        />
      )}
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
