import { useState } from 'react';
import { Alert, Box, Button, Card, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '../components/common';
import Label from '../components/Label';
import { usePort, useStoredState } from '../demo/PortStore';
import SignAndConfirm from '../demo/SignaturePad';
import { MISSING_PAYMENTS } from '../data/finance';
import { formatDateTime } from '../demo/format';
import { Confirmation, Plate, ReasonField, SectionTitle, SourceMarker, StatusPill } from '../demo/ui';
import { useT, tr } from '../i18n/LanguageContext';

// M-13: every approval and request in one inbox. The maker never sees Approve or Reject, the super admin included.

function CorrectionItem({ c, onDone }) {
  const p = usePort();
  const [remarks, setRemarks] = useState('');
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState(null);
  const [signatures, setSignatures] = useStoredState('approvalSignatures', NO_MAP);
  const signed = signatures[c.id];
  const mine = c.by === p.actor.name;
  return (
    <Card variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
        <Typography variant="subtitle1">Correction on {c.record}</Typography>
        <StatusPill word={c.decision ? (c.decision.approve ? 'Approved' : 'Rejected') : mine ? 'Sent for approval' : 'Waiting approval'} />
      </Stack>
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0,1fr))' }, mb: 1.5 }}>
        <Box><Typography variant="caption" color="text.secondary">{tr("Field")}</Typography><Typography variant="body2">{c.field}</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">{tr("Value now")}</Typography><Typography variant="body2">{c.from}</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">{tr("Value asked for")}</Typography><Typography variant="body2" fontWeight={600}>{c.to}</Typography></Box>
      </Box>
      <Typography variant="body2">Reason: {c.reason}</Typography>
      <Typography variant="caption" color="text.secondary">Asked by {c.by}, {c.role} · {formatDateTime(c.at)}</Typography>
      {c.decision && <Typography variant="body2" sx={{ mt: 1 }}>{c.decision.approve ? 'Approved' : 'Rejected'} by {c.decision.by}, {formatDateTime(c.decision.at)}{c.decision.remarks ? `: ${c.decision.remarks}` : ''}. Both values are kept on the record.</Typography>}
      {signed && (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
          <Box component="img" src={signed.image} alt={`Signature of ${c.decision?.by ?? 'the approver'}`} sx={{ height: 40, border: 1, borderColor: 'divider', borderRadius: 0.5, bgcolor: 'background.neutral' }} />
          <Typography variant="caption" color="text.secondary">Signed on the device · second sign-in factor confirmed · {formatDateTime(signed.at)}</Typography>
        </Stack>
      )}
      {!c.decision && mine && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{tr("You asked for this change, so someone else decides it. It does not apply until approved.")}</Typography>}
      {!c.decision && !mine && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1.5 }}>
          <TextField size="small" label={tr("Remarks (required to reject)")} value={remarks} onChange={(e) => setRemarks(e.target.value)} sx={{ flex: 1 }} />
          <Button variant="contained" onClick={() => setSigning(true)} disabled={signing}>{tr("Approve correction")}</Button>
          <Button color="error" variant="outlined" disabled={!remarks.trim()} onClick={() => { p.decideCorrection(c.id, false, remarks.trim()); onDone('Correction rejected'); }}>{tr("Reject correction")}</Button>
        </Stack>
      )}
      {!c.decision && !mine && signing && (
        <Stack spacing={1.5} sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle2">{tr("Sign to approve")}</Typography>
          <SignAndConfirm person={p.actor.name} onChange={setSignature} />
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center">
            {!signature && <Typography variant="caption" color="text.secondary" role="status" sx={{ flex: 1 }}>{tr("Sign and enter the six-digit code to approve.")}</Typography>}
            <Button variant="outlined" color="inherit" onClick={() => setSigning(false)}>{tr("Cancel")}</Button>
            <Button variant="contained" disabled={!signature} onClick={() => { setSignatures((all) => ({ ...all, [c.id]: { ...signature, at: new Date().toISOString() } })); p.decideCorrection(c.id, true, remarks.trim()); onDone('Correction approved and signed'); }}>{tr("Sign and approve")}</Button>
          </Stack>
        </Stack>
      )}
    </Card>
  );
}

const NO_MAP = {};
const NO_LIST = [];

// Rules that allow an override with a reason, and acts that never do (M-13, Table 59).
const OVERRIDABLE = ['Storage rule for a place', 'Holding-area call time', 'Aging limit for a lot', 'Weighbridge queue order'];
const NEVER = ["Customs' release or exit note", 'A paid status', 'A locked load', 'An Exit Pass', 'An active hold', 'An approved correction'];

