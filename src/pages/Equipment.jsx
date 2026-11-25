import { useState } from 'react';
import { Tabs, Tab, Button, Typography, Alert, Snackbar, Stack, TextField, MenuItem, Card, Box, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { PageHeader, ReasonDialog } from '../components/common';
import FormDrawer, { useFreshForm } from '../components/FormDrawer';
import { useStoredState } from '../demo/PortStore';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { AddRoundedIcon, UploadFileRoundedIcon } from '../components/icons';
import { tr } from '../i18n/LanguageContext';

// M2 M-08: equipment and labour are kept as categories with how each is charged; rates live on the tariff
// order, never here. A machine category can be marked unavailable or available again with a reason. M-19: IBMS
// never records which labourer did which job, so there are no named gangs here.
const UNITS = ['Per hour', 'Per shift', 'Per movement', 'Per lift', 'Per tonne'];
const BASES = ['Shed 5', 'Shed 7', 'Shed 9', 'Shed 12', 'Shed 31', 'Open yard 1', 'Open yard B', 'Port-wide'];

const initialEquipment = [
  { code: 'EQ-FL3', name: 'Forklift 3 t', unit: 'Per hour', count: 4, base: 'Shed 5', available: true },
  { code: 'EQ-FL5', name: 'Forklift 5 t', unit: 'Per hour', count: 2, base: 'Shed 12', available: true },
  { code: 'EQ-MC25', name: 'Mobile crane 25 t', unit: 'Per lift', count: 1, base: 'Open yard 1', available: false, reason: 'Hydraulic leak, repair ordered 2026-11-20' },
  { code: 'EQ-RS', name: 'Reach stacker', unit: 'Per movement', count: 1, base: 'Open yard B', available: true },
];
const initialLabour = [
  { code: 'LB-UNL', name: 'Manual unloading', unit: 'Per tonne' },
  { code: 'LB-LDG', name: 'Manual loading', unit: 'Per tonne' },
  { code: 'LB-STK', name: 'Stacking and restacking', unit: 'Per movement' },
  { code: 'LB-SHF', name: 'Shed shift crew', unit: 'Per shift' },
];

const EMPTY_CATEGORY = { code: '', name: '', unit: 'Per hour', count: '1', base: 'Shed 5' };

function CategoryDrawer({ kind, open, onClose, onSave, taken }) {
  const [f, set] = useFreshForm(open, EMPTY_CATEGORY);
  const code = f.code.trim().toUpperCase();
  const dup = taken.includes(code);
  const codeOk = /^[A-Z]{2}-[A-Z0-9]{2,6}$/.test(code) && !dup;
  const countOk = kind === 'labour' || (/^\d+$/.test(f.count) && Number(f.count) >= 1);
  const ready = codeOk && f.name.trim() && countOk;
  const why = !f.name.trim() ? 'Enter the category name.' : !codeOk ? (dup ? 'This code is already used.' : 'Enter a code like EQ-FL3.') : !countOk ? 'Enter how many machines, at least 1.' : '';
  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={kind === 'equipment' ? 'Add equipment category' : 'Add labour category'}
      subtitle="Rates are set on the tariff order, not here."
      actions={<><Button variant="outlined" color="inherit" onClick={onClose}>{tr('Cancel')}</Button><Button variant="contained" disabled={!ready} onClick={() => onSave({ ...f, code, name: f.name.trim() })}>{tr('Add category')}</Button></>}
    >
      <Stack spacing={2.5}>
        <TextField fullWidth required autoFocus label={tr('Category name')} placeholder={kind === 'equipment' ? 'Forklift 3 t' : 'Manual unloading'} value={f.name} onChange={set('name')} />
        <TextField fullWidth required label={tr('Code')} placeholder={kind === 'equipment' ? 'EQ-FL3' : 'LB-UNL'} value={code} onChange={set('code')} error={Boolean(f.code) && !codeOk} helperText={dup ? tr('This code is already used') : tr('Two letters, a dash, then 2 to 6 letters or digits')} />
        <TextField select fullWidth label={tr('Charged')} value={f.unit} onChange={set('unit')} helperText={tr('How billing counts its use')}>{UNITS.map((u) => <MenuItem key={u} value={u}>{tr(u)}</MenuItem>)}</TextField>
        {kind === 'equipment' && (
          <Stack direction="row" spacing={2}>
            <TextField required label={tr('Machines')} inputMode="numeric" value={f.count} onChange={set('count')} error={!countOk} sx={{ width: 140 }} />
            <TextField select fullWidth label={tr('Based at')} value={f.base} onChange={set('base')}>{BASES.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}</TextField>
          </Stack>
        )}
        {!ready && <Typography variant="caption" color="text.secondary" role="status">{tr(why)}</Typography>}
      </Stack>
    </FormDrawer>
  );
}

