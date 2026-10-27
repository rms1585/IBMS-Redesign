import { useState } from 'react';
import { Box, Card, Stack, Typography, Button, TextField, MenuItem, Drawer, IconButton, Divider, Chip } from '@mui/material';
import { PageHeader, DetailRow } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { auditEvents } from '../data/mock';
import { CloseRoundedIcon, FileDownloadOutlinedIcon } from '../components/icons';

const flagColor = { Override: 'warning', 'Recorded offline': 'info', 'Manual pending reconciliation': 'error' };
const modules = ['All', ...new Set(auditEvents.map((e) => e.module))];

export default function AuditLog() {
  const [module, setModule] = useState('All');
  const [flag, setFlag] = useState('');
  const [open, setOpen] = useState(null);
  const rows = auditEvents.filter((e) => (module === 'All' || e.module === module) && (!flag || e.flags.includes(flag)));

  return (
    <>
      <PageHeader
        title="Audit log"
        links={[{ name: 'Administration' }, { name: 'Audit log' }]}
        subtitle="Append-only record of writes, approvals, imports, confirmations and downloads."
        action={<Button variant="outlined" color="inherit" startIcon={<FileDownloadOutlinedIcon />}>Export</Button>}
      />
      <Card>
        <Stack direction="row" spacing={2} sx={{ px: 2.5, pt: 2.5 }} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField select size="small" label="Module" value={module} onChange={(e) => setModule(e.target.value)} sx={{ width: 180 }}>
            {modules.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>
          <TextField size="small" label="From" type="date" defaultValue="2026-10-26" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField size="small" label="To" type="date" defaultValue="2026-10-27" slotProps={{ inputLabel: { shrink: true } }} />
          {Object.keys(flagColor).map((f) => (
            <Chip key={f} label={f} variant={flag === f ? 'filled' : 'outlined'} color={flag === f ? 'primary' : 'default'} onClick={() => setFlag(flag === f ? '' : f)} />
          ))}
        </Stack>
        <DataTable
          card={false}
          rows={rows}
          searchKeys={['actor', 'text', 'role']}
          searchPlaceholder="Search user, role or event"
          onRowClick={setOpen}
          rowKey={(r) => r.id}
          columns={[
            { key: 'time', label: 'Time', render: (r) => <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>{r.time}</Typography> },
            { key: 'actor', label: 'Actor', render: (r) => <><Typography variant="subtitle2">{r.actor}</Typography><Typography variant="caption" color="text.secondary">{r.role}</Typography></> },
            { key: 'text', label: 'Event' },
            { key: 'flags', label: 'Flags', render: (r) => <Stack spacing={0.5} alignItems="flex-start">{r.flags.map((f) => <Label key={f} color={flagColor[f]}>{f}</Label>)}</Stack> },
          ]}
        />
      </Card>
      <Drawer anchor="right" open={Boolean(open)} onClose={() => setOpen(null)}>
        {open && (
          <Box sx={{ width: 480 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 3 }}>
              <Typography variant="h6">{open.id}</Typography>
              <IconButton onClick={() => setOpen(null)}><CloseRoundedIcon /></IconButton>
            </Stack>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Box sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>{open.text}</Typography>
              <DetailRow label="Time">{open.time}</DetailRow>
              <DetailRow label="Actor">{open.actor}</DetailRow>
              <DetailRow label="Role">{open.role}</DetailRow>
              <DetailRow label="Module">{open.module}</DetailRow>
              <DetailRow label="Device">BEN-GATE-WS-02</DetailRow>
              <DetailRow label="Origin">{open.flags.includes('Recorded offline') ? 'Offline contingency sheet, synced 07:40' : 'Online'}</DetailRow>
              <DetailRow label="Flags">{open.flags.length ? open.flags.join(', ') : 'None'}</DetailRow>
              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Before / after</Typography>
              <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.neutral', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }}>
                {'{\n  "status": "assigned" → "admitted",\n  "gate": null → "Border gate 1 / B2"\n}'}
              </Box>
            </Box>
          </Box>
        )}
      </Drawer>
    </>
  );
}
