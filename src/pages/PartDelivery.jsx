import { useState } from 'react';
import {
  Box, Card, Stack, Typography, Button, Divider, Alert, Snackbar, LinearProgress, Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment, MenuItem, Link,
} from '@mui/material';
import { PageHeader, DetailRow, formatKg, formatBDT, EmptyState, AssumptionNote, TableScroll } from '../components/common';
import { Workbench, QueueCard } from '../components/Workbench';
import Label from '../components/Label';
import { useCfTrucks } from '../CfTrucksContext';

// Demo rate only, so a part bill has an amount to show.
const partBillRatePerKg = 0.1025;
const initialConsignments = [
  {
    id: 'BEN-IGM-2026-08841', product: 'Rice (non-basmati)', importer: 'Delta Agro Foods Ltd.', agency: 'Rupsha Clearing & Forwarding', receivedKg: 64000,
    deliveries: [{ bill: 'PB-BEN-7701', truck: 'JESSORE-TA-11-2034', kg: 16000, at: '27 Oct, 08:40' }],
    sharedWith: [],
  },
  {
    id: 'BEN-IGM-2026-08866', product: 'Gelatin capsule shells', importer: 'Orion Pharma Inputs Ltd.', agency: 'Meghna Trade Logistics', receivedKg: 2400,
    deliveries: [
      { bill: 'PB-BEN-7688', truck: 'KHULNA-DA-14-0433', kg: 600, at: '24 Oct, 15:20' },
      { bill: 'PB-BEN-7695', truck: 'KHULNA-DA-14-0433', kg: 400, at: '26 Oct, 11:05' },
    ],
    sharedWith: [
      { importer: 'Orion Pharma Inputs Ltd.', agency: 'Meghna Trade Logistics', product: 'Gelatin capsule shells', kg: 2400 },
      { importer: 'Beacon Healthcare Ltd.', agency: 'Rupsha Clearing & Forwarding', product: 'Gelatin capsule shells', kg: 1800 },
      { importer: 'Incepta Inputs Ltd.', agency: 'Padma Border Agents', product: 'Gelatin capsule shells', kg: 1500 },
    ],
  },
];
const deliveredKg = (c) => c.deliveries.reduce((sum, d) => sum + d.kg, 0);

// The truck comes from the local trucks the C&F agent registered for this manifest: no typed or invented plates (F32).
function RecordDialog({ consignment, trucks, onClose, onSave }) {
  const remaining = consignment.receivedKg - deliveredKg(consignment);
  const [truck, setTruck] = useState('');
  const [kg, setKg] = useState('');
  const amount = Number(kg);
  const tooMuch = amount > remaining;
  let helper = `Up to ${formatKg(remaining)}`;
  if (tooMuch) helper = `Only ${formatKg(remaining)} remains`;
  else if (amount > 0) helper = `${amount === remaining ? 'Nothing' : formatKg(remaining - amount)} will remain. Part bill ${formatBDT(amount * partBillRatePerKg)} (demo rate)`;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Record part delivery</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {consignment.product} on <Box component="span" sx={{ fontFamily: 'monospace' }}>{consignment.id}</Box> · {formatKg(remaining)} still in the port
        </Typography>
        <Stack spacing={2} sx={{ pt: 2.5 }}>
          {trucks.length ? (
            <TextField
              select fullWidth required label="Local truck" value={truck} onChange={(e) => setTruck(e.target.value)} helperText="Registered for this manifest by the C&F agent"
              SelectProps={{ renderValue: (plate) => <Box component="span" sx={{ fontFamily: 'monospace' }}>{plate}</Box> }}
            >
              {trucks.map((t) => <MenuItem key={t.plate} value={t.plate}><Box component="span" sx={{ fontFamily: 'monospace' }}>{t.plate}</Box>&nbsp;· {t.cls} · {t.driver}</MenuItem>)}
            </TextField>
          ) : (
            <Alert severity="info">No local trucks are registered for this manifest. The C&amp;F agent registers them in the C&amp;F portal.</Alert>
          )}
          <TextField
            fullWidth required label="Quantity actually delivered" value={kg}
            onChange={(e) => setKg(e.target.value.replace(/\D/g, ''))}
            error={tooMuch}
            helperText={helper}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> } }}
          />
          {amount !== remaining && <Link component="button" type="button" variant="subtitle2" underline="hover" sx={{ alignSelf: 'flex-start' }} onClick={() => setKg(String(remaining))}>Deliver all {formatKg(remaining)}</Link>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!truck || amount <= 0 || tooMuch} onClick={() => onSave(truck, amount)}>Record and bill</Button>
      </DialogActions>
    </Dialog>
  );
}

