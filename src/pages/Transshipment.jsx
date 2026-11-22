import { useState, useEffect } from 'react';
import {
  Box, Card, Stack, Typography, Button, LinearProgress, Divider, Alert, Snackbar, Link,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, InputAdornment,
} from '@mui/material';
import { PageHeader, DetailRow, formatKg, formatBDT, EmptyState, AssumptionNote } from '../components/common';
import { Workbench, QueueCard } from '../components/Workbench';
import Label from '../components/Label';
import { AddRoundedIcon } from '../components/icons';
import { RaiseDialog } from './Labour';
import { LabourPanel, HandlingFields } from './Warehousing';
import {
  useWarehouse, requisitionFor, isDoubleHandling, handlingsFor, TRANSSHIP_HANDLING_RATE,
} from '../WarehouseContext';
import { useCfTrucks } from '../CfTrucksContext';
import { useAudit } from '../AuditContext';
import { currentUser, localBookingStatus } from '../data/mock';

const YARD = 'Transshipment yard T1';
const movedKg = (o) => o.receivers.reduce((s, r) => s + r.movedKg, 0);
const remainingKg = (o) => o.goodsKg - movedKg(o);
const toTonnes = (kg) => Math.round(kg / 100) / 10;
const tonnes = (t) => `${t.toLocaleString('en-US', { maximumFractionDigits: 1 })} t`;
const isPerishable = (o) => o.productType === 'Perishable';
const needsPermission = (o) => o.kind === 'transshipment' && !isPerishable(o);
// A registered local truck has entered once the inland gate admitted it (F32: the gate admits only tagged trucks).
const hasEntered = (t) => [localBookingStatus.entered, localBookingStatus.loaded].includes(t.status);
// Perishables first, then the longest wait (Item 9; F3: most perishables arrive and leave the same day).
const byPriority = (a, b) => (isPerishable(b) - isPerishable(a)) || (a.arrivedAt - b.arrivedAt);

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(id); }, []);
  return now;
}
const waited = (since, now) => {
  const m = Math.max(0, Math.floor((now - since) / 60000));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

// Why transfers are stopped on this work order, if they are.
function orderBlock(order, requisition) {
  if (needsPermission(order) && order.customsPermission !== 'Granted') return 'Non-perishable goods are transshipped only with Customs’ permission. Transfers stay stopped until it is granted.';
  if (!requisition || requisition.status !== 'Gang assigned') return 'No gang assigned yet. Transfers start once the contractor and labour union assign one.';
  return null;
}

function AddTruckDialog({ order, registered, onClose, onAdd }) {
  const onOrder = order.receivers.map((r) => r.plate);
  const available = registered.filter((t) => hasEntered(t) && !onOrder.includes(t.plate));
  const [plate, setPlate] = useState('');
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add local truck</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Only trucks the C&amp;F agent registered for <Box component="span" sx={{ fontFamily: 'monospace' }}>{order.manifest}</Box> that have entered at the inland gate.
        </Typography>
        {available.length ? (
          <TextField
            select fullWidth required label="Local truck" value={plate} onChange={(e) => setPlate(e.target.value)}
            SelectProps={{ renderValue: (v) => <Box component="span" sx={{ fontFamily: 'monospace' }}>{v}</Box> }}
          >
            {available.map((t) => <MenuItem key={t.plate} value={t.plate}><Box component="span" sx={{ fontFamily: 'monospace' }}>{t.plate}</Box>&nbsp;· {t.cls} · {t.driver}</MenuItem>)}
          </TextField>
        ) : (
          <Alert severity="info">No other registered truck has entered yet. The C&amp;F agent registers trucks in the C&amp;F portal; they appear here once the inland gate admits them.</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!plate} onClick={() => onAdd(plate)}>Add truck</Button>
      </DialogActions>
    </Dialog>
  );
}

// The officer scans the receiving truck on a handheld, then records what was moved onto it (Item 9, Benapole).
function TransferDialog({ order, receiver, onReread, onClose, onSave }) {
  const [kg, setKg] = useState('');
  const remaining = remainingKg(order);
  const amount = Number(kg);
  const match = receiver.handheldPlate === receiver.plate;
  const tooMuch = amount > remaining;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Record transfer</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {order.product} from <Box component="span" sx={{ fontFamily: 'monospace' }}>{order.plate}</Box> · {formatKg(remaining)} still on it
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" component="div">Handheld read</Typography>
            <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{receiver.handheldPlate}</Typography>
          </Box>
          {match ? <Label color="success">Matches {receiver.plate}</Label> : <Label color="error">Expected {receiver.plate}</Label>}
        </Stack>
        {!match && (
          <Alert severity="error" sx={{ mb: 2 }} action={<Button variant="outlined" color="inherit" size="small" onClick={onReread}>Re-read plate</Button>}>
            This isn&apos;t the registered truck. Loading stays stopped until the plate matches.
          </Alert>
        )}
        <TextField
          fullWidth required label="Moved onto this truck" value={kg} disabled={!match}
          onChange={(e) => setKg(e.target.value.replace(/\D/g, ''))}
          error={tooMuch}
          helperText={tooMuch ? `Only ${formatKg(remaining)} remains` : `Up to ${formatKg(remaining)}`}
          slotProps={{ input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> } }}
        />
        {match && amount !== remaining && (
          <Link component="button" type="button" variant="subtitle2" underline="hover" sx={{ mt: 1.5 }} onClick={() => setKg(String(remaining))}>Move all {formatKg(remaining)}</Link>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!match || amount <= 0 || tooMuch} onClick={() => onSave(amount)}>Record transfer</Button>
      </DialogActions>
    </Dialog>
  );
}

