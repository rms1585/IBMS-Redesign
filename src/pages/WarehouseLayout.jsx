import { useState } from 'react';
import { Box, Card, Stack, Typography, Button, Grid2 as Grid, ButtonBase, Menu, MenuItem, Divider, Alert, Snackbar, TextField, Checkbox, ListItemText } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { PageHeader, SectionCard, ReasonDialog } from '../components/common';
import FormDrawer, { useFreshForm } from '../components/FormDrawer';
import { useStoredState } from '../demo/PortStore';
import { BayGrid, BayLegend } from '../components/BayGrid';
import Label from '../components/Label';
import { facilities, bayState } from '../data/mock';
import { AddRoundedIcon, MoreHorizRoundedIcon, WarehouseRoundedIcon } from '../components/icons';

function zoneStats(z) {
  let used = 0; let blocked = 0;
  for (let r = 0; r < z.rows; r += 1) for (let c = 0; c < z.cols; c += 1) {
    const s = bayState(z.code, r, c).state;
    if (s === 'blocked') blocked += 1; else if (s !== 'empty') used += 1;
  }
  return { total: z.rows * z.cols, used, blocked };
}

function ZoneCard({ zone, onAction }) {
  const [anchor, setAnchor] = useState(null);
  const st = zoneStats(zone);
  const empty = st.used === 0;
  const act = (a) => { setAnchor(null); onAction(a, zone, empty); };
  return (
    <Card variant="outlined" sx={{ boxShadow: 'none', p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="subtitle1">Zone {zone.code}</Typography>
          <Typography variant="body2" color="text.secondary">
            {zone.rows} × {zone.cols} bays · {zone.capacityT} t per bay · {st.used} in use · {st.blocked} blocked
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>{zone.categories.map((c) => <Label key={c} color="info">{c}</Label>)}</Stack>
        </Box>
        <Button size="small" variant="outlined" color="inherit" endIcon={<MoreHorizRoundedIcon />} onClick={(e) => setAnchor(e.currentTarget)}>Edit grid</Button>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          <MenuItem onClick={() => act('Add row')}>Add row</MenuItem>
          <MenuItem onClick={() => act('Add column')}>Add column</MenuItem>
          <MenuItem onClick={() => act('Change accepted categories')}>Change accepted categories</MenuItem>
          <MenuItem onClick={() => act('Block zone')}>Block zone…</MenuItem>
          <Divider />
          <MenuItem onClick={() => act('Remove last row')}>Remove last row</MenuItem>
          <MenuItem onClick={() => act('Re-grid')}>Re-grid</MenuItem>
          <MenuItem onClick={() => act('Remove zone')} sx={{ color: 'error.main' }}>Remove zone</MenuItem>
        </Menu>
      </Stack>
      <Box sx={{ overflowX: 'auto' }}><BayGrid zone={zone} size={40} /></Box>
    </Card>
  );
}

const KINDS = ['Shed', 'Open yard', 'Transshipment yard'];
const CATEGORIES = ['Any', 'Food', 'Textile', 'Chemical', 'Rubber', 'Baby products', 'Stone'];
const EMPTY_FACILITY = { name: '', kind: 'Shed', code: '' };
const EMPTY_ZONE = { rows: '4', cols: '8', capacityT: '20', categories: ['Any'] };
const wholeIn = (v, min, max) => /^\d+$/.test(v) && Number(v) >= min && Number(v) <= max;

function FacilityDrawer({ open, onClose, onSave, taken }) {
  const [f, set] = useFreshForm(open, EMPTY_FACILITY);
  const code = f.code.toUpperCase();
  const codeOk = /^[A-Z0-9]{2,4}$/.test(code) && !taken.includes(code);
  const ready = f.name.trim() && codeOk;
  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title="Create facility"
      subtitle="Add zones once it exists. Sheds and open yards attract storage rent; transshipment yards do not."
      actions={<><Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button><Button variant="contained" disabled={!ready} onClick={() => onSave({ ...f, code })}>Create facility</Button></>}
    >
      <Stack spacing={2.5}>
        <TextField fullWidth required autoFocus label="Name" placeholder="Shed 14" value={f.name} onChange={set('name')} />
        <TextField select fullWidth label="Kind" value={f.kind} onChange={set('kind')} helperText={f.kind === 'Transshipment yard' ? 'Positions for transfers, no bays and no separation rules' : ' '}>{KINDS.map((k) => <MenuItem key={k} value={k}>{k}</MenuItem>)}</TextField>
        <TextField fullWidth required label="Short code" value={code} onChange={set('code')} error={Boolean(f.code) && !codeOk} helperText={taken.includes(code) ? 'This code is already used' : 'Two to four letters or digits, for example S14. Starts every zone and bay code.'} />
      </Stack>
    </FormDrawer>
  );
}

function ZoneDrawer({ open, onClose, onSave, facility }) {
  const [f, set] = useFreshForm(open, EMPTY_ZONE);
  const ok = { rows: wholeIn(f.rows, 1, 20), cols: wholeIn(f.cols, 1, 20), capacityT: wholeIn(f.capacityT, 1, 200) };
  const ready = ok.rows && ok.cols && ok.capacityT && f.categories.length > 0;
  const code = `${facility.id}${String.fromCharCode(65 + facility.zones.length)}`;
  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={`Add zone to ${facility.name}`}
      subtitle={`The new zone is ${code}. Its bays are numbered ${code}-R1 onwards.`}
      actions={<><Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button><Button variant="contained" disabled={!ready} onClick={() => onSave({ code, rows: Number(f.rows), cols: Number(f.cols), capacityT: Number(f.capacityT), categories: f.categories })}>Add zone</Button></>}
    >
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={2}>
          <TextField fullWidth required autoFocus label="Rows" inputMode="numeric" value={f.rows} onChange={set('rows')} error={!ok.rows} helperText={ok.rows ? ' ' : '1 to 20'} />
          <TextField fullWidth required label="Bays per row" inputMode="numeric" value={f.cols} onChange={set('cols')} error={!ok.cols} helperText={ok.cols ? ' ' : '1 to 20'} />
        </Stack>
        <TextField fullWidth required label="Capacity per bay (t)" inputMode="numeric" value={f.capacityT} onChange={set('capacityT')} error={!ok.capacityT} helperText={ok.capacityT ? `${(ok.rows && ok.cols) ? Number(f.rows) * Number(f.cols) : '–'} bays in all` : '1 to 200 tonnes'} />
        <TextField
          select fullWidth label="Accepted categories" value={f.categories} onChange={set('categories')}
          slotProps={{ select: { multiple: true, renderValue: (v) => v.join(', ') } }}
          error={!f.categories.length} helperText={f.categories.length ? 'Storage rules still apply between categories' : 'Choose at least one'}
        >
          {CATEGORIES.map((c) => <MenuItem key={c} value={c}><Checkbox size="small" checked={f.categories.includes(c)} /><ListItemText primary={c} /></MenuItem>)}
        </TextField>
      </Stack>
    </FormDrawer>
  );
}

