import { useState } from 'react';
import {
  Button, Tabs, Tab, Typography, Alert, Snackbar, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Divider,
} from '@mui/material';
import { PageHeader, AssumptionNote, DetailRow, formatKg, formatBDT } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { tariffLines } from '../data/mock';

const rate = (charge) => tariffLines.find((t) => t.charge === charge).rate;
const ENTRANCE_FEE = rate('Entrance fee (inland gate)');
const HALTAGE_PER_DAY = rate('Haltage');
const SHED_RATE_PER_TONNE = rate('Shed storage, days 1–10');
const initialCargo = [
  { id: 'EXP-BEN-0931', type: 'Export', goods: 'Garment cartons', manifest: 'BEN-EGM-2026-01204', location: 'Shed 9 · S9A-R3', kg: 12000, days: 4, billed: false },
  { id: 'EXP-BEN-0928', type: 'Re-export', goods: 'Machinery parts', manifest: 'BEN-EGM-2026-01198', location: 'Open yard 1 · OY1A-R2', kg: 7400, days: 9, billed: true },
  { id: 'EXP-BEN-0925', type: 'Export', goods: 'Jute bags', manifest: 'BEN-EGM-2026-01187', location: 'Shed 5 · S5A-R4', kg: 5600, days: 2, billed: false },
];
const initialTrucks = [
  { plate: 'JESSORE-TA-11-2240', manifest: 'BEN-EGM-2026-01204', driver: 'Nazmul Haque', location: 'Border gate lane B1', status: 'At the border' },
  { plate: 'KHULNA-DA-14-0520', manifest: 'BEN-EGM-2026-01198', driver: 'Shafiq Uddin', location: 'Export yard', status: 'At the border' },
  { plate: 'JESSORE-TA-11-2199', manifest: 'BEN-EGM-2026-01176', driver: 'Liton Das', location: 'Returned inland', status: 'Returned', returnCharge: 533.92, remark: 'Goods refused at the Indian side' },
];
const storageCharge = (c) => (c.kg / 1000) * SHED_RATE_PER_TONNE;

function ReturnDialog({ truck, onClose, onSave }) {
  const [days, setDays] = useState('');
  const [remark, setRemark] = useState('');
  const charge = ENTRANCE_FEE + Number(days) * HALTAGE_PER_DAY;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Record return of {truck.plate}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>This export truck is going back inland without exporting.</Typography>
        <Stack spacing={2}>
          <TextField fullWidth required label="Days waited" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} />
          <TextField fullWidth required multiline minRows={2} label="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Stack>
        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
        <DetailRow label="Entrance fee">{formatBDT(ENTRANCE_FEE)}</DetailRow>
        <DetailRow label="Haltage">{formatBDT(Number(days) * HALTAGE_PER_DAY)}</DetailRow>
        <DetailRow label="Total"><b>{formatBDT(charge)}</b></DetailRow>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={days === '' || !remark.trim()} onClick={() => onSave(charge, remark.trim())}>Record return</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ExportCargo() {
  const [tab, setTab] = useState('cargo');
  const [cargo, setCargo] = useState(initialCargo);
  const [trucks, setTrucks] = useState(initialTrucks);
  const [returning, setReturning] = useState(null);
  const [toast, setToast] = useState('');

  return (
    <>
      <PageHeader title="Export" links={[{ name: 'Operations' }, { name: 'Export' }]} subtitle="Storage and billing for export and re-export cargo, and a record of export trucks that return inland." />
      <Alert severity="info" sx={{ mb: 3 }}>Demonstration tariff, not legal rates.</Alert>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="cargo" label="Cargo in storage" />
        <Tab value="trucks" label="Export trucks" />
      </Tabs>
      {tab === 'cargo' ? (
        <DataTable rows={cargo} searchKeys={['id', 'goods', 'manifest']} searchPlaceholder="Search cargo or manifest" rowKey={(r) => r.id} columns={[
          { key: 'id', label: 'Cargo', render: (r) => <><Typography variant="subtitle2">{r.id}</Typography><Typography variant="caption" color="text.secondary">{r.manifest}</Typography></> },
          { key: 'type', label: 'Type', render: (r) => <Label color={r.type === 'Export' ? 'info' : 'primary'}>{r.type}</Label> },
          { key: 'goods', label: 'Goods', render: (r) => <>{r.goods}<Typography variant="caption" color="text.secondary" component="div">{formatKg(r.kg)}</Typography></> },
          { key: 'location', label: 'Location' },
          { key: 'days', label: 'Days stored' },
          { key: 'charge', label: 'Storage charge', render: (r) => formatBDT(storageCharge(r)) },
          { key: 'a', label: '', render: (r) => (r.billed ? <Label color="success">Billed</Label> : <Button size="small" variant="outlined" onClick={() => { setCargo((cs) => cs.map((c) => (c.id === r.id ? { ...c, billed: true } : c))); setToast(`${formatBDT(storageCharge(r))} billed for ${r.id}.`); }}>Bill storage</Button>) },
        ]} />
      ) : (
        <>
          <AssumptionNote code="F50" sx={{ mb: 3 }}>Whether an empty Bangladeshi export truck pays on return was asked and not answered. Here every returned truck pays.</AssumptionNote>
          <DataTable rows={trucks} searchKeys={['plate', 'manifest']} searchPlaceholder="Search plate or manifest" rowKey={(r) => r.plate} columns={[
            { key: 'plate', label: 'Truck', render: (r) => <><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{r.plate}</Typography><Typography variant="caption" color="text.secondary">{r.driver}</Typography></> },
            { key: 'manifest', label: 'Manifest' },
            { key: 'location', label: 'Location' },
            { key: 'status', label: 'Status', render: (r) => <Label color={r.status === 'Returned' ? 'warning' : 'info'}>{r.status}</Label> },
            { key: 'returnCharge', label: 'Return charge', render: (r) => (r.returnCharge != null ? <>{formatBDT(r.returnCharge)}<Typography variant="caption" color="text.secondary" component="div">{r.remark}</Typography></> : '—') },
            { key: 'a', label: '', render: (r) => r.status !== 'Returned' && <Button size="small" variant="outlined" onClick={() => setReturning(r)}>Record return</Button> },
          ]} />
        </>
      )}
      {returning && (
        <ReturnDialog
          truck={returning}
          onClose={() => setReturning(null)}
          onSave={(returnCharge, remark) => {
            setTrucks((ts) => ts.map((t) => (t.plate === returning.plate ? { ...t, status: 'Returned', location: 'Returned inland', returnCharge, remark } : t)));
            setToast(`${returning.plate} recorded as returned. ${formatBDT(returnCharge)} billed.`);
            setReturning(null);
          }}
        />
      )}
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
