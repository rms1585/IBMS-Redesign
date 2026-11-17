import { useState } from 'react';
import {
  Box, Card, Stack, Typography, Button, Divider, Alert, Snackbar, LinearProgress, Link, Tabs, Tab, TextField, InputAdornment,
  MenuItem, RadioGroup, Radio, FormControl, FormLabel, FormControlLabel,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader, DetailRow, formatKg, formatBDT, EmptyState, ReasonDialog, AssumptionNote } from '../components/common';
import { Workbench, QueueCard } from '../components/Workbench';
import { BayGrid, BayLegend } from '../components/BayGrid';
import Label from '../components/Label';
import { facilities, bayState, storageRules, currentUser } from '../data/mock';
import { useCfAlerts } from '../CfAlertsContext';
import { useAudit } from '../AuditContext';

const cargoLines = [
  { key: 'L1', plate: 'WB-19-C-0803', manifest: 'BEN-IGM-2026-08841', product: 'Rice (non-basmati)', category: 'Food', packages: 640, declaredKg: 32000, grossKg: 32070, outstandingKg: 32000, volumeM3: 48, packing: 'Bags', wait: '18m', agency: 'Rupsha Clearing & Forwarding', stage: 'propose', parts: [] },
  { key: 'L2', plate: 'WB-41-B-1192', manifest: 'BEN-IGM-2026-08871', product: 'Detergent', category: 'Chemical', packages: 520, declaredKg: 13000, grossKg: 12960, outstandingKg: 13000, volumeM3: 26, packing: 'Cartons', wait: '6m', agency: 'Padma Border Agents', stage: 'propose', parts: [] },
  { key: 'L3', plate: 'WB-41-B-1207', manifest: 'BEN-IGM-2026-08871', product: 'Detergent', category: 'Chemical', packages: 520, declaredKg: 13000, grossKg: 13040, outstandingKg: 13000, volumeM3: 26, packing: 'Cartons', wait: '24m', agency: 'Padma Border Agents', stage: 'waiting', proposedBy: 'Rokeya Begum', parts: [{ bay: 'S5B-R1-C03', m3: 14 }, { bay: 'S9A-R2-C04', m3: 12 }] },
  // One Indian truck often carries several consignments for different sheds; each line is posted to its own zone (F21).
  { key: 'L4', plate: 'WB-19-C-0826', manifest: 'BEN-IGM-2026-08841', product: 'Lentils (masur)', category: 'Food', packages: 400, declaredKg: 10000, grossKg: 27130, outstandingKg: 10000, volumeM3: 16, packing: 'Bags', wait: '31m', agency: 'Rupsha Clearing & Forwarding', stage: 'propose', parts: [] },
  { key: 'L5', plate: 'WB-19-C-0826', manifest: 'BEN-IGM-2026-08841', product: 'Paint (water-based)', category: 'Chemical', packages: 300, declaredKg: 6000, grossKg: 27130, outstandingKg: 6000, volumeM3: 12, packing: 'Drums', wait: '31m', agency: 'Rupsha Clearing & Forwarding', stage: 'waiting', proposedBy: 'Rokeya Begum', parts: [{ bay: 'S5B-R2-C05', m3: 12 }] },
  { key: 'L6', plate: 'WB-58-D-2290', manifest: 'BEN-IGM-2026-08877', product: 'Stone boulders', category: 'Stone', packages: null, declaredKg: 24000, grossKg: 35210, outstandingKg: 24000, volumeM3: 15, packing: 'Loose bulk', wait: '9m', agency: 'Padma Border Agents', stage: 'propose', parts: [] },
];

// Stone and cotton cannot be unloaded in the port: they go to an outside yard instead of a bay (Item 7, Bhomra).
// Who approves that route is still open in the exception catalogue (F62, EX-01 and EX-02).
const OUTSIDE_YARD_CATEGORIES = ['Stone', 'Cotton'];
const isOutsideYard = (line) => OUTSIDE_YARD_CATEGORIES.includes(line.category);
const outsideYards = [
  { id: 'OYD-01', name: 'Shapla Stone Yard, Jessore Road' },
  { id: 'OYD-02', name: 'Benapole Cotton Depot, Putkhali' },
];
// Demonstration outing fee per truck trip: not a legal rate.
const OUTING_FEE = 250;
// Lines that left the posting queue; they still count when showing a truck's consignments.
const DONE_STAGES = ['posted', 'outside'];
const stageLabel = { propose: 'To propose', waiting: 'Waiting for in-charge', posted: 'Posted', outside: 'Outside yard' };
const facilityOf = (bay) => facilities.find((f) => f.zones.some((z) => bay.startsWith(`${z.code}-`)))?.name ?? 'Unknown facility';
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Volume and packing decide whether cargo fits a shed, so free space is shown in cubic metres (F21).
const freeSpace = [['Shed 5', 940, 4800], ['Shed 9', 1120, 2400], ['Open yard 1', 2560, 4800]];
const usedM3 = (line) => line.parts.reduce((sum, p) => sum + p.m3, 0);

