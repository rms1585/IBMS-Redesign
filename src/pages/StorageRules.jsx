import { useEffect, useState } from 'react';
import {
  Box, Card, Stack, Typography, Button, Tabs, Tab, TextField, MenuItem, Alert, Snackbar, Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '../demo/InPlace';
import { PageHeader } from '../components/common';
import FormDrawer from '../components/FormDrawer';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { storageRules } from '../data/mock';
import { AddRoundedIcon, UploadFileRoundedIcon } from '../components/icons';
import { useStoredState } from '../demo/PortStore';
import { tr } from '../i18n/LanguageContext';

const categories = ['Food', 'Chemical', 'Baby products', 'Textile', 'Rubber', 'Stone'];
const stateColor = { Active: 'success', 'Waiting for approval': 'warning', Draft: 'default' };

const EMPTY_RULE = { a: 'Food', b: 'Chemical', scope: 'adjacent', gap: 1, reason: '' };

// Stays mounted so the drawer slides in and out; the form empties itself each time it opens.
function RuleDrawer({ open, onClose, onSave }) {
  const [f, setF] = useState(EMPTY_RULE);
  useEffect(() => {
    if (open) setF(EMPTY_RULE);
  }, [open]);
  const same = f.a === f.b;
  const gapOk = f.scope !== 'adjacent' || (Number.isInteger(Number(f.gap)) && Number(f.gap) >= 1);
  const ready = !same && gapOk && f.reason.trim();
  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={tr("New local storage rule")}
      subtitle={tr("Saved as a draft. A port in-charge or head-office approver publishes it.")}
      actions={(
        <>
          <Button variant="outlined" color="inherit" onClick={onClose}>{tr("Cancel")}</Button>
          <Button variant="contained" disabled={!ready} onClick={() => onSave(f)}>{tr("Save draft")}</Button>
        </>
      )}
    >
      <Stack spacing={2.5}>
        <TextField select fullWidth label={tr("Category A")} value={f.a} onChange={(e) => setF({ ...f, a: e.target.value })}>{categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField>
        <TextField select fullWidth label={tr("Must not be with category B")} value={f.b} error={same} helperText={same ? 'Choose a different category' : ' '} onChange={(e) => setF({ ...f, b: e.target.value })}>{categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField>
        <TextField select fullWidth label={tr("Scope")} value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })}>
          {[['bay', 'Same bay'], ['adjacent', 'Adjacent bays'], ['zone', 'Same zone'], ['facility', 'Same facility']].map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </TextField>
        {f.scope === 'adjacent' && (
          <TextField fullWidth label={tr("Minimum gap (bays)")} value={f.gap} error={!gapOk} onChange={(e) => setF({ ...f, gap: e.target.value.replace(/\D/g, '') })} helperText={tr("1 forbids every touching bay, edge or corner")} />
        )}
        <TextField fullWidth required multiline minRows={3} label={tr("Evidence or reason")} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} helperText={tr("Read by the approver")} />
        <Alert severity="info">Rules work both ways: A not with B also means B not with A.</Alert>
      </Stack>
    </FormDrawer>
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
                <TableRow key={c}><TableCell sx={{ pl: 2, fontWeight: 700 }}>{c}</TableCell><TableCell sx={{ pr: 2 }}>{m}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: 'background.neutral', typography: 'caption', fontWeight: 700 }}>Food,Chemical,adjacent,1,Contamination risk</Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>{tr("Close")}</Button>
        <Button variant="contained" startIcon={<UploadFileRoundedIcon />}>{tr("Choose file")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function StorageRules() {
  const [rules, setRules] = useStoredState('storageRules', storageRules);
  const [tab, setTab] = useState('Active');
  const [open, setOpen] = useState(false);
  const [fmt, setFmt] = useState(false);
  const [toast, setToast] = useState('');
  const rows = rules.filter((r) => r.state === tab);
  const count = (s) => rules.filter((r) => r.state === s).length;

  return (
    <>
      <PageHeader
        title={tr("Storage rules")}
        links={[{ name: 'Administration' }, { name: 'Storage rules' }]}
        subtitle={tr("Active rules combine national rules with approved local rules. They are checked at bay allocation, at receipt and when custody moves.")}
        action={
          <>
            <Button variant="outlined" color="inherit" startIcon={<UploadFileRoundedIcon />} onClick={() => setFmt(true)}>{tr("Import rules")}</Button>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>{tr("New rule")}</Button>
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
        searchPlaceholder={tr("Search category or reason")}
        columns={[
          { key: 'pair', label: 'Categories', render: (r) => <Stack direction="row" spacing={1} alignItems="center"><Label color="info">{r.a}</Label><Typography variant="caption" color="text.secondary">not with</Typography><Label color="info">{r.b}</Label></Stack> },
          { key: 'scope', label: 'Scope', render: (r) => <span style={{ textTransform: 'capitalize' }}>{r.scope}{r.scope === 'adjacent' ? ` · gap ${r.gap}` : ''}</span> },
          { key: 'source', label: 'Source', render: (r) => <Label color={r.source === 'National' ? 'default' : 'primary'}>{r.source}</Label> },
          { key: 'reason', label: 'Reason' },
          { key: 'act', label: '', render: (r) => (r.source === 'National' ? <Typography variant="caption" color="text.secondary">Set by head office</Typography> : r.state === 'Active' ? <Button size="small" color="error">{tr("Retire")}</Button> : r.state === 'Draft' ? <Button size="small" onClick={() => { setRules((rs) => rs.map((x) => (x === r ? { ...x, state: 'Waiting for approval' } : x))); setToast('Sent for approval.'); }}>{tr("Send for approval")}</Button> : <Label color="warning">With approver</Label>) },
        ]}
      />
      <RuleDrawer open={open} onClose={() => setOpen(false)} onSave={(f) => { setRules((rs) => [...rs, { ...f, gap: f.scope === 'adjacent' ? Number(f.gap) : null, source: 'Local · BEN', state: 'Draft' }]); setOpen(false); setTab('Draft'); setToast('Draft saved.'); }} />
      <FormatDialog open={fmt} onClose={() => setFmt(false)} />
      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
