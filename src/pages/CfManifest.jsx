import { useState } from 'react';
import { Alert, Box, Button, Card, Checkbox, Divider, FormControlLabel, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/common';
import { agencyOf, billTotals, importerName, usePort } from '../demo/PortStore';
import { dayKey, formatBDT, formatBoe, formatDateTime, formatKg } from '../demo/format';
import { ApprovalRow, Confirmation, Fact, Facts, HoldRow, Id, Plate, ReasonField, Refusal, ResponsiveTable, SectionTitle, SourceMarker, StatusPill } from '../demo/ui';
import { AgencyPicker, LicenceBanner, useAgency } from './CfPortal';
import { tr } from '../i18n/LanguageContext';
import { Documents, TieWaitingTruck, TransferRequest, downloadRecord } from './CfExtras';

const CLASSES = [['10-wheel truck', 3], ['12-wheel truck', 4], ['6-wheel truck', 2], ['Covered van', 2]];

function EnterTruck({ mid, ain, onDone }) {
  const p = usePort();
  const [f, setF] = useState({ plate: '', cls: '10-wheel truck', driverName: '', driverId: '', carPass: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const missing = ['plate', 'driverName', 'driverId', 'carPass'].filter((k) => !f[k].trim());
  const problem = p.licenceProblem(ain);
  const save = () => {
    const axles = CLASSES.find((c) => c[0] === f.cls)[1];
    p.enterTruck({ plate: f.plate.trim().toUpperCase(), vehicleClass: f.cls, axles, driverName: f.driverName.trim(), driverId: f.driverId.trim(), carPass: f.carPass.trim(), mid, ain });
    onDone(`Truck ${f.plate.toUpperCase()} entered`);
    setF({ plate: '', cls: '10-wheel truck', driverName: '', driverId: '', carPass: '' });
  };
  return (
    <Card variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="subtitle1" gutterBottom>Enter an incoming truck</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>As written on the Car Pass. The gate checks the plate and Car Pass number against this entry. No driving licence is needed.</Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <TextField required label={tr("Plate")} value={f.plate} onChange={set('plate')} helperText={tr("As registered, for example WB 23 D 1187")} />
        <TextField select label={tr("Vehicle class")} value={f.cls} onChange={set('cls')} helperText={tr("The gate confirms it by counting axles")}>
          {CLASSES.map(([c, a]) => <MenuItem key={c} value={c}>{c} ({a} axles)</MenuItem>)}
        </TextField>
        <TextField required label={tr("Driver's name")} value={f.driverName} onChange={set('driverName')} />
        <TextField required label={tr("Driver's identity number on the Car Pass")} value={f.driverId} onChange={set('driverId')} helperText={tr("BLPA and Customs are still to name the document for foreign drivers")} />
        <TextField required label={tr("Car Pass number")} value={f.carPass} onChange={set('carPass')} />
      </Box>
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {problem && <Refusal title={tr("Truck entry refused")} items={[problem]} />}
        <Box><Button variant="contained" disabled={missing.length > 0 || Boolean(problem)} onClick={save}>{tr("Enter truck")}</Button></Box>
      </Stack>
    </Card>
  );
}

function RecordBoe({ m, lines, ain, onDone }) {
  const p = usePort();
  const open = lines.filter((l) => !p.boeOfLine(l.id));
  const [sel, setSel] = useState(open.map((l) => l.id));
  const [reg, setReg] = useState('');
  const [date, setDate] = useState(dayKey());
  if (!open.length) return null;
  const importers = [...new Set(open.filter((l) => sel.includes(l.id)).map((l) => l.importer))];
  const blockers = [p.licenceProblem(ain), importers.length > 1 && 'A Bill of Entry covers one importer\'s lines. Select lines of one importer.', !sel.length && 'Select at least one line.'].filter(Boolean);
  return (
    <Card variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="subtitle1" gutterBottom>Record the Bill of Entry</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        IBMS checks the importer's BIN and your AIN against BNSW. A line can belong to one Bill of Entry only.{p.state.bnswDown && ' BNSW is down: the number stays keyed and unverified until the revenue desk checks Customs\' release.'}
      </Typography>
      <Stack>
        {open.map((l) => (
          <FormControlLabel key={l.id} control={<Checkbox checked={sel.includes(l.id)} onChange={(e) => setSel(e.target.checked ? [...sel, l.id] : sel.filter((x) => x !== l.id))} />} label={`Line ${l.no}: ${l.goods} · ${importerName(l.importer)} · ${formatKg(l.declaredKg)} declared`} />
        ))}
      </Stack>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '120px 120px 1fr 180px' }, mt: 1.5 }}>
        <TextField label={tr("Type")} value="C" disabled />
        <TextField label={tr("Office")} value={p.port.stationCode} disabled />
        <TextField required label={tr("Registration number")} value={reg} onChange={(e) => setReg(e.target.value)} placeholder={tr("C-48512")} />
        <TextField required label={tr("Date")} type="date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
      </Box>
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        <Refusal title={tr("Bill of Entry not recorded")} items={blockers.filter((b) => b !== 'Select at least one line.')} />
        <Box>
          <Button variant="contained" disabled={blockers.length > 0 || !reg.trim()} onClick={() => { p.recordBoe({ mid: m.id, bin: importers[0], ain, lineIds: sel, reg: reg.trim().toUpperCase(), date }); onDone('Bill of Entry recorded'); setReg(''); }}>
            Record Bill of Entry
          </Button>
        </Box>
      </Stack>
    </Card>
  );
}