// Applies active storage-separation rules (symmetric) for the cargo category being placed.
function makeDisallowed(category) {
  const active = storageRules.filter((r) => r.state === 'Active');
  const conflicts = active
    .filter((r) => r.a === category || r.b === category)
    .map((r) => ({ other: r.a === category ? r.b : r.a, scope: r.scope, gap: r.gap ?? 0 }));
  return (code, zone, r, c) => {
    if (!zone.categories.includes('Any') && !zone.categories.includes(category)) return true;
    return conflicts.some((cf) => {
      if (cf.scope === 'zone') {
        for (let rr = 0; rr < zone.rows; rr += 1) for (let cc = 0; cc < zone.cols; cc += 1) if (bayState(zone.code, rr, cc).category === cf.other) return true;
        return false;
      }
      if (cf.scope !== 'adjacent') return false;
      for (let dr = -cf.gap; dr <= cf.gap; dr += 1) {
        for (let dc = -cf.gap; dc <= cf.gap; dc += 1) {
          const rr = r + dr; const cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= zone.rows || cc >= zone.cols || (dr === 0 && dc === 0)) continue;
          if (bayState(zone.code, rr, cc).category === cf.other) return true;
        }
      }
      return false;
    });
  };
}

function CargoDetails({ line }) {
  return (
    <>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>BL / manifest</Typography>
      <DetailRow labelWidth={96} label="Manifest">{line.manifest}</DetailRow>
      <DetailRow labelWidth={96} label="Agency">{line.agency}</DetailRow>
      <DetailRow labelWidth={96} label="Packing">{line.packages ? `${line.packages} · ${line.packing}` : line.packing}</DetailRow>
      <DetailRow labelWidth={96} label="Volume">{line.volumeM3} m³</DetailRow>
      <DetailRow labelWidth={96} label="Declared">{formatKg(line.declaredKg)}</DetailRow>
      <DetailRow labelWidth={96} label="Truck gross">{formatKg(line.grossKg)}</DetailRow>
    </>
  );
}

function FreeSpaceCard() {
  return (
    <Card key="free" sx={{ p: 2.5 }}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>Free space</Typography>
      <Stack spacing={2}>
        {freeSpace.map(([name, free, capacity]) => (
          <Box key={name}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
              <Typography variant="body2">{name}</Typography>
              <Typography variant="body2" color="text.secondary">{free.toLocaleString('en-US')} m³ free</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={((capacity - free) / capacity) * 100} />
          </Box>
        ))}
      </Stack>
      <Link component={RouterLink} to="/warehouse-layout" variant="body2" sx={{ display: 'block', mt: 2 }}>Open free space view</Link>
    </Card>
  );
}

// The posting officer builds the proposal here; one truck can be split across several bays and sheds.
function ProposalCard({ line, bay, onClearBay, onChange, onSend }) {
  const remaining = line.volumeM3 - usedM3(line);
  const [m3, setM3] = useState('');
  const amount = Number(m3);
  const canAdd = bay && amount > 0 && amount <= remaining && !line.parts.some((p) => p.bay === bay);
  return (
    <Card key="ctx" sx={{ p: 2.5 }}>
      <CargoDetails line={line} />
      <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Selected bay</Typography>
      <Typography variant="h6" sx={{ fontFamily: 'monospace', mb: 2 }}>{bay ?? '—'}</Typography>
      <TextField
        fullWidth size="small" label="Volume" value={m3}
        onChange={(e) => setM3(e.target.value.replace(/\D/g, ''))}
        helperText={`${remaining} m³ still to place`}
        slotProps={{ input: { endAdornment: <InputAdornment position="end">m³</InputAdornment> } }}
      />
      <Button fullWidth variant="outlined" color="inherit" sx={{ mt: 1 }} disabled={!canAdd} onClick={() => { onChange([...line.parts, { bay, m3: amount }]); setM3(''); onClearBay(); }}>Add bay</Button>
      {line.parts.length > 0 && (
        <Stack spacing={0.5} sx={{ mt: 2 }}>
          {line.parts.map((p) => (
            <Stack key={p.bay} direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <Typography variant="caption" component="p" sx={{ fontFamily: 'monospace' }}>{p.bay} · {p.m3} m³</Typography>
              <Button size="small" color="error" sx={{ minWidth: 0, px: 1 }} onClick={() => onChange(line.parts.filter((x) => x.bay !== p.bay))}>Remove</Button>
            </Stack>
          ))}
        </Stack>
      )}
      <Typography id="send-proposal-note" variant="body2" color="text.secondary" sx={{ mt: 2 }}>Send proposal to warehouse in-charge for approval</Typography>
      <Button fullWidth variant="contained" size="large" sx={{ mt: 1 }} disabled={remaining !== 0} aria-describedby="send-proposal-note" onClick={onSend}>Send</Button>
    </Card>
  );
}

