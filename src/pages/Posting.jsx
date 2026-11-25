import { useCallback, useState } from 'react';
import { Alert, Box, Button, Card, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import VehicleTerminal from './VehicleTerminal';
import { PageHeader } from '../components/common';
import { importerName, usePort } from '../demo/PortStore';
import { billableTonnes, formatDuration, formatKg } from '../demo/format';
import { ActionFoot, Bench, Checklist, Confirmation, Fact, Facts, HoldRow, Plate, QueueList, ResponsiveTable, SectionTitle, StatusPill, useKeyAction } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-05: route each line, check free space, propose a shed; the holding area is only for trucks with nowhere to go.

const ROUTE = { perishable: 'Transshipment', heavy: 'Open yard B', chemicals: 'Shed 31', general: 'Shed 12' };

function useFreeSpace() {
  const p = usePort();
  return p.port.sheds.map((s) => {
    const pending = p.state.visits.filter((v) => v.posting?.shed === s.id && v.posting.accepted !== false && !v.receipt?.locked).reduce((sum, v) => sum + billableTonnes(v.weigh?.kg ?? 0), 0);
    return { ...s, freeT: Math.max(0, s.capacityT - s.usedT - pending) };
  });
}

function PostingBench() {
  const p = usePort();
  const t = useT();
  const [msg, setMsg] = useState('');
  const space = useFreeSpace();
  const queue = p.state.visits.filter((v) => v.stage === 'Weighed' && !v.posting && !v.holding);
  const holding = p.state.visits.filter((v) => (v.holding || v.stage === 'Manifest not yet available') && v.stage !== 'Exited');
  const [sel, setSel] = useState(queue[0]?.id);
  const v = p.visit(sel) && queue.some((x) => x.id === sel) ? p.visit(sel) : queue[0];
  const lines = v ? p.linesOfVisit(v) : [];
  const category = lines[0]?.category ?? 'general';
  const suggested = ROUTE[category];
  const [shed, setShed] = useState('');
  const chosen = shed || suggested;
  const needT = v ? billableTonnes(v.weigh.kg) : 0;
  const target = space.find((s) => s.id === chosen);
  const checks = v ? [
    { label: 'Manifest matched to the visit', state: 'pass', text: v.manifests.join(', ') },
    { label: 'Route', state: 'info', text: `${lines.map((l) => `Line ${l.no}: ${l.goods}`).join('; ')} → ${suggested}` },
    category === 'perishable'
      ? { label: 'Transshipment', state: 'info', text: 'Perishables go truck to truck. The tagged agency raises a transfer request.' }
      : !p.port.modules.warehousing
        ? { label: 'Warehousing', state: 'fail', text: 'Warehousing is switched off at this port (Port setup, step 2), so non-perishable cargo has no shed to go to.' }
        : { label: `Free space in ${chosen}`, state: target && target.freeT >= needT ? 'pass' : 'fail', text: target ? `${target.freeT} t free, this truck needs ${needT} t.` : 'Choose a shed or yard.' },
    ...(p.holdsOnVisit(v).length ? [{ label: 'Holds', state: 'info', text: 'A hold travels with the lines; posting still goes ahead.' }] : []),
  ] : [];
  const propose = useCallback(() => {
    if (!v || checks.some((c) => c.state === 'fail')) return;
    p.proposePosting(v.id, chosen);
    setMsg(`Posting proposed: ${chosen}`);
    setShed('');
  }, [v, checks, chosen, p]);
  useKeyAction('p', propose, Boolean(v));
  const noSpace = target && target.freeT < needT;

  return (
    <>
      <Bench
        context={[
          { label: 'Port', value: 'Benapole' },
          { label: 'To post', value: queue.length },
          { label: 'In the holding area', value: holding.length },
          ...space.map((s) => ({ label: s.id, value: `${s.freeT} t free` })),
        ]}
        queue={
          <QueueList
            title="Weighed, to post"
            items={queue}
            selected={v?.id}
            onSelect={(id) => { setSel(id); setShed(''); }}
            empty="No weighed truck is waiting for a posting."
            render={(x) => <><Plate>{x.plate}</Plate><Typography variant="caption" color="text.secondary" component="div">Weighed {formatDuration(x.weigh.at)} ago</Typography></>}
          />
        }
        center={v ? (
          <Stack spacing={2.5}>
            <Plate size="hero">{v.plate}</Plate>
            <Facts cols={2}>
              <Fact label="Weight">{formatKg(v.weigh.kg)}</Fact>
              <Fact label="Billable">{needT} t</Fact>
              <Fact label="Category">{category}</Fact>
            </Facts>
            {v.weigh.overTolerance && <Alert severity="warning">Weight over tolerance is flagged to the officials. If one places a hold, the truck waits in the holding area while the goods are inspected.</Alert>}
            {p.holdsOnVisit(v).map((h) => <HoldRow key={h.id} hold={h} />)}
            <SectionTitle>Lines</SectionTitle>
            {lines.map((l) => (
              <Stack key={l.id} direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="body2">Line {l.no}: {l.goods} · {importerName(l.importer)}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{formatKg(l.declaredKg)}</Typography>
              </Stack>
            ))}
            {category !== 'perishable' && (
              <TextField select label="Propose a shed or zone" value={chosen} onChange={(e) => setShed(e.target.value)} helperText={chosen !== suggested ? 'Not the suggested place: the shed in-charge sees why when deciding.' : 'Suggested from the goods category and the product list.'} sx={{ maxWidth: 360 }}>
                {space.map((s) => <MenuItem key={s.id} value={s.id}>{s.id} · {s.freeT} t free · takes {s.takes}</MenuItem>)}
              </TextField>
            )}
            {noSpace && (
              <Box>
                <Button variant="outlined" onClick={() => { p.sendToHolding(v.id, `No free space in ${chosen}`); setMsg('Placed in the holding area'); }}>Place in the holding area</Button>
              </Box>
            )}
          </Stack>
        ) : <Typography variant="body2" color="text.secondary">Select a truck.</Typography>}
        right={v ? (<><Typography variant="subtitle2" sx={{ mb: 1 }}>Checks</Typography><Checklist checks={checks} /><ActionFoot checks={checks} label="Propose posting" keyHint="P" onClick={propose} /></>) : null}
      />
      <Card sx={{ p: 3, mt: 3 }}>
        <SectionTitle>Holding area</SectionTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Only for a truck with no free space, a manifest not yet available, a transshipment truck waiting for its receiving trucks, or goods being inspected.</Typography>
        <ResponsiveTable
          rowKey={(x) => x.id}
          rows={holding}
          empty="The holding area is empty."
          columns={[
            { label: 'Place', render: (x) => holding.indexOf(x) + 1 },
            { label: 'Plate', render: (x) => <Plate>{x.plate}</Plate> },
            { label: 'Why', render: (x) => (x.stage === 'Manifest not yet available' ? <StatusPill word="Manifest not yet available" /> : x.holding.reason) },
            { label: 'Waiting', priority: 'low', render: (x) => formatDuration(x.holding?.since ?? x.weigh?.at ?? x.gateIn?.at) },
            {
              label: 'Action',
              render: (x) => (x.stage === 'Manifest not yet available'
                ? <Typography variant="caption" color="text.secondary">Waits until the manifest is matched</Typography>
                : <Button size="small" variant="outlined" onClick={() => { p.callForward(x.id); setMsg(`${x.plate} called forward`); }}>Call forward</Button>),
            },
          ]}
        />
      </Card>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}

// Posting and its cargo vehicle terminal are one module (M2 Annex 24.12): the terminal is a view of Posting.
export default function Posting() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'terminal' ? 'terminal' : 'posting';
  return (
    <>
      <PageHeader
        title={t('Posting and holding area')}
        action={
          <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, v) => v && setParams(v === 'posting' ? {} : { view: v }, { replace: true })} aria-label="Posting view">
            <ToggleButton value="posting">{t('Posting')}</ToggleButton>
            <ToggleButton value="terminal">{t('Cargo vehicle terminal')}</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      {view === 'posting' ? <PostingBench /> : <VehicleTerminal />}
    </>
  );
}
