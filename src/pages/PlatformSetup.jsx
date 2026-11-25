import { useEffect, useState } from 'react';
import {
  Box, Card, Stack, Typography, Tabs, Tab, Button, Grid2 as Grid, TextField, MenuItem, Alert, Snackbar, Step, StepLabel, Stepper, Checkbox, ListItemText,
} from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '../demo/InPlace';
import { PageHeader, formatBDT } from '../components/common';
import FormDrawer, { useFreshForm } from '../components/FormDrawer';
import { usePort, useStoredState } from '../demo/PortStore';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { ports, products, vehicleTypes, agencies, traders, holidays, tariffLines } from '../data/mock';
import { AddRoundedIcon, UploadFileRoundedIcon } from '../components/icons';
import { tr } from '../i18n/LanguageContext';

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

const EMPTY_PORT = { code: '', name: '', station: '', tariff: 'TO-2026-03 (invented reference)' };

// Stays mounted so the drawer slides in and out; the form empties itself each time it opens.
function CreatePort({ open, onClose, onCreate, taken }) {
  const [f, setF] = useState(EMPTY_PORT);
  useEffect(() => {
    if (open) setF(EMPTY_PORT);
  }, [open]);
  const dup = taken.includes(f.code.toUpperCase());
  const codeOk = /^[A-Za-z]{3}$/.test(f.code) && !dup;
  return (
    <FormDrawer
      open={open}
      dirty={f !== EMPTY_PORT}
      why={!f.code ? 'Enter a three-letter port code.' : !codeOk ? (dup ? 'This code is already used.' : 'The port code is three letters.') : !f.name.trim() ? 'Enter the port name.' : ''}
      onClose={onClose}
      title={tr("Create port")}
      subtitle={tr("The port administrator completes the setup afterwards.")}
      actions={(
        <>
          <Button variant="outlined" color="inherit" onClick={onClose}>{tr("Cancel")}</Button>
          <Button variant="contained" disabled={!codeOk || !f.name.trim()} onClick={() => onCreate(f)}>{tr("Create port")}</Button>
        </>
      )}
    >
      <Stack spacing={2.5}>
        <TextField
          fullWidth required label={tr("Port code")} value={f.code}
          onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().slice(0, 3) })}
          error={Boolean(f.code) && !codeOk}
          helperText={dup ? 'This code is already used' : codeOk ? `Bills and passes will be numbered ${f.code}-BILL-… and ${f.code}-PASS-…` : 'Three letters; fixed after creation'}
        />
        <TextField fullWidth required label={tr("Port name")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <TextField fullWidth label={tr("Customs station code")} value={f.station} onChange={(e) => setF({ ...f, station: e.target.value })} helperText={tr("Routes incoming NSW messages to this port")} />
        <TextField select fullWidth required label={tr("Tariff order")} value={f.tariff} onChange={(e) => setF({ ...f, tariff: e.target.value })}>
          <MenuItem value="TO-2026-03 (invented reference)">TO-2026-03 (invented reference)</MenuItem>
          <MenuItem value="TO-2025-11 (invented reference)">TO-2025-11 (invented reference)</MenuItem>
        </TextField>
      </Stack>
    </FormDrawer>
  );
}

const NO_ORDERS = [];
const PORT_CODES = ports.map((p) => p.code);
const CATEGORY_OPTIONS = ['Food', 'Textile', 'Chemical', 'Rubber', 'Baby products', 'Stone'];