function OverrideRequests({ onDone }) {
  const p = usePort();
  const requests = p.state.overrideRequests ?? NO_LIST;
  const [rule, setRule] = useState(OVERRIDABLE[0]);
  const [record, setRecord] = useState('');
  const [reason, setReason] = useState('');
  const save = (update) => p.setStored('overrideRequests', NO_LIST, update);
  const never = NEVER.includes(rule);
  const why = never ? `${rule} never allows an override. Ask the body that owns it instead.` : !record.trim() ? 'Name the record or place.' : !reason.trim() ? 'Give the reason.' : '';
  const raise = () => {
    save((l) => [{ id: `OVR-${l.length + 101}`, rule, record: record.trim(), reason: reason.trim(), by: p.actor.name, role: p.actor.role, at: new Date().toISOString(), decision: null }, ...l]);
    p.logEvent(`Override requested on ${record.trim()} (${rule}): ${reason.trim()}`, record.trim());
    setRecord(''); setReason('');
    onDone('Override requested; a second person decides it');
  };
  const decide = (o, approve) => {
    save((l) => l.map((x) => (x.id === o.id ? { ...x, decision: { approve, by: p.actor.name, at: new Date().toISOString() } } : x)));
    p.logEvent(`Override on ${o.record} (${o.rule}) ${approve ? 'approved' : 'rejected'}`, o.record);
    onDone(`Override ${approve ? 'approved' : 'rejected'}`);
  };
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle>{tr("Overrides")}</SectionTitle>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0,1fr))' } }}>
        <TextField select label={tr("Rule to override")} value={rule} onChange={(e) => setRule(e.target.value)}>
          {OVERRIDABLE.map((r) => <MenuItem key={r} value={r}>{tr(r)}</MenuItem>)}
          <MenuItem disabled divider sx={{ typography: 'caption' }}>{tr("Never overridable")}</MenuItem>
          {NEVER.map((r) => <MenuItem key={r} value={r}>{tr(r)}</MenuItem>)}
        </TextField>
        <TextField label={tr("Record or place")} placeholder="Shed 31 · Bay 2" value={record} onChange={(e) => setRecord(e.target.value)} disabled={never} />
      </Box>
      {never ? <Alert severity="error" variant="outlined" sx={{ mt: 2 }}>{rule} never allows an override in IBMS, for any role. Customs, the provider or the approver who owns it must act.</Alert> : <Box sx={{ mt: 2 }}><ReasonField value={reason} onChange={setReason} /></Box>}
      <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center" sx={{ mt: 2 }}>
        {why && !never && <Typography variant="caption" color="text.secondary" role="status" sx={{ flex: 1 }}>{tr(why)}</Typography>}
        <Button variant="contained" disabled={Boolean(why)} onClick={raise}>{tr("Request override")}</Button>
      </Stack>
      {requests.length > 0 && (
        <Stack spacing={1.5} sx={{ mt: 3 }}>
          {requests.map((o) => (
            <Stack key={o.id} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">{o.rule} on {o.record}: {o.reason}</Typography>
                <Typography variant="caption" color="text.secondary">Asked by {o.by}, {formatDateTime(o.at)}{o.decision ? ` · ${o.decision.approve ? 'approved' : 'rejected'} by ${o.decision.by}` : ''}</Typography>
              </Box>
              {o.decision ? <StatusPill word={o.decision.approve ? 'Approved' : 'Rejected'} />
                : o.by === p.actor.name ? <Typography variant="caption" color="text.secondary">{tr("You asked, so someone else decides")}</Typography>
                  : <Stack direction="row" spacing={1}><Button size="small" variant="contained" onClick={() => decide(o, true)}>{tr("Approve")}</Button><Button size="small" variant="outlined" color="error" onClick={() => decide(o, false)}>{tr("Reject")}</Button></Stack>}
            </Stack>
          ))}
        </Stack>
      )}
    </Card>
  );
}

