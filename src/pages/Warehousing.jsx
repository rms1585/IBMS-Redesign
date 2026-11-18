import { useState, useEffect } from 'react';
import {
  Box, Card, Stack, Typography, Button, Divider, Grid2 as Grid, TextField, MenuItem, Alert, Snackbar, Tabs, Tab, Link,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader, DetailRow, formatKg, formatBDT, EmptyState, AssumptionNote } from '../components/common';
import { Workbench, QueueCard, CameraCard } from '../components/Workbench';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { AddRoundedIcon } from '../components/icons';
import { RaiseDialog, equipmentText, equipmentPhrase, sameEquipment } from './Labour';
import {
  useWarehouse, requisitionFor, gangByName, isDoubleHandling, SHIFTING_FEE_PER_T,
} from '../WarehouseContext';
import { useAudit } from '../AuditContext';
import { currentUser } from '../data/mock';

const channelColor = { Green: 'success', Yellow: 'warning', Red: 'error' };
const needsExamination = (item) => ['Yellow', 'Red'].includes(item.customs.channel);
// Benapole records the higher of the declared and weighbridge weight at receipt (F26).
const receiptWeight = (item) => Math.max(item.declaredKg, item.weighedKg);
const toTonnes = (kg) => Math.round(kg / 100) / 10;
const tonnes = (t) => `${t.toLocaleString('en-US', { maximumFractionDigits: 1 })} t`;

// Unloading starts only for the expected truck, with a gang the contractor and labour union assigned.
function unloadingBlock(item, plateRead, requisition) {
  if (plateRead !== item.plate) return `The handheld read ${plateRead}, which doesn't match this truck. Unloading stays stopped until the plate matches.`;
  if (!requisition) return 'No labour requisition for this truck yet. Raise one so the contractor and labour union can send a gang.';
  if (requisition.status !== 'Gang assigned') return `${requisition.id} is waiting for the contractor and labour union to assign a gang.`;
  return null;
}

function Elapsed({ since }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const s = Math.floor((now - since) / 1000);
  return <>{String(Math.floor(s / 3600)).padStart(2, '0')}:{String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}</>;
}

function CustomsStatus({ item }) {
  if (!item.customs.boe) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 2 }}>
        Bill of Entry not filed yet. Its number and Customs channel arrive through BNSW once the C&amp;F agent files it.
      </Typography>
    );
  }
  if (!needsExamination(item)) return null;
  return (
    <Box sx={{ px: 3, pb: 3 }}>
      <Alert severity={item.customs.channel === 'Red' ? 'error' : 'warning'}>
        <Box component="span" sx={{ fontWeight: 600 }}>Examination notice: {item.customs.channel.toLowerCase()} channel.</Box>{' '}
        Customs will physically examine these goods at this shed. Keep them reachable at {item.parts.map((p) => p.bay).join(', ')} and don&apos;t stack other cargo in front.
      </Alert>
      <AssumptionNote code="F27" sx={{ mt: 1.5 }}>The notice arrives as a BNSW status in this demo. How Customs reaches IBMS is to be confirmed with NBR (#61).</AssumptionNote>
    </Box>
  );
}

