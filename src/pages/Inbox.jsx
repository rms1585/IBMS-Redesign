import { useState } from 'react';
import { Box, Button, Card, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '../components/common';
import { usePort } from '../demo/PortStore';
import { formatDateTime } from '../demo/format';
import { Confirmation, Plate, SectionTitle, StatusPill } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-13: every approval and request in one inbox. The maker never sees Approve or Reject, the super admin included.

function CorrectionItem({ c, onDone }) {
  const p = usePort();
  const [remarks, setRemarks] = useState('');
  const mine = c.by === p.actor.name;
  return (
    <Card variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
        <Typography variant="subtitle1">Correction on {c.record}</Typography>
        <StatusPill word={c.decision ? (c.decision.approve ? 'Approved' : 'Rejected') : mine ? 'Sent for approval' : 'Waiting approval'} />
      </Stack>
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0,1fr))' }, mb: 1.5 }}>
        <Box><Typography variant="caption" color="text.secondary">Field</Typography><Typography variant="body2">{c.field}</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">Value now</Typography><Typography variant="body2">{c.from}</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">Value asked for</Typography><Typography variant="body2" fontWeight={600}>{c.to}</Typography></Box>
      </Box>
      <Typography variant="body2">Reason: {c.reason}</Typography>
      <Typography variant="caption" color="text.secondary">Asked by {c.by}, {c.role} · {formatDateTime(c.at)}</Typography>
      {c.decision && <Typography variant="body2" sx={{ mt: 1 }}>{c.decision.approve ? 'Approved' : 'Rejected'} by {c.decision.by}, {formatDateTime(c.decision.at)}{c.decision.remarks ? `: ${c.decision.remarks}` : ''}. Both values are kept on the record.</Typography>}
      {!c.decision && mine && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>You asked for this change, so someone else decides it. It does not apply until approved.</Typography>}
      {!c.decision && !mine && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1.5 }}>
          <TextField size="small" label="Remarks (required to reject)" value={remarks} onChange={(e) => setRemarks(e.target.value)} sx={{ flex: 1 }} />
          <Button variant="contained" onClick={() => { p.decideCorrection(c.id, true, remarks.trim()); onDone('Correction approved'); }}>Approve correction</Button>
          <Button color="error" variant="outlined" disabled={!remarks.trim()} onClick={() => { p.decideCorrection(c.id, false, remarks.trim()); onDone('Correction rejected'); }}>Reject correction</Button>
        </Stack>
      )}
    </Card>
  );
}

export default function Inbox() {
  const p = usePort();
  const t = useT();
  const [msg, setMsg] = useState('');
  const open = p.state.corrections.filter((c) => !c.decision);
  const decided = p.state.corrections.filter((c) => c.decision);
  const passes = p.state.passes.filter((x) => p.passStatus(x) === 'Waiting approval');
  const changes = p.state.truckChanges.filter((tc) => !tc.done);
  const flags = p.state.visits.filter((v) => v.weigh?.overTolerance && !v.weigh.inspection);
  const late = p.state.visits.filter((v) => v.late && v.gateIn);
  return (
    <>
      <PageHeader title={t('Inbox')} subtitle={`${p.actor.name} · ${p.actor.role}`} />
      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <SectionTitle>Approvals</SectionTitle>
          <Stack spacing={2}>
            {open.length === 0 && <Typography variant="body2" color="text.secondary">No correction is waiting. A request made from a locked value appears here for a second person.</Typography>}
            {open.map((c) => <CorrectionItem key={c.id} c={c} onDone={setMsg} />)}
          </Stack>
        </Card>
        <Card sx={{ p: 3 }}>
          <SectionTitle>Needs attention</SectionTitle>
          <Stack spacing={1.5}>
            {passes.map((x) => (
              <Stack key={x.id} direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <StatusPill word="Waiting approval" />
                <Typography variant="body2">Exit Pass {x.id} for <Plate>{x.plate}</Plate>: {3 - Object.values(x.approvals).filter(Boolean).length} of 3 approvals missing</Typography>
                <Button size="small" variant="outlined" component={RouterLink} to="/inland-gate">Open</Button>
              </Stack>
            ))}
            {changes.map((tc) => (
              <Stack key={tc.id} direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <StatusPill word="Waiting approval" />
                <Typography variant="body2">Truck change {tc.from} to {tc.to} on {tc.pass}: shed in-charge and Customs ARO approve</Typography>
              </Stack>
            ))}
            {flags.map((v) => (
              <Stack key={v.id} direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <StatusPill word="Weight over tolerance" />
                <Typography variant="body2"><Plate>{v.plate}</Plate>: flagged to BLPA and Customs officials, no inspection outcome yet</Typography>
              </Stack>
            ))}
            {late.map((v) => (
              <Stack key={v.id} direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <StatusPill word="Manifest not yet available" />
                <Typography variant="body2"><Plate>{v.plate}</Plate>: admitted {formatDateTime(v.gateIn.at)}, manifest {v.carPassManifest} not matched (EXC-04). Owner: posting officer.</Typography>
              </Stack>
            ))}
            {!passes.length && !changes.length && !flags.length && !late.length && <Typography variant="body2" color="text.secondary">Nothing needs attention.</Typography>}
          </Stack>
        </Card>
        {decided.length > 0 && (
          <Card sx={{ p: 3 }}>
            <SectionTitle>Decided</SectionTitle>
            <Stack spacing={2}>{decided.map((c) => <CorrectionItem key={c.id} c={c} onDone={setMsg} />)}</Stack>
          </Card>
        )}
      </Stack>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