function RaiseRequest({ b, ain, onDone }) {
  const p = usePort();
  const [kg, setKg] = useState('');
  const [ceiling, setCeiling] = useState('1');
  const v = p.visitOfManifest(b.manifest);
  const balance = p.releasedBalance(b) - p.inFlightKg(b);
  const holds = p.holdsOnBoe(b);
  const n = Number(kg);
  const blockers = [
    p.licenceProblem(ain),
    !b.release && 'Customs has not released this Bill of Entry yet. A Delivery Request comes after the release.',
    b.release && v && v.stage !== 'Exited' && `The foreign truck ${v.plate} has not exited yet. The bill can be raised only after it leaves.`,
    holds.length && `${holds[0].body} hold: ${holds[0].reason}`,
    n > balance && `You asked for ${formatKg(n)}; the released balance in custody is ${formatKg(balance)}.`,
  ].filter(Boolean);
  return (
    <Card variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="subtitle1" gutterBottom>Raise a Delivery Request</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>One delivery day (today), a quantity up to the released balance and a ceiling of trucks. The bill is raised on submission; each local truck enters on an Entry Pass against a paid slot.</Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' } }}>
        <TextField label={tr("Delivery day")} value={dayKey()} disabled />
        <TextField required label={tr("Quantity (kg)")} type="number" value={kg} onChange={(e) => setKg(e.target.value)} helperText={`Released balance in custody: ${formatKg(balance)}`} />
        <TextField required label={tr("Ceiling of trucks")} type="number" value={ceiling} onChange={(e) => setCeiling(e.target.value)} inputProps={{ min: 1, max: 6 }} />
      </Box>
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        <Refusal title={tr("Delivery Request refused")} items={blockers} />
        <Box>
          <Button variant="contained" disabled={blockers.length > 0 || !n || Number(ceiling) < 1} onClick={() => { p.raiseDeliveryRequest({ boeId: b.id, kg: n, ceiling: Number(ceiling) }); onDone('Delivery Request raised and bill issued'); setKg(''); }}>
            Raise Delivery Request
          </Button>
        </Box>
      </Stack>
    </Card>
  );
}

