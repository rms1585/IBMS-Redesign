import { useState } from 'react';
import {
  Box, Card, Stack, Typography, Button, Tabs, Tab, Stepper, Step, StepLabel, TextField, MenuItem, Grid2 as Grid,
  Checkbox, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar, Divider,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { PageHeader } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { roles, modulesCatalog, ports } from '../data/mock';

function CreateRole({ open, onClose, onSave }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [scope, setScope] = useState('Port');
  const [mods, setMods] = useState([]);
  const [actions, setActions] = useState({});
  const close = () => { setStep(0); setName(''); setMods([]); setActions({}); onClose(); };
  const chosen = modulesCatalog.filter((m) => mods.includes(m.key));
  const picked = chosen.flatMap((m) => m.actions.filter((a) => actions[`${m.key}:${a[1]}`]).map((a) => ({ m: m.name, a })));
  const sensitive = picked.some((p) => p.a[2]);
  const canNext = [name.trim(), mods.length > 0, picked.length > 0, true][step];

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="md">
      <DialogTitle>Create role</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {['Name and scope', 'Modules', 'Actions', 'Summary'].map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
        </Stepper>
        {step === 0 && (
          <Grid container spacing={2}>
            <Grid size={12}><TextField fullWidth required label="Role name" value={name} onChange={(e) => setName(e.target.value)} /></Grid>
            <Grid size={12}><TextField fullWidth multiline minRows={2} label="Description" /></Grid>
            <Grid size={6}>
              <TextField select fullWidth label="Scope" value={scope} onChange={(e) => setScope(e.target.value)}>
                {['Port', 'Port + gates/lanes', 'Port + scale', 'Port + shed/yard', 'Multi-port', 'Platform'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={6}>
              <TextField select fullWidth label="Port" defaultValue="BEN">{ports.map((p) => <MenuItem key={p.code} value={p.code}>{p.name} ({p.code})</MenuItem>)}</TextField>
            </Grid>
          </Grid>
        )}
        {step === 1 && (
          <Grid container spacing={1.5}>
            {modulesCatalog.map((m) => (
              <Grid key={m.key} size={6}>
                <Card variant="outlined" sx={{ boxShadow: 'none', px: 1.5, py: 0.5, borderColor: mods.includes(m.key) ? 'primary.main' : 'divider' }}>
                  <FormControlLabel
                    sx={{ width: '100%' }}
                    control={<Checkbox checked={mods.includes(m.key)} onChange={(e) => setMods(e.target.checked ? [...mods, m.key] : mods.filter((x) => x !== m.key))} />}
                    label={<Box><Typography variant="subtitle2">{m.name}</Typography><Typography variant="caption" color="text.secondary">{m.actions.length} actions</Typography></Box>}
                  />
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        {step === 2 && (
          <Stack spacing={3}>
            {chosen.map((m) => {
              const allOn = m.actions.every((a) => actions[`${m.key}:${a[1]}`]);
              return (
                <Box key={m.key}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1">{m.name}</Typography>
                    <Button size="small" color="inherit" onClick={() => setActions({ ...actions, ...Object.fromEntries(m.actions.map((a) => [`${m.key}:${a[1]}`, !allOn])) })}>{allOn ? 'Clear' : 'Tick all'}</Button>
                  </Stack>
                  {['See', 'Record and do', 'Set up'].map((g) => {
                    const acts = m.actions.filter((a) => a[0] === g);
                    if (!acts.length) return null;
                    return (
                      <Box key={g} sx={{ pl: 1 }}>
                        <Typography variant="overline" color="text.disabled">{g}</Typography>
                        {acts.map((a) => (
                          <Stack key={a[1]} direction="row" alignItems="center">
                            <FormControlLabel control={<Checkbox size="small" checked={Boolean(actions[`${m.key}:${a[1]}`])} onChange={(e) => setActions({ ...actions, [`${m.key}:${a[1]}`]: e.target.checked })} />} label={<Typography variant="body2">{a[1]}</Typography>} />
                            {a[2] && <Label color="error">Sensitive</Label>}
                          </Stack>
                        ))}
                      </Box>
                    );
                  })}
                  <Divider sx={{ mt: 1, borderStyle: 'dashed' }} />
                </Box>
              );
            })}
          </Stack>
        )}
        {step === 3 && (
          <>
            <Typography variant="h6">{name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{scope} · {chosen.length} modules · {picked.length} actions</Typography>
            <Stack spacing={0.5} sx={{ mb: 2 }}>
              {picked.map((p) => <Typography key={p.m + p.a[1]} variant="body2">• {p.m}: {p.a[1]} {p.a[2] && <Label color="error" sx={{ ml: 0.5 }}>Sensitive</Label>}</Typography>)}
            </Stack>
            {sensitive ? (
              <Alert severity="warning">This role includes sensitive actions. Assigning it to anyone needs independent approval in the Inbox.</Alert>
            ) : (
              <Alert severity="success">No sensitive actions. Changes take effect immediately.</Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={step === 0 ? close : () => setStep(step - 1)}>{step === 0 ? 'Cancel' : 'Previous'}</Button>
        {step < 3 ? (
          <Button variant="contained" disabled={!canNext} onClick={() => setStep(step + 1)}>Next</Button>
        ) : (
          <Button variant="contained" onClick={() => { onSave({ name, scope, org: 'BLPA', modules: chosen.length, tasks: picked.length, template: false, sensitive }); close(); }}>Save role</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default function Roles() {
  const [list, setList] = useState(roles);
  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState(false);
  const [copy, setCopy] = useState(null);
  const [copyName, setCopyName] = useState('');
  const [toast, setToast] = useState('');
  const rows = list.filter((r) => tab === 'all' || (tab === 'templates' ? r.template : !r.template));

  return (
    <>
      <PageHeader
        title="Roles"
        links={[{ name: 'Administration' }, { name: 'Roles' }]}
        subtitle="A role combines scope, modules and actions. Templates are read-only: copy one to make a local role you can edit."
        action={<Button variant="contained" color="inherit" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>Create role</Button>}
      />
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="all" label="All" />
        <Tab value="templates" label="Templates" />
        <Tab value="local" label="Local roles" />
      </Tabs>
      <DataTable
        rows={rows}
        searchKeys={['name', 'scope']}
        searchPlaceholder="Search roles"
        columns={[
          { key: 'name', label: 'Role', render: (r) => <Stack direction="row" spacing={1} alignItems="center"><Typography variant="subtitle2">{r.name}</Typography>{r.template && <Label>Template</Label>}{r.sensitive && <Label color="error">Sensitive</Label>}</Stack> },
          { key: 'modules', label: 'Modules', align: 'center' },
          { key: 'scope', label: 'Scope' },
          { key: 'org', label: 'Organisation' },
          { key: 'tasks', label: 'Tasks', align: 'center' },
          { key: 'act', label: '', align: 'right', render: (r) => <Stack direction="row" spacing={0.5} justifyContent="flex-end"><Button size="small" color="inherit">View access</Button>{r.template ? <Button size="small" onClick={() => { setCopy(r); setCopyName(`${r.name} (BEN)`); }}>Copy</Button> : <Button size="small">Edit</Button>}</Stack> },
        ]}
      />
      <CreateRole open={open} onClose={() => setOpen(false)} onSave={(r) => { setList((l) => [...l, r]); setToast(`Role “${r.name}” created.`); }} />
      <Dialog open={Boolean(copy)} onClose={() => setCopy(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Copy “{copy?.name}”</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>The template stays unchanged. Your copy is independent and can be edited.</Typography>
          <TextField fullWidth label="New role name" value={copyName} onChange={(e) => setCopyName(e.target.value)} sx={{ mb: 2 }} />
          <TextField select fullWidth label="Port" defaultValue="BEN">{ports.map((p) => <MenuItem key={p.code} value={p.code}>{p.name}</MenuItem>)}</TextField>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={() => setCopy(null)}>Cancel</Button>
          <Button variant="contained" disabled={!copyName.trim()} onClick={() => { setList((l) => [...l, { ...copy, name: copyName, template: false }]); setCopy(null); setToast(`Copied as “${copyName}”.`); }}>Copy role</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
