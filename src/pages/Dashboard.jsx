import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, Grid2 as Grid, LinearProgress, Skeleton, Stack, Tab, Tabs, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { KpiCard, PageHeader, SectionCard } from '../components/common';
import Label from '../components/Label';
import { BlockRoundedIcon, FileDownloadOutlinedIcon, LocalShippingRoundedIcon, TimerOutlinedIcon } from '../components/icons';
import { billTotals, usePort } from '../demo/PortStore';
import { formatBDT, formatDateTime, formatDuration } from '../demo/format';
import { ResponsiveTable } from '../demo/ui';
import { indicators } from '../data/indicators';
import { useT } from '../i18n/LanguageContext';

// M-11 in the earlier dashboard's layout: tabs of figures and charts, read-only. Figures about what is in
// the port now (trucks, holds, bills, sheds) come live from the demo record; history (last week, last year)
// is demonstration data.

const WEEK = { admissions: [128, 141, 137, 152, 149, 96, 142], departures: [121, 133, 140, 147, 151, 102, 118] };
const MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
const BILLED_LAKH = [281, 295, 302, 288, 310, 322, 318, 301, 327, 335, 330, 342];
const COUNTED_LAKH = [250, 262, 270, 259, 276, 290, 281, 268, 291, 299, 296, 303];

const REPORTS = [
  { name: 'Vehicle entry register', desc: 'Time, gate and lane, plate, kind, manifest, agency, operator, overrides.' },
  { name: 'Vehicle exit register', desc: 'Departure, gate and lane, plate, Exit Pass, manifest, hold and manual flags.' },
  { name: 'Weighbridge register', desc: 'Loaded, empty and return weights, billable tonnes, tare age, declared and difference.' },
  { name: 'Posting and allocation', desc: 'Cargo line, shed and bay, waiting time and overrides.' },
  { name: 'Billing and collection', desc: 'Bills raised, paid and owed, correcting lines and who approved them.' },
];

// The last seven days, ending today, in Bangladesh time.
function lastSevenDays() {
  const now = Date.now() + 6 * 3600 * 1000;
  return Array.from({ length: 7 }, (_, i) => new Date(now - (6 - i) * 86400000).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }));
}

// Charts are drawn without animation when the device asks for reduced motion (M2 Annex 24.8).
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const legend = { position: { vertical: 'top', horizontal: 'right' }, itemMarkWidth: 10, itemMarkHeight: 10, markGap: 6, itemGap: 16 };

function useFigures() {
  const p = usePort();
  const s = p.state;
  const inPort = s.visits.filter((v) => v.gateIn && v.stage !== 'Exited');
  const holding = s.visits.filter((v) => v.holding || v.stage === 'Manifest not yet available');
  const totals = s.bills.map(billTotals);
  const billed = totals.reduce((sum, x) => sum + x.total, 0);
  const counted = totals.reduce((sum, x) => sum + x.paid, 0);
  const byStage = inPort.reduce((acc, v) => ({ ...acc, [v.stage]: (acc[v.stage] ?? 0) + 1 }), {});
  const holdBodies = p.activeHolds.reduce((acc, h) => ({ ...acc, [h.body]: (acc[h.body] ?? 0) + 1 }), {});
  return {
    p,
    inPort,
    holding,
    oldestHolding: holding.map((v) => v.holding?.since ?? v.gateIn?.at).filter(Boolean).sort()[0],
    holds: p.activeHolds.length,
    holdText: Object.entries(holdBodies).map(([b, n]) => `${n} ${b}`).join(' · ') || 'None open',
    flags: s.visits.filter((v) => v.weigh?.overTolerance).length,
    passesWaiting: s.passes.filter((x) => p.passStatus(x) === 'Waiting approval').length,
    lateManifest: s.visits.filter((v) => v.stage === 'Manifest not yet available').length,
    keyed: s.boes.filter((b) => b.source === 'Keyed by the agency').length,
    corrections: s.corrections.filter((c) => !c.decision).length,
    truckChanges: s.truckChanges.filter((t) => !t.done).length,
    expected: s.visits.filter((v) => v.stage === 'Expected').length,
    byStage,
    billed,
    counted,
    owed: billed - counted,
    unpaidBills: s.bills.filter((b) => b.status === 'Payment due').length,
    sheds: p.port.sheds,
  };
}

