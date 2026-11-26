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
import { tr } from '../i18n/LanguageContext';

// Two roles one person may never hold together, because one records what the other approves (M-13).
const SEPARATE = [
  ['Billing officer', 'Bill approver', 'raising a bill and approving it'],
  ['Revenue configurator', 'Head-office approver', 'recording a tariff and approving it'],
  ['Access administrator', 'Head-office approver', 'building a role and approving it'],
];
const conflictOf = (held, role) => {
  for (const [a, b, what] of SEPARATE) {
    const other = role === a ? b : role === b ? a : null;
    if (other && held.some((h) => h.startsWith(`${other} @`))) return `${role} cannot go to someone who already holds ${other}: the two keep ${what} apart.`;
  }
  return '';
};

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
      dirty={f !== EMPTY_INVITE}
      why={!f.name.trim() ? 'Enter the full name.' : !emailOk ? 'Enter a valid email address.' : ''}
      onClose={onClose}
      title={tr("New user")}
      subtitle={tr("They get an email invitation to set up their account.")}
      actions={(
        <>
          <Button variant="outlined" color="inherit" onClick={onClose}>{tr("Cancel")}</Button>
          <Button variant="contained" disabled={!ready} onClick={() => onInvite(f, sensitive)}>{tr("Create and invite")}</Button>
        </>
      )}
    >
      <Stack spacing={2.5} component="form" noValidate onSubmit={(e) => { e.preventDefault(); if (ready) onInvite(f, sensitive); }}>
        <Typography variant="subtitle2">Person</Typography>
        <TextField fullWidth required autoFocus label={tr("Full name")} value={f.name} onChange={set('name')} />
        <TextField select fullWidth label={tr("Organisation or person type")} value={f.type} onChange={set('type')}>
          {['BLPA staff', 'C&F agency', 'Importer / exporter', 'Bank staff'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <TextField fullWidth required type="email" label={tr("Email")} value={f.email} onChange={set('email')} error={Boolean(f.email) && !emailOk} helperText={f.email && !emailOk ? 'Enter a valid email, for example name@blpa.gov.bd' : 'The invitation goes to this address'} />
        <TextField fullWidth type="tel" label={tr("Mobile (optional)")} value={f.mobile} onChange={set('mobile')} />
        <Typography variant="subtitle2" sx={{ pt: 1 }}>Access</Typography>
        <Stack direction="row" spacing={2}>
          <TextField select label={tr("Port")} value={f.port} onChange={set('port')} sx={{ width: 120, flexShrink: 0 }}>{ports.map((p) => <MenuItem key={p.code} value={p.code}>{p.code}</MenuItem>)}</TextField>
          <TextField select fullWidth label={tr("Role")} value={f.role} onChange={set('role')}>{roles.map((r) => <MenuItem key={r.name} value={r.name}>{r.name}</MenuItem>)}</TextField>
        </Stack>
        {sensitive && <Alert severity="warning">“{f.role}” is sensitive. The assignment waits for independent approval before it takes effect.</Alert>}
        <TextField fullWidth type="date" label={tr("Acting until (optional)")} value={f.acting} onChange={set('acting')} slotProps={{ inputLabel: { shrink: true } }} helperText={tr("Access ends automatically on this date")} />
      </Stack>
    </FormDrawer>
  );
}

function RowMenu({ user, onDeactivate, onAssign }) {
  const [a, setA] = useState(null);
  return (
    <>
      <IconButton size="small" aria-label={`Actions for ${user.name}`} onClick={(e) => { e.stopPropagation(); setA(e.currentTarget); }}><MoreVertRoundedIcon fontSize="small" /></IconButton>
      <Menu anchorEl={a} open={Boolean(a)} onClose={() => setA(null)}>
        <MenuItem onClick={() => { setA(null); onAssign(user); }}>Add role assignment</MenuItem>
        <MenuItem onClick={() => setA(null)}>Resend invitation</MenuItem>
        <MenuItem disabled={user.status === 'Deactivated'} onClick={() => { setA(null); onDeactivate(user); }} sx={{ color: 'error.text' }}>Deactivate…</MenuItem>
      </Menu>
    </>
  );
}

// Adding a role to someone refuses a pair of roles that must stay separate.
function AssignForm({ user, onClose, onAssign }) {
  const [role, setRole] = useState(roles[0].name);
  const [port, setPort] = useState('BEN');
  useEffect(() => { if (user) { setRole(roles[0].name); setPort('BEN'); } }, [user]);
  const held = user?.assignments ?? [];
  const label = `${role} @ ${port}`;
  const duplicate = user && held.includes(label) ? `${user.name} already holds this role at ${port}.` : '';
  const conflict = user && !duplicate ? conflictOf(held, role) : '';
  return (
    <FormDrawer
      open={Boolean(user)}
      onClose={onClose}
      title={tr('Add role assignment')}
      subtitle={user ? `${user.name} · ${held.join(', ')}` : ''}
      why={duplicate || (conflict ? 'Refused: these roles must stay with different people.' : '')}
      actions={(
        <>
          <Button variant="outlined" color="inherit" onClick={onClose}>{tr('Cancel')}</Button>
          <Button variant="contained" disabled={Boolean(duplicate || conflict)} onClick={() => onAssign(user, label)}>{tr('Add role')}</Button>
        </>
      )}
    >
      <Stack spacing={2.5}>
        <TextField select fullWidth label={tr('Role')} value={role} onChange={(e) => setRole(e.target.value)}>{roles.map((r) => <MenuItem key={r.name} value={r.name}>{r.name}</MenuItem>)}</TextField>
        <TextField select fullWidth label={tr('Port')} value={port} onChange={(e) => setPort(e.target.value)}>{ports.map((p) => <MenuItem key={p.code} value={p.code}>{p.code}</MenuItem>)}</TextField>
        {conflict && <Alert severity="error" variant="outlined">{conflict} Assign it to another person.</Alert>}
      </Stack>
    </FormDrawer>
  );
}