// Shows every consignment on the same truck, so the officer knows the truck is not done after one product.
function TruckConsignments({ line, lines }) {
  const onTruck = lines.filter((l) => l.plate === line.plate);
  if (onTruck.length < 2) return null;
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <b>{line.plate}</b> carries {onTruck.length} consignments. Each one is posted to its own zone.
      <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
        {onTruck.map((l) => (
          <li key={l.key}>{l.product} ({l.category}): {stageLabel[l.stage]}{l.key === line.key ? ', this one' : ''}</li>
        ))}
      </Box>
    </Alert>
  );
}

function OutsideYardRoute({ line, lines, onRoute }) {
  const [yard, setYard] = useState(outsideYards[0].id);
  const [carrier, setCarrier] = useState('foreign');
  const [count, setCount] = useState('');
  const trips = carrier === 'foreign' ? 1 : Number(count);
  const yardName = outsideYards.find((y) => y.id === yard).name;
  return (
    <Card>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Route {line.product} to an outside yard</Typography>
        <TruckConsignments line={line} lines={lines} />
        <Alert severity="warning" sx={{ mb: 2 }}>
          {line.category} cannot be unloaded in the port, so it goes to an outside yard instead of a bay.
        </Alert>
        <AssumptionNote code="F62" sx={{ mb: 3 }}>
          BLPA has not yet named who approves this route (Exception catalogue, EX-01 and EX-02). Until then the posting officer routes it directly. The outing fee is a demo rate.
        </AssumptionNote>
        <Stack spacing={2.5}>
          <TextField select fullWidth label="Outside yard" value={yard} onChange={(e) => setYard(e.target.value)}>
            {outsideYards.map((y) => <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>)}
          </TextField>
          <FormControl>
            <FormLabel id="carrier-label">Carried by</FormLabel>
            <RadioGroup aria-labelledby="carrier-label" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
              <FormControlLabel value="foreign" control={<Radio />} label={`This Indian truck, ${line.plate}, which returns empty`} />
              <FormControlLabel value="local" control={<Radio />} label="Bangladeshi trucks, counted, not recorded by plate" />
            </RadioGroup>
          </FormControl>
          {carrier === 'local' && (
            <TextField
              label="Number of truck trips" value={count} sx={{ maxWidth: 240 }}
              onChange={(e) => setCount(e.target.value.replace(/\D/g, ''))}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
          )}
          <Box>
            <DetailRow label="Outing fee">{trips > 0 ? `${plural(trips, 'trip')} × ${formatBDT(OUTING_FEE)} = ${formatBDT(trips * OUTING_FEE)}` : 'Enter the number of trips'}</DetailRow>
          </Box>
        </Stack>
      </Box>
      <Stack className="record-actions" direction="row" justifyContent="flex-end" sx={{ p: 3, pt: 0 }}>
        <Button variant="contained" size="large" disabled={!(trips > 0)} onClick={() => onRoute({ yardName, trips, carrier })}>Route to outside yard</Button>
      </Stack>
    </Card>
  );
}