function Operations({ f }) {
  const theme = useTheme();
  const days = lastSevenDays();
  // Hues far apart, so neighbouring stages never read as the same colour (audit m7).
  const tones = [theme.palette.primary.main, theme.palette.info.main, theme.palette.warning.main, theme.palette.grey[600], theme.palette.error.main, theme.palette.info.light];
  const stages = Object.entries(f.byStage).map(([label, value], i) => ({ id: label, label, value, color: tones[i % tones.length] }));
  const attention = [
    { what: 'Exit Passes waiting approval', n: f.passesWaiting, tone: 'warning' },
    { what: 'Admitted with the manifest not yet available', n: f.lateManifest, tone: 'error' },
    { what: 'Expected trucks not yet at the gate', n: f.expected, tone: 'info', note: 'Only trucks known in advance.' },
    { what: 'Weight over tolerance', n: f.flags, tone: 'warning', note: 'Flags, not holds.' },
    { what: 'Keyed values to check against BNSW', n: f.keyed, tone: 'error' },
  ];
  const money = [
    ['Billed', f.billed, 'primary'],
    ['Counted (paid and confirmed)', f.counted, 'success'],
    ['Owed', f.owed, 'warning'],
  ];
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Admissions today" value={WEEK.admissions[6]} change={8.2} icon={<LocalShippingRoundedIcon />} /></Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Trucks in the port" value={f.inPort.length} caption="Live from the record" icon={<LocalShippingRoundedIcon />} color="info" /></Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Oldest in the holding area" value={f.oldestHolding ? formatDuration(f.oldestHolding) : '–'} caption={`${f.holding.length} truck${f.holding.length === 1 ? '' : 's'} waiting`} icon={<TimerOutlinedIcon />} color="warning" /></Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard title="Holds open" value={f.holds} caption={f.holdText} icon={<BlockRoundedIcon />} color="error" /></Grid>

      <Grid size={{ xs: 12, lg: 8 }}>
        <SectionCard title="Admissions and departures" subheader="Last seven days" sx={{ height: '100%' }}>
          <Box sx={{ px: 1, pb: 1 }}>
            <BarChart
              skipAnimation={reduceMotion()}
              height={320}
              borderRadius={6}
              xAxis={[{ scaleType: 'band', data: days, categoryGapRatio: 0.45, barGapRatio: 0.2 }]}
              series={[
                { data: WEEK.admissions, label: 'Admissions', color: theme.palette.primary.main },
                { data: WEEK.departures, label: 'Departures', color: theme.palette.warning.main },
              ]}
              slotProps={{ legend }}
              margin={{ top: 40, right: 16, left: 40, bottom: 30 }}
            />
          </Box>
          <ChartInWords>{days.map((d, i) => `${d} ${WEEK.admissions[i]} in, ${WEEK.departures[i]} out`).join('; ')}.</ChartInWords>
        </SectionCard>
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <SectionCard title="Trucks in the port by stage" subheader="Live" sx={{ height: '100%' }}>
          <Box sx={{ pb: 1 }}>
            <PieChart
              skipAnimation={reduceMotion()}
              height={220}
              series={[{ data: stages, innerRadius: 60, outerRadius: 96, paddingAngle: 2, cornerRadius: 4, cx: '50%' }]}
              slotProps={{ legend: { hidden: true } }}
              margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
            />
          </Box>
          <Stack spacing={1.25} sx={{ px: 3, pb: 3 }}>
            {stages.map((x) => (
              <Stack key={x.id} direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: x.color, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ flex: 1 }}>{x.label}</Typography>
                <Typography variant="subtitle2">{x.value}</Typography>
              </Stack>
            ))}
          </Stack>
        </SectionCard>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <SectionCard title="Needs attention" subheader="Live" sx={{ height: '100%' }} contentSx={{ px: 3, pb: 3 }}>
          <ResponsiveTable
            rowKey={(r) => r.what}
            rows={attention}
            columns={[
              { label: 'What', render: (r) => <>{r.what}{r.note && <Typography variant="caption" color="text.secondary" component="div">{r.note}</Typography>}</> },
              { label: 'Count', align: 'right', render: (r) => <Label color={r.n ? r.tone : 'default'}>{r.n}</Label> },
            ]}
          />
        </SectionCard>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <SectionCard title="Billed, counted and owed" subheader="Live, Benapole" sx={{ height: '100%' }}>
          <Stack spacing={2.5} sx={{ px: 3, pb: 3 }}>
            {money.map(([label, value, tone]) => (
              <Box key={label}>
                <Stack direction="row" justifyContent="space-between" gap={2} sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="subtitle2" sx={{ whiteSpace: 'nowrap' }}>{formatBDT(value)}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={f.billed ? (value / f.billed) * 100 : 0} color={tone} aria-label={label} />
              </Box>
            ))}
            <Typography variant="caption" color="text.secondary">Bank fallback payments count only after a second officer confirms them.</Typography>
          </Stack>
        </SectionCard>
      </Grid>
    </Grid>
  );
}