// A staff list is checked row by row; only the good rows are imported (M-13). Columns: name, email, role, port.
const SAMPLE_CSV = `name,email,role,port
Nusrat Jahan,nusrat.jahan@blpa.gov.bd,Border gate operator,BEN
Kamrul Islam,kamrul.islam@blpa.gov.bd,Weighbridge operator,BEN
Farhana Rahman,farhana.rahman@blpa.gov.bd,Posting officer,BEN
Abu Bakar,abu.bakar@blpa,Shed in-charge,BEN
Sumaiya Akter,sumaiya.akter@blpa.gov.bd,Posting officer,XYZ`;

function checkRows(text, existing) {
  const [, ...lines] = text.trim().split(/\r?\n/);
  const seen = new Set(existing.map((u) => u.email.toLowerCase()));
  return lines.filter((l) => l.trim()).map((line, i) => {
    const [name = '', email = '', role = '', port = ''] = line.split(',').map((x) => x.trim());
    const problem = !name ? 'Name is missing.'
      : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? 'The email is not valid.'
        : seen.has(email.toLowerCase()) ? 'This person already has an account.'
          : !roles.some((r) => r.name === role) ? `"${role}" is not a role at this port.`
            : !ports.some((p) => p.code === port) ? `"${port}" is not a port code.` : '';
    seen.add(email.toLowerCase());
    return { row: i + 2, name, email, role, port, problem };
  });
}

function UploadStaff({ open, existing, onClose, onImport }) {
  const [rows, setRows] = useState(null);
  const [file, setFile] = useState('');
  useEffect(() => { if (open) { setRows(null); setFile(''); } }, [open]);
  const load = (text, name) => { setRows(checkRows(text, existing)); setFile(name); };
  const good = rows?.filter((r) => !r.problem) ?? [];
  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      width={640}
      title={tr('Upload staff list')}
      subtitle={tr('A CSV with the columns name, email, role, port. Each row is checked; only the good rows are imported.')}
      why={!rows ? 'Choose a file.' : !good.length ? 'No row is ready to import.' : ''}
      actions={(
        <>
          <Button variant="outlined" color="inherit" onClick={onClose}>{tr('Cancel')}</Button>
          <Button variant="contained" disabled={!good.length} onClick={() => onImport(good)}>{good.length ? `Import ${good.length} good row${good.length === 1 ? '' : 's'}` : tr('Import')}</Button>
        </>
      )}
    >
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
          <Button component="label" variant="outlined" color="inherit">
            {tr('Choose CSV file')}
            <input hidden type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) f.text().then((t) => load(t, f.name)); e.target.value = ''; }} />
          </Button>
          <Button color="inherit" onClick={() => load(SAMPLE_CSV, 'benapole-staff-demo.csv')}>{tr('Use the demo file')}</Button>
          {file && <Typography variant="caption" color="text.secondary">{file}</Typography>}
        </Stack>
        {rows && (
          <Stack spacing={1}>
            <Typography variant="subtitle2">{good.length} of {rows.length} rows ready</Typography>
            {rows.map((r) => (
              <Stack key={r.row} direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ width: 44, flexShrink: 0, pt: 0.25 }}>Row {r.row}</Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2">{r.name || '–'} · {r.email || '–'}</Typography>
                  <Typography variant="caption" color={r.problem ? 'error.text' : 'text.secondary'}>{r.problem || `${r.role} @ ${r.port}`}</Typography>
                </Box>
                <Label color={r.problem ? 'error' : 'success'}>{r.problem ? 'Not imported' : 'Ready'}</Label>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </FormDrawer>
  );
}

export default function Users() {
  const [list, setList] = useStoredState('users', initial);
  const [open, setOpen] = useState(false);
  const [deact, setDeact] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');

  return (
    <>
      <PageHeader
        title={tr("Users")}
        links={[{ name: 'Access and control' }, { name: 'Users' }]}
        action={<Stack direction="row" spacing={1.5}><Button variant="outlined" color="inherit" onClick={() => setUploading(true)}>{tr('Upload staff list')}</Button><Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>{tr("New user")}</Button></Stack>}
      />
      <DataTable
        rows={list}
        searchKeys={['name', 'email', 'org']}
        searchPlaceholder={tr("Search person, email, role or port")}
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
          { key: 'm', label: '', render: (r) => <RowMenu user={r} onDeactivate={setDeact} onAssign={setAssigning} /> },
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
      <AssignForm
        user={assigning}
        onClose={() => setAssigning(null)}
        onAssign={(u, label) => { setList((l) => l.map((x) => (x.email === u.email ? { ...x, assignments: [...x.assignments, label] } : x))); setAssigning(null); setToast(`${label} added for ${u.name}.`); }}
      />
      <UploadStaff
        open={uploading}
        existing={list}
        onClose={() => setUploading(false)}
        onImport={(rows) => { setList((l) => [...rows.map((r) => ({ name: r.name, email: r.email, org: 'BLPA', assignments: [`${r.role} @ ${r.port}`], status: 'Invited' })), ...l]); setUploading(false); setToast(`${rows.length} invitation${rows.length === 1 ? '' : 's'} sent.`); }}
      />
      <ReasonDialog
        open={Boolean(deact)}
        title={`Deactivate ${deact?.name ?? ''}?`}
        description={tr("Access is revoked immediately. Their past records keep their name as author.")}
        confirmLabel={tr("Deactivate")}
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
