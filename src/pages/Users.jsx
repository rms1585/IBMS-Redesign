import { useState } from 'react';
import {
  Box, Stack, Typography, Button, Grid2 as Grid, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Snackbar, IconButton, Menu,
} from '@mui/material';
import { PageHeader, UserAvatar, ReasonDialog } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { users as initial, roles, ports } from '../data/mock';
import { AddRoundedIcon, MoreVertRoundedIcon } from '../components/icons';

const statusColor = { Active: 'success', Invited: 'info', Deactivated: 'default' };

function InviteDialog({ open, onClose, onInvite }) {
  const [f, setF] = useState({ name: '', type: 'BLPA staff', email: '', mobile: '', port: 'BEN', role: 'Border gate operator', acting: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email);
  const sensitive = roles.find((r) => r.name === f.role)?.sensitive;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New user</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={6}><TextField fullWidth required label="Full name" value={f.name} onChange={set('name')} /></Grid>
          <Grid size={6}>
            <TextField select fullWidth label="Organisation / person type" value={f.type} onChange={set('type')}>
              {['BLPA staff', 'C&F agency', 'Importer / exporter', 'Bank staff'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={6}><TextField fullWidth required label="Email" value={f.email} onChange={set('email')} error={Boolean(f.email) && !emailOk} helperText={f.email && !emailOk ? 'Enter a valid email' : ' '} /></Grid>
          <Grid size={6}><TextField fullWidth label="Mobile" value={f.mobile} onChange={set('mobile')} /></Grid>
          <Grid size={4}><TextField select fullWidth label="Port" value={f.port} onChange={set('port')}>{ports.map((p) => <MenuItem key={p.code} value={p.code}>{p.code}</MenuItem>)}</TextField></Grid>
          <Grid size={8}><TextField select fullWidth label="Role" value={f.role} onChange={set('role')}>{roles.map((r) => <MenuItem key={r.name} value={r.name}>{r.name}</MenuItem>)}</TextField></Grid>
          <Grid size={12}><TextField fullWidth type="date" label="Acting until (optional)" value={f.acting} onChange={set('acting')} slotProps={{ inputLabel: { shrink: true } }} helperText="Access ends automatically on this date" /></Grid>
        </Grid>
        {sensitive && <Alert severity="warning" sx={{ mt: 1 }}>“{f.role}” is sensitive. The assignment waits for independent approval before it takes effect.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!f.name.trim() || !emailOk} onClick={() => onInvite(f, sensitive)}>Create and invite</Button>
      </DialogActions>
    </Dialog>
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
  const [list, setList] = useState(initial);
  const [open, setOpen] = useState(false);
  const [deact, setDeact] = useState(null);
  const [toast, setToast] = useState('');

  return (
    <>
      <PageHeader
        title="Users"
        links={[{ name: 'Administration' }, { name: 'Users' }]}
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
          { key: 'm', label: '', align: 'right', render: (r) => <RowMenu user={r} onDeactivate={setDeact} /> },
        ]}
      />
      <InviteDialog
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
