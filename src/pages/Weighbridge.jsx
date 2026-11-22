import { useState, useEffect } from 'react';
import {
  Box, Card, Stack, Typography, Button, Tabs, Tab, Divider, Grid2 as Grid, Alert, Snackbar, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { PageHeader, DetailRow, formatKg, formatBDT, EmptyState, AssumptionNote } from '../components/common';
import { Workbench, QueueCard, CameraCard, BridgeCameraCard } from '../components/Workbench';
import Label from '../components/Label';
import { weighQueue, currentUser, truckClassRates } from '../data/mock';
import { useAudit } from '../AuditContext';
import { useCfTrucks } from '../CfTrucksContext';
import { useTruckWeights, formatDate, TARE_DROP_FLAG_KG } from '../TruckWeightsContext';

function ManualWeight({ open, onClose, onConfirm }) {
  const [kg, setKg] = useState('');
  const [reason, setReason] = useState('');
  const n = Number(kg);
  const valid = Number.isFinite(n) && n > 0 && n < 80000 && reason.trim();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Enter weight manually</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Use only when the scale cannot provide a reading. The manual method is kept in the audit log, tracking and the weighbridge register.
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Weight"
            required
            value={kg}
            onChange={(e) => setKg(e.target.value.replace(/[^\d]/g, ''))}
            error={kg !== '' && !(n > 0 && n < 80000)}
            helperText={kg !== '' && !(n > 0 && n < 80000) ? 'Enter a weight between 1 and 79,999 kg' : ' '}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> } }}
          />
          <TextField label="Reason" required multiline minRows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Scale link failure" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!valid} onClick={() => { onConfirm(n, reason); setKg(''); setReason(''); }}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}

// Weighing is charged on the class Customs recorded, as the border gate fee is (cards #27 and #36).
const weighingCharge = (truck) => (truck.customsCls ? truckClassRates[truck.customsCls].weighing : null);

// Proposed tolerance against the declared weight (F18): 5% either way, still to be confirmed by BLPA and Customs.
const TOLERANCE = 0.05;

// How far net cargo is from the declaration. Information only: the scale reading is never changed (F18).
function toleranceCheck(net, declaredKg) {
  if (net == null || !declaredKg) return null;
  const diff = net - declaredKg;
  return { diff, share: diff / declaredKg, outside: Math.abs(diff / declaredKg) > TOLERANCE };
}

// Weighing needs a truck that has passed the entry gate, whose plate matches the camera read (F17),
// and that sits fully inside the marked area on the bridge camera.
function weighingBlock(truck, plateRead, inPosition) {
  if (!truck.admitted) return 'This truck has not been admitted at the entry gate. It can be weighed only after entry.';
  if (plateRead !== truck.plate) return `The camera read ${plateRead}, which doesn't match this truck. Weight capture stays stopped until the plate matches.`;
  if (!inPosition) return 'The truck is not fully inside the marked area. Weight capture stays stopped until it is.';
  return null;
}