export default function WarehouseLayout() {
  const [storage, setStorage] = useStoredState('facilities', facilities);
  const [adding, setAdding] = useState(null);
  const [sel, setSel] = useState('S5');
  const [toast, setToast] = useState(null);
  const [blockZone, setBlockZone] = useState(null);
  const f = storage.find((x) => x.id === sel);

  const onAction = (a, zone, empty) => {
    if (a === 'Block zone') return setBlockZone(zone);
    const destructive = ['Remove last row', 'Re-grid', 'Remove zone'].includes(a);
    if (destructive && !empty) {
      return setToast({ severity: 'error', text: `${a} refused: zone ${zone.code} still holds cargo. Remove, shrink and re-grid are allowed only while empty.` });
    }
    return setToast({ severity: 'success', text: `${a} applied to zone ${zone.code}.` });
  };

  return (
    <>
      <PageHeader
        title="Warehouse layout"
        links={[{ name: 'Administration' }, { name: 'Warehouse layout' }]}
        subtitle="Facility → zone → bay grid. Sheds and open yards hold cargo and attract storage rent; transshipment yards do not."
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setAdding('facility')}>Create facility</Button>}
      />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 3 }}>
          <Card sx={{ p: 1.5 }}>
            {storage.map((x) => (
              <ButtonBase
                key={x.id}
                onClick={() => setSel(x.id)}
                sx={{ width: '100%', justifyContent: 'flex-start', gap: 1.5, p: 1.5, borderRadius: 1.5, textAlign: 'left', ...(x.id === sel && { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) }) }}
              >
                <Box sx={{ width: 40, height: 40, borderRadius: 1.25, display: 'grid', placeItems: 'center', bgcolor: 'background.neutral', color: x.id === sel ? 'primary.main' : 'text.secondary' }}>
                  <WarehouseRoundedIcon fontSize="small" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>{x.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{x.kind} · {x.zones.length} zones · {x.zones.reduce((s, z) => s + z.rows * z.cols, 0)} bays</Typography>
                </Box>
                {x.live && <Label color="success">Live</Label>}
              </ButtonBase>
            ))}
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 9 }}>
          <SectionCard
            title={f.name}
            subheader={f.kind}
            action={<Stack direction="row" spacing={1}><Button variant="outlined" color="inherit">Change kind</Button><Button variant="outlined" color="error">Retire</Button>{f.kind !== 'Transshipment yard' && <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => setAdding('zone')}>Add zone</Button>}</Stack>}
          >
            <Box sx={{ px: 3, pb: 3 }}>
              {f.zones.length ? (
                <>
                  <Box sx={{ mb: 2 }}><BayLegend /></Box>
                  <Stack spacing={2.5}>{f.zones.map((z) => <ZoneCard key={z.code} zone={z} onAction={onAction} />)}</Stack>
                </>
              ) : f.kind !== 'Transshipment yard' ? (
                <Alert severity="info">No zones yet. Add a zone to give this facility bays that cargo can be posted to.</Alert>
              ) : (
                <Alert severity="info">A transshipment yard is not a storage facility. It has positions for transfers, not bays, and storage separation rules do not apply.</Alert>
              )}
            </Box>
          </SectionCard>
        </Grid>
      </Grid>
      <FacilityDrawer
        open={adding === 'facility'}
        taken={storage.map((x) => x.id)}
        onClose={() => setAdding(null)}
        onSave={(n) => {
          setStorage((l) => [...l, { id: n.code, name: n.name.trim(), kind: n.kind, live: false, zones: [] }]);
          setSel(n.code);
          setAdding(null);
          setToast({ severity: 'success', text: `${n.name.trim()} created. Add its zones next.` });
        }}
      />
      <ZoneDrawer
        open={adding === 'zone'}
        facility={f}
        onClose={() => setAdding(null)}
        onSave={(z) => {
          setStorage((l) => l.map((x) => (x.id === f.id ? { ...x, zones: [...x.zones, z] } : x)));
          setAdding(null);
          setToast({ severity: 'success', text: `Zone ${z.code} added to ${f.name}.` });
        }}
      />
      <ReasonDialog
        open={Boolean(blockZone)}
        title={`Block zone ${blockZone?.code ?? ''}?`}
        description="Blocked bays cannot receive new allocations. Existing cargo stays where it is."
        confirmLabel="Block zone"
        confirmColor="error"
        onClose={() => setBlockZone(null)}
        onConfirm={() => { setToast({ severity: 'success', text: `Zone ${blockZone.code} blocked.` }); setBlockZone(null); }}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {toast ? <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>{toast.text}</Alert> : <span />}
      </Snackbar>
    </>
  );
}
