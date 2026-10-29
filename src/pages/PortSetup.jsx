import { useState } from 'react';
import {
  Box, Card, Stack, Typography, Button, Grid2 as Grid, TextField, Switch, Divider, Alert, Snackbar,
  Table, TableHead, TableRow, TableCell, TableBody, ButtonBase,
  LinearProgress, Checkbox, Tabs, Tab,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { PageHeader, SectionCard, UserAvatar } from '../components/common';
import Label from '../components/Label';
import { ports, agencies, users } from '../data/mock';
import { AddRoundedIcon, CancelRoundedIcon, CheckCircleRoundedIcon, LockOutlinedIcon } from '../components/icons';

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
        <TextField fullWidth label="Port code" value={port.code} disabled slotProps={{ input: { endAdornment: <LockOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} /> } }} helperText="Fixed after creation" />
      </Grid>
      <Grid size={8}><TextField fullWidth label="Port name" defaultValue={port.name} /></Grid>
      <Grid size={12}><TextField fullWidth label="Customs station" defaultValue={port.station} helperText="Incoming NSW messages are routed by this station code" /></Grid>
      <Grid size={12}>
        <TextField fullWidth label="Tariff order" value={port.tariff} disabled helperText="Assigned by head office. Rates are set centrally, not per port." />
      </Grid>
    </Grid>
  );
}

function StepModules({ modules, setModules }) {
  const rows = [
    ['gates', 'Border and inland gates', 'Always on', true],
    ['weigh', 'Weighing', 'Always on', true],
    ['billing', 'Billing, payments and exit passes', 'Always on', true],
    ['warehousing', 'Warehousing and posting', 'One capability: turning Warehousing off also turns off Posting.', false],
    ['transshipment', 'Transshipment', 'Direct truck-to-truck transfer in a yard.', false],
    ['stone', 'Stone route', 'Stone trucks leave loaded for a bonded yard and return empty for weighing.', false],
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

function StepResources({ modules }) {
  const resources = [
    ['Border gate 1', 'Border gate', 'Lanes B1, B2', 'Live'],
    ['Inland gate', 'Inland gate', 'Lanes I1, I2', 'Live'],
    ['Scale 1', 'Weighbridge', 'Calibrated to 12 Jan 2027', 'Live'],
    ['Scale 2', 'Weighbridge', 'Calibration due in 6 days', 'Live'],
    ...(modules.warehousing ? [['Shed 5', 'Shed', '2 zones · 56 bays', 'Live'], ['Shed 9', 'Shed', '1 zone · 24 bays', 'Live']] : []),
    ...(modules.transshipment ? [['Transshipment yard T1', 'Transshipment yard', '8 positions', 'Live']] : []),
  ];
  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">Border gates face the zero line. Inland gates face the Bangladesh road.</Typography>
        <Button variant="outlined" color="inherit" startIcon={<AddRoundedIcon />}>Add resource</Button>
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
                <TableCell><Label color="success">{s}</Label></TableCell>
                <TableCell sx={{ pr: 2, whiteSpace: 'nowrap' }}><Button size="small" color="inherit">Edit</Button><Button size="small" color="error">Retire</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Box sx={{ mt: 3, p: 2.5, borderRadius: 2, bgcolor: 'background.neutral' }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Empty weighing rule</Typography>
        <Grid container spacing={2}>
          <Grid size={6}><TextField fullWidth size="small" label="Stored tare valid for (months)" defaultValue="3" /></Grid>
          <Grid size={6}><TextField fullWidth size="small" select label="Weigh empty" defaultValue="missing" SelectProps={{ native: true }}><option value="missing">Only trucks with missing or expired tare</option><option value="all">Every truck</option></TextField></Grid>
        </Grid>
      </Box>
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
    ...(modules.transshipment ? [['Transshipment yard recorded', port.code !== 'HIL', true]] : []),
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
        <Button variant="outlined" color="inherit">Re-run checks</Button>
      </Stack>
      <Stack spacing={1.25}>
        {checks.map(([l, ok, required]) => (
          <Stack key={l} direction="row" spacing={1.25} alignItems="center">
            {ok ? <CheckCircleRoundedIcon color="success" fontSize="small" /> : <CancelRoundedIcon color={required ? 'error' : 'disabled'} fontSize="small" />}
            <Typography variant="body2" sx={{ flex: 1 }} color={ok || !required ? 'text.primary' : 'error.main'}>{l}</Typography>
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
          <Button variant="contained" size="large" onClick={onRequest}>Request go-live</Button>
        </Stack>
      )}
    </>
  );
}

const stateColor = (state) => (state === 'Live' ? 'success' : state.startsWith('Awaiting') ? 'info' : 'warning');

export default function PortSetup() {
  const [portCode, setPortCode] = useState('SON');
  const [step, setStep] = useState(0);
  const [modules, setModules] = useState({ warehousing: true, transshipment: true, stone: false });
  const [toast, setToast] = useState('');
  const port = ports.find((p) => p.code === portCode);

  return (
    <>
      <PageHeader title="Port setup" links={[{ name: 'Administration' }, { name: 'Port setup' }, { name: `${port.name} (${port.code})` }]} />
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
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: `${stateColor(p.state)}.main` }} />
                <span>{p.name}</span>
                <Typography component="span" variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>{p.code}</Typography>
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
                      width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700,
                      bgcolor: active || done ? 'primary.main' : 'action.selected', color: active || done ? '#fff' : 'text.secondary',
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
              {step === 2 && <StepResources modules={modules} />}
              {step === 3 && <StepPeople />}
              {step === 4 && <StepGoLive port={port} modules={modules} onRequest={() => setToast(`Go-live request for ${port.name} sent to head office.`)} />}
            </Box>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ p: 3 }}>
              <Button color="inherit" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Previous</Button>
              <Stack direction="row" spacing={1.5}>
                {step < 4 && <Button variant="outlined" color="inherit" onClick={() => setToast('Changes saved.')}>Save</Button>}
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
