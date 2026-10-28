import { useState } from 'react';
import { Stack, Typography, Button, Grid2 as Grid, Alert, Snackbar, TextField, MenuItem } from '@mui/material';
import { PageHeader, KpiCard } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { products } from '../data/mock';

const routeColor = { Warehouse: 'primary', Transshipment: 'info', 'Stone route': 'warning' };
const enabled = { Warehouse: true, Transshipment: true, 'Stone route': false };

export default function Routing() {
  const [routes, setRoutes] = useState(() => Object.fromEntries(products.map((p) => [p.code, p.route])));
  const [pending, setPending] = useState({});
  const [toast, setToast] = useState('');
  const rows = products.map((p) => ({ ...p, current: routes[p.code], pending: pending[p.code] }));
  const counts = (r) => rows.filter((p) => p.current === r).length;

  return (
    <>
      <PageHeader
        title="Products & routing"
        links={[{ name: 'Administration' }, { name: 'Products & routing' }]}
        subtitle="Products are national. This port chooses one enabled branch for each product it handles."
      />
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="National products" value={products.length} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Warehouse" value={counts('Warehouse')} color="primary" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Transshipment" value={counts('Transshipment')} color="info" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Stone route" value={counts('Stone route')} color="warning" caption="Branch disabled: turn it on in Port setup, step 2" /></Grid>
      </Grid>
      <Alert severity="info" sx={{ mb: 3 }}>
        At a live port, a route change stays pending until the port in-charge or head office approves it. Cargo with no route goes to a routing exception and is never sent down a branch by default.
      </Alert>
      <DataTable
        rows={rows}
        searchKeys={['name', 'code']}
        searchPlaceholder="Search product name or code"
        columns={[
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Product', render: (r) => <><Typography variant="subtitle2">{r.name}</Typography><Typography variant="caption" color="text.secondary">{r.type} · suggested {r.type === 'Perishable' ? 'straight across' : 'into the port'}</Typography></> },
          { key: 'categories', label: 'Categories', render: (r) => <Stack direction="row" spacing={0.5}>{r.categories.map((c) => <Label key={c}>{c}</Label>)}</Stack> },
          { key: 'current', label: 'Current route', render: (r) => <Stack direction="row" spacing={1}><Label color={routeColor[r.current]}>{r.current}</Label>{!enabled[r.current] && <Label color="error">Branch off</Label>}</Stack> },
          {
            key: 'change', label: 'Change to', render: (r) => r.pending ? <Label color="warning">Pending: {r.pending}</Label> : (
              <TextField select size="small" value="" onChange={(e) => { setPending((p) => ({ ...p, [r.code]: e.target.value })); setToast(`Route change for ${r.name} sent for approval. The current route stays in force until then.`); }} sx={{ width: 170 }} SelectProps={{ displayEmpty: true, renderValue: () => 'Choose…' }}>
                {Object.keys(enabled).filter((k) => enabled[k] && k !== r.current).map((k) => <MenuItem key={k} value={k}>{k}</MenuItem>)}
              </TextField>
            ),
          },
        ]}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="info" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