function LabourPanel({ requisition, onRaise }) {
  if (!requisition) {
    return (
      <Alert severity="info" action={<Button color="inherit" size="small" onClick={onRaise}>Raise requisition</Button>}>
        No labour requisition for this truck yet.
      </Alert>
    );
  }
  if (requisition.status !== 'Gang assigned') {
    return (
      <Alert severity="warning">
        <Link component={RouterLink} to="/labour" color="inherit" sx={{ fontWeight: 600 }}>{requisition.id}</Link> asks for {requisition.workers} workers
        and {equipmentPhrase(requisition.requested)}. Waiting for the contractor and labour union to assign a gang.
      </Alert>
    );
  }
  const gang = gangByName(requisition.gang);
  return (
    <>
      <DetailRow label="Gang">
        {gang.name} · <Link component={RouterLink} to="/labour">{requisition.id}</Link>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
          {gang.labourers.length} labourers named by the contractor: {gang.labourers.map((l) => l.name).join(', ')}
        </Typography>
      </DetailRow>
      <DetailRow label="Equipment sent">
        {equipmentText(requisition.sent)}
        {!sameEquipment(requisition.sent, requisition.requested) && (
          <Box sx={{ mt: 0.5 }}><Label color="warning">Requested: {equipmentPhrase(requisition.requested)}</Label></Box>
        )}
      </DetailRow>
      <AssumptionNote code="F24" sx={{ mt: 1.5 }}>How the contractor or labour union confirms the gang is for BLPA to decide (#60). Here the assignment in Labour requisitions stands for it.</AssumptionNote>
    </>
  );
}

// Tonnes by hand and by equipment, lifts per equipment item, and double handling (F25). Lifts captured by the
// contractor's device are shown as such; anything else is entered by the in-charge.
function HandlingFields({ item, requisition, manual, setManual, lifts, setLifts }) {
  const total = toTonnes(receiptWeight(item));
  const sent = requisition.sent;
  if (!sent.length) {
    return <Typography variant="body2" color="text.secondary">No equipment was sent: all {tonnes(total)} is handled by hand.</Typography>;
  }
  const manualT = Number(manual || 0);
  return (
    <>
      <Box className="record-fields" sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Box>
          <TextField
            fullWidth required label="Handled by hand (t)" value={manual}
            onChange={(e) => setManual(e.target.value.replace(/[^\d.]/g, ''))}
            error={manualT > total}
            helperText={manualT > total ? `More than the ${tonnes(total)} received` : `With equipment: ${tonnes(Math.max(0, Math.round((total - manualT) * 10) / 10))}`}
          />
        </Box>
        {sent.map((eq) => {
          const captured = requisition.captured?.[eq];
          return (
            <Box key={eq}>
              <TextField
                fullWidth required label={`Lifts · ${eq}`} value={captured ?? lifts[eq] ?? ''} disabled={captured != null}
                onChange={(e) => setLifts({ ...lifts, [eq]: e.target.value.replace(/\D/g, '') })}
                helperText={captured != null ? 'Captured by the contractor’s device' : 'Entered by you'}
              />
            </Box>
          );
        })}
      </Box>
      {isDoubleHandling(sent) && (
        <Alert severity="info" sx={{ mt: 2 }}>Crane and forklift both used: the equipment tonnes are billed as double handling.</Alert>
      )}
    </>
  );
}

function Record({ item, plateRead, requisition, onRaise, onStart, onFinish }) {
  const [kg, setKg] = useState('');
  const [method, setMethod] = useState('Scale weight (gross − tare)');
  const [actualBay, setActualBay] = useState(item.parts[0].bay);
  const [note, setNote] = useState('');
  const [manual, setManual] = useState('');
  const [lifts, setLifts] = useState({});
  const block = item.stage === 'waiting' ? unloadingBlock(item, plateRead, requisition) : null;
  const receiptKg = receiptWeight(item);
  const totalT = toTonnes(receiptKg);
  const diff = kg ? Number(kg) - receiptKg : 0;

  const sent = requisition?.sent ?? [];
  const liftsFor = (eq) => Number(requisition?.captured?.[eq] ?? lifts[eq] ?? 0);
  const manualT = sent.length ? Number(manual || 0) : totalT;
  const handlingDone = !sent.length || (manual !== '' && manualT <= totalT && sent.every((eq) => liftsFor(eq) > 0));
  const handling = () => ({
    manualT,
    equipmentT: Math.round((totalT - manualT) * 10) / 10,
    lifts: Object.fromEntries(sent.map((eq) => [eq, liftsFor(eq)])),
    double: isDoubleHandling(sent),
    source: sent.some((eq) => requisition.captured?.[eq] != null) ? 'Contractor device and in-charge' : 'In-charge',
  });

  return (
    <Card>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ p: 3 }}>
        <Box>
          <Typography className="record-plate" variant="h5" sx={{ fontFamily: 'monospace' }}>{item.plate}</Typography>
          <Typography variant="body2" color="text.secondary">{item.product} · allocated {item.parts.map((p) => p.bay).join(', ')}</Typography>
        </Box>
        {block ? <Label color="error">Unloading stopped</Label>
          : item.stage === 'waiting' ? <Label color="success">Ready to unload</Label>
            : <Label color="info">Unloading · <Elapsed since={item.startedAt} /></Label>}
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Grid container spacing={{ xs: 0, xl: 4 }} sx={{ p: 3, pb: 2 }}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <DetailRow label="Manifest">{item.manifest}</DetailRow>
          <DetailRow label="Category">{item.category}</DetailRow>
          <DetailRow label="C&amp;F agency">{item.agency}</DetailRow>
          <DetailRow label="Bill of Entry">
            {item.customs.boe
              ? <><Box component="span" sx={{ fontFamily: 'monospace' }}>{item.customs.boe}</Box> <Label color={channelColor[item.customs.channel]}>{item.customs.channel} channel</Label></>
              : <Label>Not filed yet</Label>}
          </DetailRow>
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <DetailRow label="Declared">{formatKg(item.declaredKg)}</DetailRow>
          <DetailRow label="Weighbridge net">
            {formatKg(item.weighedKg)}
            {item.sharedTruck && <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>The truck carries several consignments: its net weight is split by declared weight.</Typography>}
          </DetailRow>
          <DetailRow label="Receipt weight">
            <Box component="span" sx={{ fontWeight: 600 }}>{formatKg(receiptKg)}</Box>
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
              The higher of declared and weighbridge ({item.weighedKg > item.declaredKg ? 'weighbridge' : 'declared'})
            </Typography>
          </DetailRow>
        </Grid>
      </Grid>
      <AssumptionNote code="F26" sx={{ px: 3, pb: 2 }}>Using the higher weight is Benapole&apos;s current rule. BLPA is to confirm it for every port.</AssumptionNote>
      <CustomsStatus item={item} />
      <Divider sx={{ borderStyle: 'dashed' }} />
      {item.stage === 'waiting' ? (
        <Box sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Check the truck at the shed door, then start unloading</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>The contractor and labour union assign the gang and equipment from your requisition.</Typography>
          <LabourPanel requisition={requisition} onRaise={onRaise} />
          {block && plateRead !== item.plate && <Alert severity="error" sx={{ mt: 2 }}>{block}</Alert>}
          <Stack className="record-actions" direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="contained" size="large" disabled={Boolean(block)} onClick={() => onStart(item)}>Start unloading</Button>
          </Stack>
        </Box>
      ) : (
        <Box sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>Record what was received · {requisition?.gang ?? 'no gang'} · {equipmentText(sent)}</Typography>
          <Box className="record-fields" sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <Box><TextField fullWidth required label="Unloaded quantity (kg)" value={kg} onChange={(e) => setKg(e.target.value.replace(/\D/g, ''))} helperText={kg ? `${diff >= 0 ? '+' : ''}${diff.toLocaleString()} kg vs receipt weight` : 'Physical count, for shortage or damage'} /></Box>
            <Box>
              <TextField select fullWidth label="Measurement method" value={method} onChange={(e) => setMethod(e.target.value)}>
                {['Scale weight (gross − tare)', 'Package count × unit weight', 'Declared (not measured)'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Box>
            <Box><TextField fullWidth label="Actual bay" value={actualBay} onChange={(e) => setActualBay(e.target.value)} /></Box>
            <Box><TextField fullWidth label="Shortage / damage note" value={note} onChange={(e) => setNote(e.target.value)} /></Box>
          </Box>
          {actualBay !== item.parts[0].bay && <Alert severity="warning" sx={{ mt: 2 }}>The actual bay differs from the allocation. Capacity, category and separation rules will be checked again for {actualBay}.</Alert>}
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 0.5 }}>How it was handled</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Split the {tonnes(totalT)} receipt weight between hand and equipment, and count the lifts. This feeds the contractor bill.</Typography>
          {requisition && <HandlingFields item={item} requisition={requisition} manual={manual} setManual={setManual} lifts={lifts} setLifts={setLifts} />}
          <Stack className="record-actions" direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="contained" size="large" disabled={!kg || !handlingDone} onClick={() => onFinish(item, receiptKg, handling())}>Finish and record receipt</Button>
          </Stack>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>The receipt is locked after recording. Changes need a correction request.</Typography>
        </Box>
      )}
    </Card>
  );
}