// Reconciliation: outage exceptions, values keyed while BNSW was down, and payments that did not arrive.
function Reconciliation() {
  const p = usePort();
  const cases = (p.state.outageCases ?? NO_LIST).filter((c) => c.cls !== 'A');
  const keyed = p.state.boes.filter((b) => b.source === 'Keyed by the agency' || b.release?.source === "Keyed from Customs' reference");
  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <SectionTitle>{tr("After the manual procedure")}</SectionTitle>
        {cases.length === 0 ? <Typography variant="body2" color="text.secondary">{tr("No exception from back-entry. Cases appear here once paper forms are back-entered.")}</Typography> : (
          <Stack spacing={1.5}>{cases.map((c) => (
            <Stack key={c.id} direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
              <Label color={c.cls === 'E' || c.cls === 'D' ? 'error' : c.cls === 'C' ? 'warning' : 'info'}>Class {c.cls}</Label>
              <Typography variant="body2" sx={{ flex: 1 }}>{c.text} · {c.owner}, due {formatDateTime(c.deadline)}</Typography>
              {c.referred ? <Label color="success">{tr("With owner")}</Label> : <Button size="small" variant="outlined" color="inherit" component={RouterLink} to="/back-entry">{tr("Open")}</Button>}
            </Stack>
          ))}</Stack>
        )}
      </Card>
      <Card sx={{ p: 3 }}>
        <SectionTitle>{tr("Keyed while BNSW was down")}</SectionTitle>
        {keyed.length === 0 ? <Typography variant="body2" color="text.secondary">{tr("Nothing keyed is waiting for BNSW.")}</Typography> : (
          <Stack spacing={1.5}>{keyed.map((b) => (
            <Stack key={b.id} direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body2" sx={{ flex: 1 }}>Bill of Entry {b.reg} for {b.manifest}{b.release?.ref ? `, release ${b.release.ref}` : ''}: checked against BNSW when it returns</Typography>
              <SourceMarker source={b.release?.source === "Keyed from Customs' reference" ? b.release.source : b.source} />
            </Stack>
          ))}</Stack>
        )}
      </Card>
      <Card sx={{ p: 3 }}>
        <SectionTitle>{tr("Payments that did not arrive")}</SectionTitle>
        <Stack spacing={1.5}>{MISSING_PAYMENTS.map((m) => (
          <Stack key={m.id} direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" sx={{ flex: 1 }}>{m.id}: payment ID {m.paymentId}, {m.provider}, open since {m.since}. {m.status}.</Typography>
            <Button size="small" variant="outlined" color="inherit" component={RouterLink} to="/billing">{tr("Open")}</Button>
          </Stack>
        ))}</Stack>
      </Card>
    </Stack>
  );
}

// Alerts the person subscribed to, newest first; unread ones are marked (acceptance story: "newest first, marked unread").
const ALERT_TYPES = ['Weight over tolerance', 'Hold placed or lifted', 'Link to NDC down', 'Class E exception', 'Lot referred for aging'];
const SEED_ALERTS = [
  { id: 'AL-5', type: 'Hold placed or lifted', text: 'Customs hold placed on manifest 2026/601/08852: sample for lab test', at: new Date(Date.now() - 25 * 60000).toISOString(), read: false },
  { id: 'AL-4', type: 'Weight over tolerance', text: 'WB 11 C 4420 weighed 3.8% over its declared weight', at: new Date(Date.now() - 2.2 * 3600000).toISOString(), read: false },
  { id: 'AL-3', type: 'Lot referred for aging', text: 'LOT-3374 (truck tyres) passed 60 days and is referred to the port in-charge', at: new Date(Date.now() - 6 * 3600000).toISOString(), read: true },
  { id: 'AL-2', type: 'Link to NDC down', text: 'Link 2 to NDC Agargaon dropped for 4 minutes; link 1 carried the traffic', at: new Date(Date.now() - 26 * 3600000).toISOString(), read: true },
];

function Alerts() {
  const [alerts, setAlerts] = useStoredState('inboxAlerts', SEED_ALERTS);
  const [subs, setSubs] = useStoredState('alertSubscriptions', ALERT_TYPES);
  const shown = alerts.filter((a) => subs.includes(a.type)).sort((a, b) => (a.at < b.at ? 1 : -1));
  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <SectionTitle>{tr("Alerts")}</SectionTitle>
          <Button size="small" color="inherit" disabled={!shown.some((a) => !a.read)} onClick={() => setAlerts((l) => l.map((a) => ({ ...a, read: true })))}>{tr("Mark all as read")}</Button>
        </Stack>
        {shown.length === 0 && <Typography variant="body2" color="text.secondary">{tr("No alerts for the types you follow.")}</Typography>}
        <Stack spacing={1}>{shown.map((a) => (
          <Stack key={a.id} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.5, borderRadius: 1, bgcolor: a.read ? 'transparent' : 'background.neutral' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: a.read ? 'transparent' : 'primary.main' }} aria-hidden />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={a.read ? 400 : 600}>{a.text}</Typography>
              <Typography variant="caption" color="text.secondary">{a.type} · {formatDateTime(a.at)}{a.read ? '' : ' · unread'}</Typography>
            </Box>
            {!a.read && <Button size="small" color="inherit" onClick={() => setAlerts((l) => l.map((x) => (x.id === a.id ? { ...x, read: true } : x)))}>{tr("Mark read")}</Button>}
          </Stack>
        ))}</Stack>
      </Card>
      <Card sx={{ p: 3 }}>
        <SectionTitle>{tr("Alerts you follow")}</SectionTitle>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {ALERT_TYPES.map((tp) => {
            const on = subs.includes(tp);
            return <Button key={tp} size="small" variant={on ? 'contained' : 'outlined'} color={on ? 'primary' : 'inherit'} aria-pressed={on} onClick={() => setSubs((l) => (on ? l.filter((x) => x !== tp) : [...l, tp]))}>{tp}</Button>;
          })}
        </Stack>
      </Card>
    </Stack>
  );
}