function FinishDialog({ order, requisition, onClose, onFinish }) {
  const totalT = toTonnes(movedKg(order));
  const [manual, setManual] = useState('');
  const [lifts, setLifts] = useState({});
  const sent = requisition.sent;
  const liftsFor = (eq) => Number(requisition.captured?.[eq] ?? lifts[eq] ?? 0);
  const manualT = sent.length ? Number(manual || 0) : totalT;
  const ready = !sent.length || (manual !== '' && manualT <= totalT && sent.every((eq) => liftsFor(eq) > 0));
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Finish {order.id}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Split the {tonnes(totalT)} moved between hand and equipment. This completes {requisition.id} and feeds the contractor bill.
        </Typography>
        <HandlingFields totalT={totalT} requisition={requisition} manual={manual} setManual={setManual} lifts={lifts} setLifts={setLifts} />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button
          variant="contained" disabled={!ready}
          onClick={() => onFinish({
            manualT,
            equipmentT: Math.round((totalT - manualT) * 10) / 10,
            lifts: Object.fromEntries(sent.map((eq) => [eq, liftsFor(eq)])),
            double: isDoubleHandling(sent),
            source: 'In-charge',
          })}
        >
          Finish work order
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function OrderTypeNotes({ order, onCheckPermission }) {
  if (order.kind === 'truck-to-truck') {
    return (
      <Box sx={{ px: 3, pb: 3 }}>
        <Alert severity="warning">
          <Box component="span" sx={{ fontWeight: 600 }}>Sheds jammed.</Box> Goods are inspected on the truck and moved truck to truck. Billed as unloading plus loading. Declared by {order.jammedBy}.
        </Alert>
        <AssumptionNote code="EX-04" sx={{ mt: 1.5 }}>Who declares sheds jammed, and with what authority, is for BLPA to decide (#70). The charge rule waits on BLPA too.</AssumptionNote>
      </Box>
    );
  }
  if (!needsPermission(order)) return null;
  const granted = order.customsPermission === 'Granted';
  return (
    <Box sx={{ px: 3, pb: 3 }}>
      <Alert
        severity={granted ? 'success' : 'warning'}
        action={!granted && <Button variant="outlined" color="inherit" size="small" onClick={onCheckPermission}>Check again</Button>}
      >
        <Box component="span" sx={{ fontWeight: 600 }}>Customs permission: {granted ? 'granted' : order.customsPermission.toLowerCase()}.</Box>{' '}
        {granted ? 'Non-perishable goods may go across. Billed as unloading plus loading.' : 'Non-perishable goods go across only with Customs’ permission.'}
      </Alert>
      <AssumptionNote code="EX-03" sx={{ mt: 1.5 }}>The permission arrives as a BNSW status in this demo; &quot;Check again&quot; stands in for it. How Customs sends it is to be confirmed with NBR (#69).</AssumptionNote>
    </Box>
  );
}

function WorkOrder({ order, requisition, registered, now, onRaise, onAddTruck, onTransfer, onFinish, onCheckPermission }) {
  const moved = movedKg(order);
  const remaining = remainingKg(order);
  const block = orderBlock(order, requisition);
  const entered = registered.filter(hasEntered).length;
  const handlings = handlingsFor(order);
  return (
    <Card>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ p: 3 }}>
        <Box>
          <Typography className="record-plate" variant="h5" sx={{ fontFamily: 'monospace' }}>{order.id}</Typography>
          <Typography variant="body2" color="text.secondary">{order.product} · <Box component="span" sx={{ fontFamily: 'monospace' }}>{order.manifest}</Box></Typography>
          <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.75} sx={{ mt: 1 }}>
            <Label color={order.kind === 'truck-to-truck' ? 'warning' : 'info'}>{order.kind === 'truck-to-truck' ? 'Truck-to-truck · sheds jammed' : 'Transshipment'}</Label>
            <Label color={isPerishable(order) ? 'warning' : 'default'}>{order.productType}</Label>
          </Stack>
        </Box>
        {block ? <Label color="error">Transfers stopped</Label> : remaining === 0 ? <Label color="success">All moved</Label> : <Label color="info">In progress</Label>}
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 3 }}>
        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: 'background.neutral', boxShadow: 'none' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="overline" color="text.disabled">Source foreign truck</Typography>
              <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>{order.plate}</Typography>
              <Typography variant="body2" color="text.secondary">{order.driver} · {order.location} · waiting {waited(order.arrivedAt, now)}</Typography>
            </Box>
            <Box sx={{ textAlign: { sm: 'right' } }}>
              <Typography variant="overline" color="text.disabled">Remaining</Typography>
              <Typography variant="h5">{formatKg(remaining)}</Typography>
              <Typography variant="caption" color="text.secondary">of {formatKg(order.goodsKg)}</Typography>
            </Box>
          </Stack>
          <LinearProgress variant="determinate" value={(moved / order.goodsKg) * 100} sx={{ mt: 2 }} />
        </Card>
      </Box>
      <OrderTypeNotes order={order} onCheckPermission={onCheckPermission} />
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Labour</Typography>
        <LabourPanel requisition={requisition} onRaise={onRaise} />
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="subtitle2">Receiving trucks</Typography>
            <Typography variant="caption" color="text.secondary">{registered.length} registered by the C&amp;F agent · {entered} entered · {order.receivers.length} on this order</Typography>
          </Box>
          <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={onAddTruck} disabled={remaining === 0}>Add local truck</Button>
        </Stack>
        {block && <Alert severity="error" sx={{ mb: 2 }}>{block}</Alert>}
        {order.receivers.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No receiving truck yet. Add one of the registered trucks that has entered.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {order.receivers.map((r) => {
              const booking = registered.find((t) => t.plate === r.plate);
              return (
                <Stack key={r.plate} direction="row" alignItems="center" flexWrap="wrap" gap={2} sx={{ p: 2, borderRadius: 1.5, border: 1, borderColor: 'divider' }}>
                  <Box sx={{ flex: '1 1 180px' }}>
                    <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{r.plate}</Typography>
                    <Typography variant="caption" color="text.secondary">{booking ? `${booking.cls} · ${booking.driver}` : 'Registered truck'}</Typography>
                  </Box>
                  <Box sx={{ width: 120, flexShrink: 0 }}>
                    <Typography variant="body2">{r.movedKg ? formatKg(r.movedKg) : '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">moved</Typography>
                  </Box>
                  {/* Fixed-width status and action slots keep every row's columns lined up. */}
                  <Box sx={{ width: 96, flexShrink: 0 }}>
                    {r.movedKg ? <Label color="success">Loaded</Label> : r.handheldPlate !== r.plate ? <Label color="error">Plate mismatch</Label> : <Label color="info">In position</Label>}
                  </Box>
                  <Box sx={{ width: 136, flexShrink: 0 }}>
                    {!r.movedKg && <Button variant="outlined" size="small" disabled={Boolean(block) || remaining === 0} onClick={() => onTransfer(r)}>Record transfer</Button>}
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 3 }}>
        <DetailRow label="Handling charge">
          {formatBDT(toTonnes(moved) * TRANSSHIP_HANDLING_RATE * handlings)}
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
            {tonnes(toTonnes(moved))} moved × {handlings === 1 ? 'one handling (transshipment)' : 'two handlings (unloading and loading)'} × {formatBDT(TRANSSHIP_HANDLING_RATE)} per tonne (demo rate)
          </Typography>
        </DetailRow>
        <Stack className="record-actions" direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button variant="contained" size="large" disabled={remaining !== 0 || !requisition} onClick={onFinish}>Finish work order</Button>
        </Stack>
      </Box>
    </Card>
  );
}

export default function Transshipment() {
  const { workOrders, updateOrder, requisitions, raiseRequisition, completeRequisition } = useWarehouse();
  const { local } = useCfTrucks();
  const { addEvent } = useAudit();
  const now = useNow();
  const open = workOrders.filter((o) => !o.done).sort(byPriority);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(open[0]?.id ?? null);
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState('');
  const list = open.filter((o) => `${o.id} ${o.plate} ${o.manifest} ${o.product}`.toLowerCase().includes(search.toLowerCase()));
  const current = open.find((o) => o.id === selected);
  const requisition = current && requisitionFor(requisitions, current.plate, 'Transshipment');
  const registered = current ? local[current.manifest] ?? [] : [];
  const exceptionFlag = (o) => (o.kind === 'truck-to-truck' || needsPermission(o) ? ['Exception'] : []);

  const addTruck = (plate) => {
    updateOrder(current.id, (o) => ({ receivers: [...o.receivers, { plate, handheldPlate: o.handheld?.[plate] ?? plate, movedKg: 0 }] }));
    setDialog(null);
    setToast(`${plate} added to ${current.id}.`);
  };
  const reread = (plate) => updateOrder(current.id, (o) => ({ receivers: o.receivers.map((r) => (r.plate === plate ? { ...r, handheldPlate: plate } : r)) }));
  const transfer = (plate, kg) => {
    updateOrder(current.id, (o) => ({ receivers: o.receivers.map((r) => (r.plate === plate ? { ...r, movedKg: kg } : r)) }));
    addEvent({
      actor: currentUser.name, role: currentUser.role, module: 'Transshipment', type: 'Record', flags: exceptionFlag(current),
      text: `Moved ${formatKg(kg)} of ${current.product} from ${current.plate} to ${plate} (${current.id}${current.kind === 'truck-to-truck' ? ', truck-to-truck: sheds jammed' : ''}); handheld plate matched`,
    });
    setDialog(null);
    setToast(`${formatKg(kg)} moved to ${plate}.`);
  };
  const finish = (handling) => {
    completeRequisition(requisition.id, handling);
    updateOrder(current.id, { done: true });
    addEvent({
      actor: currentUser.name, role: currentUser.role, module: 'Transshipment', type: 'Record', flags: exceptionFlag(current),
      text: `Finished ${current.id}: ${formatKg(movedKg(current))} of ${current.product} across ${current.receivers.length} trucks; ${handlingsFor(current)} handling${handlingsFor(current) === 1 ? '' : 's'} billed`,
    });
    setDialog(null);
    setSelected(null);
    setToast(`${current.id} finished. ${requisition.id} is complete and feeds the contractor bill.`);
  };
  const checkPermission = () => {
    updateOrder(current.id, { customsPermission: 'Granted' });
    setToast(`Customs permission granted for ${current.id}.`);
  };

  return (
    <>
      <PageHeader title="Transshipment" links={[{ name: 'Operations' }, { name: 'Transshipment' }]} subtitle="Direct truck-to-truck transfer in the transshipment yard. The yard is not storage, so storage separation rules do not apply." />
      <Workbench
        queue={
          <QueueCard
            title="Work orders"
            count={list.length}
            search={search}
            onSearch={setSearch}
            placeholder="Search order, plate or goods"
            items={list}
            getKey={(o) => o.id}
            selectedKey={selected}
            onSelect={setSelected}
            emptyText="No open work orders"
            renderItem={(o) => (
              <>
                <Stack direction="row" justifyContent="space-between" gap={1}>
                  <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }} noWrap>{o.plate}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{waited(o.arrivedAt, now)}</Typography>
                </Stack>
                <Typography variant="body2" noWrap>{o.product} · {formatKg(remainingKg(o))} left</Typography>
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.75} sx={{ mt: 0.75 }}>
                  {isPerishable(o) && <Label color="warning">Perishable</Label>}
                  {o.kind === 'truck-to-truck' && <Label color="warning">Sheds jammed</Label>}
                  {needsPermission(o) && o.customsPermission !== 'Granted' && <Label color="error">Customs permission</Label>}
                </Stack>
              </>
            )}
          />
        }
        center={current ? (
          <WorkOrder
            key={current.id}
            order={current}
            requisition={requisition}
            registered={registered}
            now={now}
            onRaise={() => setDialog({ type: 'raise' })}
            onAddTruck={() => setDialog({ type: 'add' })}
            onTransfer={(r) => setDialog({ type: 'transfer', plate: r.plate })}
            onFinish={() => setDialog({ type: 'finish' })}
            onCheckPermission={checkPermission}
          />
        ) : (
          <Card><EmptyState title={list.length ? 'Select a work order' : 'No open work orders'} sx={{ py: 12 }} /></Card>
        )}
        rail={[
          <Card key="yard" sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Yard T1 today</Typography>
            <Stack spacing={1.25} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
              {[
                ['Open work orders', open.length],
                ['Perishable', open.filter(isPerishable).length],
                ['Waiting for Customs', open.filter((o) => needsPermission(o) && o.customsPermission !== 'Granted').length],
                ['Finished today', workOrders.filter((o) => o.done).length],
              ].map(([l, v]) => (
                <Stack key={l} direction="row" justifyContent="space-between"><Typography variant="body2">{l}</Typography><Typography variant="subtitle2">{v}</Typography></Stack>
              ))}
            </Stack>
          </Card>,
        ]}
      />
      {current && dialog?.type === 'add' && <AddTruckDialog order={current} registered={registered} onClose={() => setDialog(null)} onAdd={addTruck} />}
      {current && dialog?.type === 'transfer' && (
        <TransferDialog
          order={current}
          receiver={current.receivers.find((r) => r.plate === dialog.plate)}
          onReread={() => reread(dialog.plate)}
          onClose={() => setDialog(null)}
          onSave={(kg) => transfer(dialog.plate, kg)}
        />
      )}
      {current && requisition && dialog?.type === 'finish' && <FinishDialog order={current} requisition={requisition} onClose={() => setDialog(null)} onFinish={finish} />}
      {current && (
        <RaiseDialog
          key={current.id}
          open={dialog?.type === 'raise'}
          initial={{ truck: current.plate, shed: YARD, work: 'Transshipment' }}
          onClose={() => setDialog(null)}
          onSave={(f) => { raiseRequisition(f); setDialog(null); setToast('Requisition sent to the contractor and labour union.'); }}
        />
      )}
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
