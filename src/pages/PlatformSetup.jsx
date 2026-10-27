import { useState } from 'react';
import {
  Box, Card, Stack, Typography, Tabs, Tab, Button, Grid2 as Grid, TextField, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Snackbar, Step, StepLabel, Stepper,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import { PageHeader, formatBDT } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { ports, products, vehicleTypes, agencies, traders, holidays, tariffLines } from '../data/mock';

function BulkImport({ open, onClose, what }) {
  const [step, setStep] = useState(0);
  const close = () => { setStep(0); onClose(); };
  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Import {what}</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
          {['Template', 'Upload', 'Preview', 'Import'].map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
        </Stepper>
        {step === 0 && <Typography variant="body2" color="text.secondary">Download the template, fill one row per record and save as .csv. Nothing is saved until you check the preview.</Typography>}
        {step === 1 && (
          <Box sx={{ p: 5, border: '1px dashed', borderColor: 'divider', borderRadius: 2, textAlign: 'center', bgcolor: 'background.neutral' }}>
            <UploadFileRoundedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography variant="subtitle2">Drop a CSV or spreadsheet here</Typography>
            <Typography variant="caption" color="text.secondary">or paste rows</Typography>
          </Box>
        )}
        {step === 2 && (
          <Stack spacing={1.5}>
            <Alert severity="success">12 rows ready to import.</Alert>
            <Alert severity="error">2 rows rejected: row 4 duplicate code, row 9 missing a required field.</Alert>
            <Typography variant="caption" color="text.secondary">Correct rejected rows in your file and upload again, or import the valid rows now.</Typography>
          </Stack>
        )}
        {step === 3 && <Alert severity="success">Imported 12 rows. The import, its file and the rejected rows are kept in the audit log.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={close}>{step === 3 ? 'Done' : 'Cancel'}</Button>
        {step < 3 && (
          <Button variant="contained" onClick={() => setStep((s) => s + 1)}>
            {['Download template', 'Upload & check', 'Import 12 valid rows'][step]}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

function CreatePort({ open, onClose, onCreate }) {
  const [f, setF] = useState({ code: '', name: '', station: '', tariff: 'TO-2026-03 (invented reference)' });
  const dup = ports.some((p) => p.code === f.code.toUpperCase());
  const codeOk = /^[A-Za-z]{3}$/.test(f.code) && !dup;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create port</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={4}>
            <TextField
              fullWidth required label="Port code" value={f.code}
              onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().slice(0, 3) })}
              error={Boolean(f.code) && !codeOk}
              helperText={dup ? 'This code is already used' : 'Three letters; fixed after creation'}
            />
          </Grid>
          <Grid size={8}><TextField fullWidth required label="Port name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Grid>
          <Grid size={12}><TextField fullWidth label="Customs station code" value={f.station} onChange={(e) => setF({ ...f, station: e.target.value })} helperText="Routes incoming NSW messages to this port" /></Grid>
          <Grid size={12}>
            <TextField select fullWidth required label="Tariff order" value={f.tariff} onChange={(e) => setF({ ...f, tariff: e.target.value })}>
              <MenuItem value="TO-2026-03 (invented reference)">TO-2026-03 (invented reference)</MenuItem>
              <MenuItem value="TO-2025-11 (invented reference)">TO-2025-11 (invented reference)</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        {codeOk && <Typography variant="caption" color="text.secondary">Bills and passes will be numbered {f.code}-BILL-… and {f.code}-PASS-…</Typography>}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!codeOk || !f.name} onClick={() => onCreate(f)}>Create port</Button>
      </DialogActions>
    </Dialog>
  );
}

const tabs = [
  ['tariff', 'Tariff orders'], ['products', 'Products'], ['vehicles', 'Vehicle types'], ['agencies', 'C&F agencies'],
  ['traders', 'Importers & exporters'], ['holidays', 'Public holidays'], ['ports', 'Ports'],
];

export default function PlatformSetup() {
  const [tab, setTab] = useState('ports');
  const [importOpen, setImportOpen] = useState(false);
  const [portOpen, setPortOpen] = useState(false);
  const [toast, setToast] = useState('');
  const label = tabs.find((t) => t[0] === tab)[1];

  return (
    <>
      <PageHeader
        title="Platform setup"
        links={[{ name: 'Administration' }, { name: 'Platform setup' }, { name: label }]}
        subtitle="National registries are maintained once by head office and reused by every port."
        action={
          <>
            {tab !== 'tariff' && <Button variant="outlined" color="inherit" startIcon={<UploadFileRoundedIcon />} onClick={() => setImportOpen(true)}>Import {label.toLowerCase()}</Button>}
            <Button variant="contained" color="inherit" startIcon={<AddRoundedIcon />} onClick={() => (tab === 'ports' ? setPortOpen(true) : setToast(`New ${label.toLowerCase()} form opens here.`))}>
              {tab === 'ports' ? 'Create port' : tab === 'tariff' ? 'Record tariff order' : 'Add'}
            </Button>
          </>
        }
      />
      <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" sx={{ mb: 3 }}>
        {tabs.map(([v, l]) => <Tab key={v} value={v} label={l} />)}
      </Tabs>

      {tab === 'tariff' && (
        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Stack direction="row" spacing={1} alignItems="center"><Typography variant="h6">TO-2026-03</Typography><Label color="success">Active</Label></Stack>
                <Typography variant="body2" color="text.secondary">Invented reference · effective 1 Mar 2026 · billing at BEN, BUR, SON, AKH</Typography>
              </Box>
              <Stack direction="row" spacing={1}><Button color="inherit">Edit details</Button><Button color="error">Deactivate</Button></Stack>
            </Stack>
            <Alert severity="info" sx={{ mt: 2 }}>Demonstration values, not legal rates. Free days: storage 3, haltage 1.</Alert>
          </Card>
          <DataTable
            rows={tariffLines}
            searchKeys={['charge']}
            searchPlaceholder="Search charges"
            columns={[
              { key: 'charge', label: 'Charge', render: (r) => <Typography variant="subtitle2">{r.charge}</Typography> },
              { key: 'basis', label: 'Basis' },
              { key: 'rate', label: 'Rate (BDT)', align: 'right', render: (r) => formatBDT(r.rate) },
            ]}
            pageSize={25}
          />
        </Stack>
      )}
      {tab === 'products' && (
        <DataTable
          rows={products}
          searchKeys={['name', 'code', 'hs']}
          searchPlaceholder="Search product, code or HS code"
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Product', render: (r) => <Typography variant="subtitle2">{r.name}</Typography> },
            { key: 'hs', label: 'HS code' },
            { key: 'type', label: 'Type', render: (r) => <Label color={r.type === 'Perishable' ? 'warning' : 'default'}>{r.type}</Label> },
            { key: 'categories', label: 'Categories', render: (r) => <Stack direction="row" spacing={0.5}>{r.categories.map((c) => <Label key={c} color="info">{c}</Label>)}</Stack> },
            { key: 'route', label: 'Default route' },
          ]}
        />
      )}
      {tab === 'vehicles' && (
        <DataTable
          rows={vehicleTypes}
          searchKeys={['name']}
          searchPlaceholder="Search vehicle type"
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Vehicle type', render: (r) => <Typography variant="subtitle2">{r.name}</Typography> },
            { key: 'wheels', label: 'Wheels', align: 'center' },
            { key: 'mode', label: 'Transport mode' },
            { key: 'edit', label: '', align: 'right', render: () => <Button size="small" color="inherit">Edit</Button> },
          ]}
        />
      )}
      {tab === 'agencies' && (
        <DataTable
          rows={agencies}
          searchKeys={['name', 'licence']}
          searchPlaceholder="Search agency or licence"
          columns={[
            { key: 'name', label: 'Agency', render: (r) => <Typography variant="subtitle2">{r.name}</Typography> },
            { key: 'licence', label: 'Licence' },
            { key: 'validTo', label: 'Valid to', render: (r) => (new Date(r.validTo) < new Date('2026-12-01') ? <Label color="warning">{r.validTo} · expiring</Label> : r.validTo) },
            { key: 'ports', label: 'Registered ports', render: (r) => <Stack direction="row" spacing={0.5}>{r.ports.map((p) => <Label key={p}>{p}</Label>)}</Stack> },
          ]}
        />
      )}
      {tab === 'traders' && (
        <DataTable
          rows={traders}
          searchKeys={['name', 'bin']}
          searchPlaceholder="Search company or BIN"
          columns={[
            { key: 'name', label: 'Company', render: (r) => <Typography variant="subtitle2">{r.name}</Typography> },
            { key: 'bin', label: 'BIN' },
            { key: 'contact', label: 'Contact' },
            { key: 'ports', label: 'Trading ports', render: (r) => <Stack direction="row" spacing={0.5}>{r.ports.map((p) => <Label key={p}>{p}</Label>)}</Stack> },
          ]}
        />
      )}
      {tab === 'holidays' && (
        <DataTable
          rows={holidays}
          searchKeys={['name', 'date']}
          searchPlaceholder="Search name or date"
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'name', label: 'Holiday', render: (r) => <Stack direction="row" spacing={1} alignItems="center"><Typography variant="subtitle2">{r.name}</Typography>{r.upcoming && <Label color="info">Upcoming</Label>}</Stack> },
            { key: 'rm', label: '', align: 'right', render: () => <Button size="small" color="error">Remove</Button> },
          ]}
        />
      )}
      {tab === 'ports' && (
        <DataTable
          rows={ports}
          searchKeys={['code', 'name']}
          searchPlaceholder="Search code or name"
          columns={[
            { key: 'code', label: 'Code', render: (r) => <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{r.code}</Typography> },
            { key: 'name', label: 'Port', render: (r) => <><Typography variant="subtitle2">{r.name}</Typography><Typography variant="caption" color="text.secondary">{r.station}</Typography></> },
            { key: 'tariff', label: 'Tariff' },
            { key: 'state', label: 'State', render: (r) => <Label color={r.state === 'Live' ? 'success' : r.state.startsWith('Awaiting') ? 'info' : 'warning'}>{r.state}</Label> },
            { key: 'admin', label: 'Administrator' },
          ]}
        />
      )}
      <BulkImport open={importOpen} onClose={() => setImportOpen(false)} what={label.toLowerCase()} />
      <CreatePort open={portOpen} onClose={() => setPortOpen(false)} onCreate={(f) => { setPortOpen(false); setToast(`${f.name} (${f.code}) created. The port administrator can now complete setup.`); }} />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
