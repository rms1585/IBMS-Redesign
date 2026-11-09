import { useState } from 'react';
import { Box, Card, Stack, Typography, Button, Divider, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { PageHeader, DetailRow, formatKg, EmptyState, AssumptionNote } from '../components/common';
import { Workbench, QueueCard } from '../components/Workbench';
import Label from '../components/Label';
import { CheckCircleRoundedIcon } from '../components/icons';

const approvers = [
  { key: 'shed', role: 'Shed in-charge', name: 'Mahmud Karim' },
  { key: 'customs', role: 'Customs ARO', name: 'Selina Parvin' },
  { key: 'cf', role: "C&F agent's authorised signer", name: 'Ayesha Siddiqua' },
];
const initialPasses = [
  { id: 'BEN-PASS-004418', plate: 'JESSORE-TA-11-2101', manifest: 'BEN-IGM-2026-08841', product: 'Rice (non-basmati)', kg: 16000, agency: 'Rupsha Clearing & Forwarding', signatures: { shed: '27 Oct, 11:05' } },
  { id: 'BEN-PASS-004419', plate: 'JESSORE-TA-11-1987', manifest: 'BEN-IGM-2026-08841', product: 'Rice (non-basmati)', kg: 8000, agency: 'Rupsha Clearing & Forwarding', signatures: {} },
  { id: 'BEN-PASS-004412', plate: 'JESSORE-TA-11-2034', manifest: 'BEN-IGM-2026-08841', product: 'Rice (non-basmati)', kg: 16000, agency: 'Rupsha Clearing & Forwarding', issued: true, signatures: { shed: '27 Oct, 08:10', customs: '27 Oct, 08:22', cf: '27 Oct, 08:31' } },
];

function SignDialog({ approver, pass, onClose, onSign }) {
  const [code, setCode] = useState('');
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Sign {pass.id}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {approver.name} approves this pass as {approver.role}. The signature is recorded with this name and time.
        </Typography>
        <TextField
          autoFocus fullWidth required label="One-time code" value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          helperText="Demo: enter any 6 digits"
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={code.length !== 6} onClick={onSign}>Sign electronically</Button>
      </DialogActions>
    </Dialog>
  );
}

function PassRecord({ pass, onSign, onIssue }) {
  const [signing, setSigning] = useState(null);
  const signedCount = approvers.filter((a) => pass.signatures[a.key]).length;
  const allSigned = signedCount === approvers.length;
  return (
    <Card>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ p: 3 }}>
        <Box>
          <Typography className="record-plate" variant="h5" sx={{ fontFamily: 'monospace' }}>{pass.plate}</Typography>
          <Typography variant="body2" color="text.secondary">{pass.id}</Typography>
        </Box>
        {pass.issued ? <Label color="success">Issued</Label> : <Label color="warning">{signedCount} of {approvers.length} signed</Label>}
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 3 }}>
        <DetailRow label="Manifest">{pass.manifest}</DetailRow>
        <DetailRow label="Agency">{pass.agency}</DetailRow>
        <DetailRow label="Goods">{pass.product} · {formatKg(pass.kg)}</DetailRow>
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Approvals</Typography>
        <Stack spacing={1.5} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
          {approvers.map((a) => (
            <Stack key={a.key} direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Box>
                <Typography variant="subtitle2">{a.role}</Typography>
                <Typography variant="body2" color="text.secondary">{a.name}</Typography>
              </Box>
              {pass.signatures[a.key] ? (
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <CheckCircleRoundedIcon color="success" fontSize="small" />
                  <Typography variant="body2">Signed {pass.signatures[a.key]}</Typography>
                </Stack>
              ) : (
                <Button size="small" variant="outlined" onClick={() => setSigning(a)}>Sign</Button>
              )}
            </Stack>
          ))}
        </Stack>
        <AssumptionNote code="F45" sx={{ mt: 2.5 }}>Whether Customs officers sign in IBMS is still to be confirmed with NBR.</AssumptionNote>
      </Box>
      {!pass.issued && (
        <Stack className="record-actions" direction="row" justifyContent="flex-end" sx={{ p: 3, pt: 0 }}>
          <Button variant="contained" size="large" disabled={!allSigned} onClick={() => onIssue(pass)}>Issue exit pass</Button>
        </Stack>
      )}
      {signing && (
        <SignDialog
          approver={signing}
          pass={pass}
          onClose={() => setSigning(null)}
          onSign={() => { onSign(pass, signing); setSigning(null); }}
        />
      )}
    </Card>
  );
}

export default function ExitPass() {
  const [passes, setPasses] = useState(initialPasses);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(initialPasses[0].id);
  const [toast, setToast] = useState('');
  const filtered = passes.filter((p) => `${p.id} ${p.plate} ${p.manifest}`.toLowerCase().includes(search.toLowerCase()));
  const current = passes.find((p) => p.id === selected);
  const update = (id, change) => setPasses((ps) => ps.map((p) => (p.id === id ? change(p) : p)));

  return (
    <>
      <PageHeader title="Exit pass" links={[{ name: 'Operations' }, { name: 'Exit pass' }]} subtitle="A pass is issued only after the shed in-charge, the Customs ARO and the C&F agent's authorised signer have each signed it." />
      <Workbench
        queue={
          <QueueCard
            title="Exit passes"
            count={filtered.length}
            search={search}
            onSearch={setSearch}
            placeholder="Search pass, plate or manifest"
            items={filtered}
            getKey={(p) => p.id}
            selectedKey={selected}
            onSelect={setSelected}
            emptyText="No exit passes"
            renderItem={(p) => (
              <>
                <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{p.plate}</Typography>
                <Typography variant="caption" color="text.secondary" component="div" noWrap>{p.id}</Typography>
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.75} sx={{ mt: 0.75 }}>
                  {p.issued ? <Label color="success">Issued</Label> : <Label color="warning">{Object.keys(p.signatures).length} of 3 signed</Label>}
                </Stack>
              </>
            )}
          />
        }
        center={
          current ? (
            <PassRecord
              key={current.id}
              pass={current}
              onSign={(p, a) => {
                update(p.id, (x) => ({ ...x, signatures: { ...x.signatures, [a.key]: 'just now' } }));
                setToast(`${a.name} signed ${p.id}.`);
              }}
              onIssue={(p) => {
                update(p.id, (x) => ({ ...x, issued: true }));
                setToast(`${p.id} issued. It expires at the end of the operating day.`);
              }}
            />
          ) : (
            <Card><EmptyState title="Select an exit pass" sx={{ py: 12 }} /></Card>
          )
        }
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