// ----- Annex 11 indicators -----

const PORT_NAMES = { BEN: 'Benapole', BHO: 'Bhomra', BUR: 'Burimari' };

// Benapole figures the demo record can compute; everything else is demonstration data (marked as such).
function liveIndicators(f) {
  const s = f.p.state;
  const visits = s.visits.filter((v) => v.gateIn);
  const exited = visits.filter((v) => v.stage === 'Exited' || v.exitAt).length;
  const outage = s.outage ?? { phase: 'normal' };
  const cases = s.outageCases ?? [];
  const keyed = s.boes.filter((b) => b.source === 'Keyed by the agency').length;
  const used = f.sheds.reduce((n, x) => n + x.usedT, 0);
  const capacity = f.sheds.reduce((n, x) => n + x.capacityT, 0);
  return {
    holds: `${f.holds} open${f.holdText !== 'None open' ? ` (${f.holdText})` : ''}`,
    weightFlags: `${f.flags} flag${f.flags === 1 ? '' : 's'}`,
    occupancy: `${Math.round((used / capacity) * 100)}% used (${used} of ${capacity} t)`,
    exitCompleteness: visits.length ? `${Math.round((exited / Math.max(1, visits.filter((v) => v.stage === 'Exited' || v.exitAt || v.stage === 'Unloaded').length)) * 100)}% of finished visits` : '–',
    breaches: cases.filter((c) => c.cls === 'E').length ? `${cases.filter((c) => c.cls === 'E').length} incident(s), referred to Customs and BLPA` : 'None',
    manualPeriods: outage.declaredAt ? `1 period from ${formatDateTime(outage.declaredAt)}${outage.normalAt ? ` to ${formatDateTime(outage.normalAt)}` : ', not yet closed'} · ${(s.backEntries ?? []).length} forms back-entered · ${cases.filter((c) => !c.referred).length} exceptions open` : 'None this period',
    corrections: `${s.corrections.length} recorded · ${f.corrections} waiting approval`,
    bnswDownShare: `${s.manifests.length ? Math.round((keyed / s.manifests.length) * 100) : 0}% keyed${s.bnswDown ? ' · BNSW down now' : ''}`,
    revenue: `Billed ${formatBDT(f.billed)} · collected ${formatBDT(f.counted)}`,
  };
}

