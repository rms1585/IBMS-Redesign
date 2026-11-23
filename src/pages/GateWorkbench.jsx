import { useState, useMemo } from 'react';
import {
  Box, Card, Stack, Typography, Button, Tabs, Tab, Divider, Grid2 as Grid, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
} from '@mui/material';
import { PageHeader, DetailRow, formatBDT, formatKg, EmptyState, AssumptionNote } from '../components/common';
import { Workbench, QueueCard, CameraCard } from '../components/Workbench';
import { FitnessRow, FitnessWarning } from '../components/Fitness';
import Label from '../components/Label';
import { arrivingTrucks, inlandArriving, leavingTrucks, vehicleTypes, truckDataStatus, truckClassRates, currentUser } from '../data/mock';
import { useAudit } from '../AuditContext';
import { useTruckWeights, AUTHORITIES, formatDate } from '../TruckWeightsContext';
import { useCustoms } from '../CustomsContext';
import { CustomsLabel } from '../components/CustomsSteps';
import { AddRoundedIcon, CancelRoundedIcon, CheckCircleRoundedIcon, TimerOutlinedIcon } from '../components/icons';

const awaitingIgm = (t) => t.igm === 'Awaiting';
const reference = (t) => t.manifest ?? t.preArrival;

function PerishableLabel() {
  return <Label color="warning" startIcon={<TimerOutlinedIcon />}>Perishable</Label>;
}

// Border-gate checks before admission (Phase 1). The IGM may not exist yet when the truck
// arrives, and C&F-entered truck details count only once Customs has validated them.
function borderChecks(truck) {
  return [
    {
      label: awaitingIgm(truck) ? 'No IGM yet: Customs keys it when the goods reach zero point' : `IGM ${truck.manifest} received from NSW and matched to this station`,
      ok: !awaitingIgm(truck),
      blocks: true,
    },
    {
      label: truck.truckData === truckDataStatus.validated ? 'Truck details validated by Customs' : 'Truck details entered by the C&F agency, not yet validated by Customs',
      ok: truck.truckData === truckDataStatus.validated,
      blocks: true,
    },
  ];
}