// The truck's past empty weighings, newest first, with the change from the one before (#76).
function TareHistory({ history }) {
  if (history.length === 0) return null;
  const rows = history.map((h, i) => ({ ...h, change: i === 0 ? null : h.kg - history[i - 1].kg })).reverse();
  return (
    <Box sx={{ px: 3, pb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Tare history</Typography>
      {rows.map((h) => (
        <DetailRow key={h.date.getTime()} label={formatDate(h.date)}>
          {formatKg(h.kg)}
          {h.change != null && (
            <Typography component="span" variant="caption" color={-h.change > TARE_DROP_FLAG_KG ? 'warning.text' : 'text.secondary'}>
              {' '}({h.change >= 0 ? '+' : '−'}{formatKg(Math.abs(h.change))})
            </Typography>
          )}
        </DetailRow>
      ))}
    </Box>
  );
}

function WeighRecord({ truck, plateRead, inPosition, onConfirmed }) {
  const { tareFor, emptyWeighingReason } = useTruckWeights();
  const tare = tareFor(truck.plate);
  const [live, setLive] = useState(truck.live);
  const [captured, setCaptured] = useState(null);
  const [manual, setManual] = useState(false);

  // Simulated scale jitter until a weight is captured.
  useEffect(() => {
    if (captured) return undefined;
    const id = setInterval(() => setLive(truck.live + Math.round((Math.random() - 0.5) * 30)), 900);
    return () => clearInterval(id);
  }, [captured, truck.live]);

  const block = weighingBlock(truck, plateRead, inPosition);
  const loaded = truck.reason.startsWith('Loaded');
  const tareValid = tare.valid;
  const net = captured && loaded && tareValid ? captured.kg - tare.kg : null;
  // A new tare well below the last one is information for the operator, never a block (F16, #76).
  const drop = !loaded && captured && tare.kg ? tare.kg - captured.kg : 0;
  const emptyReason = loaded ? null : emptyWeighingReason(truck.plate);
  const tolerance = toleranceCheck(net, truck.declaredKg);

  return (
    <Card>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ p: 3 }}>
        <Box>
          <Typography className="record-plate" variant="h5" sx={{ fontFamily: 'monospace' }}>{truck.plate}</Typography>
          <Typography variant="body2" color="text.secondary">{truck.reason} · Scale 1, position A</Typography>
        </Box>
        {block ? <Label color="error">Weighing stopped</Label> : captured ? <Label color="info">Captured</Label> : <Label color="success">Ready to weigh</Label>}
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 3 }}>
        <Box sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 2, textAlign: 'center', containerType: 'inline-size', bgcolor: (t) => alpha(t.palette.primary.main, 0.06), border: (t) => `1px dashed ${alpha(t.palette.primary.main, 0.3)}` }}>
          <Typography variant="overline" color="text.secondary">{captured ? `Captured weight (${captured.method})` : 'Live scale reading'}</Typography>
          <Typography sx={{ fontSize: 'clamp(32px, 13cqi, 56px)', fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums', color: 'text.primary', whiteSpace: 'nowrap' }}>
            {(captured?.kg ?? live).toLocaleString('en-US')} <Typography component="span" variant="h4" color="text.secondary">kg</Typography>
          </Typography>
          {net != null && <Typography variant="subtitle1" color="primary.main">Net cargo {formatKg(net)} (gross − stored tare)</Typography>}
        </Box>
        {block && <Alert severity="error" sx={{ mt: 2 }}>{block}</Alert>}
        {tolerance && (tolerance.outside ? (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Net cargo is {formatKg(Math.abs(tolerance.diff))} ({Math.abs(tolerance.share * 100).toFixed(1)}%) {tolerance.diff > 0 ? 'above' : 'below'} the declared {formatKg(truck.declaredKg)}, outside the {TOLERANCE * 100}% tolerance.
            Customs is notified for checking. The weight is saved exactly as read; nothing is deducted.
          </Alert>
        ) : (
          <Alert severity="success" sx={{ mt: 2 }}>
            Net cargo is within {TOLERANCE * 100}% of the declared {formatKg(truck.declaredKg)} ({tolerance.share >= 0 ? '+' : '−'}{Math.abs(tolerance.share * 100).toFixed(1)}%).
          </Alert>
        ))}
        {tolerance && <AssumptionNote code="F18" sx={{ mt: 1.5 }}>The 5% tolerance is proposed, to be confirmed by BLPA and Customs, including whether it applies below the declaration too.</AssumptionNote>}
        {!tareValid && loaded && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {tare.kg ? `Stored tare expired on ${formatDate(tare.expiresOn)}` : 'No stored tare'}. This truck must be weighed empty before it leaves, so net weight is not calculated yet.
          </Alert>
        )}
        {!loaded && emptyReason && (
          <Alert severity="info" sx={{ mt: 2 }}>{emptyReason}. This empty weighing becomes the stored tare and clears the truck to leave.</Alert>
        )}
        {drop > TARE_DROP_FLAG_KG && (
          <>
            <Alert severity="warning" sx={{ mt: 2 }}>
              This empty weight is {formatKg(drop)} below the last stored tare ({formatKg(tare.kg)} on {formatDate(tare.date)}).
              It is flagged in the audit log for information. Nothing is blocked.
            </Alert>
            <AssumptionNote code="F16" sx={{ mt: 1.5 }}>The {TARE_DROP_FLAG_KG} kg figure is a demo value until BLPA names the scenarios it wants flagged.</AssumptionNote>
          </>
        )}
      </Box>
      <Grid container spacing={{ xs: 0, xl: 4 }} sx={{ px: 3, pb: 2 }}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <DetailRow label="Manifest">{truck.manifest}</DetailRow>
          <DetailRow label="Agency">{truck.agency}</DetailRow>
          <DetailRow label="Declared cargo">{truck.declaredKg ? formatKg(truck.declaredKg) : '—'}</DetailRow>
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <DetailRow label="Driver">{truck.driver}</DetailRow>
          <DetailRow label="Class">
            {truck.customsCls ?? truck.cls}{' '}
            <Typography component="span" variant="caption" color="text.disabled">{truck.customsCls ? '(from Customs)' : '(from the C&F agent, not yet confirmed by Customs)'}</Typography>
            {truck.customsCls && truck.customsCls !== truck.cls && <Box sx={{ mt: 0.5 }}><Label color="warning">C&amp;F entered {truck.cls}</Label></Box>}
          </DetailRow>
          <DetailRow label="Weighing charge">
            {weighingCharge(truck) == null
              ? <Typography component="span" variant="body2" color="text.secondary">Set when Customs confirms the class</Typography>
              : formatBDT(weighingCharge(truck))}
          </DetailRow>
          <DetailRow label="Stored tare">{tare.kg ? <>{formatKg(tare.kg)} <Typography component="span" variant="caption" color={tare.valid ? 'text.secondary' : 'warning.text'}>· {tare.status}</Typography></> : tare.status}</DetailRow>
        </Grid>
      </Grid>
      {!loaded && <TareHistory history={tare.history} />}
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Stack className="record-actions" direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5} sx={{ p: 3 }}>
        <Button variant="outlined" color="inherit" size="large" disabled={Boolean(block)} onClick={() => setManual(true)}>Scale not working? Enter manually</Button>
        <Stack direction="row" spacing={1.5}>
          {captured ? (
            <>
              <Button variant="outlined" color="inherit" size="large" onClick={() => setCaptured(null)}>Re-weigh</Button>
              <Button variant="contained" size="large" disabled={Boolean(block)} onClick={() => onConfirmed(truck, captured, tolerance, drop)}>Confirm weight</Button>
            </>
          ) : (
            <Button variant="contained" size="large" disabled={Boolean(block)} onClick={() => setCaptured({ kg: live, method: 'scale' })}>Capture weight</Button>
          )}
        </Stack>
      </Stack>
      <ManualWeight open={manual} onClose={() => setManual(false)} onConfirm={(kg, reason) => { setManual(false); setCaptured({ kg, method: 'manual', reason }); }} />
    </Card>
  );
}