// One form per national register. Each field: key, label, kind (text | select | multi | date), options,
// required, check (returns an error message or ''), help. `toRow` turns the values into a table row.
const REGISTERS = {
  products: {
    title: 'Add product', action: 'Add product', subtitle: 'Every port uses this product list and its default route.',
    fields: [
      { key: 'name', label: 'Product name', required: true },
      { key: 'hs', label: 'HS code', required: true, help: 'Four digits, a dot and two digits, for example 1006.30', check: (v) => (/^\d{4}\.\d{2}$/.test(v) ? '' : 'Use the form 1006.30') },
      { key: 'type', label: 'Type', kind: 'select', options: ['Non-perishable', 'Perishable', 'Bulk'], initial: 'Non-perishable' },
      { key: 'categories', label: 'Categories', kind: 'multi', options: CATEGORY_OPTIONS, initial: [], required: true, help: 'Storage rules use these' },
      { key: 'route', label: 'Default route', kind: 'select', options: ['Warehouse', 'Transshipment', 'Stone route'], initial: 'Warehouse' },
    ],
    toRow: (v) => ({ ...v, code: `P-${v.hs.slice(0, 4)}` }),
  },
  vehicles: {
    title: 'Add vehicle type', action: 'Add vehicle type', subtitle: 'Vehicle types set entrance and weighment charges.',
    fields: [
      { key: 'name', label: 'Vehicle type', required: true, placeholder: '12-wheel truck' },
      { key: 'wheels', label: 'Wheels', required: true, check: (v) => (/^\d+$/.test(v) && Number(v) >= 2 && Number(v) <= 30 ? '' : 'A whole number from 2 to 30') },
      { key: 'mode', label: 'Transport mode', kind: 'select', options: ['Road', 'Rail'], initial: 'Road' },
    ],
    toRow: (v) => ({ ...v, wheels: Number(v.wheels), code: `VT-${String(v.wheels).padStart(2, '0')}` }),
  },
  agencies: {
    title: 'Add C&F agency', action: 'Add agency', subtitle: 'An agency can act only at ports it is registered for, with a valid licence.',
    fields: [
      { key: 'name', label: 'Agency name', required: true },
      { key: 'licence', label: 'Licence number', required: true, placeholder: 'CF-0000', check: (v) => (/^CF-\d{4}$/.test(v) ? '' : 'Use the form CF-0412') },
      { key: 'validTo', label: 'Licence valid to', kind: 'date', required: true },
      { key: 'ports', label: 'Registered ports', kind: 'multi', options: PORT_CODES, initial: [], required: true },
    ],
    toRow: (v) => v,
  },
  traders: {
    title: 'Add importer or exporter', action: 'Add company', subtitle: 'Matched to Customs declarations by BIN.',
    fields: [
      { key: 'name', label: 'Company name', required: true },
      { key: 'bin', label: 'BIN', required: true, placeholder: '000123456-0101', check: (v) => (/^\d{9}-\d{4}$/.test(v) ? '' : 'Nine digits, a dash and four digits') },
      { key: 'contact', label: 'Contact number', placeholder: '+880 1711 000000' },
      { key: 'ports', label: 'Trading ports', kind: 'multi', options: PORT_CODES, initial: [], required: true },
    ],
    toRow: (v) => ({ ...v, contact: v.contact || '–' }),
  },
  holidays: {
    title: 'Add public holiday', action: 'Add holiday', subtitle: 'Free storage days do not count public holidays.',
    fields: [
      { key: 'date', label: 'Date', kind: 'date', required: true },
      { key: 'name', label: 'Holiday', required: true },
    ],
    toRow: (v) => ({ ...v, upcoming: v.date >= new Date().toISOString().slice(0, 10) }),
  },
  tariff: {
    title: 'Record tariff order', action: 'Record tariff order', subtitle: 'Saved as a draft until head office activates it. Rates are entered line by line afterwards.',
    fields: [
      { key: 'ref', label: 'Order reference', required: true, placeholder: 'TO-2027-01', check: (v) => (/^TO-\d{4}-\d{2}$/.test(v) ? '' : 'Use the form TO-2027-01') },
      { key: 'effective', label: 'Effective from', kind: 'date', required: true },
      { key: 'ports', label: 'Billing at', kind: 'multi', options: PORT_CODES, initial: [], required: true },
      { key: 'storageFree', label: 'Free storage days', initial: '3', check: (v) => (/^\d+$/.test(v) ? '' : 'A whole number') },
      { key: 'haltageFree', label: 'Free haltage days', initial: '1', check: (v) => (/^\d+$/.test(v) ? '' : 'A whole number') },
    ],
    toRow: (v) => v,
  },
};

