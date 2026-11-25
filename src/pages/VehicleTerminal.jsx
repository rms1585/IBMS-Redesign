import { useState } from 'react';
import { Box, ButtonBase, Card, Stack, Typography, Button, Alert, Snackbar, Tooltip, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { EmptyState, AssumptionNote, DetailRow } from '../components/common';
import { Workbench, QueueCard } from '../components/Workbench';
import Label from '../components/Label';
import { useStoredState } from '../demo/PortStore';
import { tr } from '../i18n/LanguageContext';

const blocks = [
  { code: 'A', use: 'Foreign trucks', rows: 3, cols: 8 },
  { code: 'B', use: 'Foreign trucks', rows: 3, cols: 8 },
  { code: 'C', use: 'Local trucks', rows: 2, cols: 10 },
];
const initialVehicles = [
  { plate: 'WB-23-K-4471', kind: 'Foreign', use: 'Foreign trucks', manifest: '2026/601/08852', waiting: '12m' },
  { plate: 'WB-41-B-1207', kind: 'Foreign', use: 'Foreign trucks', manifest: '2026/601/08871', waiting: '7m' },
  { plate: 'JESSORE-TA-11-2101', kind: 'Local', use: 'Local trucks', manifest: '2026/601/08841', waiting: '4m' },
];
const slotCode = (block, r, c) => `${block.code}-${r + 1}${String.fromCharCode(65 + c)}`;
// Spacing follows the width of the centre column (the Workbench's `record` container), not the screen:
// the side columns take more or less room depending on the screen and whether the navigation is open.
const COMPACT = '@container record (max-width: 520px)';

// A fixed pattern, so the demo shows a part-full terminal.
const seededOccupied = (block, r, c) => (r * 3 + c * 5 + block.code.charCodeAt(0)) % 4 === 0;

// Occupied and not-for-this-vehicle slots stay clickable so their status shows in the line under the block:
// nothing is told only in the tooltip (M2 Annex 24.8). Only a free slot can be chosen.
function Slot({ code, state, onClick, onInspect, label }) {
  return (
    <Tooltip title={label} arrow disableInteractive>
      <Box component="span" sx={{ display: 'block', minWidth: 0 }}>
        <ButtonBase
          aria-label={`Slot ${code}: ${label}`}
          aria-disabled={state === 'occupied' || state === 'wrong'}
          onClick={() => { onInspect(`${code.split('-')[1]} · ${label}`); if (state === 'free' || state === 'selected') onClick(); }}
          sx={(t) => ({
            width: '100%', minWidth: 0, height: 32, borderRadius: '6px', ...t.typography.caption,
            border: `1px solid ${state === 'free' ? alpha(t.palette.grey[500], 0.32) : 'transparent'}`,
            color: state === 'selected' ? t.palette.primary.contrastText : t.palette.text.secondary,
            bgcolor: state === 'selected' ? 'primary.main' : state === 'occupied' ? alpha(t.palette.grey[500], 0.24) : 'background.paper',
            opacity: state === 'wrong' ? 0.4 : 1,
            cursor: state === 'occupied' || state === 'wrong' ? 'default' : 'pointer',
            '&.Mui-focusVisible': { outline: `2px solid ${t.palette.primary.main}`, outlineOffset: 1 },
            '&:hover': { borderColor: t.palette.primary.main },
          })}
        >
          {code.split('-')[1]}
        </ButtonBase>
      </Box>
    </Tooltip>
  );
}

function BlockView({ block, vehicle, assigned, selected, onSelect }) {
  const rows = Array.from({ length: block.rows }, (_, r) => r);
  const cols = Array.from({ length: block.cols }, (_, c) => c);
  const fits = !vehicle || vehicle.use === block.use;
  const occupied = (r, c) => seededOccupied(block, r, c) || Boolean(assigned[slotCode(block, r, c)]);
  const free = rows.flatMap((r) => cols.filter((c) => !occupied(r, c))).length;
  const [inspected, setInspected] = useState(null);
  return (
    <Box>
      <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 1.5, [COMPACT]: { mb: 1 } }}>
        <Typography variant="subtitle1">Block {block.code}</Typography>
        <Typography variant="body2" color="text.secondary">{block.use}</Typography>
        <Label color={free ? 'success' : 'error'}>{free} free</Label>
      </Stack>
      {/* Slots share the width instead of scrolling sideways: they shrink on narrow screens and stop growing at 56px. */}
      <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${block.cols}, minmax(0, 56px))`, gap: 0.75, [COMPACT]: { gap: 0.5 } }}>
          {rows.flatMap((r) => cols.map((c) => {
            const code = slotCode(block, r, c);
            const taken = occupied(r, c);
            const state = code === selected ? 'selected' : taken ? 'occupied' : fits ? 'free' : 'wrong';
            const label = assigned[code] ?? (taken ? 'Occupied' : fits ? 'Free' : `For ${block.use.toLowerCase()} only`);
            return <Slot key={code} code={code} state={state} label={label} onClick={() => onSelect(code)} onInspect={setInspected} />;
          }))}
      </Box>
      {inspected && <Typography variant="caption" color="text.secondary" component="div" role="status" sx={{ mt: 1 }}>{inspected}</Typography>}
    </Box>
  );
}

// Shown inside Posting as its "Cargo vehicle terminal" view (M2 Annex 24.12), so it has no page header of its own.
export default function VehicleTerminal() {
  const [vehicles, setVehicles] = useStoredState('terminalVehicles', initialVehicles);
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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{tr("Assign waiting vehicles to a block and see each block's space at a glance.")}</Typography>
      <AssumptionNote code="F23" sx={{ mb: 3 }}>The terminal's position in the flow will be taken from BLPA's master plan.</AssumptionNote>
      <Workbench
        queue={
          <QueueCard
            title={tr("Waiting vehicles")}
            count={filtered.length}
            search={search}
            onSearch={setSearch}
            placeholder={tr("Search plate or manifest")}
            items={filtered}
            getKey={(v) => v.plate}
            selectedKey={selected}
            onSelect={(k) => { setSelected(k); setSlot(null); }}
            emptyText={tr("No vehicles waiting")}
            renderItem={(v) => (
              <>
                <Stack direction="row" justifyContent="space-between" gap={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>{v.plate}</Typography>
                  <Typography variant="caption" color="text.secondary">{v.waiting}</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" component="div" noWrap>{v.manifest}</Typography>
                <Stack direction="row" sx={{ mt: 0.75 }}><Label>{v.kind}</Label></Stack>
              </>
            )}
          />
        }
        center={
          <Card sx={{ p: 3, [COMPACT]: { p: 2 } }}>
            <Typography variant="h6" sx={{ mb: 3, [COMPACT]: { mb: 2 } }}>{current ? `Choose a slot for ${current.plate}` : 'Terminal blocks'}</Typography>
            <Stack spacing={3} sx={{ [COMPACT]: { gap: 2.5 } }} useFlexGap divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />}>
              {blocks.map((b) => <BlockView key={b.code} block={b} vehicle={current} assigned={assigned} selected={slot} onSelect={setSlot} />)}
            </Stack>
          </Card>
        }
        rail={[
          <Card key="assign" sx={{ p: 2.5 }}>
            {current ? (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Assignment</Typography>
                <DetailRow labelWidth={72} label={tr("Vehicle")}>{current.plate}</DetailRow>
                <DetailRow labelWidth={72} label={tr("Slot")}>{slot ?? 'Not chosen'}</DetailRow>
                <Button fullWidth variant="contained" size="large" sx={{ mt: 2 }} disabled={!slot} onClick={assign}>{slot ? `Assign ${slot}` : 'Assign slot'}</Button>
              </>
            ) : <EmptyState title={tr("Select a vehicle")} sx={{ py: 3 }} />}
          </Card>,
        ]}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
