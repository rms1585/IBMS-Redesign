import { useState, useEffect } from 'react';
import {
  Box, Card, Stack, Typography, Button, Divider, Grid2 as Grid, TextField, MenuItem, Alert, Snackbar, Tabs, Tab, Link,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader, DetailRow, formatKg, EmptyState } from '../components/common';
import { Workbench, QueueCard } from '../components/Workbench';
import Label from '../components/Label';
import { useWarehouse } from '../WarehouseContext';


function Elapsed({ since }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const s = Math.floor((now - since) / 1000);
  return <>{String(Math.floor(s / 3600)).padStart(2, '0')}:{String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}</>;
}

function Record({ item, onStart, onFinish }) {
  const [gang, setGang] = useState('Gang 2');
  const [equipment, setEquipment] = useState('None (manual)');
  const [kg, setKg] = useState('');
  const [method, setMethod] = useState('Scale weight (gross − tare)');
  const [actualBay, setActualBay] = useState(item.parts[0].bay);
  const [note, setNote] = useState('');
  const diff = kg ? Number(kg) - item.declaredKg : 0;

  return (
    <Card>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ p: 3 }}>
        <Box>
          <Typography className="record-plate" variant="h5" sx={{ fontFamily: 'monospace' }}>{item.plate}</Typography>
          <Typography variant="body2" color="text.secondary">{item.product} · allocated {item.parts.map((p) => p.bay).join(', ')}</Typography>
        </Box>
        {item.stage === 'waiting' ? <Label color="warning">Waiting at shed door</Label> : <Label color="info">Unloading · <Elapsed since={item.startedAt} /></Label>}
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Grid container spacing={{ xs: 0, xl: 4 }} sx={{ p: 3 }}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <DetailRow label="Manifest">{item.manifest}</DetailRow>
          <DetailRow label="Category">{item.category}</DetailRow>
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <DetailRow label="Declared">{formatKg(item.declaredKg)}</DetailRow>
          <DetailRow label="Weighbridge net">{formatKg(item.weighedKg)}</DetailRow>
        </Grid>
      </Grid>
      <Divider sx={{ borderStyle: 'dashed' }} />
      {item.stage === 'waiting' ? (
        <Box sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Confirm arrival at the shed door, then record who unloads</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>The gang comes from a <Link component={RouterLink} to="/labour">labour requisition</Link>.</Typography>
          <Box className="record-fields" sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <Box>
              <TextField select fullWidth label="Labour gang" value={gang} onChange={(e) => setGang(e.target.value)}>
                {['Gang 1', 'Gang 2', 'Gang 3', 'Gang 4'].map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            </Box>
            <Box>
              <TextField select fullWidth label="Equipment" value={equipment} onChange={(e) => setEquipment(e.target.value)} helperText={equipment.startsWith('None') ? 'Manual unloading rate applies' : 'Equipment unloading rate applies'}>
                {['None (manual)', 'Forklift FL-01', 'Forklift FL-02', 'Mobile crane MC-01'].map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            </Box>
          </Box>
          <Stack className="record-actions" direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="contained" size="large" onClick={() => onStart(item, gang, equipment)}>Start unloading</Button>
          </Stack>
        </Box>
      ) : (
        <Box sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>Record what was received · {item.gang} · {item.equipment}</Typography>
          <Box className="record-fields" sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <Box><TextField fullWidth required label="Unloaded quantity (kg)" value={kg} onChange={(e) => setKg(e.target.value.replace(/\D/g, ''))} helperText={kg ? `${diff >= 0 ? '+' : ''}${diff.toLocaleString()} kg vs declared` : ' '} /></Box>
            <Box>
              <TextField select fullWidth label="Measurement method" value={method} onChange={(e) => setMethod(e.target.value)}>
                {['Scale weight (gross − tare)', 'Package count × unit weight', 'Declared (not measured)'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Box>
            <Box><TextField fullWidth label="Actual bay" value={actualBay} onChange={(e) => setActualBay(e.target.value)} /></Box>
            <Box><TextField fullWidth label="Shortage / damage note" value={note} onChange={(e) => setNote(e.target.value)} /></Box>
          </Box>
          {actualBay !== item.parts[0].bay && <Alert severity="warning" sx={{ mt: 2 }}>The actual bay differs from the allocation. Capacity, category and separation rules will be checked again for {actualBay}.</Alert>}
          <Stack className="record-actions" direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button variant="contained" size="large" disabled={!kg} onClick={() => onFinish(item, Number(kg))}>Finish and record receipt</Button>
          </Stack>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>The receipt is locked after recording. Changes need a correction request.</Typography>
        </Box>
      )}
    </Card>
  );
}

export default function Warehousing() {
  const { receipts: items, updateReceipt, recordReceipt } = useWarehouse();
  const [tab, setTab] = useState('waiting');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(items[0]?.key ?? null);
  const [toast, setToast] = useState('');
  const list = items.filter((i) => i.stage === tab && `${i.plate} ${i.manifest}`.toLowerCase().includes(search.toLowerCase()));
  const current = items.find((i) => i.key === selected && i.stage === tab);

  return (
    <>
      <PageHeader title="Warehouse receipt" links={[{ name: 'Operations' }, { name: 'Warehousing' }]} />
      <Tabs value={tab} onChange={(e, v) => { setTab(v); setSelected(null); }} sx={{ mb: 3 }}>
        <Tab value="waiting" label="Waiting" />
        <Tab value="unloading" label="Unloading" />
      </Tabs>
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
            renderItem={(i) => (
              <>
                <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{i.plate}</Typography>
                <Typography variant="body2" noWrap>{i.product}</Typography>
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.75} sx={{ mt: 0.75 }}>{i.parts.map((p) => <Label key={p.bay}>{p.bay}</Label>)}</Stack>
              </>
            )}
          />
        }
        center={
          current ? (
            <Record
              key={current.key + current.stage}
              item={current}
              onStart={(it, gang, equipment) => {
                updateReceipt(it.key, { stage: 'unloading', startedAt: Date.now(), gang, equipment });
                setTab('unloading');
                setToast(`Unloading started for ${it.plate}.`);
              }}
              onFinish={(it, kg) => {
                recordReceipt(it, kg, null);
                setSelected(null);
                setToast(`Receipt recorded: ${formatKg(kg)} into ${it.parts[0].bay}. Vehicle processed.`);
              }}
            />
          ) : (
            <Card><EmptyState title="Select a truck" sx={{ py: 12 }} /></Card>
          )
        }
        rail={[
          <Card key="moves" sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Shed 5 movements</Typography>
            <Stack spacing={1.25}>
              {[['Driving to shed', 1, 'info'], ['At bay', 1, 'warning'], ['Unloading', items.filter((i) => i.stage === 'unloading').length, 'primary']].map(([l, n, c]) => (
                <Stack key={l} direction="row" justifyContent="space-between"><Typography variant="body2">{l}</Typography><Label color={c}>{n}</Label></Stack>
              ))}
            </Stack>
          </Card>,
        ]}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