const emptyOf = (fields) => Object.fromEntries(fields.map((f) => [f.key, f.initial ?? '']));
const EMPTIES = Object.fromEntries(Object.entries(REGISTERS).map(([k, r]) => [k, emptyOf(r.fields)]));

function RegisterDrawer({ register, open, onClose, onSave }) {
  const spec = REGISTERS[register];
  const [v, set, dirty] = useFreshForm(open, EMPTIES[register]);
  const problems = Object.fromEntries(spec.fields.map((f) => {
    const value = v[f.key];
    const blank = Array.isArray(value) ? value.length === 0 : !String(value ?? '').trim();
    if (blank) return [f.key, f.required ? 'Required' : ''];
    return [f.key, f.check ? f.check(String(value).trim()) : ''];
  }));
  const ready = Object.values(problems).every((x) => !x);
  const first = spec.fields.find((f) => problems[f.key]);
  const why = first ? `${first.label}: ${problems[first.key] === 'Required' ? 'required' : problems[first.key]}` : '';
  // A field shows its problem only once something is typed, so an untouched form is not all red.
  const shown = (f) => {
    const value = v[f.key];
    const touched = Array.isArray(value) ? value.length > 0 : String(value ?? '').length > 0;
    return touched && problems[f.key] && problems[f.key] !== 'Required' ? problems[f.key] : '';
  };
  return (
    <FormDrawer
      open={open}
      dirty={dirty}
      why={why}
      onClose={onClose}
      title={spec.title}
      subtitle={spec.subtitle}
      actions={<><Button variant="outlined" color="inherit" onClick={onClose}>{tr("Cancel")}</Button><Button variant="contained" disabled={!ready} onClick={() => onSave(spec.toRow(Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof x === 'string' ? x.trim() : x]))))}>{spec.action}</Button></>}
    >
      <Stack spacing={2.5}>
        {spec.fields.map((f, i) => {
          const error = shown(f);
          const common = { fullWidth: true, required: f.required, autoFocus: i === 0, label: tr(f.label), value: v[f.key], onChange: set(f.key), error: Boolean(error), helperText: tr(error || f.help) || ' ', placeholder: f.placeholder };
          if (f.kind === 'select') return <TextField key={f.key} select {...common}>{f.options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}</TextField>;
          if (f.kind === 'multi') {
            return (
              <TextField key={f.key} select {...common} slotProps={{ select: { multiple: true, renderValue: (x) => x.join(', ') } }}>
                {f.options.map((o) => <MenuItem key={o} value={o}><Checkbox size="small" checked={v[f.key].includes(o)} /><ListItemText primary={o} /></MenuItem>)}
              </TextField>
            );
          }
          if (f.kind === 'date') return <TextField key={f.key} type="date" {...common} slotProps={{ inputLabel: { shrink: true } }} />;
          return <TextField key={f.key} {...common} />;
        })}
      </Stack>
    </FormDrawer>
  );
}

