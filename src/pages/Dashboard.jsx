import { useState } from 'react';
import { Alert, Box, Card, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { billTotals, usePort } from '../demo/PortStore';
import { formatBDT, formatDuration } from '../demo/format';
import { ResponsiveTable, SectionTitle } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-11: one set of figures from the same records the ports operate on. Nothing is decided here.
// Benapole's figures are live from the demo record; the comparison figures are demonstration figures.

function Figure({ label, value, before, note }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h4" sx={{ my: 0.5 }}>{value}</Typography>
      {before != null && <Typography variant="caption" color="text.secondary" component="div">Period before: {before}</Typography>}
      {note && <Typography variant="caption" color="text.secondary" component="div">{note}</Typography>}
    </Card>
  );
}

function useLiveFigures() {
  const p = usePort();
  const s = p.state;
  const inPort = s.visits.filter((v) => v.gateIn && v.stage !== 'Exited');
  const holding = s.visits.filter((v) => v.holding || v.stage === 'Manifest not yet available');
  const exited = s.visits.filter((v) => v.exitAt && v.gateIn);
  const avgMins = exited.length ? exited.reduce((sum, v) => sum + (new Date(v.exitAt) - new Date(v.gateIn.at)) / 60000, 0) / exited.length : 0;
  const revenue = s.bills.filter((b) => b.status === 'Paid').reduce((sum, b) => sum + billTotals(b).total, 0);
  const other = s.manifests.filter((m) => m.source === 'Other').length;
  return {
    inPort: inPort.length,
    holding: holding.length,
    holds: p.activeHolds.length,
    flags: s.visits.filter((v) => v.weigh?.overTolerance).length,
    open: s.manifests.filter((m) => p.openReasons(m.id).length).length,
    avgTime: avgMins ? `${Math.floor(avgMins / 60)} h ${Math.round(avgMins % 60)} min` : '–',
    revenue,
    otherShare: s.manifests.length ? `${Math.round((other / s.manifests.length) * 100)}%` : '0%',
    oldestHolding: holding.map((v) => v.holding?.since ?? v.gateIn?.at).filter(Boolean).sort()[0],
  };
}

export default function Dashboard() {
  const p = usePort();
  const t = useT();
  const f = useLiveFigures();
  const [view, setView] = useState('supervisor');
  const [period, setPeriod] = useState('Today');
  const problems = [
    p.state.bnswDown && 'BNSW is down: the port works in BNSW-down mode.',
    p.state.exitCheckDown && 'The exit check is down: trucks are held at the exit lanes.',
    f.holding > 0 && `${f.holding} truck${f.holding === 1 ? '' : 's'} in the holding area, oldest waiting ${formatDuration(f.oldestHolding)}.`,
    f.holds > 0 && `${f.holds} hold${f.holds === 1 ? '' : 's'} open on cargo or trucks.`,
  ].filter(Boolean);
  return (
    <>
      <PageHeader
        title={t('Dashboard')}
        subtitle={view === 'hq' ? 'All ports' : 'Benapole'}
        action={
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, v) => v && setView(v)} aria-label="Dashboard view">
              <ToggleButton value="supervisor">Checkpoint supervisor</ToggleButton>
              <ToggleButton value="manager">Port manager</ToggleButton>
              <ToggleButton value="hq">Headquarters</ToggleButton>
            </ToggleButtonGroup>
            <TextField select size="small" label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} sx={{ minWidth: 150 }}>
              {['Today', 'This week', 'This month'].map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}
            </TextField>
          </Stack>
        }
      />
      {problems.length > 0 && view !== 'hq' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Live problems at Benapole</Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>{problems.map((x) => <li key={x}><Typography variant="body2">{x}</Typography></li>)}</Box>
        </Alert>
      )}
      {view === 'supervisor' && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
          <Figure label="Trucks in the port" value={f.inPort} />
          <Figure label="In the holding area" value={f.holding} note="Only trucks with nowhere to go" />
          <Figure label="Holds open" value={f.holds} />
          <Figure label="Weight over tolerance" value={f.flags} note="Flags, not holds" />
        </Box>
      )}
      {view === 'manager' && (
        <Stack spacing={3}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
            <Figure label="Time in port, foreign trucks" value={f.avgTime} before="31 h 10 min" note="Gate in to exit, measured for the first time" />
            <Figure label="Revenue collected" value={formatBDT(f.revenue)} before={formatBDT(18420)} />
            <Figure label="Records open past their limit" value={f.open} note="Each with an owner on the daily list" />
            <Figure label="Manifests keyed as Other" value={f.otherShare} note="Retire the Other entry once BNSW is reliable" />
          </Box>
          <Card sx={{ p: 3 }}>
            <SectionTitle>Free space</SectionTitle>
            <ResponsiveTable
              rowKey={(s) => s.id}
              rows={p.port.sheds}
              columns={[
                { label: 'Shed or yard', render: (s) => s.id },
                { label: 'Capacity', align: 'right', render: (s) => `${s.capacityT} t` },
                { label: 'Used', align: 'right', render: (s) => `${s.usedT} t` },
                { label: 'Free', align: 'right', render: (s) => `${s.capacityT - s.usedT} t (${Math.round(((s.capacityT - s.usedT) / s.capacityT) * 100)}%)` },
              ]}
            />
          </Card>
        </Stack>
      )}
      {view === 'hq' && (
        <Card sx={{ p: 3 }}>
          <SectionTitle>Pilot ports side by side · {period}</SectionTitle>
          <ResponsiveTable
            rowKey={(r) => r.port}
            rows={[
              { port: 'Benapole', trucks: f.inPort, holding: f.holding, holds: f.holds, time: f.avgTime, revenue: formatBDT(f.revenue), feed: p.state.bnswDown ? 'Down' : 'Live' },
              { port: 'Bhomra', trucks: 41, holding: 3, holds: 1, time: '22 h 40 min', revenue: formatBDT(126400), feed: 'Live' },
              { port: 'Burimari', trucks: 28, holding: 0, holds: 0, time: '18 h 05 min', revenue: formatBDT(88150), feed: 'Live' },
            ]}
            columns={[
              { label: 'Port', render: (r) => r.port },
              { label: 'Trucks in port', align: 'right', render: (r) => r.trucks },
              { label: 'Holding area', align: 'right', render: (r) => r.holding },
              { label: 'Holds open', align: 'right', priority: 'low', render: (r) => r.holds },
              { label: 'Time in port', align: 'right', priority: 'low', render: (r) => r.time },
              { label: 'Revenue', align: 'right', render: (r) => r.revenue },
              { label: 'BNSW', render: (r) => r.feed },
            ]}
          />
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1.5 }}>Benapole is live from the demo record; Bhomra and Burimari are demonstration figures.</Typography>
        </Card>
      )}
    </>
  );
}