function BillCard({ bill, onPay }) {
  const tot = billTotals(bill);
  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
        <Box>
          <Typography variant="subtitle2">Bill · payment ID <Id>{bill.paymentId}</Id></Typography>
          <Typography variant="caption" color="text.secondary">Raised {formatDateTime(bill.raisedAt)} · {bill.lines.length} lines</Typography>
        </Box>
        <StatusPill word={bill.status} />
      </Stack>
      {bill.lines.map((l) => (
        <Stack key={l.what} direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.5 }}>
          <Typography variant="body2" color="text.secondary">{l.what}: {l.qty} {l.unit} × {formatBDT(l.rate)}{l.note ? ` (${l.note})` : ''}</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>{formatBDT(l.qty * l.rate)}</Typography>
        </Stack>
      ))}
      <Divider sx={{ my: 1 }} />
      <Stack direction="row" justifyContent="space-between"><Typography variant="body2">VAT 15%</Typography><Typography variant="body2">{formatBDT(tot.vat)}</Typography></Stack>
      <Stack direction="row" justifyContent="space-between"><Typography variant="subtitle2">Total</Typography><Typography variant="subtitle2">{formatBDT(tot.total)}</Typography></Stack>
      {bill.status === 'Payment due' && onPay && (
        <Button variant="contained" sx={{ mt: 1.5 }} onClick={onPay}>{tr("Pay online")}</Button>
      )}
      {bill.status === 'Paid' && <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>Paid {formatDateTime(bill.paidAt)} · {bill.provider}</Typography>}
    </Card>
  );
}

function Slot({ d, slot, idx, onDone }) {
  const p = usePort();
  const [plate, setPlate] = useState('');
  const bill = p.bill(d.bill);
  if (slot.plate) {
    const ps = slot.pass && p.pass(slot.pass);
    return (
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ py: 1 }}>
        <Typography variant="body2" color="text.secondary">Slot {idx + 1}</Typography>
        <Plate>{slot.plate}</Plate>
        <SourceMarker source="Keyed by the agency" />
        {slot.enteredAt ? <StatusPill word="Admitted" /> : <StatusPill word="Expected" />}
        {ps && <StatusPill word={p.passStatus(ps)} />}
      </Stack>
    );
  }
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ py: 1 }}>
      <Typography variant="body2" color="text.secondary">Slot {idx + 1}</Typography>
      <TextField size="small" label={tr("Plate of the local truck")} value={plate} onChange={(e) => setPlate(e.target.value)} disabled={bill.status !== 'Paid'} helperText={bill.status !== 'Paid' ? 'Pay the bill first; slots open once it is paid' : 'Key it up to the moment the truck enters'} />
      <Button variant="outlined" disabled={!plate.trim() || bill.status !== 'Paid'} onClick={() => { p.bindPlate(d.id, idx, plate.trim()); onDone(`Plate ${plate.trim()} keyed`); setPlate(''); }}>{tr("Key plate")}</Button>
    </Stack>
  );
}

function PassSigning({ pass, onDone, ain }) {
  const p = usePort();
  const [changing, setChanging] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [reason, setReason] = useState('');
  const agency = agencyOf(ain);
  const status = p.passStatus(pass);
  const tc = p.state.truckChanges.find((x) => x.pass === pass.id && !x.done);
  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="subtitle2">{'Exit Pass'} <Id>{pass.id}</Id></Typography>
          <Typography variant="body2" color="text.secondary"><Plate>{pass.plate}</Plate> · {pass.goods} · {formatKg(pass.kg)} · valid to the end of {dayKey(pass.validDay)}</Typography>
        </Box>
        <StatusPill word={status} />
      </Stack>
      {pass.invalidatedBy && <Alert severity="error" sx={{ mt: 1 }}>A hold invalidated this pass. Lifting the hold does not revive it; a new pass is issued with its approvals.</Alert>}
      <Box sx={{ mt: 1 }}>
        <ApprovalRow title={tr("Shed in-charge")} approval={pass.approvals.shed} />
        <ApprovalRow title={tr("Customs Assistant Revenue Officer")} approval={pass.approvals.aro} />
        <ApprovalRow
          title={`C&F authorized signer (${agency.signer})`}
          approval={pass.approvals.signer}
          action={!pass.invalidatedBy && !pass.used && <Button size="small" variant="contained" disabled={Boolean(p.licenceProblem(ain))} onClick={() => { p.signPass(pass.id, 'signer'); onDone('Exit Pass signed'); }}>{tr("Sign Exit Pass")}</Button>}
        />
      </Box>
      {pass.approvals.shed && !pass.used && !pass.invalidatedBy && (
        <Box sx={{ mt: 1.5 }}>
          {tc ? (
            <Alert severity="warning">Truck change {tc.from} to {tc.to} sent for approval to the shed in-charge and the Customs ARO. You proposed it, so you cannot approve it.</Alert>
          ) : changing ? (
            <Stack spacing={1.5}>
              <TextField size="small" label={tr("New plate")} value={newPlate} onChange={(e) => setNewPlate(e.target.value)} />
              <ReasonField value={reason} onChange={setReason} label={tr("Reason for the truck change")} />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" disabled={!newPlate.trim() || !reason.trim()} onClick={() => { p.proposeTruckChange(pass.id, newPlate.trim(), reason.trim()); setChanging(false); onDone('Truck change sent for approval'); }}>{tr("Send for approval")}</Button>
                <Button variant="outlined" color="inherit" onClick={() => setChanging(false)}>{tr("Cancel")}</Button>
              </Stack>
            </Stack>
          ) : (
            <Button size="small" variant="outlined" color="inherit" onClick={() => setChanging(true)}>{tr("Propose a truck change")}</Button>
          )}
        </Box>
      )}
    </Card>
  );
}

