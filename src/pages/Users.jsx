import { useEffect, useState } from 'react';
import {
  Box, Stack, Typography, Button, TextField, MenuItem, Alert, Snackbar, IconButton, Menu,
} from '@mui/material';
import FormDrawer from '../components/FormDrawer';
import { PageHeader, UserAvatar, ReasonDialog } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { users as initial, roles, ports } from '../data/mock';
import { AddRoundedIcon, MoreVertRoundedIcon } from '../components/icons';
import { useStoredState } from '../demo/PortStore';

const statusColor = { Active: 'success', Invited: 'info', Deactivated: 'default' };

const EMPTY_INVITE = { name: '', type: 'BLPA staff', email: '', mobile: '', port: 'BEN', role: 'Border gate operator', acting: '' };

// Stays mounted so the drawer can slide in and out; the form empties itself each time it opens.
function InviteForm({ open, onClose, onInvite }) {
  const [f, setF] = useState(EMPTY_INVITE);
  useEffect(() => {
    if (open) setF(EMPTY_INVITE);
  }, [open]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email);
  const sensitive = roles.find((r) => r.name === f.role)?.sensitive;
  const ready = f.name.trim() && emailOk;
  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title="New user"
      subtitle="They get an email invitation to set up their account."
      actions={(
        <>
          <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
          <Button variant="contained" disabled={!ready} onClick={() => onInvite(f, sensitive)}>Create and invite</Button>
        </>
      )}
    >
      <Stack spacing={2.5} component="form" noValidate onSubmit={(e) => { e.preventDefault(); if (ready) onInvite(f, sensitive); }}>
        <Typography variant="subtitle2">Person</Typography>
        <TextField fullWidth required autoFocus label="Full name" value={f.name} onChange={set('name')} />
        <TextField select fullWidth label="Organisation or person type" value={f.type} onChange={set('type')}>
          {['BLPA staff', 'C&F agency', 'Importer / exporter', 'Bank staff'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <TextField fullWidth required type="email" label="Email" value={f.email} onChange={set('email')} error={Boolean(f.email) && !emailOk} helperText={f.email && !emailOk ? 'Enter a valid email, for example name@blpa.gov.bd' : 'The invitation goes to this address'} />
        <TextField fullWidth type="tel" label="Mobile (optional)" value={f.mobile} onChange={set('mobile')} />
        <Typography variant="subtitle2" sx={{ pt: 1 }}>Access</Typography>
        <Stack direction="row" spacing={2}>
          <TextField select label="Port" value={f.port} onChange={set('port')} sx={{ width: 120, flexShrink: 0 }}>{ports.map((p) => <MenuItem key={p.code} value={p.code}>{p.code}</MenuItem>)}</TextField>
          <TextField select fullWidth label="Role" value={f.role} onChange={set('role')}>{roles.map((r) => <MenuItem key={r.name} value={r.name}>{r.name}</MenuItem>)}</TextField>
        </Stack>
        {sensitive && <Alert severity="warning">“{f.role}” is sensitive. The assignment waits for independent approval before it takes effect.</Alert>}
        <TextField fullWidth type="date" label="Acting until (optional)" value={f.acting} onChange={set('acting')} slotProps={{ inputLabel: { shrink: true } }} helperText="Access ends automatically on this date" />
      </Stack>
    </FormDrawer>
  );
}

function RowMenu({ user, onDeactivate }) {
  const [a, setA] = useState(null);
  return (
    <>
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setA(e.currentTarget); }}><MoreVertRoundedIcon fontSize="small" /></IconButton>
      <Menu anchorEl={a} open={Boolean(a)} onClose={() => setA(null)}>
        <MenuItem onClick={() => setA(null)}>Add role assignment</MenuItem>
        <MenuItem onClick={() => setA(null)}>Resend invitation</MenuItem>
        <MenuItem disabled={user.status === 'Deactivated'} onClick={() => { setA(null); onDeactivate(user); }} sx={{ color: 'error.main' }}>Deactivate…</MenuItem>
      </Menu>
    </>
  );
}

export default function Users() {
  const [list, setList] = useStoredState('users', initial);
  const [open, setOpen] = useState(false);
  const [deact, setDeact] = useState(null);
  const [toast, setToast] = useState('');

  return (
    <>
      <PageHeader
        title="Users"
        links={[{ name: 'Access and control' }, { name: 'Users' }]}
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>New user</Button>}
      />
      <DataTable
        rows={list}
        searchKeys={['name', 'email', 'org']}
        searchPlaceholder="Search person, email, role or port"
        rowKey={(r) => r.email}
        columns={[
          { key: 'name', label: 'Person', render: (r) => (
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ opacity: r.status === 'Deactivated' ? 0.5 : 1 }}>
              <UserAvatar name={r.name} size={36} />
              <Box><Typography variant="subtitle2">{r.name}</Typography><Typography variant="caption" color="text.secondary">{r.email}</Typography></Box>
            </Stack>
          ) },
          { key: 'org', label: 'Organisation' },
          { key: 'assignments', label: 'Role @ port', render: (r) => <Stack spacing={0.5} alignItems="flex-start">{r.assignments.map((a) => <Label key={a}>{a}</Label>)}</Stack> },
          { key: 'status', label: 'Status', render: (r) => <Label color={statusColor[r.status]}>{r.status}</Label> },
          { key: 'm', label: '', render: (r) => <RowMenu user={r} onDeactivate={setDeact} /> },
        ]}
      />
      <InviteForm
        open={open}
        onClose={() => setOpen(false)}
        onInvite={(f, sensitive) => {
          setList((l) => [{ name: f.name, email: f.email, org: f.type === 'BLPA staff' ? 'BLPA' : f.type, assignments: [`${f.role} @ ${f.port}${sensitive ? ' (awaiting approval)' : ''}`], status: 'Invited' }, ...l]);
          setOpen(false);
          setToast(`Invitation sent to ${f.email}.`);
        }}
      />
      <ReasonDialog
        open={Boolean(deact)}
        title={`Deactivate ${deact?.name ?? ''}?`}
        description="Access is revoked immediately. Their past records keep their name as author."
        confirmLabel="Deactivate"
        confirmColor="error"
        onClose={() => setDeact(null)}
        onConfirm={() => { setList((l) => l.map((u) => (u.email === deact.email ? { ...u, status: 'Deactivated' } : u))); setToast(`${deact.name} deactivated.`); setDeact(null); }}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