function IndicatorCard({ ind, scope, live }) {
  const [open, setOpen] = useState(false);
  const isLive = scope === 'BEN' && live[ind.id] !== undefined;
  const value = scope === 'all' ? null : (isLive ? live[ind.id] : ind.ports[scope]);
  return (
    <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle2" component="h3">{ind.name}</Typography>
        <Label color={isLive || (scope === 'all' && live[ind.id] !== undefined) ? 'success' : 'default'}>{isLive ? 'Live' : scope === 'all' && live[ind.id] !== undefined ? 'Benapole live' : 'Demo'}</Label>
      </Stack>
      {scope === 'all' ? (
        <Stack spacing={0.5} sx={{ mb: 1 }}>
          {Object.entries(ind.ports).map(([code, v]) => (
            <Typography key={code} variant="body2"><Box component="span" sx={{ color: 'text.secondary' }}>{PORT_NAMES[code]}:</Box> {code === 'BEN' && live[ind.id] !== undefined ? live[ind.id] : v}</Typography>
          ))}
        </Stack>
      ) : (
        <Typography variant="h6" sx={{ mb: 0.5 }}>{value}</Typography>
      )}
      <Typography variant="caption" color="text.secondary" component="div">Same period last year: {ind.lastYear}</Typography>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>Answers for it: {ind.owner}</Typography>
      <Box sx={{ mt: 'auto' }}>
        <Button size="small" variant="outlined" color="inherit" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? 'Hide how it is calculated' : "How it's calculated"}</Button>
        {open && (
          <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>{ind.definition}</Typography>
            <Typography variant="caption" color="text.secondary" component="div">Computed from: {ind.from}</Typography>
            <Typography variant="caption" color="text.secondary" component="div">Baseline: {ind.baseline}</Typography>
            {isLive && <Typography variant="caption" color="text.secondary" component="div">This figure is computed now from the Benapole demo record.</Typography>}
          </Box>
        )}
      </Box>
    </Card>
  );
}

function IndicatorGrid({ group, scope, f }) {
  const live = liveIndicators(f);
  const list = indicators.filter((i) => i.group === group);
  return (
    <>
      <Typography variant="h6" component="h2" sx={{ mt: 1, mb: 2 }}>{group} indicators (M2 Annex 11) · {list.length}</Typography>
      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,1fr))', lg: 'repeat(3, minmax(0,1fr))' } }}>
        {list.map((ind) => <IndicatorCard key={ind.id} ind={ind} scope={scope} live={live} />)}
      </Box>
    </>
  );
}

// Every chart has the same information in words beneath it (M2 Annex 24.8).
function ChartInWords({ children }) {
  return <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 3 }}><Box component="span" sx={{ fontWeight: 600 }}>In words: </Box>{children}</Typography>;
}

function Performance({ f, scope }) {
  const theme = useTheme();
  const hours = [31.2, 30.4, 29.8, 28.1, 26.9, 25.5, 24.2, 23.0, 21.8, 20.9, 19.6, 18.7];
  return (
    <Stack spacing={3}>
      <SectionCard title="Time in port" subheader="Median hours, gate in to exit, last 12 months, Benapole">
        <Box sx={{ px: 1 }}>
          <LineChart
            skipAnimation={reduceMotion()}
            height={300}
            xAxis={[{ scaleType: 'point', data: MONTHS }]}
            series={[{ data: hours, label: 'Median hours', color: theme.palette.primary.main, area: true, showMark: false, curve: 'natural' }]}
            sx={{ '& .MuiAreaElement-root': { fillOpacity: 0.12 } }}
            slotProps={{ legend }}
            margin={{ top: 40, right: 20, left: 40, bottom: 30 }}
          />
        </Box>
        <ChartInWords>The median time in port fell every month, from {hours[0]} hours in {MONTHS[0]} to {hours[11]} hours in {MONTHS[11]}.</ChartInWords>
      </SectionCard>
      <Box><IndicatorGrid group="Performance" scope={scope} f={f} /></Box>
    </Stack>
  );
}

function Revenue({ f, scope }) {
  const theme = useTheme();
  return (
    <Stack spacing={3}>
      <SectionCard title="Billed and counted" subheader="Last 12 months (BDT lakh), Benapole">
        <Box sx={{ px: 1 }}>
          <LineChart
            skipAnimation={reduceMotion()}
            height={340}
            xAxis={[{ scaleType: 'point', data: MONTHS }]}
            series={[
              { data: BILLED_LAKH, label: 'Billed', color: theme.palette.primary.main, area: true, showMark: false, curve: 'natural' },
              { data: COUNTED_LAKH, label: 'Counted', color: theme.palette.warning.main, showMark: false, curve: 'natural' },
            ]}
            sx={{ '& .MuiAreaElement-root': { fillOpacity: 0.12 } }}
            slotProps={{ legend }}
            margin={{ top: 40, right: 20, left: 40, bottom: 30 }}
          />
        </Box>
        <ChartInWords>Billing grew from {BILLED_LAKH[0]} lakh in {MONTHS[0]} to {BILLED_LAKH[11]} lakh in {MONTHS[11]}; collections followed about 11% lower each month, {COUNTED_LAKH[11]} lakh in {MONTHS[11]}.</ChartInWords>
      </SectionCard>
      <Box><IndicatorGrid group="Revenue" scope={scope} f={f} /></Box>
    </Stack>
  );
}

