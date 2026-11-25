import { useState } from 'react';
import { Tabs, Tab, Button, Typography, Alert, Snackbar, Stack, TextField, MenuItem } from '@mui/material';
import { PageHeader } from '../components/common';
import FormDrawer, { useFreshForm } from '../components/FormDrawer';
import { useStoredState } from '../demo/PortStore';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { AddRoundedIcon } from '../components/icons';
import { tr } from '../i18n/LanguageContext';

const equipment = [
  { id: 'FL-01', name: 'Forklift 3 t', kind: 'Forklift', facility: 'Shed 5', status: 'Available' },
  { id: 'FL-02', name: 'Forklift 3 t', kind: 'Forklift', facility: 'Shed 5', status: 'In use' },
  { id: 'MC-01', name: 'Mobile crane 25 t', kind: 'Crane', facility: 'Open yard 1', status: 'Maintenance' },
];
const gangs = [
  { id: 'G-01', name: 'Gang 1', size: 12, leader: 'Abul Kalam', shift: 'Day' },
  { id: 'G-02', name: 'Gang 2', size: 10, leader: 'Rafiqul Islam', shift: 'Day' },
  { id: 'G-03', name: 'Gang 3', size: 12, leader: 'Motaleb Mia', shift: 'Night' },
  { id: 'G-04', name: 'Gang 4', size: 8, leader: 'Nurul Amin', shift: 'Day' },
];
const color = { Available: 'success', 'In use': 'info', Maintenance: 'warning' };
const KINDS = ['Forklift', 'Crane', 'Reach stacker', 'Conveyor', 'Pallet truck'];
const BASES = ['Shed 5', 'Shed 7', 'Shed 9', 'Shed 12', 'Shed 31', 'Open yard 1', 'Open yard B'];
const nextId = (list, prefix) => `${prefix}-${String(list.filter((x) => x.id.startsWith(prefix)).length + 1).padStart(2, '0')}`;

const EMPTY_EQUIPMENT = { kind: 'Forklift', capacity: '', facility: 'Shed 5', status: 'Available' };

function EquipmentDrawer({ open, onClose, onSave }) {
  const [f, set] = useFreshForm(open, EMPTY_EQUIPMENT);
  const capOk = /^\d+(\.\d+)?$/.test(f.capacity) && Number(f.capacity) > 0;
  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={tr("Add equipment")}
      subtitle={tr("Machine use on this equipment is billed at the equipment rate.")}
      actions={<><Button variant="outlined" color="inherit" onClick={onClose}>{tr("Cancel")}</Button><Button variant="contained" disabled={!capOk} onClick={() => onSave(f)}>{tr("Add equipment")}</Button></>}
    >
      <Stack spacing={2.5}>
        <TextField select fullWidth label={tr("Kind")} value={f.kind} onChange={set('kind')}>{KINDS.map((k) => <MenuItem key={k} value={k}>{k}</MenuItem>)}</TextField>
        <TextField fullWidth required autoFocus label={tr("Lifting capacity (t)")} inputMode="decimal" value={f.capacity} onChange={set('capacity')} error={Boolean(f.capacity) && !capOk} helperText={f.capacity && !capOk ? 'Enter tonnes as a number, for example 3' : 'Used to name it, for example Forklift 3 t'} />
        <TextField select fullWidth label={tr("Based at")} value={f.facility} onChange={set('facility')}>{BASES.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}</TextField>
        <TextField select fullWidth label={tr("Status")} value={f.status} onChange={set('status')}>{Object.keys(color).map((st) => <MenuItem key={st} value={st}>{st}</MenuItem>)}</TextField>
      </Stack>
    </FormDrawer>
  );
}

const EMPTY_GANG = { size: '', leader: '', shift: 'Day' };

