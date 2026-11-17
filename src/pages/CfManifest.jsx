import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, Typography, Button, Menu, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Alert, Snackbar, Grid2 as Grid,
} from '@mui/material';
import { PageHeader, SectionCard, EmptyState, AssumptionNote, TableScroll, formatBDT, formatKg } from '../components/common';
import Label from '../components/Label';
import { TruckForm, statusColor as foreignStatusColor } from '../components/ForeignTrucksDrawer';
import { TruckDialog as LocalTruckForm, statusColor as localStatusColor } from '../components/LocalTrucksDrawer';
import { preArrivals } from '../data/mock';
import { useManifests } from '../ManifestsContext';
import { useCfTrucks } from '../CfTrucksContext';
import { AddRoundedIcon, KeyboardArrowDownRoundedIcon } from '../components/icons';

const customsColor = { Released: 'success', Pending: 'warning', Hold: 'error' };
const sides = { foreign: 'Indian', local: 'Bangladeshi' };

function AddTruckButton({ disabled, onPick }) {
  const [anchor, setAnchor] = useState(null);
  const pick = (side) => { setAnchor(null); onPick(side); };
  return (
    <>
      <Button
        variant="contained" startIcon={<AddRoundedIcon />} endIcon={<KeyboardArrowDownRoundedIcon />} disabled={disabled}
        aria-haspopup="menu" aria-expanded={Boolean(anchor)} onClick={(e) => setAnchor(e.currentTarget)}
      >
        Add truck
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem onClick={() => pick('foreign')}>Indian truck</MenuItem>
        <MenuItem onClick={() => pick('local')}>Bangladeshi truck</MenuItem>
      </Menu>
    </>
  );
}

function VehiclesTable({ rows }) {
  if (rows.length === 0) return <EmptyState title="No vehicles yet" description="Add the trucks that will carry this manifest." sx={{ py: 6 }} />;
  return (
    <TableScroll>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ pl: 3 }}>Vehicle</TableCell>
            <TableCell>Side</TableCell>
            <TableCell>Class</TableCell>
            <TableCell sx={{ pr: 3 }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((t) => (
            <TableRow key={`${t.side}-${t.plate}`}>
              <TableCell sx={{ pl: 3 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{t.plate}</Typography>
                <Typography variant="caption" color="text.secondary">{t.driver}</Typography>
              </TableCell>
              <TableCell>{sides[t.side]}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{t.cls}</TableCell>
              <TableCell sx={{ pr: 3 }}>
                <Label color={(t.side === 'foreign' ? foreignStatusColor : localStatusColor)[t.status]}>{t.status}</Label>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableScroll>
  );
}

// Pre-arrival consignments have no IGM yet, so they show what is expected instead of Customs and billing.
function summaryFor(m) {
  if (m.preArrival) {
    return [
      ['Customs', <Label color="error">No IGM yet</Label>],
      ['Land-port bill', 'Not billed yet'],
      ['Expected', m.expected],
      ['Goods', m.perishable ? 'Perishable' : 'Non-perishable'],
      ['Status', 'Open'],
    ];
  }
  return [
    ['Customs', <Label color={customsColor[m.customs]}>{m.customs}</Label>],
    ['Land-port bill', m.balance > 0 ? <Label color="warning">{formatBDT(m.balance)} due</Label> : <Label color="success">Paid</Label>],
    ['Declared', formatKg(m.declaredKg)],
    ['Still in port', formatKg(m.remainingKg)],
    ['Status', m.status],
  ];
}

// One manifest from the C&F portal: its summary and every vehicle under it, Indian and Bangladeshi.
export default function CfManifest() {
  const { manifestId } = useParams();
  const { manifests } = useManifests();
  const manifest = manifests.find((m) => m.id === manifestId)
    ?? preArrivals.filter((p) => p.id === manifestId).map((p) => ({ ...p, preArrival: true, status: 'Open' }))[0];
  const { foreign: allForeign, local: allLocal, setForeignFor, setLocalFor } = useCfTrucks();
  const foreign = allForeign[manifestId] ?? [];
  const local = allLocal[manifestId] ?? [];
  const [adding, setAdding] = useState(null);
  const [toast, setToast] = useState('');

  const links = [{ name: 'Operations' }, { name: 'C&F portal', href: '/cf-portal' }, { name: manifestId }];
  if (!manifest) {
    return (
      <>
        <PageHeader title="Manifest not found" links={links} />
        <Card><EmptyState title="No manifest with this number" description="Open a manifest from the C&F portal." sx={{ py: 10 }} /></Card>
      </>
    );
  }

  const closed = manifest.status === 'Closed';
  const summary = summaryFor(manifest);
  const rows = [...foreign.map((t) => ({ ...t, side: 'foreign' })), ...local.map((t) => ({ ...t, side: 'local' }))];
  const save = (side, truck) => {
    if (side === 'foreign') setForeignFor(manifestId, [...foreign, truck]);
    else setLocalFor(manifestId, [...local, truck]);
    setAdding(null);
    setToast(`${truck.plate} added to ${manifest.id}.`);
  };

  return (
    <>
      <PageHeader
        title={<Typography component="span" variant="h4" sx={{ fontFamily: 'monospace' }}>{manifest.id}</Typography>}
        links={links}
        subtitle={`${manifest.product} · ${manifest.trader}`}
        action={<AddTruckButton disabled={closed} onPick={setAdding} />}
      />
      {manifest.preArrival && (
        <AssumptionNote code="F4" sx={{ mb: 3 }}>
          Customs keys the IGM when the goods reach zero point. Until then this consignment uses an IBMS pre-arrival reference.
        </AssumptionNote>
      )}
      {/* Summary sits in a strip above so the vehicle table gets the full width. */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {summary.map(([label, value]) => (
            <Grid key={label} size={{ xs: 6, sm: 4, md: 'grow' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{label}</Typography>
              <Typography variant="subtitle2" component="div">{value}</Typography>
            </Grid>
          ))}
        </Grid>
      </Card>
      <SectionCard title="Vehicles" subheader={`${foreign.length} Indian · ${local.length} Bangladeshi`}>
        <VehiclesTable rows={rows} />
      </SectionCard>
      {adding === 'foreign' && (
        <TruckForm open truck={null} takenPlates={foreign.map((t) => t.plate)} onClose={() => setAdding(null)} onSave={(t) => save('foreign', t)} />
      )}
      {adding === 'local' && (
        <LocalTruckForm takenPlates={local.map((t) => t.plate)} onClose={() => setAdding(null)} onSave={(t) => save('local', t)} />
      )}
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