function ConsignmentRecord({ consignment, onRecord }) {
  const [recording, setRecording] = useState(false);
  const { local } = useCfTrucks();
  const delivered = deliveredKg(consignment);
  const remaining = consignment.receivedKg - delivered;
  return (
    <Card>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ p: 3 }}>
        <Box>
          <Typography className="record-plate" variant="h5" sx={{ fontFamily: 'monospace' }}>{consignment.id}</Typography>
          <Typography variant="body2" color="text.secondary">{consignment.product} · {consignment.importer}</Typography>
        </Box>
        {remaining === 0 ? <Label color="success">Fully delivered</Label> : <Label color="info">{formatKg(remaining)} remaining</Label>}
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
          <Typography variant="body2">{formatKg(delivered)} delivered</Typography>
          <Typography variant="body2" color="text.secondary">of {formatKg(consignment.receivedKg)}</Typography>
        </Stack>
        <LinearProgress variant="determinate" value={(delivered / consignment.receivedKg) * 100} />
        <AssumptionNote code="F39" sx={{ mt: 2 }}>Part delivery rules differ by port. BLPA still has to approve one rule set for all ports.</AssumptionNote>
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Typography variant="subtitle2" sx={{ px: 3, pt: 3, pb: 1 }}>Deliveries and part bills</Typography>
      <TableScroll>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>Part bill</TableCell>
              <TableCell>Truck</TableCell>
              <TableCell>Delivered</TableCell>
              <TableCell sx={{ pr: 3 }}>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {consignment.deliveries.map((d) => (
              <TableRow key={d.bill}>
                <TableCell sx={{ pl: 3, whiteSpace: 'nowrap' }}>{d.bill}<Typography variant="caption" color="text.secondary" component="div">{d.at}</Typography></TableCell>
                <TableCell sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{d.truck}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatKg(d.kg)}</TableCell>
                <TableCell sx={{ pr: 3, whiteSpace: 'nowrap' }}>{formatBDT(d.kg * partBillRatePerKg)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScroll>
      <Stack className="record-actions" direction="row" justifyContent="flex-end" sx={{ p: 3 }}>
        <Button variant="contained" size="large" disabled={remaining === 0} onClick={() => setRecording(true)}>Record part delivery</Button>
      </Stack>
      {recording && <RecordDialog consignment={consignment} trucks={local[consignment.id] ?? []} onClose={() => setRecording(false)} onSave={(truck, kg) => { setRecording(false); onRecord(truck, kg); }} />}
    </Card>
  );
}

function SharedTruckCard({ consignment }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>On the same foreign truck</Typography>
      {consignment.sharedWith.length === 0 ? (
        <Typography variant="body2" color="text.secondary">This truck carries one importer's goods.</Typography>
      ) : (
        <>
          <Stack spacing={1.5} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
            {consignment.sharedWith.map((s) => (
              <Box key={s.importer}>
                <Typography variant="body2">{s.importer}</Typography>
                <Typography variant="caption" color="text.secondary">{s.agency} · {s.product} · {formatKg(s.kg)}</Typography>
              </Box>
            ))}
          </Stack>
          <AssumptionNote code="F40" sx={{ mt: 2 }}>How haltage is shared between these importers is not decided yet.</AssumptionNote>
        </>
      )}
    </Card>
  );
}

export default function PartDelivery() {
  const [consignments, setConsignments] = useState(initialConsignments);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(initialConsignments[0].id);
  const [toast, setToast] = useState('');
  const filtered = consignments.filter((c) => `${c.id} ${c.importer} ${c.product}`.toLowerCase().includes(search.toLowerCase()));
  const current = consignments.find((c) => c.id === selected);

  const record = (truck, kg) => {
    const bill = `PB-BEN-${7702 + consignments.reduce((n, c) => n + c.deliveries.length, 0)}`;
    setConsignments((cs) => cs.map((c) => (c.id === selected ? { ...c, deliveries: [...c.deliveries, { bill, truck, kg, at: 'Just now' }] } : c)));
    setToast(`${formatKg(kg)} delivered to ${truck}. Part bill ${bill} created.`);
  };

  return (
    <>
      <PageHeader title="Part delivery" links={[{ name: 'Operations' }, { name: 'Part delivery' }]} subtitle="Goods released in instalments, with the quantity actually delivered and a part bill for each." />
      <Workbench
        queue={
          <QueueCard
            title="Consignments"
            count={filtered.length}
            search={search}
            onSearch={setSearch}
            placeholder="Search manifest or importer"
            items={filtered}
            getKey={(c) => c.id}
            selectedKey={selected}
            onSelect={setSelected}
            emptyText="No consignments"
            renderItem={(c) => (
              <>
                <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }} noWrap>{c.id}</Typography>
                <Typography variant="body2" noWrap>{c.product}</Typography>
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.75} sx={{ mt: 0.75 }}>
                  <Label>{formatKg(c.receivedKg - deliveredKg(c))} left</Label>
                  {c.sharedWith.length > 0 && <Label color="info">Shared truck</Label>}
                </Stack>
              </>
            )}
          />
        }
        center={current ? <ConsignmentRecord key={current.id} consignment={current} onRecord={record} /> : <Card><EmptyState title="Select a consignment" sx={{ py: 12 }} /></Card>}
        rail={current ? [
          <Card key="details" sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Consignment</Typography>
            <DetailRow labelWidth={72} label="Agency">{current.agency}</DetailRow>
            <DetailRow labelWidth={72} label="Importer">{current.importer}</DetailRow>
          </Card>,
          <SharedTruckCard key="shared" consignment={current} />,
        ] : null}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