// Goods moved inside a shed to make room pay a fee per tonne, charged to the owner of the goods moved (Item 8, Bhomra).
function ShiftingDialog({ open, stock, onClose, onSave }) {
  const empty = { lot: '', to: '', t: '', reason: '' };
  const [f, setF] = useState(empty);
  const lot = stock.find((l) => l.id === f.lot);
  const maxT = lot ? toTonnes(lot.kg) : 0;
  const t = Number(f.t || 0);
  const valid = lot && f.to.trim() && f.to.trim().toUpperCase() !== lot.bay && t > 0 && t <= maxT && f.reason.trim();
  const set = (k) => (e) => setF({ ...f, [k]: k === 't' ? e.target.value.replace(/[^\d.]/g, '') : e.target.value });
  const close = () => { setF(empty); onClose(); };
  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Record shifting</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={12}>
            <TextField select fullWidth required label="Goods moved" value={f.lot} onChange={set('lot')}>
              {stock.map((l) => <MenuItem key={l.id} value={l.id}>{l.product} · {l.manifest} · {l.bay} · {tonnes(toTonnes(l.kg))}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth disabled label="From bay" value={lot?.bay ?? ''} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="To bay" value={f.to} onChange={set('to')} error={Boolean(lot && f.to.trim().toUpperCase() === lot.bay)} helperText={lot && f.to.trim().toUpperCase() === lot.bay ? 'Same as the current bay' : ' '} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth required label="Tonnes moved" value={f.t} onChange={set('t')} error={t > maxT} helperText={lot ? (t > maxT ? `At most ${tonnes(maxT)}` : `Fee ${formatBDT(t * SHIFTING_FEE_PER_T)}`) : ' '} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth disabled label="Charged to" value={lot?.owner ?? ''} helperText="Owner of the goods moved" /></Grid>
          <Grid size={12}><TextField fullWidth required label="Reason" value={f.reason} onChange={set('reason')} placeholder="For example: make room for the solvent drums" /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={close}>Cancel</Button>
        <Button variant="contained" disabled={!valid} onClick={() => { onSave({ lot, to: f.to.trim().toUpperCase(), tonnes: t, reason: f.reason.trim() }); setF(empty); }}>Record shifting</Button>
      </DialogActions>
    </Dialog>
  );
}

function Shifting({ shiftings, onRecord }) {
  return (
    <>
      <AssumptionNote code="Item 8" sx={{ mb: 2 }}>The shifting fee of {formatBDT(SHIFTING_FEE_PER_T)} per tonne is a demonstration rate until BLPA confirms it.</AssumptionNote>
      <DataTable
        rows={shiftings} rowKey={(r) => r.id} searchKeys={['id', 'manifest', 'product', 'owner']} searchPlaceholder="Search shifting, manifest or goods"
        toolbar={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={onRecord} sx={{ flexShrink: 0 }}>Record shifting</Button>}
        columns={[
          { key: 'id', label: 'Shifting', render: (r) => <><Typography variant="subtitle2">{r.id}</Typography><Typography variant="caption" color="text.secondary">{r.at} · {r.by}</Typography></> },
          { key: 'goods', label: 'Goods moved', render: (r) => <>{r.product}<Typography variant="caption" color="text.secondary" component="div" sx={{ fontFamily: 'monospace' }}>{r.manifest}</Typography></> },
          { key: 'move', label: 'Move', render: (r) => <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{r.from} → {r.to}</Typography> },
          { key: 'tonnes', label: 'Tonnes', render: (r) => tonnes(r.tonnes) },
          { key: 'fee', label: 'Fee', render: (r) => formatBDT(r.tonnes * SHIFTING_FEE_PER_T) },
          { key: 'owner', label: 'Charged to', render: (r) => <>{r.owner}<Typography variant="caption" color="text.secondary" component="div">{r.reason}</Typography></> },
        ]}
      />
    </>
  );
}

export default function Warehousing() {
  const {
    receipts, requisitions, stock, shiftings, updateReceipt, recordReceipt, raiseRequisition, addShifting,
  } = useWarehouse();
  const { addEvent } = useAudit();
  const [tab, setTab] = useState('waiting');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(receipts[0]?.key ?? null);
  const [raising, setRaising] = useState(false);
  const [shifting, setShifting] = useState(false);
  const [toast, setToast] = useState('');
  const list = receipts.filter((i) => i.stage === tab && `${i.plate} ${i.manifest}`.toLowerCase().includes(search.toLowerCase()));
  const current = receipts.find((i) => i.key === selected && i.stage === tab);
  const currentReq = current && requisitionFor(requisitions, current.plate);
  const count = (stage) => receipts.filter((i) => i.stage === stage).length;

  const start = (item) => {
    updateReceipt(item.key, { stage: 'unloading', startedAt: Date.now() });
    setTab('unloading');
    setToast(`Unloading started for ${item.plate}.`);
  };
  const finish = (item, receiptKg, handling) => {
    recordReceipt(item, receiptKg, handling);
    addEvent({
      actor: currentUser.name, role: currentUser.role, module: 'Warehouse', type: 'Record',
      text: `Recorded receipt of ${item.product} from ${item.plate} into ${item.parts[0].bay}: ${formatKg(receiptKg)}; ${tonnes(handling.manualT)} by hand, ${tonnes(handling.equipmentT)} with equipment${handling.double ? ' (double handling)' : ''}`,
    });
    setSelected(null);
    setToast(`Receipt recorded: ${formatKg(receiptKg)} into ${item.parts[0].bay}. The requisition is complete.`);
  };
  const recordShifting = ({ lot, to, tonnes: t, reason }) => {
    addShifting({ lot: lot.id, manifest: lot.manifest, product: lot.product, owner: lot.owner, from: lot.bay, to, tonnes: t, reason, by: currentUser.name });
    addEvent({
      actor: currentUser.name, role: currentUser.role, module: 'Warehouse', type: 'Record',
      text: `Shifted ${tonnes(t)} of ${lot.product} (${lot.manifest}) from ${lot.bay} to ${to}; fee ${formatBDT(t * SHIFTING_FEE_PER_T)} charged to ${lot.owner}`,
    });
    setShifting(false);
    setToast(`Shifting recorded. ${formatBDT(t * SHIFTING_FEE_PER_T)} is charged to ${lot.owner}.`);
  };

  return (
    <>
      <PageHeader title="Warehouse receipt" links={[{ name: 'Operations' }, { name: 'Warehousing' }]} />
      <Tabs value={tab} onChange={(e, v) => { setTab(v); setSelected(null); }} sx={{ mb: 3 }} variant="scrollable" allowScrollButtonsMobile>
        <Tab value="waiting" label={<Stack direction="row" spacing={1} alignItems="center"><span>Waiting</span><Label>{count('waiting')}</Label></Stack>} />
        <Tab value="unloading" label={<Stack direction="row" spacing={1} alignItems="center"><span>Unloading</span><Label>{count('unloading')}</Label></Stack>} />
        <Tab value="shifting" label="Shifting" />
      </Tabs>
      {tab === 'shifting' ? (
        <Shifting shiftings={shiftings} onRecord={() => setShifting(true)} />
      ) : (
        <Workbench
          queue={
            <QueueCard
              title={tab === 'waiting' ? 'Waiting at shed' : 'Unloading now'}
              count={list.length}
              search={search}
              onSearch={setSearch}
              placeholder="Search plate or manifest"
              items={list}
              getKey={(i) => i.key}
              selectedKey={selected}
              onSelect={setSelected}
              renderItem={(i) => {
                const req = requisitionFor(requisitions, i.plate);
                return (
                  <>
                    <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{i.plate}</Typography>
                    <Typography variant="body2" noWrap>{i.product}</Typography>
                    <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.75} sx={{ mt: 0.75 }}>
                      {i.parts.map((p) => <Label key={p.bay}>{p.bay}</Label>)}
                      {i.stage === 'waiting' && i.handheldPlate !== i.plate && <Label color="error">Plate mismatch</Label>}
                      {i.stage === 'waiting' && req?.status !== 'Gang assigned' && <Label color="warning">No gang yet</Label>}
                      {needsExamination(i) && <Label color={channelColor[i.customs.channel]}>Examination</Label>}
                    </Stack>
                  </>
                );
              }}
            />
          }
          center={
            current ? (
              <Record
                key={current.key + current.stage}
                item={current}
                plateRead={current.handheldPlate}
                requisition={currentReq}
                onRaise={() => setRaising(true)}
                onStart={start}
                onFinish={finish}
              />
            ) : (
              <Card><EmptyState title={list.length ? 'Select a truck' : 'No trucks here'} description={list.length ? undefined : 'Trucks appear when the warehouse in-charge accepts their posting.'} sx={{ py: 12 }} /></Card>
            )
          }
          rail={[
            current && (
              <CameraCard
                key="handheld"
                lane={`${current.shed} door · handheld`}
                title="Handheld plate read"
                source="Handheld"
                before="unloading"
                plate={current.handheldPlate}
                expected={current.plate}
                onReread={current.handheldPlate !== current.plate ? () => updateReceipt(current.key, { handheldPlate: current.plate }) : undefined}
              />
            ),
            <Card key="moves" sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Shed 5 today</Typography>
              <Stack spacing={1.25}>
                {[['Waiting at the door', count('waiting'), 'warning'], ['Unloading', count('unloading'), 'primary'], ['Examination notices', receipts.filter(needsExamination).length, 'error']].map(([l, n, c]) => (
                  <Stack key={l} direction="row" justifyContent="space-between"><Typography variant="body2">{l}</Typography><Label color={c}>{n}</Label></Stack>
                ))}
              </Stack>
            </Card>,
          ].filter(Boolean)}
        />
      )}
      {current && (
        <RaiseDialog
          key={current.key}
          open={raising}
          initial={{ truck: current.plate, shed: current.shed }}
          onClose={() => setRaising(false)}
          onSave={(f) => {
            raiseRequisition(f);
            setRaising(false);
            setToast('Requisition sent to the contractor and labour union.');
          }}
        />
      )}
      <ShiftingDialog open={shifting} stock={stock} onClose={() => setShifting(false)} onSave={recordShifting} />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
