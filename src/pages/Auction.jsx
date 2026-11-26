import { useState } from 'react';
import { Button, Tabs, Tab, TextField, Typography, Alert, Snackbar, Stack, Grid2 as Grid } from '@mui/material';
import { KpiCard, AssumptionNote, ReasonDialog, formatKg } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';
import { useStoredState } from '../demo/PortStore';
import { tr } from '../i18n/LanguageContext';

const ONE_MONTH = 30;
const TWO_MONTHS = 60;
const initialLots = [
  { id: 'LOT-3381', product: 'Cotton fabric', manifest: '2026/601/07412', location: 'Shed 5 · S5A-R3', kg: 8400, ageDays: 74, stage: 'stock', notice: false },
  { id: 'LOT-3374', product: 'Truck tyres', manifest: '2026/601/07655', location: 'Open yard 1 · OY1A-R1', kg: 5200, ageDays: 63, stage: 'stock', notice: true },
  { id: 'LOT-3402', product: 'Detergent', manifest: '2026/601/07980', location: 'Shed 5 · S5B-R2', kg: 3100, ageDays: 41, stage: 'stock', notice: false },
  { id: 'LOT-3410', product: 'Infant cereal', manifest: '2026/601/08102', location: 'Shed 9 · S9A-R1', kg: 1900, ageDays: 33, stage: 'stock', notice: false },
  { id: 'LOT-3433', product: 'Rice (non-basmati)', manifest: '2026/601/08510', location: 'Shed 5 · S5A-R1', kg: 16000, ageDays: 12, stage: 'stock', notice: false },
  { id: 'LOT-3290', product: 'Onion (spoiled)', manifest: '2026/601/06988', location: 'Shed 9 · S9A-R4', kg: 2700, ageDays: 96, stage: 'listed', notice: true },
];

function AgeLabel({ days }) {
  if (days >= TWO_MONTHS) return <Label color="error">{days} days</Label>;
  if (days >= ONE_MONTH) return <Label color="warning">{days} days</Label>;
  return <Label>{days} days</Label>;
}

