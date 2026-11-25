import { useState } from 'react';
import { Alert, Box, Button, Card, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { usePort } from '../demo/PortStore';
import { formatBoe, formatDateTime } from '../demo/format';
import { Confirmation, Id, Plate, ResponsiveTable, SectionTitle, SourceMarker, StatusPill } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-14: how BNSW, payment providers and links are doing, plus the BNSW simulator (a demo tool, never production).

// A titled block of the simulator; every block has the same spacing under its title.
function SimSection({ title, empty, children }) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">{title}</Typography>
      {empty ? <Typography variant="body2" color="text.secondary">{empty}</Typography> : children}
    </Stack>
  );
}

// One item to send: what it is on the left (wrapping if needed), its button on the right, never under it.
function SimRow({ action, children }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
      <Stack direction="row" columnGap={1.5} rowGap={0.25} alignItems="baseline" flexWrap="wrap" sx={{ minWidth: 0 }}>{children}</Stack>
      <Box sx={{ flexShrink: 0 }}>{action}</Box>
    </Stack>
  );
}

function Simulator({ onDone }) {
  const p = usePort();
  const { state } = p;
  const [holdTarget, setHoldTarget] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const awaitingRelease = state.boes.filter((b) => !b.release);
  const notesDue = state.deliveryRequests.flatMap((d) => {
    const b = p.boe(d.boe);
    return d.slots.filter((s) => s.load && b.release && !b.release.exitNotes[s.plate]).map((s) => ({ b, plate: s.plate }));
  });
  const holdTargets = [
    ...state.manifests.map((m) => ({ key: m.id, target: { kind: 'manifest', id: m.id, label: `manifest ${m.id}`, manifest: m.id }, label: `Manifest ${m.id}` })),
    ...state.boes.map((b) => ({ key: b.id, target: { kind: 'boe', id: b.id, label: formatBoe(b), manifest: b.manifest }, label: `Bill of Entry ${formatBoe(b)}` })),
  ];
  return (
    <Card sx={{ p: 3, border: 2, borderColor: 'warning.main', borderStyle: 'dashed' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h6">BNSW simulator</Typography>
        <StatusPill word="For information" />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Simulated. This demo tool stands in for Customs' system and BNSW so the prototype can be shown end to end. It is not part of the production system.</Typography>
      <Box sx={{ display: 'grid', columnGap: 4, rowGap: 3, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
        <Stack spacing={3}>
          <SimSection title="Connections">
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="outlined" onClick={() => { p.bnsw.setDown(!state.bnswDown); onDone(state.bnswDown ? 'BNSW back' : 'BNSW down'); }}>{state.bnswDown ? 'Bring BNSW back' : 'Take BNSW down'}</Button>
              <Button variant="outlined" onClick={() => { p.bnsw.setExitCheckDown(!state.exitCheckDown); onDone(state.exitCheckDown ? 'Exit check running' : 'Exit check down'); }}>{state.exitCheckDown ? 'Restore the exit check' : 'Take the exit check down'}</Button>
            </Stack>
          </SimSection>
          <SimSection title="Send a manifest" empty={state.pendingManifests.length === 0 && 'Every sample manifest has been sent.'}>
            {state.pendingManifests.map((m) => (
              <SimRow key={m.id} action={<Button size="small" variant="contained" disabled={state.bnswDown} onClick={() => { p.bnsw.sendManifest(m.id); onDone(`Manifest ${m.id} sent`); }}>Send manifest</Button>}>
                <Id>{m.id}</Id>
                <Typography variant="body2" color="text.secondary">{m.lines[0].goods}</Typography>
              </SimRow>
            ))}
          </SimSection>
          <SimSection title="Send a release" empty={awaitingRelease.length === 0 && 'No Bill of Entry is waiting for release.'}>
            {awaitingRelease.map((b) => (
              <SimRow key={b.id} action={<Button size="small" variant="contained" disabled={state.bnswDown || p.holdsOnBoe(b).length > 0} onClick={() => { p.bnsw.sendRelease(b.id); onDone('Release sent'); }}>Send release</Button>}>
                <Id>{formatBoe(b)}</Id>
                {p.holdsOnBoe(b).length > 0 && <Typography variant="caption" color="text.secondary">Under a Customs hold</Typography>}
              </SimRow>
            ))}
          </SimSection>
        </Stack>
        <Stack spacing={3}>
          <SimSection title="Send an exit note" empty={notesDue.length === 0 && 'No locked load is waiting for its exit note.'}>
            {notesDue.map(({ b, plate }) => (
              <SimRow key={plate} action={<Button size="small" variant="contained" disabled={state.bnswDown} onClick={() => { p.bnsw.sendExitNote(b.id, plate); onDone(`Exit note sent for ${plate}`); }}>Send exit note</Button>}>
                <Plate>{plate}</Plate>
                <Typography variant="body2" color="text.secondary">{formatBoe(b)}</Typography>
              </SimRow>
            ))}
          </SimSection>
          <SimSection title="Send a Customs hold">
            <TextField select size="small" label="On" value={holdTarget} onChange={(e) => setHoldTarget(e.target.value)}>
              {holdTargets.map((x) => <MenuItem key={x.key} value={x.key}>{x.label}</MenuItem>)}
            </TextField>
            <TextField size="small" label="Reason from Customs" value={holdReason} onChange={(e) => setHoldReason(e.target.value)} />
            <Box><Button variant="contained" color="error" disabled={!holdTarget || !holdReason.trim() || state.bnswDown} onClick={() => { p.bnsw.sendHold(holdTargets.find((x) => x.key === holdTarget).target, holdReason.trim()); setHoldTarget(''); setHoldReason(''); onDone('Customs hold sent'); }}>Send hold</Button></Box>
          </SimSection>
        </Stack>
      </Box>
    </Card>
  );
}

export default function ExternalStatus() {
  const p = usePort();
  const t = useT();
  const [msg, setMsg] = useState('');
  const keyed = [
    ...p.state.boes.filter((b) => b.source === 'Keyed by the agency').map((b) => ({ id: b.id, what: `Bill of Entry ${formatBoe(b)}`, source: b.source, at: b.recordedAt })),
    ...p.state.boes.filter((b) => b.release?.source === "Keyed from Customs' reference").map((b) => ({ id: `${b.id}-r`, what: `Release ${b.release.ref} on ${formatBoe(b)}`, source: b.release.source, at: b.release.at })),
  ];
  return (
    <>
      <PageHeader title={t('External status')} subtitle="Customs, CBRA and laboratory data reach IBMS only through BNSW. Ports never call an outside system." />
      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <SectionTitle>Connections</SectionTitle>
          <ResponsiveTable
            rowKey={(r) => r.name}
            rows={[
              { name: 'BNSW', state: p.state.bnswDown ? 'Down' : 'Live', note: p.state.bnswDown ? 'Ports work in BNSW-down mode' : 'Messages apply as they arrive' },
              { name: 'Sonali Bank e-payment', state: 'Live', note: 'Confirmations arriving' },
              { name: 'Payment gateway (bKash, Nagad, cards)', state: 'Live', note: 'Confirmations arriving' },
              { name: 'Benapole primary link', state: 'Live', note: 'In use' },
              { name: 'Benapole Starlink', state: 'Live', note: 'Standby' },
              { name: 'Benapole exit check', state: p.state.exitCheckDown ? 'Down' : 'Live', note: p.state.exitCheckDown ? 'Every truck held at the exit lanes' : 'Running' },
            ]}
            columns={[
              { label: 'Connection', render: (r) => r.name },
              { label: 'Status', render: (r) => <StatusPill word={r.state} /> },
              { label: 'Note', render: (r) => r.note },
            ]}
          />
        </Card>
        <Card sx={{ p: 3 }}>
          <SectionTitle>Keyed values waiting for BNSW</SectionTitle>
          {keyed.length ? (
            <ResponsiveTable rowKey={(r) => r.id} rows={keyed} columns={[{ label: 'Value', render: (r) => r.what }, { label: 'How recorded', render: (r) => <SourceMarker source={r.source} /> }, { label: 'Keyed', render: (r) => formatDateTime(r.at) }]} />
          ) : (
            <Typography variant="body2" color="text.secondary">Nothing keyed is waiting. When BNSW returns, keyed values are compared: where they agree they are confirmed; where they differ BNSW wins on Customs' fields and a case opens.</Typography>
          )}
        </Card>
        <Card sx={{ p: 3 }}>
          <SectionTitle>Messages not applied</SectionTitle>
          <Typography variant="body2" color="text.secondary">None. A message that cannot be applied shows here with the plain reason, and can be sent through again once the cause is fixed.</Typography>
        </Card>
        <Alert severity="info">The simulator below is a demonstration aid. In the live system this page shows connections and messages only.</Alert>
        <Simulator onDone={setMsg} />
      </Stack>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
