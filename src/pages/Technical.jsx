import { useState } from 'react';
import { Card, Stack, Typography, Grid2 as Grid, Switch, Alert, Box, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar } from '@mui/material';
import { PageHeader, KpiCard, SectionCard } from '../components/common';
import DataTable from '../components/DataTable';
import Label from '../components/Label';

const nodes = [
  { port: 'BEN', station: 'Benapole Customs House', state: 'Healthy', held: 0, feeds: 'Manifest, Customs statuses, release, holds, agency status', fallback: false },
  { port: 'BUR', station: 'Burimari LCS', state: 'Degraded', held: 3, feeds: 'Manifest, Customs statuses, release', fallback: false },
  { port: 'AKH', station: 'Akhaura LCS', state: 'Down', held: 17, feeds: 'All feeds held', fallback: true },
];
const color = { Healthy: 'success', Degraded: 'warning', Down: 'error' };

export default function Technical() {
  const [consent, setConsent] = useState(null);
  const [ref, setRef] = useState('');
  const [toast, setToast] = useState('');
  return (
    <>
      <PageHeader title="Technical settings" links={[{ name: 'Administration' }, { name: 'Technical settings' }]} subtitle="National Single Window is the source of IGM, Customs statuses, release, holds and agency statuses." />
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}><KpiCard title="NSW health (simulated)" value="2 of 3 nodes up" color="warning" /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><KpiCard title="Messages held" value="20" caption="Delivered when the feed recovers" color="error" /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><KpiCard title="Online payments today" value="312" caption="Latest 10:58 · BDT 4.8 L" /></Grid>
      </Grid>
      <SectionCard title="Ports and stations">
        <DataTable card={false} rows={nodes} columns={[
          { key: 'port', label: 'Port', render: (r) => <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>{r.port}</Typography> },
          { key: 'station', label: 'Station' },
          { key: 'state', label: 'Node', render: (r) => <Label color={color[r.state]}>{r.state}</Label> },
          { key: 'held', label: 'Held', align: 'center' },
          { key: 'feeds', label: 'Feed modes' },
          { key: 'fallback', label: 'Paper fallback', align: 'right', render: (r) => (
            <Switch checked={r.fallback} disabled={r.state === 'Healthy' && !r.fallback} onChange={(e) => (e.target.checked ? setConsent(r) : setToast(`Paper fallback turned off for ${r.port}.`))} />
          ) },
        ]} />
      </SectionCard>
      <Alert severity="warning" sx={{ mt: 3 }}>Paper release, hold and agency-status entries are allowed only while the feed is down and written consent exists. They stay marked manual until the feed agrees.</Alert>
      <Dialog open={Boolean(consent)} onClose={() => setConsent(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Turn on paper fallback for {consent?.port}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Needs a written-consent reference and head-office approval. It takes effect only after approval.</Typography>
          <TextField fullWidth required label="Consent reference" value={ref} onChange={(e) => setRef(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={() => setConsent(null)}>Cancel</Button>
          <Button variant="contained" disabled={!ref.trim()} onClick={() => { setToast(`Request sent to head office for ${consent.port}.`); setConsent(null); setRef(''); }}>Send for approval</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="info" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </>
  );
}
