import { Alert, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { vehicleTypes } from '../data/mock';

export default function VehicleClasses() {
  return (
    <>
      <PageHeader title="Vehicle classes" links={[{ name: 'Administration' }, { name: 'Vehicle classes' }]} />
      <Alert severity="info" sx={{ mb: 3 }}>
        Ports no longer keep their own vehicle type list. The truck class is recorded at admission from the national register, and the entrance fee depends on the gate of entry, not the vehicle type.
      </Alert>
      <DataTable
        rows={vehicleTypes}
        searchKeys={['name']}
        searchPlaceholder="Search vehicle type"
        columns={[
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Class', render: (r) => <Typography variant="subtitle2">{r.name}</Typography> },
          { key: 'wheels', label: 'Wheels', align: 'center' },
          { key: 'mode', label: 'Mode', render: (r) => <Label color={r.mode === 'Road' ? 'default' : 'warning'}>{r.mode}</Label> },
        ]}
      />
    </>
  );
}
