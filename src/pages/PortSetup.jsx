import { useState } from 'react';
import {
  Box, Card, Stack, Typography, Button, Grid2 as Grid, TextField, Switch, Divider, Alert, Snackbar, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, ButtonBase,
  LinearProgress, Checkbox, Tabs, Tab,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { PageHeader, SectionCard, UserAvatar } from '../components/common';
import Label from '../components/Label';
import { ports, agencies, users } from '../data/mock';
import { useStoredState } from '../demo/PortStore';
import FormDrawer, { useFreshForm } from '../components/FormDrawer';

// Module switches and tolerance are kept per port in the shared record.
const NO_SETTINGS = {};
const DEFAULT_MODULES = { warehousing: true, outsideYard: false, rail: true, busTerminal: true, truckScanner: false, exportStorage: false };
import { AddRoundedIcon, CancelRoundedIcon, CheckCircleRoundedIcon, LockOutlinedIcon } from '../components/icons';
import { tr } from '../i18n/LanguageContext';

const steps = [
  { key: 'port', title: 'The port', desc: 'Name and Customs station' },
  { key: 'modules', title: 'Modules', desc: 'What this port handles' },
  { key: 'resources', title: 'What the port has', desc: 'Gates, scales, sheds, yards' },
  { key: 'people', title: 'Who works here', desc: 'Staff and agencies' },
  { key: 'golive', title: 'Go live', desc: 'Checks and approval' },
];

function StepPort({ port }) {
  return (
    <Grid container spacing={2.5}>
      <Grid size={4}>
        <TextField fullWidth label={tr("Port code")} value={port.code} disabled slotProps={{ input: { endAdornment: <LockOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} /> } }} helperText={tr("Fixed after creation")} />
      </Grid>
      <Grid size={8}><TextField fullWidth label={tr("Port name")} defaultValue={port.name} /></Grid>
      <Grid size={12}><TextField fullWidth label={tr("Customs station")} defaultValue={port.station} helperText={tr("Incoming NSW messages are routed by this station code")} /></Grid>
      <Grid size={12}>
        <TextField fullWidth label={tr("Tariff order")} value={port.tariff} disabled helperText={tr("Assigned by head office. Rates are set centrally, not per port.")} />
      </Grid>
    </Grid>
  );
}