function Resources({ f, scope }) {
  const theme = useTheme();
  return (
    <Stack spacing={3}>
      <SectionCard title="Space by shed and yard" subheader="Tonnes, live, Benapole">
        <Box sx={{ px: 1, pb: 1 }}>
          <BarChart
            skipAnimation={reduceMotion()}
            height={300}
            borderRadius={6}
            xAxis={[{ scaleType: 'band', data: f.sheds.map((s) => s.id), categoryGapRatio: 0.5, barGapRatio: 0.2 }]}
            series={[
              { data: f.sheds.map((s) => s.usedT), label: 'Used', color: theme.palette.primary.main, stack: 'space' },
              { data: f.sheds.map((s) => s.capacityT - s.usedT), label: 'Free', color: theme.palette.grey[400], stack: 'space' },
            ]}
            slotProps={{ legend }}
            margin={{ top: 40, right: 16, left: 48, bottom: 30 }}
          />
        </Box>
        <ChartInWords>{f.sheds.map((s) => `${s.id} ${s.usedT} of ${s.capacityT} t used`).join('; ')}.</ChartInWords>
      </SectionCard>
      <Box><IndicatorGrid group="Resources" scope={scope} f={f} /></Box>
    </Stack>
  );
}

function Control({ f, scope }) {
  return <IndicatorGrid group="Control and security" scope={scope} f={f} />;
}

// A preview loads with skeleton rows, and a report that cannot be built shows the system-error state with a
// help-desk reference (M2 Annex 24.4). The demo always fails "Posting and allocation" once, to show that state.
const PREVIEW_ROWS = [
  ['2026-11-25 09:12', 'WB 23 D 1187', '2026/601/08841'],
  ['2026-11-25 09:40', 'WB 41 B 2240', '2026/601/08874'],
  ['2026-11-25 10:05', 'WB 25 A 3307', '2026/601/08860'],
];

function ReportPreview({ report, onClose }) {
  const [phase, setPhase] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setPhase('loading');
    const timer = setTimeout(() => setPhase(report.name === 'Posting and allocation' && attempt === 0 ? 'error' : 'ready'), 900);
    return () => clearTimeout(timer);
  }, [report, attempt]);
  return (
    <Card variant="outlined" sx={{ p: 3, mb: 3, boxShadow: 'none' }} aria-busy={phase === 'loading'}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" component="h2">{report.name}: preview</Typography>
        <Button size="small" variant="outlined" color="inherit" onClick={onClose}>Close preview</Button>
      </Stack>
      {phase === 'loading' && (
        <Stack spacing={1.25} role="status" aria-label="Loading the preview">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={28} />)}
        </Stack>
      )}
      {phase === 'error' && (
        <Alert severity="error" action={<Button color="inherit" size="small" variant="outlined" onClick={() => setAttempt((a) => a + 1)}>Try again</Button>}>
          <Typography variant="subtitle2">The report could not be built</Typography>
          <Typography variant="body2">Nothing was lost. Try again; if it fails again, call the help desk and quote reference HD-2026-11-25-0042.</Typography>
        </Alert>
      )}
      {phase === 'ready' && (
        <ResponsiveTable
          rowKey={(r) => r[0]}
          rows={PREVIEW_ROWS}
          columns={[{ label: 'Time', render: (r) => r[0] }, { label: 'Plate', render: (r) => r[1] }, { label: 'Manifest', render: (r) => r[2] }]}
        />
      )}
    </Card>
  );
}

