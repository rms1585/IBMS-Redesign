import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Card, Typography, Button, Menu, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Alert, Snackbar, Grid2 as Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import { PageHeader, SectionCard, EmptyState, AssumptionNote, TableScroll, formatBDT, formatKg } from '../components/common';
import Label from '../components/Label';
import { TruckForm, statusColor as foreignStatusColor } from '../components/ForeignTrucksDrawer';
import { TruckDialog as LocalTruckForm, statusColor as localStatusColor } from '../components/LocalTrucksDrawer';
import { preArrivals } from '../data/mock';
import { useManifests } from '../ManifestsContext';
import { useCfTrucks } from '../CfTrucksContext';
import { useAudit } from '../AuditContext';
import { useTruckWeights } from '../TruckWeightsContext';
import { AddRoundedIcon, KeyboardArrowDownRoundedIcon } from '../components/icons';
import CustomsSteps, { CustomsLabel } from '../components/CustomsSteps';
import { useCustoms } from '../CustomsContext';

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

// renderAction, when given, adds a last column with an action for each vehicle.
export function VehiclesTable({ rows, renderAction }) {
  if (rows.length === 0) return <EmptyState title="No vehicles yet" description="Add the trucks that will carry this manifest." sx={{ py: 6 }} />;
  return (
    <TableScroll>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ pl: 3 }}>Vehicle</TableCell>
            <TableCell>Side</TableCell>
            <TableCell>Class</TableCell>
            <TableCell sx={renderAction ? undefined : { pr: 3 }}>Status</TableCell>
            {renderAction && <TableCell sx={{ pr: 3 }} />}
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
              <TableCell sx={renderAction ? undefined : { pr: 3 }}>
                <Label color={(t.side === 'foreign' ? foreignStatusColor : localStatusColor)[t.status]}>{t.status}</Label>
              </TableCell>
              {renderAction && <TableCell align="right" sx={{ pr: 3, whiteSpace: 'nowrap' }}>{renderAction(t)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableScroll>
  );
}

// The C&F agent asks for an Indian truck to be weighed empty before its stored tare expires (F31, #75).
function ReweighApplication({ truck, onClose, onSave }) {
  const [reason, setReason] = useState('');
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Apply for early re-weigh</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          <Box component="span" sx={{ fontFamily: 'monospace' }}>{truck.plate}</Box> will be weighed empty again before it leaves, if both the Customs Assistant Commissioner and the BLPA Assistant Director approve.
        </Typography>
        <TextField autoFocus fullWidth required multiline minRows={3} label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Stored tare was taken in rain, or with bamboo poles on board" />
        <AssumptionNote code="F31" sx={{ mt: 2 }}>How the Customs Assistant Commissioner approves in IBMS is to be confirmed with NBR.</AssumptionNote>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!reason.trim()} onClick={() => onSave(reason.trim())}>Apply</Button>
      </DialogActions>
    </Dialog>
  );
}

// Pre-arrival consignments have no IGM yet, so they show what is expected instead of Customs and billing.
function summaryFor(m, customs) {
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
    ['Customs', <CustomsLabel customs={customs} />],
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
  const [applying, setApplying] = useState(null);
  const { tareFor, openOrder, applications, applyForReweigh } = useTruckWeights();
  const { addEvent } = useAudit();
  const { customsFor } = useCustoms();
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
  const customs = customsFor(manifest.id);
  const summary = summaryFor(manifest, customs);
  const rows = [...foreign.map((t) => ({ ...t, side: 'foreign' })), ...local.map((t) => ({ ...t, side: 'local' }))];
  const save = (side, truck) => {
    if (side === 'foreign') setForeignFor(manifestId, [...foreign, truck]);
    else setLocalFor(manifestId, [...local, truck]);
    setAdding(null);
    setToast(`${truck.plate} added to ${manifest.id}.`);
  };

  // Only an Indian truck with a valid stored tare can be re-weighed early; one without is weighed empty anyway.
  const reweighAction = (t) => {
    if (t.side !== 'foreign' || !tareFor(t.plate).valid) return null;
    if (openOrder(t.plate)) return <Label color="info">Re-weigh ordered</Label>;
    const pending = applications.find((a) => a.plate === t.plate && a.status === 'Waiting');
    if (pending) return <Label color="warning">Re-weigh applied</Label>;
    return <Button size="small" color="inherit" onClick={() => setApplying(t)}>Apply for re-weigh</Button>;
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
      {!manifest.preArrival && (
        <SectionCard title="Customs" subheader="Each step as it reaches IBMS" sx={{ mb: 3 }}>
          <Box sx={{ px: 3, pb: 3 }}><CustomsSteps customs={customs} /></Box>
        </SectionCard>
      )}
      <SectionCard title="Vehicles" subheader={`${foreign.length} Indian · ${local.length} Bangladeshi`}>
        <VehiclesTable rows={rows} renderAction={reweighAction} />
      </SectionCard>
      {adding === 'foreign' && (
        <TruckForm open truck={null} takenPlates={foreign.map((t) => t.plate)} onClose={() => setAdding(null)} onSave={(t) => save('foreign', t)} />
      )}
      {adding === 'local' && (
        <LocalTruckForm takenPlates={local.map((t) => t.plate)} onClose={() => setAdding(null)} onSave={(t) => save('local', t)} />
      )}
      {applying && (
        <ReweighApplication
          truck={applying}
          onClose={() => setApplying(null)}
          onSave={(reason) => {
            const id = applyForReweigh({ plate: applying.plate, manifest: manifest.id, agency: manifest.agency, requester: manifest.agency, reason });
            addEvent({ actor: manifest.agency, role: 'C&F agent user', module: 'Weighing', type: 'Record', text: `Applied for early re-weigh ${id} of ${applying.plate} on ${manifest.id}: ${reason}` });
            setToast(`${id} sent to the Customs Assistant Commissioner and the BLPA Assistant Director.`);
            setApplying(null);
          }}
        />
      )}
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