export default function CfManifest() {
  const { manifestId } = useParams();
  const p = usePort();
  const { ain, canPick, pick } = useAgency();
  const [msg, setMsg] = useState('');
  const m = p.manifest(decodeURIComponent(manifestId));
  if (!m || !Object.values(m.tags).includes(ain)) {
    return (
      <>
        <PageHeader title={tr("Consignment")} links={[{ name: 'C&F portal', href: '/cf-portal' }, { name: 'Not found' }]} action={canPick && <AgencyPicker ain={ain} pick={pick} />} />
        <Alert severity="info">This consignment is not tagged to your agency, so it is not shown. An importer tags its agency in its own portal.</Alert>
      </>
    );
  }
  const lines = m.lines.filter((l) => m.tags[l.importer] === ain);
  const visits = p.state.visits.filter((v) => v.manifests.includes(m.id));
  const boes = p.state.boes.filter((b) => b.manifest === m.id && b.agency === ain);
  const events = p.state.events.filter((e) => e.record === m.id || boes.some((b) => p.state.deliveryRequests.some((d) => d.boe === b.id && d.id === e.record))).slice(0, 12);
  return (
    <>
      <PageHeader
        title={m.id}
        links={[{ name: 'C&F portal', href: '/cf-portal' }, { name: m.id }]}
        subtitle={`${m.alias} · from ${m.exporter}`}
        action={<Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>{canPick && <AgencyPicker ain={ain} pick={pick} />}<Button variant="outlined" color="inherit" onClick={() => downloadRecord(m, lines, visits, boes, events)}>{tr('Download the record')}</Button></Stack>}
      />
      <LicenceBanner ain={ain} />
      <Stack spacing={3}>
        {p.holdsOnManifest(m.id).map((h) => <HoldRow key={h.id} hold={h} />)}
        <TieWaitingTruck m={m} ain={ain} onDone={setMsg} />

        <Card sx={{ p: 3 }}>
          <SectionTitle>Lines tagged to your agency</SectionTitle>
          <ResponsiveTable
            rowKey={(l) => l.id}
            rows={lines}
            columns={[
              { label: 'Line', render: (l) => l.no },
              { label: 'Goods', render: (l) => l.goods },
              { label: 'Importer', priority: 'low', render: (l) => importerName(l.importer) },
              { label: 'Declared weight', align: 'right', render: (l) => formatKg(l.declaredKg) },
              { label: 'Bill of Entry', render: (l) => { const b = p.boeOfLine(l.id); return b ? <Stack direction="row" spacing={1} alignItems="center"><Id>{formatBoe(b)}</Id><SourceMarker source={b.source} /></Stack> : '–'; } },
              { label: 'Status', render: (l) => { const b = p.boeOfLine(l.id); return <StatusPill word={!b ? 'Open' : b.release ? 'Released' : 'Awaiting Customs'} />; } },
            ]}
          />
        </Card>

        <Card sx={{ p: 3 }}>
          <SectionTitle>Trucks</SectionTitle>
          <Stack spacing={1.5}>
            {visits.map((v) => (
              <Stack key={v.id} direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Plate size="large">{v.plate}</Plate>
                <StatusPill word={v.stage} />
                {v.holding && <StatusPill word="In the holding area" />}
                <Typography variant="body2" color="text.secondary">Car Pass {v.carPass} · {v.vehicleClass}</Typography>
                {v.weigh && <Typography variant="body2" color="text.secondary">Weight {formatKg(v.weigh.kg)} · billable {Math.ceil(v.weigh.kg / 1000)} t</Typography>}
                {v.posting?.accepted && <Typography variant="body2" color="text.secondary">Drop point {v.posting.shed}</Typography>}
              </Stack>
            ))}
            {!visits.some((v) => v.stage !== 'Exited') && <EnterTruck mid={m.id} ain={ain} onDone={setMsg} />}
            {visits.length === 0 && <Typography variant="body2" color="text.secondary">No truck entered yet.</Typography>}
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <SectionTitle>Bills of Entry and deliveries</SectionTitle>
          <Stack spacing={2}>
            <RecordBoe m={m} lines={lines} ain={ain} onDone={setMsg} />
            {boes.map((b) => {
              const drs = p.state.deliveryRequests.filter((d) => d.boe === b.id);
              return (
                <Card key={b.id} variant="outlined" sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1"><Id sx={{ typography: 'subtitle1' }}>{formatBoe(b)}</Id></Typography>
                    <SourceMarker source={b.source} />
                    <StatusPill word={b.release ? 'Released' : 'Awaiting Customs'} />
                    {b.closed && <StatusPill word="Closed" />}
                  </Stack>
                  <Facts cols={4}>
                    <Fact label={tr("Importer")}>{importerName(b.importer)}</Fact>
                    <Fact label={tr("Released")}>{b.release ? <>{formatKg(b.release.kg)} <SourceMarker source={b.release.source} /></> : '–'}</Fact>
                    <Fact label={tr("Delivered")}>{formatKg(b.deliveredKg)}</Fact>
                    <Fact label={tr("Balance in custody")}>{b.release ? formatKg(p.releasedBalance(b)) : '–'}</Fact>
                  </Facts>
                  <Stack spacing={2} sx={{ mt: 2.5 }}>
                    {!b.closed && <RaiseRequest b={b} ain={ain} onDone={setMsg} />}
                    {drs.map((d) => (
                      <Box key={d.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 1.5 }}>
                          <Typography variant="subtitle1">{'Delivery Request'} <Id sx={{ typography: 'subtitle1' }}>{d.id}</Id></Typography>
                          <StatusPill word={d.closed ? 'Closed' : 'Open'} />
                          <Typography variant="body2" color="text.secondary">{dayKey(d.day)} · {formatKg(d.kg)} · up to {d.ceiling} truck{d.ceiling === 1 ? '' : 's'}</Typography>
                        </Stack>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
                          <BillCard bill={p.bill(d.bill)} onPay={() => { p.payBill(d.bill); setMsg('Paid. The provider confirmed the payment'); }} />
                          <Box>
                            {d.slots.map((sl, i) => <Slot key={i} d={d} slot={sl} idx={i} onDone={setMsg} />)}
                          </Box>
                        </Box>
                        <Stack spacing={1.5} sx={{ mt: 2 }}>
                          {d.slots.filter((sl) => sl.pass).map((sl) => <PassSigning key={sl.pass} pass={p.pass(sl.pass)} ain={ain} onDone={setMsg} />)}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        </Card>

        <TransferRequest m={m} lines={lines} ain={ain} onDone={setMsg} />
        <Documents m={m} lines={lines} />

        <Card sx={{ p: 3 }}>
          <SectionTitle>Alerts</SectionTitle>
          <Stack spacing={1}>
            {events.map((e) => (
              <Box key={e.id}>
                <Typography variant="body2">{e.text}</Typography>
                <Typography variant="caption" color="text.secondary">{formatDateTime(e.at)} · {e.by}</Typography>
              </Box>
            ))}
          </Stack>
        </Card>
      </Stack>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