function StepModules({ modules, setModules }) {
  const rows = [
    ['gates', 'Border and inland gates, weighing, billing and Exit Passes', 'Always on', true],
    ['warehousing', 'Warehouse', 'Sheds and posting. Product routing follows the modules switched on.', false],
    ['outsideYard', 'Outside yard (stone route)', 'Stays disabled until NBR and BLPA decide the stone route control.', false],
    ['rail', 'Rail', 'Rake records at the port siding.', false],
    ['busTerminal', 'Bus terminal', 'Bus desk and bus terminal charges.', false],
    ['truckScanner', 'Truck scanner', 'Scanner lane at the gate.', false],
    ['exportStorage', 'Export storage', 'Off at every port by default: export trucks stay loaded.', false],
  ];
  return (
    <>
      <Alert severity="info" sx={{ mb: 2 }}>At a live port, switching a module sends a request to head office. Nothing changes until it is approved, and a module cannot be turned off while work is in flight.</Alert>
      <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
        {rows.map(([k, title, desc, fixed]) => (
          <Stack key={k} direction="row" alignItems="center" spacing={2} sx={{ py: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2">{title}</Typography>
              <Typography variant="body2" color="text.secondary">{desc}</Typography>
            </Box>
            {fixed ? <Label>Always on</Label> : <Switch checked={modules[k]} onChange={(e) => setModules({ ...modules, [k]: e.target.checked })} />}
          </Stack>
        ))}
      </Stack>
    </>
  );
}

const RESOURCE_TYPES = {
  'Border gate': { label: 'Lanes', placeholder: 'B3, B4', help: 'Lane codes, separated by commas', format: (v) => `Lanes ${v}` },
  'Inland gate': { label: 'Lanes', placeholder: 'I3', help: 'Lane codes, separated by commas', format: (v) => `Lanes ${v}` },
  Weighbridge: { label: 'Calibrated until', type: 'date', help: 'From the calibration certificate', format: (v) => `Calibrated to ${v}` },
  'Rail siding': { label: 'Lines', placeholder: '2', help: 'Number of lines', format: (v) => `${v} line${v === '1' ? '' : 's'}` },
  'Exit check camera': { label: 'Lane', placeholder: 'I1', help: 'The inland lane it watches', format: (v) => `Lane ${v}` },
};
const EMPTY_RESOURCE = { name: '', type: 'Border gate', detail: '' };

// Sheds and yards are added in Warehouse layout, so they are not offered here.
function ResourceDrawer({ open, onClose, onSave, taken }) {
  const [f, set] = useFreshForm(open, EMPTY_RESOURCE);
  const kind = RESOURCE_TYPES[f.type];
  const dup = taken.includes(f.name.trim().toLowerCase());
  const ready = f.name.trim() && !dup && f.detail.trim();
  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={tr("Add resource")}
      subtitle={tr("It starts as Setting up and goes live when the port administrator confirms it.")}
      actions={<><Button variant="outlined" color="inherit" onClick={onClose}>{tr("Cancel")}</Button><Button variant="contained" disabled={!ready} onClick={() => onSave({ name: f.name.trim(), type: f.type, detail: kind.format(f.detail.trim()) })}>{tr("Add resource")}</Button></>}
    >
      <Stack spacing={2.5}>
        <TextField select fullWidth label={tr("Type")} value={f.type} onChange={set('type')} helperText={tr("Sheds and yards are added in Warehouse layout")}>{Object.keys(RESOURCE_TYPES).map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField>
        <TextField fullWidth required autoFocus label={tr("Name")} placeholder={f.type === 'Weighbridge' ? 'Scale 3' : `${f.type} 2`} value={f.name} onChange={set('name')} error={dup} helperText={dup ? 'A resource with this name already exists' : ' '} />
        <TextField fullWidth required type={kind.type ?? 'text'} label={kind.label} placeholder={kind.placeholder} value={f.detail} onChange={set('detail')} helperText={kind.help} slotProps={kind.type === 'date' ? { inputLabel: { shrink: true } } : undefined} />
      </Stack>
    </FormDrawer>
  );
}

function StepResources({ port, modules }) {
  const [added, setAdded] = useStoredState('portResources', NO_SETTINGS);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState('');
  const [tolerances, setTolerances] = useStoredState('portTolerance', NO_SETTINGS);
  const tolerance = tolerances[port.code] ?? '5';
  const setTolerance = (value) => setTolerances((all) => ({ ...all, [port.code]: value }));
  const toleranceValid = /^\d+(\.\d+)?$/.test(tolerance) && Number(tolerance) >= 1 && Number(tolerance) <= 20;
  const resources = [
    ['Border gate 1', 'Border gate', 'Lanes B1, B2', 'Live'],
    ['Inland gate', 'Inland gate', 'Lanes I1, I2', 'Live'],
    ['Scale 1', 'Weighbridge', 'Calibrated to 12 Jan 2027', 'Live'],
    ['Scale 2', 'Weighbridge', 'Calibration due in 6 days', 'Live'],
    ...(modules.warehousing ? [['Shed 5', 'Shed', '2 zones · 56 bays', 'Live'], ['Shed 9', 'Shed', '1 zone · 24 bays', 'Live']] : []),
    ...(modules.rail ? [['Benapole siding', 'Rail siding', '2 lines', 'Live']] : []),
    ...(added[port.code] ?? []).map((r) => [r.name, r.type, r.detail, 'Setting up']),
  ];
  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">Border gates face the zero line. Inland gates face the Bangladesh road.</Typography>
        <Button variant="outlined" color="inherit" startIcon={<AddRoundedIcon />} onClick={() => setAdding(true)}>{tr("Add resource")}</Button>
      </Stack>
      <Card variant="outlined" sx={{ boxShadow: 'none' }}>
        <Table size="small">
          <TableHead><TableRow><TableCell sx={{ pl: 2 }}>Name</TableCell><TableCell>Type</TableCell><TableCell>Details</TableCell><TableCell>Status</TableCell><TableCell sx={{ pr: 2 }} /></TableRow></TableHead>
          <TableBody>
            {resources.map(([n, t, d, s]) => (
              <TableRow key={n} hover>
                <TableCell sx={{ pl: 2, fontWeight: 600 }}>{n}</TableCell>
                <TableCell>{t}</TableCell>
                <TableCell sx={{ color: d.includes('due') ? 'warning.text' : 'text.secondary' }}>{d}</TableCell>
                <TableCell><Label color={s === 'Live' ? 'success' : 'warning'}>{s}</Label></TableCell>
                <TableCell sx={{ pr: 2 }}><Stack direction="row" spacing={1} justifyContent="flex-end"><Button size="small" variant="outlined" color="inherit">{tr("Edit")}</Button><Button size="small" variant="outlined" color="error">{tr("Retire")}</Button></Stack></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Box sx={{ mt: 3, p: 2.5, borderRadius: 2, bgcolor: 'background.neutral' }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Weighing rules</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}><TextField
            fullWidth
            size="small"
            label={tr("Weight tolerance at this port (%)")}
            value={tolerance}
            onChange={(e) => setTolerance(e.target.value)}
            error={!toleranceValid}
            helperText={toleranceValid ? 'Set by BLPA and Customs together. A versioned rule: a change goes to a second approver, and each weight check records the version it used.' : 'Enter a percentage from 1 to 20.'}
          /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary" component="div">Tare rule (every port)</Typography>
            <Typography variant="body2" fontWeight={600}>Stored tare valid for 3 months</Typography>
            <Typography variant="caption" color="text.secondary">Set by BLPA headquarters, the same at every port. A port cannot change it.</Typography>
          </Grid>
        </Grid>
      </Box>
      <ResourceDrawer
        open={adding}
        taken={resources.map((r) => r[0].toLowerCase())}
        onClose={() => setAdding(false)}
        onSave={(r) => {
          setAdded((all) => ({ ...all, [port.code]: [...(all[port.code] ?? []), r] }));
          setAdding(false);
          setToast(`${r.name} added as Setting up.`);
        }}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}

function StepPeople() {
  return (
    <Grid container spacing={3}>
      <Grid size={7}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>BLPA staff at this port</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Assign existing national users. New identities are created in Users, not here.</Typography>
        <Stack spacing={1.5}>
          {users.filter((u) => u.org === 'BLPA' && u.status === 'Active').map((u) => (
            <Stack key={u.email} direction="row" spacing={1.5} alignItems="center">
              <UserAvatar name={u.name} size={36} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2">{u.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap component="div">{u.assignments.join(' · ')}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Grid>
      <Grid size={5}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>C&amp;F agencies permitted here</Typography>
        <Stack>
          {agencies.map((a) => (
            <Stack key={a.id} direction="row" alignItems="center">
              <Checkbox defaultChecked={a.ports.includes('BEN')} />
              <Box>
                <Typography variant="body2">{a.name}</Typography>
                <Typography variant="caption" color="text.secondary">{a.licence} · valid to {a.validTo}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Grid>
    </Grid>
  );
}

function StepGoLive({ port, modules, onRequest }) {
  const checks = [
    ['Identity and Customs station set, approved tariff assigned', true, true],
    ['Every handled product has an enabled route', true, true],
    ['Posting depends on Warehousing', modules.warehousing, true],
    ['At least one border gate, one inland gate and one calibrated scale', true, true],
    ...(modules.warehousing ? [['Warehouse facilities, zones and bays recorded', true, true]] : []),
    ...(modules.rail ? [['Rail siding recorded', port.code !== 'HIL', true]] : []),
    ['Equipment and labour recorded', port.readiness > 50, true],
    ['At least one port configuration administrator', true, true],
    ['At least two access administrators', port.readiness === 100, true],
    ['Staff for border gate, weighbridge, billing, finance, inland gate and supervision', port.readiness > 70, true],
    ['Paper fallback consent recorded', false, false],
  ];
  const blocking = checks.filter(([, ok, required]) => required && !ok);
  return (
    <>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">{checks.filter(([, ok]) => ok).length} of {checks.length} checks pass</Typography>
          <LinearProgress variant="determinate" value={(checks.filter(([, ok]) => ok).length / checks.length) * 100} sx={{ mt: 1 }} />
        </Box>
        <Button variant="outlined" color="inherit">{tr("Re-run checks")}</Button>
      </Stack>
      <Stack spacing={1.25}>
        {checks.map(([l, ok, required]) => (
          <Stack key={l} direction="row" spacing={1.25} alignItems="center">
            {ok ? <CheckCircleRoundedIcon color="success" fontSize="small" /> : <CancelRoundedIcon color={required ? 'error' : 'disabled'} fontSize="small" />}
            <Typography variant="body2" sx={{ flex: 1 }} color={ok || !required ? 'text.primary' : 'error.text'}>{l}</Typography>
            {!required && <Label>Advisory</Label>}
          </Stack>
        ))}
      </Stack>
      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
      {blocking.length ? (
        <Alert severity="error">{blocking.length} blocking check{blocking.length > 1 ? 's' : ''} must pass before you can request go-live.</Alert>
      ) : (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">A head-office approver reviews the request. You cannot approve your own request.</Typography>
          <Button variant="contained" size="large" onClick={onRequest}>{tr("Request go-live")}</Button>
        </Stack>
      )}
    </>
  );
}

const stateColor = (state) => (state === 'Live' ? 'success' : state.startsWith('Awaiting') ? 'info' : 'warning');

export default function PortSetup() {
  const [portCode, setPortCode] = useState('SON');
  const [step, setStep] = useState(0);
  const [portModules, setPortModules] = useStoredState('portModules', NO_SETTINGS);
  const modules = portModules[portCode] ?? DEFAULT_MODULES;
  const setModules = (value) => setPortModules((all) => ({ ...all, [portCode]: value }));
  const [toast, setToast] = useState('');
  const port = ports.find((p) => p.code === portCode);

  return (
    <>
      <PageHeader title={tr("Port setup")} links={[{ name: 'Administration' }, { name: 'Port setup' }, { name: `${port.name} (${port.code})` }]} />
      {/* Ports as compact tabs; the selected port's status and readiness show in the steps panel. */}
      <Tabs
        value={portCode}
        onChange={(e, v) => { setPortCode(v); setStep(0); }}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {ports.map((p) => (
          <Tab
            key={p.code}
            value={p.code}
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>{p.name}</span>
                <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{p.code}</Typography>
                {/* Status in words as well as colour (M2 Annex 24.5: never a coloured dot alone). */}
                <Label color={stateColor(p.state)}>{tr(p.state)}</Label>
              </Stack>
            }
          />
        ))}
      </Tabs>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 3 }}>
          <Card sx={{ p: 1.5 }}>
            <Box sx={{ p: 1.5, pb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap" sx={{ mb: 1.25 }}>
                <Label color={stateColor(port.state)}>{port.state}</Label>
                <Typography variant="caption" color="text.secondary">{port.readiness}% ready</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={port.readiness} color={port.readiness === 100 ? 'success' : 'primary'} />
            </Box>
            <Divider sx={{ borderStyle: 'dashed', mx: 1.5, mb: 1 }} />
            {steps.map((s, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <ButtonBase
                  key={s.key}
                  onClick={() => setStep(i)}
                  sx={{
                    width: '100%', justifyContent: 'flex-start', gap: 1.5, p: 1.5, borderRadius: 1.5, textAlign: 'left',
                    ...(active && { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) }),
                  }}
                >
                  <Box
                    sx={{
                      width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, typography: 'subtitle2',
                      bgcolor: active || done ? 'primary.main' : 'action.selected', color: active || done ? 'primary.contrastText' : 'text.secondary',
                    }}
                  >
                    {i < 4 ? i + 1 : 'L'}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color={active ? 'primary.main' : 'text.primary'}>{s.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.desc}</Typography>
                  </Box>
                </ButtonBase>
              );
            })}
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 9 }}>
          <SectionCard title={steps[step].title} subheader={steps[step].desc}>
            <Box sx={{ px: 3, pb: 3 }}>
              {step === 0 && <StepPort key={port.code} port={port} />}
              {step === 1 && <StepModules modules={modules} setModules={setModules} />}
              {step === 2 && <StepResources port={port} modules={modules} />}
              {step === 3 && <StepPeople />}
              {step === 4 && <StepGoLive port={port} modules={modules} onRequest={() => setToast(`Go-live request for ${port.name} sent to head office.`)} />}
            </Box>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ p: 3 }}>
              <Button variant="outlined" color="inherit" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>{tr("Previous")}</Button>
              <Stack direction="row" spacing={1.5}>
                {step < 4 && <Button variant="outlined" color="inherit" onClick={() => setToast('Changes saved.')}>{tr("Save")}</Button>}
                {step < 4 && <Button variant="contained" onClick={() => setStep((s) => s + 1)}>Next: {steps[step + 1].title}</Button>}
              </Stack>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