function ProposalDecision({ line, lines, onAccept, onReject }) {
  const [rejecting, setRejecting] = useState(false);
  return (
    <Card>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Proposal for {line.product}</Typography>
        <Typography variant="body2" color="text.secondary">Proposed by {line.proposedBy}. You decide whether this cargo fits.</Typography>
      </Box>
      <Box sx={{ px: 3 }}><TruckConsignments line={line} lines={lines} /></Box>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Stack spacing={1} sx={{ p: 3 }}>
        {line.parts.map((p) => <DetailRow key={p.bay} label={p.bay}>{p.m3} m³ of {line.volumeM3} m³</DetailRow>)}
      </Stack>
      <Stack className="record-actions" direction="row" justifyContent="flex-end" flexWrap="wrap" gap={1.5} sx={{ p: 3, pt: 0 }}>
        <Button variant="outlined" color="error" size="large" onClick={() => setRejecting(true)}>Reject</Button>
        <Button variant="contained" size="large" onClick={onAccept}>Accept proposal</Button>
      </Stack>
      <ReasonDialog
        open={rejecting}
        title="Reject this proposal?"
        description="The cargo goes back to the posting officer with your reason."
        confirmLabel="Reject proposal"
        confirmColor="error"
        onClose={() => setRejecting(false)}
        onConfirm={(reason) => { setRejecting(false); onReject(reason); }}
      />
    </Card>
  );
}

