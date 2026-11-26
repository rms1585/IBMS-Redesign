import { useState } from 'react';
import { Alert, Box, Button, Card, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import Label from '../components/Label';
import { useRole } from '../RoleContext';
import { usePort, useStoredState } from '../demo/PortStore';
import { formatDateTime, formatKg, searchKey } from '../demo/format';
import { initialReceipts } from './Passenger';
import { ApprovalRow, Confirmation, HoldRow, Plate, ReasonField, ResponsiveTable, SectionTitle, StatusPill } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-20: Customs acts under the officer's own name. BGB and Immigration read, and may place and lift their own holds.
const BODY_OF_ROLE = { customs: 'Customs', bgb: 'BGB', immigration: 'Immigration' };

function PlaceHold({ body, onDone }) {
  const p = usePort();
  const targets = [
    ...p.state.manifests.map((m) => ({ key: `manifest:${m.id}`, target: { kind: 'manifest', id: m.id, label: `manifest ${m.id}`, manifest: m.id }, label: `Manifest ${m.id}` })),
    ...p.state.manifests.flatMap((m) => m.lines.map((l) => ({ key: `line:${l.id}`, target: { kind: 'line', id: l.id, label: `line ${l.no} of ${m.id}`, manifest: m.id }, label: `Line ${l.no} of ${m.id}: ${l.goods}` }))),
    ...p.state.visits.filter((v) => v.stage !== 'Exited').map((v) => ({ key: `truck:${v.plate}`, target: { kind: 'truck', id: v.plate, label: `truck ${v.plate}`, manifest: v.manifests[0] }, label: `Truck ${v.plate}` })),
    ...p.state.deliveryRequests.flatMap((d) => d.slots.filter((s) => s.plate && !p.pass(s.pass)?.used).map((s) => ({ key: `truck:${s.plate}`, target: { kind: 'truck', id: s.plate, label: `truck ${s.plate}`, manifest: p.boe(d.boe)?.manifest }, label: `Local truck ${s.plate}` }))),
  ];
  const [key, setKey] = useState('');
  const [reason, setReason] = useState('');
  const [ref, setRef] = useState('');
  const chosen = targets.find((x) => x.key === key);
  const allowed = body === 'Customs' ? targets : targets.filter((x) => x.target.kind === 'truck' || x.target.kind === 'line');
  return (
    <Card variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="subtitle1" gutterBottom>Place a {body === 'BGB' ? 'BGB stop' : `${body} hold`}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>It applies at once at every exit gate and invalidates any Exit Pass it touches. Only {body} can lift it.</Typography>
      <Stack spacing={2}>
        <TextField select label="On" value={key} onChange={(e) => setKey(e.target.value)} required>
          {allowed.map((x) => <MenuItem key={x.key} value={x.key}>{x.label}</MenuItem>)}
        </TextField>
        <ReasonField value={reason} onChange={setReason} />
        <TextField label={`${body} reference (optional)`} value={ref} onChange={(e) => setRef(e.target.value)} />
        <Box>
          <Button variant="contained" color="error" disabled={!chosen || !reason.trim()} onClick={() => { p.placeHold({ target: chosen.target, body, reason: reason.trim(), ref: ref.trim() || undefined }); onDone(`${body === 'BGB' ? 'BGB stop' : `${body} hold`} placed`); setKey(''); setReason(''); setRef(''); }}>
            Place {body === 'BGB' ? 'stop' : 'hold'}
          </Button>
        </Box>
      </Stack>
    </Card>
  );
}

function Holds({ body, onDone }) {
  const p = usePort();
  const [lifting, setLifting] = useState(null);
  const [ref, setRef] = useState('');
  return (
    <Stack spacing={2}>
      <PlaceHold body={body} onDone={onDone} />
      <SectionTitle>Open holds</SectionTitle>
      {p.activeHolds.length === 0 && <Typography variant="body2" color="text.secondary">No hold is open at Benapole.</Typography>}
      {p.activeHolds.map((h) => (
        <Box key={h.id}>
          <HoldRow hold={h} onLift={h.body === body ? () => setLifting(h.id) : undefined} liftLabel={h.body === 'BGB' ? 'Lift stop' : 'Lift hold'} />
          {h.body !== body && <Typography variant="caption" color="text.secondary">Only {h.body} can lift this hold.</Typography>}
          {lifting === h.id && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
              <TextField size="small" label="Reference for the lift" value={ref} onChange={(e) => setRef(e.target.value)} />
              <Button variant="contained" onClick={() => { p.liftHold(h.id, ref.trim() || undefined); setLifting(null); setRef(''); onDone('Hold lifted. Passes it invalidated stay invalid'); }}>Lift hold</Button>
              <Button variant="outlined" color="inherit" onClick={() => setLifting(null)}>Cancel</Button>
            </Stack>
          )}
        </Box>
      ))}
    </Stack>
  );
}

