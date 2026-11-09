import { useState, useMemo } from 'react';
import {
  Box, Card, Stack, Typography, Button, Tabs, Tab, Divider, Grid2 as Grid, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
} from '@mui/material';
import { PageHeader, DetailRow, formatBDT, formatKg, EmptyState, AssumptionNote } from '../components/common';
import { Workbench, QueueCard, CameraCard } from '../components/Workbench';
import Label from '../components/Label';
import { arrivingTrucks, inlandArriving, leavingTrucks, vehicleTypes, truckDataStatus, truckClassRates } from '../data/mock';
import { AddRoundedIcon, CancelRoundedIcon, CheckCircleRoundedIcon, TimerOutlinedIcon } from '../components/icons';

const customsColor = { Released: 'success', Pending: 'warning', Hold: 'error' };
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

function ArrivingRecord({ truck, side, onAdmit, onRefresh }) {
  const [confirm, setConfirm] = useState(false);
  const fee = truckClassRates[truck.cls][side === 'border' ? 'borderEntrance' : 'inlandEntrance'];
  const cameraCheck = {
    label: truck.cameraPlate ? 'Camera plate matches the selected truck' : 'No camera plate read: check the vehicle manually',
    ok: truck.cameraPlate === truck.plate,
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
          <Typography variant="body2" color="text.secondary">{truck.kind} · {truck.cls} · expected {truck.eta}</Typography>
        </Box>
        {awaitingIgm(truck) ? <Label color="error">No IGM yet</Label> : <Label color={customsColor[truck.customs]}>Customs: {truck.customs}</Label>}
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
          <DetailRow label="Entry fee">{formatBDT(fee)} <Typography component="span" variant="caption" color="text.disabled">({side} gate rate)</Typography></DetailRow>
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
        {side === 'border' && truck.kind === 'Foreign' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Where the port uses a Car Pass, accept it from Customs, not the C&amp;F agent.
          </Typography>
        )}
        {blocked && (
          <Alert
            severity="warning"
            sx={{ mt: 2 }}
            action={<Button color="inherit" size="small" onClick={() => onRefresh(truck)}>Check again</Button>}
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
          {truck.cameraPlate !== truck.plate && (
            <Alert severity="error" sx={{ mt: 2 }}>{truck.cameraPlate ? `The camera read ${truck.cameraPlate}.` : 'The camera could not read a plate.'} Confirm only after checking the vehicle yourself.</Alert>
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

function LeavingRecord({ truck, side }) {
  const local = truck.kind === 'Local';
  const checks = local
    ? [['Customs released', truck.release === 'Released'], ['No Customs or BLPA hold', truck.release !== 'Hold'], ['BLPA charges paid in full', true], ['Exit pass signed by all three approvers (expires end of operating day)', truck.pass !== '—']]
    : [['Truck is empty', truck.load === 'Empty'], ['No Customs or BLPA hold', truck.release !== 'Hold']];
  const allOk = checks.every(([, ok]) => ok);
  return (
    <Card>
      <Box sx={{ p: 3 }}>
        <Typography className="record-plate" variant="h5" sx={{ fontFamily: 'monospace' }}>{truck.plate}</Typography>
        <Typography variant="body2" color="text.secondary">{truck.kind} · {truck.load} · admitted {truck.admitted}</Typography>
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 3 }}>
        <DetailRow label="Location">{truck.location}</DetailRow>
        <DetailRow label="Manifest">{truck.manifest}</DetailRow>
        <DetailRow label="Exit pass">{truck.pass}</DetailRow>
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>{local ? 'Loaded local departure checklist' : 'Foreign departure checks'}</Typography>
        <Stack spacing={1}>
          {checks.map(([l, ok]) => (
            <Stack key={l} direction="row" spacing={1} alignItems="center">
              {ok ? <CheckCircleRoundedIcon color="success" fontSize="small" /> : <CancelRoundedIcon color="error" fontSize="small" />}
              <Typography variant="body2" color={ok ? 'text.primary' : 'error.main'}>{l}</Typography>
            </Stack>
          ))}
        </Stack>
        {!allOk && <Alert severity="error" sx={{ mt: 2 }}>Departure is blocked. Conditions are checked again when you record departure.</Alert>}
      </Box>
      <Stack className="record-actions" direction="row" justifyContent="flex-end" sx={{ p: 3, pt: 0 }}>
        <Button variant="contained" size="large" disabled={!allOk}>
          {side === 'border' ? 'Record departure to India' : 'Record departure'}
        </Button>
      </Stack>
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

  const list = tab === 'arriving' ? arriving : leavingTrucks;
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
        <Tab value="leaving" label={<Stack direction="row" spacing={1} alignItems="center"><span>Leaving</span><Label>{leavingTrucks.length}</Label></Stack>} />
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
                  {awaitingIgm(t) ? <Label color="error">No IGM yet</Label> : t.customs && <Label color={customsColor[t.customs]}>{t.customs}</Label>}
                  {t.release && <Label color={customsColor[t.release]}>{t.release}</Label>}
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
                side={side}
                onAdmit={(t) => {
                  setArriving((a) => a.filter((x) => x.plate !== t.plate));
                  setSelected(null);
                  setToast(`${t.plate} admitted and routed. Entrance fee added to ${t.manifest}.`);
                }}
                onRefresh={(t) => {
                  // Demo stand-in for a BNSW update: Customs keys the IGM and validates the truck at zero point.
                  setArriving((a) => a.map((x) => (x.plate === t.plate
                    ? { ...x, igm: 'Received', manifest: x.manifest ?? x.igmOnKey, truckData: truckDataStatus.validated }
                    : x)));
                  setToast(awaitingIgm(t)
                    ? `Customs keyed ${t.igmOnKey} and validated ${t.plate}. The truck can be admitted.`
                    : `Customs validated ${t.plate}. The truck can be admitted.`);
                }}
              />
            ) : (
              <LeavingRecord key={current.plate} truck={current} side={side} />
            )
          ) : (
            <Card><EmptyState title="Select a truck" description="Choose a truck from the queue to see its checks." sx={{ py: 12 }} /></Card>
          )
        }
        rail={[
          <CameraCard key="cam" lane={side === 'border' ? 'Lane B2' : 'Lane I2'} plate={current ? current.cameraPlate : null} expected={current?.plate} onReread={() => {}} />,
          <Card key="moves" sx={{ p: 2.5, pb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Recent movements</Typography>
            <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
              {[['10:48', 'WB-19-C-0803', 'In'], ['10:31', 'WB-23-K-4390', 'Out'], ['10:12', 'WB-41-B-1150', 'In']].map(([t, p, d]) => (
                <Stack key={p} direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ py: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontFamily: 'monospace', fontSize: 12 }}>{p}</Typography>
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