function Reports() {
  const [preview, setPreview] = useState(null);
  const [recorded, setRecorded] = useState('');
  return (
    <>
      {preview && <ReportPreview report={preview} onClose={() => setPreview(null)} />}
      {recorded && <Alert severity="info" sx={{ mb: 3 }} onClose={() => setRecorded('')}>{recorded}</Alert>}
      <Card sx={{ p: 3 }}>
        <ResponsiveTable
          rowKey={(r) => r.name}
          rows={REPORTS}
          columns={[
            { label: 'Report', nowrap: true, render: (r) => <Typography variant="subtitle2">{r.name}</Typography> },
            { label: 'Contents', priority: 'low', render: (r) => <Box component="span" sx={{ color: 'text.secondary' }}>{r.desc}</Box> },
            {
              label: 'Export', align: 'right', render: (r) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" variant="outlined" color="inherit" onClick={() => setPreview(r)}>Preview</Button>
                  {['CSV', 'Excel'].map((kind) => (
                    <Button key={kind} size="small" variant="outlined" color="inherit" onClick={() => setRecorded(`${r.name} (${kind}) downloaded as BEN_${r.name.replace(/\W+/g, '-')}_2026-11-25. The download is recorded in the audit log with your name.`)}>{kind}</Button>
                  ))}
                </Stack>
              ),
            },
          ]}
        />
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 2 }}>
          Only reports you are entitled to are listed. Downloads are named by port and date range and recorded in the audit log.
        </Typography>
      </Card>
    </>
  );
}

export default function Dashboard() {
  const t = useT();
  const f = useFigures();
  const [tab, setTab] = useState('operations');
  const [period, setPeriod] = useState('week');
  // One port or all ports (M2 Annex 11 and M-11); Benapole is live from the record, the others are demo figures.
  const [scope, setScope] = useState('BEN');
  const s = f.p.state;
  const problems = [
    s.bnswDown && 'BNSW is down: the port works in BNSW-down mode.',
    s.exitCheckDown && 'The exit check is down: trucks are held at the exit lanes.',
  ].filter(Boolean);
  return (
    <>
      <PageHeader
        title={t('Dashboard')}
        subtitle={`${scope === 'all' ? 'All pilot ports' : PORT_NAMES[scope]}. Figures marked Live come from the port record; the rest, and last year, are demonstration data.`}
        action={
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <ToggleButtonGroup size="small" exclusive value={scope} onChange={(_, v) => v && setScope(v)} aria-label="Ports shown">
              <ToggleButton value="BEN">Benapole</ToggleButton>
              <ToggleButton value="BHO">Bhomra</ToggleButton>
              <ToggleButton value="BUR">Burimari</ToggleButton>
              <ToggleButton value="all">All ports</ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup size="small" exclusive value={period} onChange={(_, v) => v && setPeriod(v)} aria-label="Period">
              <ToggleButton value="day">Today</ToggleButton>
              <ToggleButton value="week">Week</ToggleButton>
              <ToggleButton value="month">Month</ToggleButton>
              <ToggleButton value="year">Year</ToggleButton>
            </ToggleButtonGroup>
            <Button variant="contained" startIcon={<FileDownloadOutlinedIcon />}>Export</Button>
          </Stack>
        }
      />
      {problems.length > 0 && <Alert severity="warning" sx={{ mb: 3 }}>{problems.join(' ')}</Alert>}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 3 }}>
        <Tab value="operations" label="Operations" />
        <Tab value="performance" label="Performance" />
        <Tab value="revenue" label="Revenue" />
        <Tab value="resources" label="Resources" />
        <Tab value="control" label="Control" />
        <Tab value="reports" label="Reports" />
      </Tabs>
      {tab === 'operations' && <Operations f={f} />}
      {tab === 'performance' && <Performance f={f} scope={scope} />}
      {tab === 'revenue' && <Revenue f={f} scope={scope} />}
      {tab === 'resources' && <Resources f={f} scope={scope} />}
      {tab === 'control' && <Control f={f} scope={scope} />}
      {tab === 'reports' && <Reports />}
    </>
  );
}