function WeightFlags({ onDone }) {
  const p = usePort();
  const flagged = p.state.visits.filter((v) => v.weigh?.overTolerance);
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(null);
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">IBMS flags a weight over tolerance and places no hold of its own. You may place a hold, inspect while the truck waits in the holding area, and record the outcome.</Typography>
      {flagged.length === 0 && <Typography variant="body2" color="text.secondary">No weight over tolerance is open.</Typography>}
      {flagged.map((v) => (
        <Card key={v.id} variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Plate size="large">{v.plate}</Plate>
            <StatusPill word="Weight over tolerance" />
            <Typography variant="body2" color="text.secondary">{formatKg(v.weigh.kg)} against {formatKg(v.weigh.declaredKg)} declared ({(((v.weigh.kg - v.weigh.declaredKg) / v.weigh.declaredKg) * 100).toFixed(1)}%)</Typography>
          </Stack>
          {v.weigh.inspection ? (
            <Typography variant="body2" sx={{ mt: 1 }}>Inspection: {v.weigh.inspection.outcome} · {v.weigh.inspection.by}, {formatDateTime(v.weigh.inspection.at)}</Typography>
          ) : open === v.id ? (
            <Stack spacing={1.5} sx={{ mt: 1.5 }}>
              <ReasonField label="Outcome of the inspection" value={reason} onChange={setReason} />
              <Stack direction="row" spacing={1}><Button variant="contained" disabled={!reason.trim()} onClick={() => { p.recordInspection(v.id, reason.trim()); setOpen(null); setReason(''); onDone('Inspection outcome recorded'); }}>Record outcome</Button><Button variant="outlined" color="inherit" onClick={() => setOpen(null)}>Cancel</Button></Stack>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              <Button size="small" color="error" variant="outlined" onClick={() => { p.placeHold({ target: { kind: 'truck', id: v.plate, label: `truck ${v.plate}`, manifest: v.manifests[0] }, body: 'Customs', reason: 'Weight over tolerance: goods to be inspected' }); onDone('Customs hold placed on the truck'); }}>Place a hold on the truck</Button>
              <Button size="small" variant="outlined" color="inherit" onClick={() => setOpen(v.id)}>Record the inspection outcome</Button>
            </Stack>
          )}
        </Card>
      ))}
    </Stack>
  );
}

function CoApprovals({ onDone }) {
  const p = usePort();
  const loads = p.state.deliveryRequests.flatMap((d) => d.slots.map((s, i) => ({ d, s, i }))).filter((x) => x.s.load && !x.s.load.aro && !p.pass(x.s.pass)?.invalidatedBy);
  const changes = p.state.truckChanges.filter((t) => !t.done && !t.aro);
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">Your co-approval of a locked load is Customs' allocation of the goods to that truck and signs its Exit Pass. Each approval needs your second sign-in factor.</Typography>
      {loads.length === 0 && changes.length === 0 && <Typography variant="body2" color="text.secondary">Nothing waits for your co-approval.</Typography>}
      {loads.map(({ d, s, i }) => (
        <Card key={`${d.id}-${i}`} variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
            <Plate size="large">{s.plate}</Plate>
            <Typography variant="body2" color="text.secondary">{formatKg(s.load.kg)} locked by {s.load.lockedBy} · {d.id}</Typography>
          </Stack>
          <ApprovalRow title="Customs Assistant Revenue Officer" approval={null} action={<Button size="small" variant="contained" onClick={() => { p.aroCoApprove(d.id, i); onDone('Load co-approved and Exit Pass signed'); }}>Co-approve load</Button>} />
        </Card>
      ))}
      {changes.map((tc) => (
        <Card key={tc.id} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2">Truck change on {tc.pass}: {tc.from} to {tc.to}</Typography>
          <Typography variant="body2" color="text.secondary">Proposed by {tc.proposedBy}: {tc.reason}</Typography>
          <ApprovalRow title="Customs Assistant Revenue Officer" approval={tc.aro} action={<Button size="small" variant="contained" onClick={() => { p.approveTruckChange(tc.id, 'aro'); onDone('Truck change approved'); }}>Approve truck change</Button>} />
        </Card>
      ))}
    </Stack>
  );
}

function Reweigh({ onDone }) {
  const p = usePort();
  const trucks = p.state.visits.filter((v) => v.weigh && v.stage !== 'Exited');
  const [sel, setSel] = useState('');
  const [reason, setReason] = useState('');
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">A re-weigh flag from the Customs in-charge makes the empty weighing mandatory with no further approval.</Typography>
      <TextField select label="Truck" value={sel} onChange={(e) => setSel(e.target.value)} sx={{ maxWidth: 360 }}>
        {trucks.map((v) => <MenuItem key={v.id} value={v.id}>{v.plate}{v.reweigh ? ' (flagged)' : ''}</MenuItem>)}
      </TextField>
      <ReasonField value={reason} onChange={setReason} />
      <Box><Button variant="contained" disabled={!sel || !reason.trim()} onClick={() => { p.flagReweigh(sel, reason.trim()); setSel(''); setReason(''); onDone('Re-weigh flagged'); }}>Flag re-weigh</Button></Box>
    </Stack>
  );
}

