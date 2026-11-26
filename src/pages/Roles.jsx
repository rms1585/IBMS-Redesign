import { useEffect, useState } from 'react';
import {
  Box, Card, Stack, Typography, Button, Tabs, Tab, Stepper, Step, StepLabel, TextField, MenuItem, Grid2 as Grid, Checkbox, FormControlLabel, Alert, Snackbar, Divider,
} from '@mui/material';
import FormDrawer from '../components/FormDrawer';
import { PageHeader } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { roles, modulesCatalog, ports, roleAccess, users } from '../data/mock';
import { AddRoundedIcon, CheckRoundedIcon } from '../components/icons';
import { useStoredState } from '../demo/PortStore';
import { tr } from '../i18n/LanguageContext';

// A role's access as module key -> action names: what Create role saved, or the template's demo access.
function accessMapOf(role) {
  const map = role.access ?? roleAccess[role.name] ?? {};
  return map === 'all' ? Object.fromEntries(modulesCatalog.map((m) => [m.key, m.actions.map((a) => a[1])])) : map;
}

// The same access with each action's group and sensitivity, in catalogue order.
function accessOf(role) {
  const map = accessMapOf(role);
  return modulesCatalog
    .filter((m) => map[m.key]?.length)
    .map((m) => ({ ...m, granted: m.actions.filter((a) => map[m.key].includes(a[1])) }));
}

const GROUPS = ['See', 'Record and do', 'Set up'];