export default function Weighbridge() {
  const [tab, setTab] = useState('entry');
  const [queue, setQueue] = useState(weighQueue);
  const { leaving, tareFor, openOrder, emptyWeighingReason, recordEmptyWeighing } = useTruckWeights();
  const { foreign } = useCfTrucks();
  const registered = Object.values(foreign).flat();
  // Empty foreign trucks that must be weighed before they leave: missing or expired tare, or a re-weigh order (#71, #74).
  const emptyQueue = leaving.filter((t) => t.load === 'Empty' && emptyWeighingReason(t.plate)).map((t) => {
    const reg = registered.find((r) => r.plate === t.plate);
    return {
      ...t, reason: 'Empty (return)', declaredKg: 0, driver: t.driver ?? reg?.driver ?? '—', cls: reg?.cls ?? '10-wheel truck', customsCls: reg?.cls ?? '10-wheel truck',
      live: t.live ?? (tareFor(t.plate).kg ?? 11000) + 25,
    };
  });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(weighQueue[0].plate);
  const [toast, setToast] = useState('');
  const [rereadPlates, setRereadPlates] = useState([]);
  const { addEvent } = useAudit();
  const plateReadFor = (t) => (rereadPlates.includes(t.plate) ? t.plate : t.cameraPlate ?? t.plate);
  // Demo stand-in for the bridge camera: a re-check finds the truck moved fully onto the bridge.
  const [repositioned, setRepositioned] = useState([]);
  const inPositionFor = (t) => t.inPosition !== false || repositioned.includes(t.plate);

  const tabQueue = tab === 'entry' ? queue : emptyQueue;
  const filtered = tabQueue.filter((t) => `${t.plate} ${t.manifest}`.toLowerCase().includes(search.toLowerCase()));
  const current = tabQueue.find((t) => t.plate === selected);

  return (
    <>
      <PageHeader title="Weighbridge" links={[{ name: 'Operations' }, { name: 'Weighbridge' }]} />
      <Tabs value={tab} onChange={(e, v) => { setTab(v); setSelected(null); }} sx={{ mb: 3 }}>
        <Tab value="entry" label="Waiting for entry" />
        <Tab value="empty" label={<Stack direction="row" spacing={1} alignItems="center"><span>Empty &amp; returned</span><Label color="warning">{emptyQueue.length}</Label></Stack>} />
      </Tabs>
      <Workbench
        queue={
          <QueueCard
            title="Weighing queue"
            count={filtered.length}
            search={search}
            onSearch={setSearch}
            placeholder="Search plate or manifest"
            items={filtered}
            getKey={(t) => t.plate}
            selectedKey={selected}
            onSelect={setSelected}
            renderItem={(t) => (
              <>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{t.plate}</Typography>
                  <Typography variant="caption" color="text.secondary">{t.admitted ?? 'Not admitted'}</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" component="div">{t.manifest}</Typography>
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.75} sx={{ mt: 0.75 }}>
                  <Label color={t.reason.startsWith('Loaded') ? 'primary' : 'info'}>{t.reason}</Label>
                  {openOrder(t.plate) ? <Label color="error">Re-weigh ordered</Label> : !tareFor(t.plate).valid && <Label color="warning">Tare needed</Label>}
                  {weighingBlock(t, plateReadFor(t), inPositionFor(t)) && <Label color="error">Stopped</Label>}
                </Stack>
              </>
            )}
          />
        }
        center={
          current ? (
            <WeighRecord
              key={current.plate}
              truck={current}
              plateRead={plateReadFor(current)}
              inPosition={inPositionFor(current)}
              onConfirmed={(t, c, tolerance, drop) => {
                const empty = !t.reason.startsWith('Loaded');
                if (empty) recordEmptyWeighing(t.plate, c.kg);
                else setQueue((q) => q.filter((x) => x.plate !== t.plate));
                setSelected(null);
                // Every confirmed weight goes to the audit log; a manual one is flagged for reconciliation (F16).
                addEvent({
                  actor: currentUser.name, role: currentUser.role, module: 'Weighing', type: 'Record',
                  text: (c.method === 'manual'
                    ? `Entered manual weight ${formatKg(c.kg)} for ${t.plate} (${c.reason})`
                    : `Captured ${t.reason.startsWith('Loaded') ? 'loaded' : 'empty'} weight ${formatKg(c.kg)} for ${t.plate} on Scale 1`)
                    + (tolerance?.outside ? `; net cargo ${(tolerance.share * 100).toFixed(1)}% from declared, flagged for Customs` : '')
                    + (empty ? '; saved as the new stored tare' : '')
                    + (drop > TARE_DROP_FLAG_KG ? `; ${formatKg(drop)} below the previous tare, flagged for information` : ''),
                  flags: [...(c.method === 'manual' ? ['Override', 'Manual pending reconciliation'] : []), ...(drop > TARE_DROP_FLAG_KG ? ['Exception'] : [])],
                });
                setToast(empty
                  ? `${formatKg(c.kg)} saved as the stored tare for ${t.plate}. The truck can leave through the border gate.`
                  : `${formatKg(c.kg)} recorded for ${t.plate} (${c.method}). Weighment charge ${formatBDT(weighingCharge(t))} added.`);
              }}
            />
          ) : (
            <Card><EmptyState title="Select a truck to weigh" sx={{ py: 12 }} /></Card>
          )
        }
        rail={[
          <CameraCard key="cam" lane="Scale 1 · plate" plate={current ? plateReadFor(current) : null} expected={current?.plate} onReread={() => current && setRereadPlates((p) => [...p, current.plate])} />,
          <BridgeCameraCard key="bridge" lane="Scale 1 · bridge" inPosition={current ? inPositionFor(current) : true} onRecheck={current ? () => setRepositioned((p) => [...p, current.plate]) : undefined} />,
        ]}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