function ReadOnlyTrucks() {
  const p = usePort();
  const rows = p.state.visits.filter((v) => v.gateIn && v.stage !== 'Exited');
  return (
    <ResponsiveTable
      rowKey={(v) => v.id}
      rows={rows}
      columns={[
        { label: 'Plate', render: (v) => <Plate>{v.plate}</Plate> },
        { label: 'Manifests', render: (v) => v.manifests.join(', ') || v.carPassManifest },
        { label: 'Status', render: (v) => <StatusPill word={v.stage} /> },
        { label: 'Holds', render: (v) => { const h = p.holdsOnVisit(v); return h.length ? <StatusPill word={h[0].body === 'BGB' ? 'BGB stop' : `${h[0].body} hold`} /> : '–'; } },
      ]}
    />
  );
}

const NONE_USED = [];

// BGB and Immigration see who paid the passenger fee and whether the ticket was used at the checkpoint before
// Immigration. Read-only; IBMS holds no immigration status (M-20).
function PassengerList() {
  const [receipts] = useStoredState('passengerReceipts', initialReceipts);
  const [used] = useStoredState('passengerTicketsUsed', NONE_USED);
  const [q, setQ] = useState('');
  const k = searchKey(q);
  const rows = receipts.filter((r) => !k || searchKey(`${r.name} ${r.passport} ${r.id}`).includes(k));
  return (
    <>
      <TextField size="small" label="Search name, passport or receipt" value={q} onChange={(e) => setQ(e.target.value)} sx={{ mb: 2, maxWidth: 360 }} fullWidth />
      <ResponsiveTable rowKey={(r) => r.id} rows={rows} empty="No passenger matches." columns={[
        { label: 'Passenger', render: (r) => <><Typography variant="subtitle2">{r.name}</Typography><Typography variant="caption" color="text.secondary">Passport {r.passport} · {r.country.split('-')[1] ?? r.country}</Typography></> },
        { label: 'Fee receipt', render: (r) => r.id },
        { label: 'Paid', priority: 'low', render: (r) => `${r.at} · ${r.method}` },
        { label: 'Checkpoint', align: 'right', render: (r) => (used.includes(r.id) ? <Label color="success">Ticket used</Label> : <Label>Not yet at the checkpoint</Label>) },
      ]} />
    </>
  );
}

export default function CustomsWorkspace() {
  const t = useT();
  const { role } = useRole();
  const [pickedBody, setPickedBody] = useState('Customs');
  const body = BODY_OF_ROLE[role.id] ?? pickedBody;
  const [tab, setTab] = useState(0);
  const [msg, setMsg] = useState('');
  const customs = body === 'Customs';
  const tabs = customs ? ['Holds', 'Weight flags', 'Co-approvals', 'Re-weigh flags', 'Trucks'] : ['Trucks', 'Passengers', 'Holds'];
  const current = tabs[tab] ?? tabs[0];
  return (
    <>
      <PageHeader
        title={customs ? t('Customs workspace') : `${body} view`}
        subtitle={customs ? `${role.person}. Every hold and approval is recorded under your own name. Releases and exit notes come from ASYCUDA through BNSW; they are never made here.` : `${role.person}. Read-only, except placing a hold and lifting your own.`}
        action={!BODY_OF_ROLE[role.id] && (
          <TextField select size="small" label="Acting as (demo)" value={pickedBody} onChange={(e) => { setPickedBody(e.target.value); setTab(0); }} sx={{ minWidth: 200 }}>
            {['Customs', 'BGB', 'Immigration'].map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
          </TextField>
        )}
      />
      {!customs && <Alert severity="info" sx={{ mb: 2 }}>No immigration status is held in IBMS. Passenger records from the fee counter are on the Passengers tab.</Alert>}
      <Card sx={{ px: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          {tabs.map((x) => <Tab key={x} label={x} />)}
        </Tabs>
      </Card>
      <Card sx={{ p: 3, mt: 2 }}>
        {current === 'Holds' && <Holds body={body} onDone={setMsg} />}
        {current === 'Weight flags' && <WeightFlags onDone={setMsg} />}
        {current === 'Co-approvals' && <CoApprovals onDone={setMsg} />}
        {current === 'Re-weigh flags' && <Reweigh onDone={setMsg} />}
        {current === 'Trucks' && <ReadOnlyTrucks />}
        {current === 'Passengers' && <PassengerList />}
      </Card>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