// A recorded order is a draft until head office enters its rates and activates it. Activation makes it the
// tariff in force: bills raised from then on use its rates (M-12; M2 Report 4.6.1).
function DraftOrder({ order, active, onActivate }) {
  const { tariff } = usePort();
  const [editing, setEditing] = useState(false);
  const [rates, setRates] = useState(() => Object.fromEntries(Object.entries(tariff.rates).map(([k, r]) => [k, String(r.rate)])));
  const valid = Object.values(rates).every((v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0);
  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
        <Stack direction="row" spacing={1} alignItems="center"><Typography variant="h6">{order.ref}</Typography>{active ? <Label color="success">{tr('Active')}</Label> : <Label color="warning">{tr('Draft')}</Label>}</Stack>
        {!active && !editing && <Button variant="outlined" color="inherit" onClick={() => setEditing(true)}>{tr('Enter rates and activate')}</Button>}
      </Stack>
      <Typography variant="body2" color="text.secondary">Effective {order.effective} · billing at {order.ports.join(', ')} · free days: storage {order.storageFree}, haltage {order.haltageFree}</Typography>
      {editing && !active && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,1fr))' } }}>
            {Object.entries(tariff.rates).map(([k, r]) => (
              <TextField key={k} label={`${r.what} (BDT per ${r.unit})`} value={rates[k]} onChange={(e) => setRates((x) => ({ ...x, [k]: e.target.value }))} error={!/^\d+(\.\d{1,2})?$/.test(rates[k])} inputMode="decimal" />
            ))}
          </Box>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center" sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            {!valid && <Typography variant="caption" color="text.secondary" role="status">{tr('Every rate must be a positive amount with up to two decimals.')}</Typography>}
            <Button variant="outlined" color="inherit" onClick={() => setEditing(false)}>{tr('Cancel')}</Button>
            <Button variant="contained" disabled={!valid} onClick={() => { onActivate(Object.fromEntries(Object.entries(tariff.rates).map(([k, r]) => [k, { ...r, rate: Number(rates[k]) }]))); setEditing(false); }}>{tr('Activate this order')}</Button>
          </Stack>
        </Box>
      )}
      {active && <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>{tr('In force. New bills use these rates.')}</Typography>}
    </Card>
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
  const [adding, setAdding] = useState(null);
  const [portList, setPortList] = useStoredState('platformPorts', ports);
  const [productList, setProductList] = useStoredState('platformProducts', products);
  const [vehicleList, setVehicleList] = useStoredState('platformVehicleTypes', vehicleTypes);
  const [agencyList, setAgencyList] = useStoredState('platformAgencies', agencies);
  const [traderList, setTraderList] = useStoredState('platformTraders', traders);
  const [holidayList, setHolidayList] = useStoredState('platformHolidays', holidays);
  const [orders, setOrders] = useStoredState('tariffOrders', NO_ORDERS);
  const [activeTariff, setActiveTariff] = useStoredState('tariffActive', null);
  const savers = {
    products: (r) => setProductList((l) => [...l, r]),
    vehicles: (r) => setVehicleList((l) => [...l, r]),
    agencies: (r) => setAgencyList((l) => [...l, { ...r, id: `AG-${String(l.length + 1).padStart(2, '0')}` }]),
    traders: (r) => setTraderList((l) => [...l, r]),
    holidays: (r) => setHolidayList((l) => [...l, r].sort((a, b) => a.date.localeCompare(b.date))),
    tariff: (r) => setOrders((l) => [...l, r]),
  };
  const [toast, setToast] = useState('');
  const label = tabs.find((t) => t[0] === tab)[1];

  return (
    <>
      <PageHeader
        title={tr("Platform setup")}
        links={[{ name: 'Platform' }, { name: 'Platform setup' }, { name: label }]}
        subtitle={tr("National registries are maintained once by head office and reused by every port.")}
        action={
          <>
            {tab !== 'tariff' && <Button variant="outlined" color="inherit" startIcon={<UploadFileRoundedIcon />} onClick={() => setImportOpen(true)}>Import {label.toLowerCase()}</Button>}
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => (tab === 'ports' ? setPortOpen(true) : setAdding(tab))}>
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
                <Stack direction="row" spacing={1} alignItems="center"><Typography variant="h6">TO-2026-03</Typography>{activeTariff ? <Label>{tr('Replaced')}</Label> : <Label color="success">{tr('Active')}</Label>}</Stack>
                <Typography variant="body2" color="text.secondary">Invented reference · effective 1 Mar 2026 · billing at BEN, BUR, SON, AKH</Typography>
              </Box>
              <Stack direction="row" spacing={1}><Button variant="outlined" color="inherit">{tr("Edit details")}</Button><Button variant="outlined" color="error">{tr("Deactivate")}</Button></Stack>
            </Stack>
            <Alert severity="info" sx={{ mt: 2 }}>Demonstration values, not legal rates. Free days: storage 3, haltage 1.</Alert>
          </Card>
          {orders.map((o) => (
            <DraftOrder
              key={o.ref}
              order={o}
              active={activeTariff?.ref === o.ref}
              onActivate={(rates) => {
                setActiveTariff({ ref: o.ref, version: `Tariff order ${o.ref}`, effective: o.effective, vat: 0.15, rates });
                setToast(`${o.ref} is now in force. New bills use its rates; bills already raised keep theirs.`);
              }}
            />
          ))}
          <DataTable
            rows={tariffLines}
            searchKeys={['charge']}
            searchPlaceholder={tr("Search charges")}
            columns={[
              { key: 'charge', label: 'Charge', render: (r) => <Typography variant="subtitle2">{r.charge}</Typography> },
              { key: 'basis', label: 'Basis' },
              { key: 'rate', label: 'Rate (BDT)', render: (r) => formatBDT(r.rate) },
            ]}
            pageSize={25}
          />
        </Stack>
      )}
      {tab === 'products' && (
        <DataTable
          rows={productList}
          searchKeys={['name', 'code', 'hs']}
          searchPlaceholder={tr("Search product, code or HS code")}
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
          rows={vehicleList}
          searchKeys={['name']}
          searchPlaceholder={tr("Search vehicle type")}
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Vehicle type', render: (r) => <Typography variant="subtitle2">{r.name}</Typography> },
            { key: 'wheels', label: 'Wheels' },
            { key: 'mode', label: 'Transport mode' },
            { key: 'edit', label: '', render: () => <Button size="small" variant="outlined" color="inherit">{tr("Edit")}</Button> },
          ]}
        />
      )}
      {tab === 'agencies' && (
        <DataTable
          rows={agencyList}
          searchKeys={['name', 'licence']}
          searchPlaceholder={tr("Search agency or licence")}
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
          rows={traderList}
          searchKeys={['name', 'bin']}
          searchPlaceholder={tr("Search company or BIN")}
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
          rows={holidayList}
          searchKeys={['name', 'date']}
          searchPlaceholder={tr("Search name or date")}
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'name', label: 'Holiday', render: (r) => <Stack direction="row" spacing={1} alignItems="center"><Typography variant="subtitle2">{r.name}</Typography>{r.upcoming && <Label color="info">Upcoming</Label>}</Stack> },
            { key: 'rm', label: '', render: () => <Button size="small" variant="outlined" color="error">{tr("Remove")}</Button> },
          ]}
        />
      )}
      {tab === 'ports' && (
        <DataTable
          rows={portList}
          searchKeys={['code', 'name']}
          searchPlaceholder={tr("Search code or name")}
          columns={[
            { key: 'code', label: 'Code', render: (r) => <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{r.code}</Typography> },
            { key: 'name', label: 'Port', render: (r) => <><Typography variant="subtitle2">{r.name}</Typography><Typography variant="caption" color="text.secondary">{r.station}</Typography></> },
            { key: 'tariff', label: 'Tariff' },
            { key: 'state', label: 'State', render: (r) => <Label color={r.state === 'Live' ? 'success' : r.state.startsWith('Awaiting') ? 'info' : 'warning'}>{r.state}</Label> },
            { key: 'admin', label: 'Administrator' },
          ]}
        />
      )}
      <BulkImport open={importOpen} onClose={() => setImportOpen(false)} what={label.toLowerCase()} />
      <CreatePort open={portOpen} taken={portList.map((p) => p.code)} onClose={() => setPortOpen(false)} onCreate={(f) => { setPortList((l) => [...l, { code: f.code.toUpperCase(), name: f.name.trim(), station: f.station.trim() || '–', tariff: f.tariff, state: 'Setting up', admin: '–', readiness: 0 }]); setPortOpen(false); setToast(`${f.name.trim()} (${f.code.toUpperCase()}) created. The port administrator can now complete setup.`); }} />
      {Object.keys(REGISTERS).map((k) => (
        <RegisterDrawer
          key={k}
          register={k}
          open={adding === k}
          onClose={() => setAdding(null)}
          onSave={(row) => { savers[k](row); setAdding(null); setToast(`${REGISTERS[k].title.replace(/^(Add|Record) /, '')} saved${k === 'tariff' ? ' as a draft' : ''}.`.replace(/^./, (c) => c.toUpperCase())); }}
        />
      ))}
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