export default function Posting() {
  const [lines, setLines] = useState(cargoLines);
  const [tab, setTab] = useState('propose');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('L1');
  const [bay, setBay] = useState(null);
  const [toast, setToast] = useState('');
  const { addAlert } = useCfAlerts();
  const { addEvent } = useAudit();
  const inTab = lines.filter((l) => l.stage === tab);
  const current = inTab.find((l) => l.key === selected);
  const filtered = inTab.filter((l) => `${l.plate} ${l.manifest} ${l.product}`.toLowerCase().includes(search.toLowerCase()));
  const storage = facilities.filter((f) => f.zones.length);
  const update = (key, change) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...change } : l)));
  const finish = (key, stage) => { update(key, { stage }); setSelected(null); };
  const stillToPost = (line) => lines.filter((l) => l.plate === line.plate && l.key !== line.key && !DONE_STAGES.includes(l.stage)).length;
  const truckNote = (line) => {
    const left = stillToPost(line);
    if (left) return ` ${plural(left, 'more consignment')} on ${line.plate} still to post.`;
    return lines.filter((l) => l.plate === line.plate).length > 1 ? ` ${line.plate} is fully posted.` : '';
  };

  // Accepting a proposal alerts the C&F agent with each drop point, so they can call the driver.
  const accept = (line) => {
    const dropPoints = line.parts.map((p) => ({ ...p, facility: facilityOf(p.bay) }));
    finish(line.key, 'posted');
    addAlert({ agency: line.agency, manifest: line.manifest, text: `${line.plate}: ${line.product} is posted. Send the driver to ${dropPoints.length === 1 ? 'this drop point' : 'these drop points'}:`, dropPoints });
    addEvent({ actor: currentUser.name, role: currentUser.role, module: 'Posting', type: 'Approval', text: `Accepted posting of ${line.product} on ${line.plate} to ${line.parts.map((p) => p.bay).join(', ')}; ${line.agency} alerted` });
    setToast(`Proposal accepted. ${line.agency} is alerted with ${plural(dropPoints.length, 'drop point')}.${truckNote(line)}`);
  };

  const routeOutside = (line, { yardName, trips, carrier }) => {
    const fee = formatBDT(trips * OUTING_FEE);
    const carried = carrier === 'foreign' ? `on ${line.plate}` : `on ${plural(trips, 'Bangladeshi truck trip')}`;
    finish(line.key, 'outside');
    addAlert({ agency: line.agency, manifest: line.manifest, text: `${line.plate}: ${line.product} goes to ${yardName} ${carried}. Outing fee ${fee}.` });
    addEvent({ actor: currentUser.name, role: currentUser.role, module: 'Posting', type: 'Record', text: `Routed ${line.product} on ${line.plate} to ${yardName} ${carried}; outing fee ${fee}`, flags: ['Exception'] });
    setToast(`${line.product} routed to ${yardName}. ${line.agency} is alerted.${truckNote(line)}`);
  };
  const count = (stage) => lines.filter((l) => l.stage === stage).length;

  return (
    <>
      <PageHeader
        title="Posting"
        links={[{ name: 'Operations' }, { name: 'Posting / bay allocation' }]}
        action={
          <>
            <Button component={RouterLink} to="/warehouse-layout" color="inherit">Warehouse layout</Button>
            <Button component={RouterLink} to="/storage-rules" color="inherit">Storage-rule overrides</Button>
          </>
        }
      />
      <Tabs value={tab} onChange={(e, v) => { setTab(v); setSelected(null); setBay(null); }} sx={{ mb: 3 }}>
        <Tab value="propose" label={<Stack direction="row" spacing={1} alignItems="center"><span>To propose</span><Label color="primary">{count('propose')}</Label></Stack>} />
        <Tab value="waiting" label={<Stack direction="row" spacing={1} alignItems="center"><span>Waiting for in-charge</span><Label>{count('waiting')}</Label></Stack>} />
      </Tabs>
      <Workbench
        queue={
          <QueueCard
            title={tab === 'propose' ? 'Warehouse cargo' : 'Proposals'}
            count={filtered.length}
            search={search}
            onSearch={setSearch}
            placeholder="Search plate, manifest or product"
            items={filtered}
            getKey={(l) => l.key}
            selectedKey={selected}
            onSelect={(k) => { setSelected(k); setBay(null); }}
            emptyText={tab === 'propose' ? 'No cargo to propose' : 'No proposals waiting'}
            renderItem={(l) => (
              <>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{l.plate}</Typography>
                  <Typography variant="caption" color="text.secondary">waiting {l.wait}</Typography>
                </Stack>
                <Typography variant="body2" noWrap>{l.product}</Typography>
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.75} sx={{ mt: 0.75 }}>
                  <Label color="primary">{l.category}</Label>
                  <Label>{l.volumeM3} m³</Label>
                  {isOutsideYard(l) && <Label color="warning">Outside yard</Label>}
                  {lines.filter((x) => x.plate === l.plate).length > 1 && <Label color="info">{plural(lines.filter((x) => x.plate === l.plate).length, 'consignment')}</Label>}
                  {l.rejection && <Label color="error">Rejected</Label>}
                </Stack>
              </>
            )}
          />
        }
        center={
          !current ? (
            <Card><EmptyState title={tab === 'propose' ? 'Select cargo to place' : 'Select a proposal to decide'} sx={{ py: 12 }} /></Card>
          ) : tab === 'waiting' ? (
            <ProposalDecision
              key={current.key}
              line={current}
              lines={lines}
              onAccept={() => accept(current)}
              onReject={(reason) => { update(current.key, { stage: 'propose', parts: [], rejection: reason }); setSelected(null); setToast('Proposal rejected and returned to the posting officer.'); }}
            />
          ) : isOutsideYard(current) ? (
            <OutsideYardRoute key={current.key} line={current} lines={lines} onRoute={(route) => routeOutside(current, route)} />
          ) : (
            <Card>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 1.5 }}>Propose bays for {current.product}</Typography>
                <TruckConsignments line={current} lines={lines} />
                <Box sx={{ mb: 2 }}><BayLegend /></Box>
                {current.rejection && <Alert severity="error" sx={{ mb: 2 }}>The warehouse in-charge rejected the last proposal: {current.rejection}</Alert>}
                <Alert severity="info" sx={{ mb: 3 }}>
                  IBMS shows free space and marks bays that break a rule for <b>{current.category}</b>. The warehouse in-charge accepts or rejects your proposal. Split the cargo across bays or sheds if it needs more than one.
                </Alert>
                <Stack spacing={4}>
                  {storage.map((f) => (
                    <Box key={f.id}>
                      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>{f.name} <Typography component="span" variant="body2" color="text.secondary">· {f.kind}</Typography></Typography>
                      <Stack spacing={3}>
                        {f.zones.map((z) => (
                          <Box key={z.code}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="subtitle2">Zone {z.code}</Typography>
                              <Typography variant="caption" color="text.secondary">accepts {z.categories.join(', ')}</Typography>
                            </Stack>
                            <Box sx={{ overflowX: 'auto', pb: 1 }}>
                              <BayGrid zone={z} selected={bay} onSelect={setBay} isDisallowed={makeDisallowed(current.category)} />
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Card>
          )
        }
        rail={
          !current
            ? null
            : tab === 'waiting'
              ? [<Card key="ctx" sx={{ p: 2.5 }}><CargoDetails line={current} /></Card>, <FreeSpaceCard key="free" />]
              : isOutsideYard(current)
                ? [<Card key="ctx" sx={{ p: 2.5 }}><CargoDetails line={current} /></Card>]
                : [
                  <ProposalCard
                    key={current.key}
                    line={current}
                    bay={bay}
                    onClearBay={() => setBay(null)}
                    onChange={(parts) => update(current.key, { parts })}
                    onSend={() => {
                      update(current.key, { stage: 'waiting', proposedBy: 'Farhana Rahman', rejection: undefined });
                      setSelected(null);
                      setBay(null);
                      setToast(`Proposal for ${current.plate} sent to the warehouse in-charge.`);
                    }}
                  />,
                  <FreeSpaceCard key="free" />,
                ]
        }
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