function ManualRegistration({ open, onClose, onDone }) {
  const [form, setForm] = useState({ plate: '', purpose: 'Delivery', manifest: '', driver: '', cls: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const valid = form.plate && form.driver && form.cls;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Register unexpected truck</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          &ldquo;Admit and flag&rdquo; records an unregistered truck, sends it to management review and needs later confirmation from the C&amp;F agency.
        </Alert>
        <Grid container spacing={2}>
          <Grid size={6}><TextField fullWidth required label="Vehicle number" value={form.plate} onChange={set('plate')} /></Grid>
          <Grid size={6}>
            <TextField select fullWidth label="Purpose" value={form.purpose} onChange={set('purpose')}>
              {['Delivery', 'Pick-up', 'Empty return', 'Other'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={6}><TextField fullWidth required label="Driver name" value={form.driver} onChange={set('driver')} /></Grid>
          <Grid size={6}>
            <TextField select fullWidth required label="Truck class" value={form.cls} onChange={set('cls')}>
              {vehicleTypes.filter((v) => v.mode === 'Road').map((v) => <MenuItem key={v.code} value={v.name}>{v.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={12}><TextField fullWidth label="Manifest (if the driver names one)" value={form.manifest} onChange={set('manifest')} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!valid} onClick={() => onDone(form)}>Admit and flag</Button>
      </DialogActions>
    </Dialog>
  );
}

function ArrivingRecord({ truck, plateRead, side, onAdmit, onRefresh }) {
  const [confirm, setConfirm] = useState(false);
  // At the border BLPA charges on the class Customs records at zero point; the C&F class is advance information.
  // Inland trucks are Bangladeshi and keep the class from the C&F booking.
  const feeCls = side === 'border' ? truck.customsCls : truck.cls;
  const fee = feeCls ? truckClassRates[feeCls][side === 'border' ? 'borderEntrance' : 'inlandEntrance'] : null;
  const classDiffers = side === 'border' && truck.customsCls && truck.customsCls !== truck.cls;
  const cameraCheck = {
    label: plateRead ? 'Camera plate matches the selected truck' : 'No camera plate read: check the vehicle manually',
    ok: plateRead === truck.plate,
    blocks: false,
  };
  const checks = side === 'border'
    ? [...borderChecks(truck), cameraCheck]
    : [{ label: 'Manifest received from NSW and matched to this station', ok: true }, { label: 'Truck assigned by the C&F agency', ok: true }, cameraCheck];
  const blocked = checks.some((c) => c.blocks && !c.ok);

  return (
    <Card>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ p: 3 }}>
        <Box>
          <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
            <Typography className="record-plate" variant="h5" sx={{ fontFamily: 'monospace', letterSpacing: 0.5 }}>{truck.plate}</Typography>
            {truck.firstVisit && <Label color="info">First visit</Label>}
            {truck.perishable && <PerishableLabel />}
          </Stack>
          <Typography variant="body2" color="text.secondary">{truck.kind} · {feeCls ?? truck.cls} · expected {truck.eta}</Typography>
        </Box>
        {awaitingIgm(truck) ? <Label color="error">No IGM yet</Label> : truck.customs && <CustomsLabel customs={truck.customs} prefix="Customs: " />}
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Grid container spacing={4} sx={{ p: 3 }}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <Typography variant="overline" color="text.disabled">Shipment</Typography>
          {awaitingIgm(truck) ? (
            <DetailRow label="Pre-arrival ref.">{truck.preArrival}</DetailRow>
          ) : (
            <DetailRow label="Manifest">{truck.manifest}</DetailRow>
          )}
          <DetailRow label="Direction">Import</DetailRow>
          <DetailRow label="Agency">{truck.agency}</DetailRow>
          <DetailRow label="Cargo">{truck.cargo}</DetailRow>
          <DetailRow label="Declared weight">{formatKg(truck.declaredKg)}</DetailRow>
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <Typography variant="overline" color="text.disabled">Driver</Typography>
          <DetailRow label="Name">{truck.driver}</DetailRow>
          <DetailRow label="Driver card">{truck.driverCard}</DetailRow>
          {side === 'border' ? (
            <DetailRow label="Truck class">
              {truck.customsCls ?? truck.cls}{' '}
              <Typography component="span" variant="caption" color="text.disabled">{truck.customsCls ? '(from Customs)' : '(from the C&F agent, not yet confirmed by Customs)'}</Typography>
              {classDiffers && <Box sx={{ mt: 0.5 }}><Label color="warning">C&amp;F entered {truck.cls}</Label></Box>}
            </DetailRow>
          ) : (
            <>
              <DetailRow label="Truck class">{truck.cls}</DetailRow>
              <FitnessRow plate={truck.plate} bangladeshi />
            </>
          )}
          <DetailRow label="Entry fee">
            {fee === null
              ? <Typography component="span" variant="body2" color="text.secondary">Set when Customs confirms the class</Typography>
              : <>{formatBDT(fee)} <Typography component="span" variant="caption" color="text.disabled">({side} gate rate)</Typography></>}
          </DetailRow>
        </Grid>
      </Grid>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Before admitting</Typography>
        <Stack spacing={1}>
          {checks.map(({ label, ok }) => (
            <Stack key={label} direction="row" spacing={1} alignItems="flex-start">
              {ok ? <CheckCircleRoundedIcon color="success" fontSize="small" /> : <CancelRoundedIcon color="error" fontSize="small" />}
              <Typography variant="body2" color={ok ? 'text.primary' : 'error.main'}>{label}</Typography>
            </Stack>
          ))}
        </Stack>
        {side === 'inland' && <FitnessWarning plate={truck.plate} bangladeshi action="admit the truck" />}
        {side === 'border' && truck.kind === 'Foreign' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Where the port uses a Car Pass, accept it from Customs, not the C&amp;F agent.
          </Typography>
        )}
        {blocked && (
          <Alert
            severity="warning"
            sx={{ mt: 2 }}
            action={<Button variant="outlined" color="inherit" size="small" onClick={() => onRefresh(truck)}>Check again</Button>}
          >
            {awaitingIgm(truck) ? 'Keep the truck at zero point until Customs keys its IGM.' : 'Keep the truck at zero point until Customs validates its details.'} Customs updates arrive through BNSW.
          </Alert>
        )}
        {side === 'border' && awaitingIgm(truck) && (
          <AssumptionNote code="F4" sx={{ mt: 2 }}>An IGM may reach IBMS only after the truck arrives. When BNSW sends IGM data is not yet confirmed.</AssumptionNote>
        )}
        {side === 'border' && truck.truckData !== truckDataStatus.validated && (
          <AssumptionNote code="F6" sx={{ mt: 1.5 }}>How Customs validates C&amp;F-entered truck details is not designed yet.</AssumptionNote>
        )}
      </Box>
      <Stack className="record-actions" direction="row" justifyContent="flex-end" flexWrap="wrap" gap={1.5} sx={{ p: 3, pt: 0 }}>
        <Button variant="outlined" color="inherit" size="large">Report problem</Button>
        <Button variant="contained" size="large" disabled={blocked} onClick={() => setConfirm(true)}>Admit truck</Button>
      </Stack>
      <Dialog open={confirm} onClose={() => setConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Admit {truck.plate}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This records admission at {side === 'border' ? 'Border gate 1, lane B2' : 'Inland gate, lane 2'}, locks the truck assignment and adds an entrance fee of {formatBDT(fee)} to {truck.manifest}.
          </Typography>
          {plateRead !== truck.plate && (
            <Alert severity="error" sx={{ mt: 2 }}>{plateRead ? `The camera read ${plateRead}.` : 'The camera could not read a plate.'} Confirm only after checking the vehicle yourself.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setConfirm(false); onAdmit(truck); }}>Admit</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

// BLPA or Customs orders a re-weigh on suspicion, at any time; the weighbridge is notified (F30, #74).
function ReweighOrderDialog({ truck, onClose, onSave }) {
  const [authority, setAuthority] = useState('blpa');
  const [reason, setReason] = useState('');
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Order re-weigh for <Box component="span" sx={{ fontFamily: 'monospace' }}>{truck.plate}</Box></DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          The truck can&apos;t leave until it is weighed empty again. The weighbridge is notified now.
        </Typography>
        <Stack spacing={2}>
          <TextField select fullWidth label="Ordered on the authority of" value={authority} onChange={(e) => setAuthority(e.target.value)}>
            {Object.entries(AUTHORITIES).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </TextField>
          <TextField fullWidth required multiline minRows={3} label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Body looks altered since the last empty weighing" helperText="Recorded in the audit log with your name and time." />
        </Stack>
        <AssumptionNote code="F30" sx={{ mt: 2 }}>Who may order a re-weigh, and whether Customs does it in IBMS, is to be confirmed by BLPA and NBR.</AssumptionNote>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!reason.trim()} onClick={() => onSave(authority, reason.trim())}>Order re-weigh</Button>
      </DialogActions>
    </Dialog>
  );
}

function LeavingRecord({ truck, side, plateRead, onDepart, onOrder }) {
  const { tareFor, emptyWeighingReason } = useTruckWeights();
  const [ordering, setOrdering] = useState(false);
  const local = truck.kind === 'Local';
  const tare = local ? null : tareFor(truck.plate);
  const weighing = local ? null : emptyWeighingReason(truck.plate);
  // A foreign truck leaves on a plate scan matched to its entry record, empty and with a valid tare (Phase 8).
  const checks = local
    ? [['Customs released', Boolean(truck.customs?.released)], ['No Customs or BLPA hold', !truck.customs?.onHold], ['BLPA charges paid in full', true], ['Exit pass issued (expires end of operating day)', truck.pass !== '—']]
    : [
      ['Truck is empty', truck.load === 'Empty'],
      ['No Customs or BLPA hold', !truck.customs?.onHold],
      [truck.admitted ? `Entry record found: admitted ${truck.admitted} at Border gate 1` : 'No entry record for this plate', Boolean(truck.admitted)],
      [plateRead === truck.plate ? 'Camera plate matches the entry record' : plateRead ? `Camera read ${plateRead}, which doesn't match` : 'No camera plate read', plateRead === truck.plate],
      [weighing ? `${weighing}: weigh empty before departure` : `Stored tare valid until ${formatDate(tare.expiresOn)}`, !weighing],
    ];
  const allOk = checks.every(([, ok]) => ok);
  return (
    <Card>
      <Box sx={{ p: 3 }}>
        <Typography className="record-plate" variant="h5" sx={{ fontFamily: 'monospace' }}>{truck.plate}</Typography>
        <Typography variant="body2" color="text.secondary">{local ? 'Local' : 'Foreign'} · {truck.load} · admitted {truck.admitted}</Typography>
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 3 }}>
        <DetailRow label="Location">{truck.location}</DetailRow>
        <DetailRow label="Manifest">{truck.manifest}</DetailRow>
        {local ? <DetailRow label="Exit pass">{truck.pass}</DetailRow> : <DetailRow label="Stored tare">{tare.kg ? formatKg(tare.kg) : '—'}</DetailRow>}
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>{local ? 'Loaded local departure checklist' : 'Foreign departure checks'}</Typography>
        <Stack spacing={1}>
          {checks.map(([l, ok]) => (
            <Stack key={l} direction="row" spacing={1} alignItems="flex-start">
              {ok ? <CheckCircleRoundedIcon color="success" fontSize="small" /> : <CancelRoundedIcon color="error" fontSize="small" />}
              <Typography variant="body2" color={ok ? 'text.primary' : 'error.main'}>{l}</Typography>
            </Stack>
          ))}
        </Stack>
        {!allOk && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Departure is blocked.{' '}
            {weighing && truck.load === 'Empty' ? 'Send the truck to the weighbridge to be weighed empty; it is already in the weighbridge queue.' : !local && plateRead !== truck.plate ? 'Re-read the plate, or check the vehicle against the entry record.' : 'Conditions are checked again when you record departure.'}
          </Alert>
        )}
        {!local && <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>The Car Pass stays with the driver.</Typography>}
      </Box>
      <Stack className="record-actions" direction="row" justifyContent="flex-end" flexWrap="wrap" gap={1.5} sx={{ p: 3, pt: 0 }}>
        {!local && truck.load === 'Empty' && !weighing && <Button variant="outlined" color="inherit" size="large" onClick={() => setOrdering(true)}>Order re-weigh</Button>}
        <Button variant="contained" size="large" disabled={!allOk} onClick={() => onDepart(truck)}>
          {side === 'border' ? 'Record departure to India' : 'Record departure'}
        </Button>
      </Stack>
      {ordering && <ReweighOrderDialog truck={truck} onClose={() => setOrdering(false)} onSave={(authority, reason) => { setOrdering(false); onOrder(truck, authority, reason); }} />}
    </Card>
  );
}

export default function GateWorkbench({ side }) {
  const [tab, setTab] = useState('arriving');
  const [search, setSearch] = useState('');
  const [arriving, setArriving] = useState(side === 'border' ? arrivingTrucks : inlandArriving);
  const [selected, setSelected] = useState((side === 'border' ? arrivingTrucks : inlandArriving)[0].plate);
  const [manual, setManual] = useState(false);
  const [toast, setToast] = useState('');
  const [rereadPlates, setRereadPlates] = useState([]);
  const [departedLocal, setDepartedLocal] = useState([]);
  const { leaving: leavingForeign, recordDeparture, createOrder } = useTruckWeights();
  const { addEvent } = useAudit();
  const { customsFor } = useCustoms();
  // Foreign trucks leave empty through the border gate; local trucks leave loaded through the inland gate.
  const leaving = side === 'border'
    ? leavingForeign.map((t) => ({ ...t, kind: 'Foreign' }))
    : leavingTrucks.filter((t) => t.kind === 'Local' && !departedLocal.includes(t.plate));
  // Demo stand-in for the camera: a re-read returns a clean read of the expected plate.
  const plateReadFor = (t) => (rereadPlates.includes(t.plate) ? t.plate : t.cameraPlate ?? (tab === 'leaving' ? t.plate : undefined));

  // Every truck shows its manifest's one shared Customs status (#80).
  const list = (tab === 'arriving' ? arriving : leaving).map((t) => (t.manifest ? { ...t, customs: customsFor(t.manifest) } : t));
  const filtered = useMemo(
    () => list.filter((t) => `${t.plate} ${reference(t)}`.toLowerCase().includes(search.toLowerCase())),
    [list, search],
  );
  const current = list.find((t) => t.plate === selected) ?? null;
  const title = side === 'border' ? 'Border gate' : 'Inland gate';

  return (
    <>
      <PageHeader
        title={title}
        links={[{ name: 'Operations' }, { name: title }]}
        subtitle={side === 'border' ? 'Faces the zero line: foreign entry and empty return, export departure and stone crossings.' : 'Faces the Bangladesh road: local trucks arriving to receive cargo and leaving loaded.'}
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setManual(true)}>Register unexpected truck</Button>}
      />
      <Tabs value={tab} onChange={(e, v) => { setTab(v); setSelected(null); }} sx={{ mb: 3 }}>
        <Tab value="arriving" label={<Stack direction="row" spacing={1} alignItems="center"><span>Arriving</span><Label color="primary">{arriving.length}</Label></Stack>} />
        <Tab value="leaving" label={<Stack direction="row" spacing={1} alignItems="center"><span>Leaving</span><Label>{leaving.length}</Label></Stack>} />
      </Tabs>
      <Workbench
        queue={
          <QueueCard
            title={tab === 'arriving' ? 'Assigned, not entered' : 'Inside, leaving this side'}
            count={filtered.length}
            search={search}
            onSearch={setSearch}
            placeholder="Search plate or manifest"
            items={filtered}
            getKey={(t) => t.plate}
            selectedKey={selected}
            onSelect={setSelected}
            emptyText={side === 'inland' ? 'No truck expected' : 'No trucks waiting'}
            renderItem={(t) => (
              <>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{t.plate}</Typography>
                  <Typography variant="caption" color="text.secondary">{t.eta ?? t.admitted}</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" component="div" noWrap>{reference(t)}</Typography>
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.75} sx={{ mt: 0.75 }}>
                  <Label>{t.kind}</Label>
                  {t.perishable && <PerishableLabel />}
                  {awaitingIgm(t) ? <Label color="error">No IGM yet</Label> : t.customs && (tab === 'arriving' || t.kind === 'Local' || t.customs.onHold) && <CustomsLabel customs={t.customs} />}
                </Stack>
              </>
            )}
          />
        }
        center={
          current ? (
            tab === 'arriving' ? (
              <ArrivingRecord
                key={current.plate}
                truck={current}
                plateRead={plateReadFor(current)}
                side={side}
                onAdmit={(t) => {
                  setArriving((a) => a.filter((x) => x.plate !== t.plate));
                  setSelected(null);
                  setToast(`${t.plate} admitted and routed. Entrance fee added to ${t.manifest}.`);
                }}
                onRefresh={(t) => {
                  // Demo stand-in for a BNSW update: Customs keys the IGM and validates the truck at zero point.
                  setArriving((a) => a.map((x) => (x.plate === t.plate
                    ? { ...x, igm: 'Received', manifest: x.manifest ?? x.igmOnKey, truckData: truckDataStatus.validated, customsCls: x.customsCls ?? x.cls }
                    : x)));
                  setToast(awaitingIgm(t)
                    ? `Customs keyed ${t.igmOnKey} and validated ${t.plate}. The truck can be admitted.`
                    : `Customs validated ${t.plate}. The truck can be admitted.`);
                }}
              />
            ) : (
              <LeavingRecord
                key={current.plate}
                truck={current}
                side={side}
                plateRead={plateReadFor(current)}
                onDepart={(t) => {
                  if (side === 'border') recordDeparture(t.plate);
                  else setDepartedLocal((d) => [...d, t.plate]);
                  setSelected(null);
                  addEvent({
                    actor: currentUser.name, role: currentUser.role, module: 'Gates', type: 'Record',
                    text: `Recorded departure of ${t.plate} (${t.manifest}) ${side === 'border' ? 'to India through Border gate 1, lane B2' : 'through the inland gate, lane 2'}; camera plate matched`,
                  });
                  setToast(`${t.plate} departed${side === 'border' ? ' to India' : ''}.`);
                }}
                onOrder={(t, authority, reason) => {
                  const id = createOrder({ plate: t.plate, authority, reason });
                  addEvent({
                    actor: currentUser.name, role: currentUser.role, module: 'Weighing', type: 'Record', flags: ['Exception'],
                    text: `Ordered re-weigh ${id} for ${t.plate} on the authority of the ${AUTHORITIES[authority]}: ${reason}`,
                  });
                  setToast(`Re-weigh ${id} ordered. The weighbridge is notified and ${t.plate} can't leave until it is weighed empty.`);
                }}
              />
            )
          ) : (
            <Card><EmptyState title="Select a truck" description="Choose a truck from the queue to see its checks." sx={{ py: 12 }} /></Card>
          )
        }
        rail={[
          <CameraCard key="cam" lane={side === 'border' ? 'Lane B2' : 'Lane I2'} plate={current ? plateReadFor(current) : null} expected={current?.plate} onReread={() => current && setRereadPlates((p) => [...p, current.plate])} />,
          <Card key="moves" sx={{ p: 2.5, pb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Recent movements</Typography>
            <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
              {[['10:48', 'WB-19-C-0803', 'In'], ['10:31', 'WB-23-K-4390', 'Out'], ['10:12', 'WB-41-B-1150', 'In']].map(([t, p, d]) => (
                <Stack key={p} direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ py: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" component="p" noWrap sx={{ fontFamily: 'monospace' }}>{p}</Typography>
                    <Typography variant="caption" color="text.secondary">{t}</Typography>
                  </Box>
                  <Label color={d === 'In' ? 'success' : 'info'}>{d}</Label>
                </Stack>
              ))}
            </Stack>
          </Card>,
        ]}
      />
      <ManualRegistration
        open={manual}
        onClose={() => setManual(false)}
        onDone={(f) => { setManual(false); setToast(`${f.plate} admitted and flagged for management review.`); }}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
