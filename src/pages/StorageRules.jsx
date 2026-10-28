import { useState } from 'react';
import {
  Box, Card, Stack, Typography, Button, Tabs, Tab, Grid2 as Grid, TextField, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Snackbar, Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import { PageHeader } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { storageRules } from '../data/mock';
import { AddRoundedIcon, UploadFileRoundedIcon } from '../components/icons';

const categories = ['Food', 'Chemical', 'Baby products', 'Textile', 'Rubber', 'Stone'];
const stateColor = { Active: 'success', 'Waiting for approval': 'warning', Draft: 'default' };

function RuleDialog({ open, onClose, onSave }) {
  const [f, setF] = useState({ a: 'Food', b: 'Chemical', scope: 'adjacent', gap: 1, reason: '' });
  const same = f.a === f.b;
  const gapOk = f.scope !== 'adjacent' || (Number.isInteger(Number(f.gap)) && Number(f.gap) >= 1);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New local storage rule</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={6}><TextField select fullWidth label="Category A" value={f.a} onChange={(e) => setF({ ...f, a: e.target.value })}>{categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Grid>
          <Grid size={6}><TextField select fullWidth label="Must not be with category B" value={f.b} error={same} helperText={same ? 'Choose a different category' : ' '} onChange={(e) => setF({ ...f, b: e.target.value })}>{categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Grid>
          <Grid size={6}>
            <TextField select fullWidth label="Scope" value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })}>
              {[['bay', 'Same bay'], ['adjacent', 'Adjacent bays'], ['zone', 'Same zone'], ['facility', 'Same facility']].map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={6}>
            <TextField fullWidth label="Minimum gap (bays)" disabled={f.scope !== 'adjacent'} value={f.scope === 'adjacent' ? f.gap : ''} error={!gapOk} onChange={(e) => setF({ ...f, gap: e.target.value.replace(/\D/g, '') })} helperText="1 forbids every touching bay, edge or corner" />
          </Grid>
          <Grid size={12}><TextField fullWidth required multiline minRows={2} label="Evidence / reason" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} helperText="Read by the approver" /></Grid>
        </Grid>
        <Alert severity="info" sx={{ mt: 1 }}>Rules work both ways: A not with B also means B not with A. A port in-charge or head-office approver publishes the draft.</Alert>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={same || !gapOk || !f.reason.trim()} onClick={() => onSave(f)}>Save draft</Button>
      </DialogActions>
    </Dialog>
  );
}

function FormatDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Import storage rules</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Upload a .csv or .txt file, or paste rows. Up to 500 rows. Imported rules are saved as drafts for approval.</Typography>
        <Card variant="outlined" sx={{ boxShadow: 'none' }}>
          <Table size="small">
            <TableHead><TableRow><TableCell sx={{ pl: 2 }}>Column</TableCell><TableCell sx={{ pr: 2 }}>Meaning / constraint</TableCell></TableRow></TableHead>
            <TableBody>
              {[['category_a', 'Active category name or ID'], ['category_b', 'Active category, different from A'], ['scope', 'bay, zone, adjacent or facility'], ['min_gap', 'Adjacent only; integer of at least 1'], ['reason', 'Evidence or business reason read by the approver']].map(([c, m]) => (
                <TableRow key={c}><TableCell sx={{ pl: 2, fontFamily: 'monospace' }}>{c}</TableCell><TableCell sx={{ pr: 2 }}>{m}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: 'background.neutral', fontFamily: 'monospace', fontSize: 13 }}>Food,Chemical,adjacent,1,Contamination risk</Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<UploadFileRoundedIcon />}>Choose file</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function StorageRules() {
  const [rules, setRules] = useState(storageRules);
  const [tab, setTab] = useState('Active');
  const [open, setOpen] = useState(false);
  const [fmt, setFmt] = useState(false);
  const [toast, setToast] = useState('');
  const rows = rules.filter((r) => r.state === tab);
  const count = (s) => rules.filter((r) => r.state === s).length;

  return (
    <>
      <PageHeader
        title="Storage rules"
        links={[{ name: 'Administration' }, { name: 'Storage rules' }]}
        subtitle="Active rules combine national rules with approved local rules. They are checked at bay allocation, at receipt and when custody moves."
        action={
          <>
            <Button variant="outlined" color="inherit" startIcon={<UploadFileRoundedIcon />} onClick={() => setFmt(true)}>Import rules</Button>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>New rule</Button>
          </>
        }
      />
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        {['Active', 'Waiting for approval', 'Draft'].map((s) => (
          <Tab key={s} value={s} label={<Stack direction="row" spacing={1} alignItems="center"><span>{s === 'Draft' ? 'Drafts' : s}</span><Label color={stateColor[s]}>{count(s)}</Label></Stack>} />
        ))}
      </Tabs>
      <DataTable
        rows={rows}
        searchKeys={['a', 'b', 'reason']}
        searchPlaceholder="Search category or reason"
        columns={[
          { key: 'pair', label: 'Categories', render: (r) => <Stack direction="row" spacing={1} alignItems="center"><Label color="info">{r.a}</Label><Typography variant="caption" color="text.secondary">not with</Typography><Label color="info">{r.b}</Label></Stack> },
          { key: 'scope', label: 'Scope', render: (r) => <span style={{ textTransform: 'capitalize' }}>{r.scope}{r.scope === 'adjacent' ? ` · gap ${r.gap}` : ''}</span> },
          { key: 'source', label: 'Source', render: (r) => <Label color={r.source === 'National' ? 'default' : 'primary'}>{r.source}</Label> },
          { key: 'reason', label: 'Reason' },
          { key: 'act', label: '', render: (r) => (r.source === 'National' ? <Typography variant="caption" color="text.disabled">Set by head office</Typography> : r.state === 'Active' ? <Button size="small" color="error">Retire</Button> : r.state === 'Draft' ? <Button size="small" onClick={() => { setRules((rs) => rs.map((x) => (x === r ? { ...x, state: 'Waiting for approval' } : x))); setToast('Sent for approval.'); }}>Submit</Button> : <Label color="warning">With approver</Label>) },
        ]}
      />
      <RuleDialog open={open} onClose={() => setOpen(false)} onSave={(f) => { setRules((rs) => [...rs, { ...f, gap: f.scope === 'adjacent' ? Number(f.gap) : null, source: 'Local · BEN', state: 'Draft' }]); setOpen(false); setTab('Draft'); setToast('Draft saved.'); }} />
      <FormatDialog open={fmt} onClose={() => setFmt(false)} />
      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