export default function Inbox() {
  const p = usePort();
  const t = useT();
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState(0);
  const open = p.state.corrections.filter((c) => !c.decision);
  const decided = p.state.corrections.filter((c) => c.decision);
  const passes = p.state.passes.filter((x) => p.passStatus(x) === 'Waiting approval');
  const changes = p.state.truckChanges.filter((tc) => !tc.done);
  const flags = p.state.visits.filter((v) => v.weigh?.overTolerance && !v.weigh.inspection);
  const late = p.state.visits.filter((v) => v.late && v.gateIn);
  const [alerts] = useStoredState('inboxAlerts', SEED_ALERTS);
  const recCount = (p.state.outageCases ?? NO_LIST).filter((c) => !c.referred && c.cls !== 'A').length + MISSING_PAYMENTS.length;
  const tabs = [
    ['Approvals', open.filter((c) => c.by !== p.actor.name).length + (p.state.overrideRequests ?? NO_LIST).filter((o) => !o.decision && o.by !== p.actor.name).length],
    ['Needs attention', passes.length + changes.length + flags.length + late.length],
    ['Reconciliation', recCount],
    ['Alerts', alerts.filter((a) => !a.read).length],
  ];
  return (
    <>
      <PageHeader title={t('Inbox')} subtitle={`${p.actor.name} · ${p.actor.role}`} />
      <Card sx={{ px: 2, mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          {tabs.map(([label, n]) => <Tab key={label} label={<Stack direction="row" spacing={1} alignItems="center"><span>{t(label)}</span>{n > 0 && <Label color="primary">{n}</Label>}</Stack>} />)}
        </Tabs>
      </Card>
      {tab === 2 && <Reconciliation />}
      {tab === 3 && <Alerts />}
      <Stack spacing={3} sx={{ display: tab < 2 ? 'flex' : 'none' }}>
        <Card sx={{ p: 3, display: tab === 0 ? 'block' : 'none' }}>
          <SectionTitle>{tr("Approvals")}</SectionTitle>
          <Stack spacing={2}>
            {open.length === 0 && <Typography variant="body2" color="text.secondary">{tr("No correction is waiting. A request made from a locked value appears here for a second person.")}</Typography>}
            {open.map((c) => <CorrectionItem key={c.id} c={c} onDone={setMsg} />)}
          </Stack>
        </Card>
        {tab === 0 && <OverrideRequests onDone={setMsg} />}
        <Card sx={{ p: 3, display: tab === 1 ? 'block' : 'none' }}>
          <SectionTitle>{tr("Needs attention")}</SectionTitle>
          <Stack spacing={1.5}>
            {passes.map((x) => (
              <Stack key={x.id} direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <StatusPill word="Waiting approval" />
                <Typography variant="body2">Exit Pass {x.id} for <Plate>{x.plate}</Plate>: {3 - Object.values(x.approvals).filter(Boolean).length} of 3 approvals missing</Typography>
                <Button size="small" variant="outlined" component={RouterLink} to="/inland-gate">{tr("Open")}</Button>
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
                <Typography variant="body2"><Plate>{v.plate}</Plate>{tr(": flagged to BLPA and Customs officials, no inspection outcome yet")}</Typography>
              </Stack>
            ))}
            {late.map((v) => (
              <Stack key={v.id} direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <StatusPill word="Manifest not yet available" />
                <Typography variant="body2"><Plate>{v.plate}</Plate>: admitted {formatDateTime(v.gateIn.at)}, manifest {v.carPassManifest} not matched (EXC-04). Owner: posting officer.</Typography>
              </Stack>
            ))}
            {!passes.length && !changes.length && !flags.length && !late.length && <Typography variant="body2" color="text.secondary">{tr("Nothing needs attention.")}</Typography>}
          </Stack>
        </Card>
        {tab === 0 && decided.length > 0 && (
          <Card sx={{ p: 3 }}>
            <SectionTitle>{tr("Decided")}</SectionTitle>
            <Stack spacing={2}>{decided.map((c) => <CorrectionItem key={c.id} c={c} onDone={setMsg} />)}</Stack>
          </Card>
        )}
      </Stack>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
