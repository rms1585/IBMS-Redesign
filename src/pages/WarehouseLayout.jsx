import { useState } from 'react';
import { Box, Card, Stack, Typography, Button, Grid2 as Grid, ButtonBase, Menu, MenuItem, Divider, Alert, Snackbar } from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded';
import { PageHeader, SectionCard, ReasonDialog } from '../components/common';
import { BayGrid, BayLegend } from '../components/BayGrid';
import Label from '../components/Label';
import { facilities, bayState } from '../data/mock';

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
        <Button size="small" color="inherit" endIcon={<MoreHorizRoundedIcon />} onClick={(e) => setAnchor(e.currentTarget)}>Edit grid</Button>
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

export default function WarehouseLayout() {
  const storage = facilities;
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
        action={<Button variant="contained" color="inherit" startIcon={<AddRoundedIcon />}>Create facility</Button>}
      />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}>
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
        <Grid size={{ xs: 12, md: 9 }}>
          <SectionCard
            title={f.name}
            subheader={f.kind}
            action={<Stack direction="row" spacing={1}><Button color="inherit">Change kind</Button><Button color="error">Retire</Button><Button variant="outlined" startIcon={<AddRoundedIcon />}>Add zone</Button></Stack>}
          >
            <Box sx={{ px: 3, pb: 3 }}>
              {f.zones.length ? (
                <>
                  <Box sx={{ mb: 2 }}><BayLegend /></Box>
                  <Stack spacing={2.5}>{f.zones.map((z) => <ZoneCard key={z.code} zone={z} onAction={onAction} />)}</Stack>
                </>
              ) : (
                <Alert severity="info">A transshipment yard is not a storage facility. It has positions for transfers, not bays, and storage separation rules do not apply.</Alert>
              )}
            </Box>
          </SectionCard>
        </Grid>
      </Grid>
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