// Shown inside Warehousing as its "Aging and auction" view (M2 Annex 24.12), so it has no page header of its own.
export default function Auction() {
  const [lots, setLots] = useStoredState('auctionLots', initialLots);
  const [tab, setTab] = useState('ageing');
  const [listing, setListing] = useState(null);
  const [destroying, setDestroying] = useState(null);
  const [decision, setDecision] = useState('');
  const [toast, setToast] = useState('');
  const update = (id, change) => setLots((ls) => ls.map((l) => (l.id === id ? { ...l, ...change } : l)));
  const inStock = lots.filter((l) => l.stage === 'stock');
  const listed = lots.filter((l) => l.stage !== 'stock');

  const lotColumns = [
    { key: 'id', label: 'Lot', render: (r) => <><Typography variant="subtitle2">{r.id}</Typography><Typography variant="caption" color="text.secondary">{r.manifest}</Typography></> },
    { key: 'product', label: 'Goods', render: (r) => <>{r.product}<Typography variant="caption" color="text.secondary" component="div">{formatKg(r.kg)}</Typography></> },
    { key: 'location', label: 'Location' },
    { key: 'ageDays', label: 'Age', render: (r) => <AgeLabel days={r.ageDays} /> },
  ];

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{tr('Uncleared goods turn yellow at one month and red at two months.')}</Typography>
      <AssumptionNote code="F28" sx={{ mb: 3 }}>The minutes don't state the auction-list age. Here the notice is due at two months.</AssumptionNote>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}><KpiCard title={tr("One month or more")} value={inStock.filter((l) => l.ageDays >= ONE_MONTH && l.ageDays < TWO_MONTHS).length} color="warning" /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><KpiCard title={tr("Two months or more")} value={inStock.filter((l) => l.ageDays >= TWO_MONTHS).length} color="error" /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><KpiCard title={tr("Notices due")} value={inStock.filter((l) => l.ageDays >= TWO_MONTHS && !l.notice).length} color="primary" /></Grid>
      </Grid>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="ageing" label={tr("Ageing stock")} />
        <Tab value="destruction" label={<Stack direction="row" spacing={1} alignItems="center"><span>Destruction list</span><Label>{listed.filter((l) => l.stage === 'listed').length}</Label></Stack>} />
      </Tabs>
      {tab === 'ageing' ? (
        <DataTable rows={inStock} searchKeys={['id', 'product', 'manifest']} searchPlaceholder={tr("Search lot, goods or manifest")} rowKey={(r) => r.id} columns={[
          ...lotColumns,
          { key: 'notice', label: 'Auction notice', render: (r) => (r.notice ? <Label color="success">Sent</Label> : r.ageDays >= TWO_MONTHS ? <Label color="error">Due</Label> : <Label>Not due</Label>) },
          // One actions column: the two buttons sit side by side and stack when the table is narrow, so the
          // table never scrolls sideways.
          {
            key: 'actions', label: '', render: (r) => (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="flex-end" sx={{ minWidth: 170 }}>
                {r.ageDays >= TWO_MONTHS && !r.notice && <Button size="small" variant="outlined" onClick={() => { update(r.id, { notice: true }); setToast(`Auction notice sent for ${r.id}.`); }}>{tr("Send notice")}</Button>}
                <Button size="small" variant="outlined" color="inherit" sx={{ whiteSpace: 'nowrap' }} onClick={() => setListing(r)}>{tr("Add to destruction list")}</Button>
              </Stack>
            ),
          },
        ]} />
      ) : (
        <DataTable rows={listed} searchKeys={['id', 'product']} searchPlaceholder={tr("Search lot or goods")} rowKey={(r) => r.id} columns={[
          ...lotColumns,
          { key: 'stage', label: 'Status', render: (r) => (r.stage === 'destroyed' ? <Label color="error">Destroyed</Label> : <Label color="warning">Listed</Label>) },
          { key: 'a', label: '', render: (r) => (r.stage === 'listed' ? <Button size="small" variant="outlined" color="error" onClick={() => setDestroying(r)}>{tr("Record as destroyed")}</Button> : <Typography variant="caption" color="text.secondary">Removed from stock{r.decision ? ` · ${r.decision}` : ''}</Typography>) },
        ]} />
      )}
      <ReasonDialog
        open={Boolean(listing)}
        title={`Add ${listing?.id ?? ''} to the destruction list?`}
        description={tr("The lot leaves ageing stock and waits to be recorded as destroyed.")}
        confirmLabel={tr("Add to list")}
        onClose={() => setListing(null)}
        onConfirm={() => { update(listing.id, { stage: 'listed' }); setToast(`${listing.id} added to the destruction list.`); setListing(null); }}
      />
      <ReasonDialog
        open={Boolean(destroying)}
        title={`Record ${destroying?.id ?? ''} as destroyed?`}
        description={tr("Disposal is decided by Customs and the disposal committee. Record the goods leaving custody against that decision; they are removed from stock and the record stays in this list.")}
        extra={<TextField fullWidth label={tr('Disposal decision reference')} placeholder="DC-BEN-2026-014" value={decision} onChange={(e) => setDecision(e.target.value)} helperText={tr('Recorded by the revenue desk from the committee minutes')} sx={{ mb: 2 }} />}
        canConfirm={Boolean(decision.trim())}
        confirmLabel={tr("Record as destroyed")}
        confirmColor="error"
        onClose={() => { setDestroying(null); setDecision(''); }}
        onConfirm={() => { update(destroying.id, { stage: 'destroyed', decision: decision.trim() }); setToast(`${destroying.id} recorded as destroyed against ${decision.trim()}.`); setDestroying(null); setDecision(''); }}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