// File upload with a row-by-row check before anything is saved (M-08): bad rows and duplicates are shown, never
// skipped silently.
function UploadPanel({ kind, taken, onClose, onImport }) {
  const sample = kind === 'equipment'
    ? 'code,name,charged,machines,based at\nEQ-FL7,Forklift 7 t,Per hour,1,Shed 12\nEQ-FL3,Forklift 3 t,Per hour,2,Shed 5\nEQ-SC,Scissor lift,Per day,1,Shed 7'
    : 'code,name,charged\nLB-SRT,Sorting by hand,Per tonne\nLB-UNL,Manual unloading,Per tonne';
  const [text, setText] = useState(sample);
  const rows = text.split('\n').slice(1).filter((l) => l.trim()).map((line) => {
    const [code = '', name = '', unit = '', count = '1', base = 'Port-wide'] = line.split(',').map((x) => x.trim());
    const problem = !/^[A-Z]{2}-[A-Z0-9]{2,6}$/.test(code.toUpperCase()) ? 'Code is not in the form EQ-FL3'
      : taken.includes(code.toUpperCase()) ? 'Already in the list'
        : !name ? 'Name is missing'
          : !UNITS.includes(unit) ? `"${unit}" is not a charge unit (${UNITS.join(', ')})`
            : kind === 'equipment' && !(/^\d+$/.test(count) && Number(count) >= 1) ? 'Machines must be a whole number' : '';
    return { code: code.toUpperCase(), name, unit, count, base, problem };
  });
  const good = rows.filter((r) => !r.problem);
  return (
    <Card variant="outlined" sx={{ p: 3, mb: 3, boxShadow: 'none' }}>
      <Typography variant="h6" component="h2" sx={{ mb: 0.5 }}>{tr(kind === 'equipment' ? 'Upload equipment categories' : 'Upload labour categories')}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{tr('Paste rows from the BLPA list, or the contents of a .csv file. Each row is checked before anything is saved.')}</Typography>
      <TextField fullWidth multiline minRows={4} label={tr('Rows')} value={text} onChange={(e) => setText(e.target.value)} sx={{ mb: 2, '& textarea': { fontFamily: 'monospace' } }} />
      <Table size="small" sx={{ mb: 2 }}>
        <TableHead><TableRow><TableCell>{tr('Code')}</TableCell><TableCell>{tr('Name')}</TableCell><TableCell>{tr('Charged')}</TableCell><TableCell>{tr('Check')}</TableCell></TableRow></TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell>{r.code || '–'}</TableCell>
              <TableCell>{r.name || '–'}</TableCell>
              <TableCell>{r.unit || '–'}</TableCell>
              <TableCell>{r.problem ? <Label color="error">{r.problem}</Label> : <Label color="success">{tr('Ready')}</Label>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center" flexWrap="wrap" useFlexGap>
        {good.length === 0 && <Typography variant="caption" color="text.secondary">{tr('No row is ready to import.')}</Typography>}
        <Button variant="outlined" color="inherit" onClick={onClose}>{tr('Cancel')}</Button>
        <Button variant="contained" disabled={!good.length} onClick={() => onImport(good)}>{`${tr('Import')} ${good.length} ${tr(good.length === 1 ? 'row' : 'rows')}`}</Button>
      </Stack>
    </Card>
  );
}

export default function Equipment() {
  const [tab, setTab] = useState('equipment');
  const [machines, setMachines] = useStoredState('equipmentCategories', initialEquipment);
  const [labour, setLabour] = useStoredState('labourCategories', initialLabour);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [toast, setToast] = useState('');
  const list = tab === 'equipment' ? machines : labour;
  const setList = tab === 'equipment' ? setMachines : setLabour;
  const taken = list.map((x) => x.code);
  const switchTab = (v) => { setTab(v); setUploading(false); };
  return (
    <>
      <PageHeader
        title={tr('Equipment & labour')}
        links={[{ name: 'Administration and configuration' }, { name: 'Equipment & labour' }]}
        subtitle={tr('Categories and how each is charged. Rates are on the tariff order.')}
        action={
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" color="inherit" startIcon={<UploadFileRoundedIcon />} onClick={() => setUploading(true)}>{tr('Upload list')}</Button>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setAdding(true)}>{tr('Add category')}</Button>
          </Stack>
        }
      />
      <Alert severity="info" sx={{ mb: 3 }}>{tr('Use is recorded on warehouse and transshipment jobs and read by billing: machine use is charged by the equipment category, manual work by the labour category. IBMS does not record which labourer did which job.')}</Alert>
      <Tabs value={tab} onChange={(e, v) => switchTab(v)} sx={{ mb: 3 }}>
        <Tab value="equipment" label={tr('Equipment categories')} />
        <Tab value="labour" label={tr('Labour categories')} />
      </Tabs>
      {uploading && (
        <UploadPanel
          key={tab}
          kind={tab}
          taken={taken}
          onClose={() => setUploading(false)}
          onImport={(rows) => {
            setList((l) => [...l, ...rows.map(({ problem, count, base, ...r }) => (tab === 'equipment' ? { ...r, count: Number(count), base, available: true } : r))]);
            setUploading(false);
            setToast(`${rows.length} ${rows.length === 1 ? 'category' : 'categories'} imported.`);
          }}
        />
      )}
      {tab === 'equipment' ? (
        <DataTable rows={machines} rowKey={(r) => r.code} searchKeys={['code', 'name', 'base']} searchPlaceholder={tr('Search equipment')} columns={[
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Category', render: (r) => <Typography variant="subtitle2">{r.name}</Typography> },
          { key: 'unit', label: 'Charged', render: (r) => tr(r.unit) },
          { key: 'count', label: 'Machines' },
          { key: 'base', label: 'Based at' },
          { key: 'available', label: 'Availability', render: (r) => (r.available ? <Label color="success">{tr('Available')}</Label> : <Box><Label color="warning">{tr('Unavailable')}</Label><Typography variant="caption" color="text.secondary" component="div" sx={{ whiteSpace: 'normal', maxWidth: 220, mt: 0.5 }}>{r.reason}</Typography></Box>) },
          { key: 'a', label: '', render: (r) => <Button size="small" variant="outlined" color="inherit" sx={{ whiteSpace: 'nowrap' }} onClick={() => setToggling(r)}>{tr(r.available ? 'Mark unavailable' : 'Mark available')}</Button> },
        ]} />
      ) : (
        <DataTable rows={labour} rowKey={(r) => r.code} searchKeys={['code', 'name']} searchPlaceholder={tr('Search labour categories')} columns={[
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Category', render: (r) => <Typography variant="subtitle2">{r.name}</Typography> },
          { key: 'unit', label: 'Charged', render: (r) => tr(r.unit) },
        ]} />
      )}
      <CategoryDrawer
        kind={tab}
        open={adding}
        taken={taken}
        onClose={() => setAdding(false)}
        onSave={(f) => {
          setList((l) => [...l, tab === 'equipment' ? { code: f.code, name: f.name, unit: f.unit, count: Number(f.count), base: f.base, available: true } : { code: f.code, name: f.name, unit: f.unit }]);
          setAdding(false);
          setToast(`${f.name} added.`);
        }}
      />
      <ReasonDialog
        open={Boolean(toggling)}
        title={toggling ? `${tr(toggling.available ? 'Mark unavailable' : 'Mark available')}: ${toggling.name}` : ''}
        description={tr('The reason is kept with the change and shown to whoever plans the next job.')}
        confirmLabel={toggling?.available ? tr('Mark unavailable') : tr('Mark available')}
        onClose={() => setToggling(null)}
        onConfirm={(reason) => {
          setMachines((l) => l.map((x) => (x.code === toggling.code ? { ...x, available: !x.available, reason: x.available ? reason : undefined } : x)));
          setToast(`${toggling.name} marked ${toggling.available ? 'unavailable' : 'available'}.`);
          setToggling(null);
        }}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
