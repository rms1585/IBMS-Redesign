import { useState } from 'react';
import { Tabs, Tab, Button, Typography, Alert } from '@mui/material';
import { PageHeader } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { AddRoundedIcon } from '../components/icons';

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

export default function Equipment() {
  const [tab, setTab] = useState('equipment');
  return (
    <>
      <PageHeader
        title="Equipment & labour"
        links={[{ name: 'Administration' }, { name: 'Equipment & labour' }]}
        action={<Button variant="contained" color="inherit" startIcon={<AddRoundedIcon />}>{tab === 'equipment' ? 'Add equipment' : 'Add gang'}</Button>}
      />
      <Alert severity="info" sx={{ mb: 3 }}>Usage is recorded during warehouse and transshipment handling and read by billing: machine use applies the equipment rate, manual gang work applies the manual rate.</Alert>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="equipment" label="Equipment" />
        <Tab value="labour" label="Labour gangs" />
      </Tabs>
      {tab === 'equipment' ? (
        <DataTable rows={equipment} searchKeys={['id', 'name']} searchPlaceholder="Search equipment" columns={[
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name', render: (r) => <Typography variant="subtitle2">{r.name}</Typography> },
          { key: 'kind', label: 'Kind' },
          { key: 'facility', label: 'Based at' },
          { key: 'status', label: 'Status', render: (r) => <Label color={color[r.status]}>{r.status}</Label> },
          { key: 'e', label: '', align: 'right', render: () => <Button size="small" color="inherit">Edit</Button> },
        ]} />
      ) : (
        <DataTable rows={gangs} searchKeys={['id', 'name', 'leader']} searchPlaceholder="Search gangs" columns={[
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Gang', render: (r) => <Typography variant="subtitle2">{r.name}</Typography> },
          { key: 'size', label: 'Workers', align: 'center' },
          { key: 'leader', label: 'Sardar' },
          { key: 'shift', label: 'Shift' },
          { key: 'e', label: '', align: 'right', render: () => <Button size="small" color="inherit">Edit</Button> },
        ]} />
      )}
    </>
  );
}
