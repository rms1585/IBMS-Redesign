import { useState } from 'react';
import { Box, ButtonBase, Card, Stack, Typography, Button, Alert, Snackbar, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { PageHeader, EmptyState, AssumptionNote, DetailRow } from '../components/common';
import { Workbench, QueueCard } from '../components/Workbench';
import Label from '../components/Label';

const blocks = [
  { code: 'A', use: 'Foreign trucks', rows: 3, cols: 8 },
  { code: 'B', use: 'Foreign trucks', rows: 3, cols: 8 },
  { code: 'C', use: 'Local trucks', rows: 2, cols: 10 },
];
const initialVehicles = [
  { plate: 'WB-23-K-4471', kind: 'Foreign', use: 'Foreign trucks', manifest: 'BEN-IGM-2026-08852', waiting: '12m' },
  { plate: 'WB-41-B-1207', kind: 'Foreign', use: 'Foreign trucks', manifest: 'BEN-IGM-2026-08871', waiting: '7m' },
  { plate: 'JESSORE-TA-11-2101', kind: 'Local', use: 'Local trucks', manifest: 'BEN-IGM-2026-08841', waiting: '4m' },
];
const slotCode = (block, r, c) => `${block.code}-${r + 1}${String.fromCharCode(65 + c)}`;
// A fixed pattern, so the demo shows a part-full terminal.
const seededOccupied = (block, r, c) => (r * 3 + c * 5 + block.code.charCodeAt(0)) % 4 === 0;

function Slot({ code, state, onClick, label }) {
  return (
    <Tooltip title={label} arrow disableInteractive>
      <span>
        <ButtonBase
          aria-label={`Slot ${code}: ${label}`}
          disabled={state === 'occupied' || state === 'wrong'}
          onClick={onClick}
          sx={(t) => ({
            width: 44, height: 32, borderRadius: '6px', fontSize: 11,
            border: `1px solid ${state === 'free' ? alpha(t.palette.grey[500], 0.32) : 'transparent'}`,
            color: state === 'selected' ? t.palette.primary.contrastText : t.palette.text.secondary,
            bgcolor: state === 'selected' ? 'primary.main' : state === 'occupied' ? alpha(t.palette.grey[500], 0.24) : 'background.paper',
            opacity: state === 'wrong' ? 0.4 : 1,
            '&.Mui-focusVisible': { outline: `2px solid ${t.palette.primary.main}`, outlineOffset: 1 },
            '&:hover': { borderColor: t.palette.primary.main },
          })}
        >
          {code.split('-')[1]}
        </ButtonBase>
      </span>
    </Tooltip>
  );
}

function BlockView({ block, vehicle, assigned, selected, onSelect }) {
  const rows = Array.from({ length: block.rows }, (_, r) => r);
  const cols = Array.from({ length: block.cols }, (_, c) => c);
  const fits = !vehicle || vehicle.use === block.use;
  const occupied = (r, c) => seededOccupied(block, r, c) || Boolean(assigned[slotCode(block, r, c)]);
  const free = rows.flatMap((r) => cols.filter((c) => !occupied(r, c))).length;
  return (
    <Box>
      <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle1">Block {block.code}</Typography>
        <Typography variant="body2" color="text.secondary">{block.use}</Typography>
        <Label color={free ? 'success' : 'error'}>{free} free</Label>
      </Stack>
      <Box sx={{ overflowX: 'auto', pb: 1 }}>
        <Box sx={{ display: 'inline-grid', gridTemplateColumns: `repeat(${block.cols}, 44px)`, gap: 0.75 }}>
          {rows.flatMap((r) => cols.map((c) => {
            const code = slotCode(block, r, c);
            const taken = occupied(r, c);
            const state = code === selected ? 'selected' : taken ? 'occupied' : fits ? 'free' : 'wrong';
            const label = assigned[code] ?? (taken ? 'Occupied' : fits ? 'Free' : `For ${block.use.toLowerCase()} only`);
            return <Slot key={code} code={code} state={state} label={label} onClick={() => onSelect(code)} />;
          }))}
        </Box>
      </Box>
    </Box>
  );
}

export default function VehicleTerminal() {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [assigned, setAssigned] = useState({});
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(initialVehicles[0].plate);
  const [slot, setSlot] = useState(null);
  const [toast, setToast] = useState('');
  const filtered = vehicles.filter((v) => `${v.plate} ${v.manifest}`.toLowerCase().includes(search.toLowerCase()));
  const current = vehicles.find((v) => v.plate === selected);

  const assign = () => {
    setAssigned((a) => ({ ...a, [slot]: current.plate }));
    setVehicles((vs) => vs.filter((v) => v.plate !== current.plate));
    setToast(`${current.plate} assigned to slot ${slot}.`);
    setSelected(null);
    setSlot(null);
  };

  return (
    <>
      <PageHeader title="Cargo vehicle terminal" links={[{ name: 'Operations' }, { name: 'Cargo vehicle terminal' }]} subtitle="Assign waiting vehicles to a block and see each block's space at a glance." />
      <AssumptionNote code="F23" sx={{ mb: 3 }}>The terminal's position in the flow will be taken from BLPA's master plan.</AssumptionNote>
      <Workbench
        queue={
          <QueueCard
            title="Waiting vehicles"
            count={filtered.length}
            search={search}
            onSearch={setSearch}
            placeholder="Search plate or manifest"
            items={filtered}
            getKey={(v) => v.plate}
            selectedKey={selected}
            onSelect={(k) => { setSelected(k); setSlot(null); }}
            emptyText="No vehicles waiting"
            renderItem={(v) => (
              <>
                <Stack direction="row" justifyContent="space-between" gap={1}>
                  <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }} noWrap>{v.plate}</Typography>
                  <Typography variant="caption" color="text.secondary">{v.waiting}</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" component="div" noWrap>{v.manifest}</Typography>
                <Stack direction="row" sx={{ mt: 0.75 }}><Label>{v.kind}</Label></Stack>
              </>
            )}
          />
        }
        center={
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>{current ? `Choose a slot for ${current.plate}` : 'Terminal blocks'}</Typography>
            <Stack spacing={3}>
              {blocks.map((b) => <BlockView key={b.code} block={b} vehicle={current} assigned={assigned} selected={slot} onSelect={setSlot} />)}
            </Stack>
          </Card>
        }
        rail={[
          <Card key="assign" sx={{ p: 2.5 }}>
            {current ? (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Assignment</Typography>
                <DetailRow labelWidth={72} label="Vehicle">{current.plate}</DetailRow>
                <DetailRow labelWidth={72} label="Slot">{slot ?? 'Not chosen'}</DetailRow>
                <Button fullWidth variant="contained" size="large" sx={{ mt: 2 }} disabled={!slot} onClick={assign}>{slot ? `Assign ${slot}` : 'Assign slot'}</Button>
              </>
            ) : <EmptyState title="Select a vehicle" sx={{ py: 3 }} />}
          </Card>,
        ]}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