function AccessDrawer({ role: picked, onClose, onCopy }) {
  // Keep showing the last role while the drawer slides out.
  const [role, setRole] = useState(picked);
  useEffect(() => {
    if (picked) setRole(picked);
  }, [picked]);
  const [people] = useStoredState('users', users);
  const modules = role ? accessOf(role) : [];
  const actions = modules.reduce((n, m) => n + m.granted.length, 0);
  const holders = role ? people.filter((u) => u.assignments.some((a) => a.startsWith(`${role.name} @`))) : [];
  return (
    <FormDrawer
      open={Boolean(picked)}
      onClose={onClose}
      title={role ? `Access: ${role.name}` : 'Access'}
      subtitle={role ? `${role.scope} · ${role.org} · ${modules.length} module${modules.length === 1 ? '' : 's'}, ${actions} action${actions === 1 ? '' : 's'}` : ''}
      width={560}
      actions={(
        <>
          <Button variant="outlined" color="inherit" onClick={onClose}>{tr("Close")}</Button>
          {role?.template && <Button variant="contained" onClick={() => onCopy(role)}>{tr("Copy to change it")}</Button>}
        </>
      )}
    >
      {role && (
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {role.template ? <Label>Template, read-only</Label> : <Label color="info">Local role</Label>}
            {role.sensitive && <Label color="error">Sensitive: assigning it needs independent approval</Label>}
          </Stack>
          {modules.length === 0 && <Typography variant="body2" color="text.secondary">This role has no actions yet.</Typography>}
          {modules.map((m) => (
            <Box key={m.key}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>{m.name}</Typography>
              <Stack spacing={1.5}>
                {GROUPS.map((g) => {
                  const acts = m.granted.filter((a) => a[0] === g);
                  if (!acts.length) return null;
                  return (
                    <Box key={g}>
                      <Typography variant="overline" color="text.secondary" component="div">{g}</Typography>
                      <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 0, listStyle: 'none' }}>
                        {acts.map((a) => (
                          <Stack component="li" key={a[1]} direction="row" spacing={1} alignItems="center">
                            <CheckRoundedIcon fontSize="small" color="success" aria-hidden />
                            <Typography variant="body2">{a[1]}</Typography>
                            {a[2] && <Label color="error">Sensitive</Label>}
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
              <Divider sx={{ mt: 2, borderStyle: 'dashed' }} />
            </Box>
          ))}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>People with this role</Typography>
            {holders.length ? (
              <Stack spacing={1}>
                {holders.map((u) => (
                  <Box key={u.email}>
                    <Typography variant="subtitle2">{u.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{u.assignments.filter((a) => a.startsWith(`${role.name} @`)).join(', ')} · {u.status}</Typography>
                  </Box>
                ))}
              </Stack>
            ) : <Typography variant="body2" color="text.secondary">Nobody has this role yet. Assign it from Users.</Typography>}
          </Box>
        </Stack>
      )}
    </FormDrawer>
  );
}

function CreateRole({ open, onClose, onSave }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [scope, setScope] = useState('Port');
  const [mods, setMods] = useState([]);
  const [actions, setActions] = useState({});
  // Starts fresh each time it opens; staying mounted on close lets the drawer slide out.
  useEffect(() => {
    if (!open) return;
    setStep(0); setName(''); setScope('Port'); setMods([]); setActions({});
  }, [open]);
  const close = onClose;
  const chosen = modulesCatalog.filter((m) => mods.includes(m.key));
  const picked = chosen.flatMap((m) => m.actions.filter((a) => actions[`${m.key}:${a[1]}`]).map((a) => ({ m: m.name, a })));
  const sensitive = picked.some((p) => p.a[2]);
  const canNext = [name.trim(), mods.length > 0, picked.length > 0, true][step];

  return (
    <FormDrawer
      open={open}
      dirty={Boolean(name.trim()) || mods.length > 0}
      why={step < 3 && !canNext ? ['Enter the role name.', 'Choose at least one module.', 'Tick at least one action.'][step] : ''}
      onClose={close}
      title={tr("Create role")}
      subtitle={tr("A role combines scope, modules and actions.")}
      width={640}
      actions={(
        <>
          <Button variant="outlined" color="inherit" onClick={step === 0 ? close : () => setStep(step - 1)}>{step === 0 ? 'Cancel' : 'Previous'}</Button>
          {step < 3 ? (
            <Button variant="contained" disabled={!canNext} onClick={() => setStep(step + 1)}>{tr("Next")}</Button>
          ) : (
            <Button variant="contained" onClick={() => { onSave({ name, scope, org: 'BLPA', template: false, sensitive, access: Object.fromEntries(chosen.map((m) => [m.key, m.actions.filter((a) => actions[`${m.key}:${a[1]}`]).map((a) => a[1])])) }); close(); }}>{tr("Save role")}</Button>
          )}
        </>
      )}
    >
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
          {['Name and scope', 'Modules', 'Actions', 'Summary'].map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
        </Stepper>
        {step === 0 && (
          <Grid container spacing={2.5}>
            <Grid size={12}><TextField fullWidth required autoFocus label={tr("Role name")} value={name} onChange={(e) => setName(e.target.value)} /></Grid>
            <Grid size={12}><TextField fullWidth multiline minRows={2} label={tr("Description")} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select fullWidth label={tr("Scope")} value={scope} onChange={(e) => setScope(e.target.value)}>
                {['Port', 'Port + gates/lanes', 'Port + scale', 'Port + shed/yard', 'Multi-port', 'Platform'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select fullWidth label={tr("Port")} defaultValue="BEN">{ports.map((p) => <MenuItem key={p.code} value={p.code}>{p.name} ({p.code})</MenuItem>)}</TextField>
            </Grid>
          </Grid>
        )}
        {step === 1 && (
          <Grid container spacing={1.5}>
            {modulesCatalog.map((m) => (
              <Grid key={m.key} size={{ xs: 12, sm: 6 }}>
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
                    <Button size="small" variant="outlined" color="inherit" onClick={() => setActions({ ...actions, ...Object.fromEntries(m.actions.map((a) => [`${m.key}:${a[1]}`, !allOn])) })}>{allOn ? 'Clear' : 'Tick all'}</Button>
                  </Stack>
                  {['See', 'Record and do', 'Set up'].map((g) => {
                    const acts = m.actions.filter((a) => a[0] === g);
                    if (!acts.length) return null;
                    return (
                      <Box key={g} sx={{ pl: 1 }}>
                        <Typography variant="overline" color="text.secondary">{g}</Typography>
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
    </FormDrawer>
  );
}

export default function Roles() {
  const [list, setList] = useStoredState('rolesV2', roles);
  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState(false);
  const [copy, setCopy] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [copyName, setCopyName] = useState('');
  const [toast, setToast] = useState('');
  const rows = list.filter((r) => tab === 'all' || (tab === 'templates' ? r.template : !r.template));

  return (
    <>
      <PageHeader
        title={tr("Roles")}
        links={[{ name: 'Access and control' }, { name: 'Roles' }]}
        subtitle={tr("A role combines scope, modules and actions. Templates are read-only: copy one to make a local role you can edit.")}
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>{tr("Create role")}</Button>}
      />
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="all" label={tr("All")} />
        <Tab value="templates" label={tr("Templates")} />
        <Tab value="local" label={tr("Local roles")} />
      </Tabs>
      <DataTable
        rows={rows}
        searchKeys={['name', 'scope']}
        searchPlaceholder={tr("Search roles")}
        columns={[
          { key: 'name', label: 'Role', render: (r) => <Stack direction="row" columnGap={1} rowGap={0.5} alignItems="center" flexWrap="wrap" sx={{ whiteSpace: 'normal', minWidth: 160 }}><Typography variant="subtitle2">{r.name}</Typography>{r.template && <Label>Template</Label>}{r.sensitive && <Label color="error">Sensitive</Label>}</Stack> },
          { key: 'modules', label: 'Modules', render: (r) => accessOf(r).length },
          { key: 'scope', label: 'Scope', render: (r) => <Box component="span" sx={{ whiteSpace: 'normal' }}>{r.scope}</Box> },
          { key: 'org', label: 'Organisation' },
          { key: 'tasks', label: 'Actions', render: (r) => accessOf(r).reduce((n, m) => n + m.granted.length, 0) },
          { key: 'act', label: '', render: (r) => <Stack direction="row" spacing={1} justifyContent="flex-end"><Button size="small" variant="outlined" color="inherit" sx={{ whiteSpace: 'nowrap' }} onClick={() => setViewing(r)}>{tr("View access")}</Button>{r.template ? <Button size="small" variant="outlined" onClick={() => { setCopy(r); setCopyName(`${r.name} (BEN)`); }}>{tr("Copy")}</Button> : <Button size="small" variant="outlined" >{tr("Edit")}</Button>}</Stack> },
        ]}
      />
      <CreateRole open={open} onClose={() => setOpen(false)} onSave={(r) => { setList((l) => [...l, r]); setToast(`Role “${r.name}” created.`); }} />
      <AccessDrawer role={viewing} onClose={() => setViewing(null)} onCopy={(r) => { setViewing(null); setCopy(r); setCopyName(`${r.name} (BEN)`); }} />
      <FormDrawer
        open={Boolean(copy)}
        onClose={() => setCopy(null)}
        why={!copyName.trim() ? 'Enter a name for the copy.' : ''}
        title={`Copy “${copy?.name ?? ''}”`}
        subtitle={tr("The template stays unchanged. Your copy is independent and can be edited.")}
        actions={(
          <>
            <Button variant="outlined" color="inherit" onClick={() => setCopy(null)}>{tr("Cancel")}</Button>
            <Button variant="contained" disabled={!copyName.trim()} onClick={() => { setList((l) => [...l, { ...copy, name: copyName, template: false, access: accessMapOf(copy) }]); setCopy(null); setToast(`Copied as “${copyName}”.`); }}>{tr("Copy role")}</Button>
          </>
        )}
      >
        <Stack spacing={2.5}>
          <TextField fullWidth autoFocus label={tr("New role name")} value={copyName} onChange={(e) => setCopyName(e.target.value)} />
          <TextField select fullWidth label={tr("Port")} defaultValue="BEN">{ports.map((p) => <MenuItem key={p.code} value={p.code}>{p.name}</MenuItem>)}</TextField>
        </Stack>
      </FormDrawer>
      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