function GangDrawer({ open, onClose, onSave }) {
  const [f, set] = useFreshForm(open, EMPTY_GANG);
  const sizeOk = /^\d+$/.test(f.size) && Number(f.size) >= 2 && Number(f.size) <= 30;
  const ready = sizeOk && f.leader.trim();
  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={tr("Add gang")}
      subtitle={tr("Manual handling by this gang is billed at the manual rate.")}
      actions={<><Button variant="outlined" color="inherit" onClick={onClose}>{tr("Cancel")}</Button><Button variant="contained" disabled={!ready} onClick={() => onSave(f)}>{tr("Add gang")}</Button></>}
    >
      <Stack spacing={2.5}>
        <TextField fullWidth required autoFocus label={tr("Sardar (gang leader)")} value={f.leader} onChange={set('leader')} />
        <TextField fullWidth required label={tr("Workers")} inputMode="numeric" value={f.size} onChange={set('size')} error={Boolean(f.size) && !sizeOk} helperText={f.size && !sizeOk ? 'Between 2 and 30 workers' : 'Including the sardar'} />
        <TextField select fullWidth label={tr("Shift")} value={f.shift} onChange={set('shift')}>{['Day', 'Night'].map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField>
      </Stack>
    </FormDrawer>
  );
}

export default function Equipment() {
  const [tab, setTab] = useState('equipment');
  const [machines, setMachines] = useStoredState('equipmentList', equipment);
  const [gangList, setGangList] = useStoredState('labourGangs', gangs);
  const [adding, setAdding] = useState(null);
  const [toast, setToast] = useState('');
  return (
    <>
      <PageHeader
        title={tr("Equipment & labour")}
        links={[{ name: 'Administration' }, { name: 'Equipment & labour' }]}
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setAdding(tab)}>{tab === 'equipment' ? 'Add equipment' : 'Add gang'}</Button>}
      />
      <Alert severity="info" sx={{ mb: 3 }}>Usage is recorded during warehouse and transshipment handling and read by billing: machine use applies the equipment rate, manual gang work applies the manual rate.</Alert>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="equipment" label={tr("Equipment")} />
        <Tab value="labour" label={tr("Labour gangs")} />
      </Tabs>
      {tab === 'equipment' ? (
        <DataTable rows={machines} searchKeys={['id', 'name']} searchPlaceholder={tr("Search equipment")} columns={[
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name', render: (r) => <Typography variant="subtitle2">{r.name}</Typography> },
          { key: 'kind', label: 'Kind' },
          { key: 'facility', label: 'Based at' },
          { key: 'status', label: 'Status', render: (r) => <Label color={color[r.status]}>{r.status}</Label> },
          { key: 'e', label: '', render: () => <Button size="small" variant="outlined" color="inherit">{tr("Edit")}</Button> },
        ]} />
      ) : (
        <DataTable rows={gangList} searchKeys={['id', 'name', 'leader']} searchPlaceholder={tr("Search gangs")} columns={[
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Gang', render: (r) => <Typography variant="subtitle2">{r.name}</Typography> },
          { key: 'size', label: 'Workers' },
          { key: 'leader', label: 'Sardar' },
          { key: 'shift', label: 'Shift' },
          { key: 'e', label: '', render: () => <Button size="small" variant="outlined" color="inherit">{tr("Edit")}</Button> },
        ]} />
      )}
      <EquipmentDrawer
        open={adding === 'equipment'}
        onClose={() => setAdding(null)}
        onSave={(f) => {
          const id = nextId(machines, f.kind === 'Forklift' ? 'FL' : f.kind === 'Crane' ? 'MC' : 'EQ');
          setMachines((l) => [...l, { id, name: `${f.kind} ${f.capacity} t`, kind: f.kind, facility: f.facility, status: f.status }]);
          setAdding(null);
          setToast(`${id} added.`);
        }}
      />
      <GangDrawer
        open={adding === 'labour'}
        onClose={() => setAdding(null)}
        onSave={(f) => {
          const id = nextId(gangList, 'G');
          setGangList((l) => [...l, { id, name: `Gang ${gangList.length + 1}`, size: Number(f.size), leader: f.leader.trim(), shift: f.shift }]);
          setAdding(null);
          setToast(`Gang ${gangList.length + 1} added.`);
        }}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
