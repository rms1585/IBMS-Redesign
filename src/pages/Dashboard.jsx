import { useState } from 'react';
import {
  Box, Card, Stack, Tabs, Tab, Typography, Grid2 as Grid, Button, ToggleButtonGroup, ToggleButton,
  Table, TableHead, TableRow, TableCell, TableBody, LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import { PageHeader, KpiCard, SectionCard, formatBDT } from '../components/common';
import Label from '../components/Label';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const reports = [
  { name: 'Vehicle entry register', desc: 'Time, gate/lane, plate, kind, manifest, agency, operator, no-manifest/override.' },
  { name: 'Vehicle exit register', desc: 'Departure, gate/lane, plate, pass, manifest, hold/manual flags.' },
  { name: 'Weighbridge register', desc: 'Loaded/empty/return weights, billable tonnes, tare age, method, declared/difference.' },
  { name: 'Posting / allocation', desc: 'Cargo-line shed/bay, wait time and overrides.' },
];

function Operations() {
  const theme = useTheme();
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 3 }}><KpiCard title="Admissions today" value="142" change={8.2} icon={<LocalShippingRoundedIcon />} /></Grid>
      <Grid size={{ xs: 12, md: 3 }}><KpiCard title="Trucks inside" value="67" change={-3.1} icon={<LocalShippingRoundedIcon />} color="info" /></Grid>
      <Grid size={{ xs: 12, md: 3 }}><KpiCard title="Oldest wait" value="4h 12m" caption="WB-23-K-4402 · Shed 5" icon={<TimerOutlinedIcon />} color="warning" /></Grid>
      <Grid size={{ xs: 12, md: 3 }}><KpiCard title="Open holds" value="5" caption="2 Customs · 3 BLPA" icon={<BlockRoundedIcon />} color="error" /></Grid>

      <Grid size={{ xs: 12, lg: 8 }}>
        <SectionCard title="Admissions and departures" subheader="This week compared with the same week last year">
          <Box sx={{ px: 1, pb: 1 }}>
            <BarChart
              height={320}
              borderRadius={6}
              xAxis={[{ scaleType: 'band', data: days, categoryGapRatio: 0.45, barGapRatio: 0.2 }]}
              series={[
                { data: [128, 141, 137, 152, 149, 96, 142], label: 'Admissions', color: theme.palette.primary.main },
                { data: [121, 133, 140, 147, 151, 102, 118], label: 'Departures', color: theme.palette.warning.main },
              ]}
              slotProps={{ legend: { position: { vertical: 'top', horizontal: 'right' }, itemMarkWidth: 10, itemMarkHeight: 10, markGap: 6, itemGap: 16 } }}
              margin={{ top: 40, right: 16, left: 40, bottom: 30 }}
            />
          </Box>
        </SectionCard>
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <SectionCard title="Trucks inside by kind" sx={{ height: '100%' }}>
          <Box sx={{ display: 'grid', placeItems: 'center', pb: 2 }}>
            <PieChart
              height={240}
              width={300}
              series={[{
                innerRadius: 64, outerRadius: 100, paddingAngle: 2, cornerRadius: 4,
                data: [
                  { id: 0, value: 38, label: 'Foreign loaded', color: theme.palette.primary.main },
                  { id: 1, value: 11, label: 'Foreign empty', color: theme.palette.primary.light },
                  { id: 2, value: 14, label: 'Local receiving', color: theme.palette.warning.main },
                  { id: 3, value: 4, label: 'Stone route', color: theme.palette.info.main },
                ],
              }]}
              slotProps={{ legend: { hidden: true } }}
              margin={{ right: 0, left: 0 }}
            />
          </Box>
          <Stack spacing={1.25} sx={{ px: 3, pb: 3 }}>
            {[['Foreign loaded', 38, 'primary.main'], ['Foreign empty', 11, 'primary.light'], ['Local receiving', 14, 'warning.main'], ['Stone route', 4, 'info.main']].map(([l, v, c]) => (
              <Stack key={l} direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: c }} />
                <Typography variant="body2" sx={{ flex: 1 }}>{l}</Typography>
                <Typography variant="subtitle2">{v}</Typography>
              </Stack>
            ))}
          </Stack>
        </SectionCard>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <SectionCard title="Needs attention" subheader="Live overview">
          <Table size="small">
            <TableBody>
              {[
                ['Loaded, awaiting exit pass', 9, 'warning'],
                ['Unlinked admissions (no manifest)', 2, 'error'],
                ['Expected arrivals in next 2 h', 14, 'info'],
                ['Scales due for calibration', 1, 'warning'],
                ['Manual statuses awaiting reconciliation', 3, 'error'],
              ].map(([l, v, c]) => (
                <TableRow key={l}>
                  <TableCell sx={{ pl: 3 }}>{l}</TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}><Label color={c}>{v}</Label></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <SectionCard title="Billed, counted and owed" subheader="Today, Benapole">
          <Stack spacing={2.5} sx={{ px: 3, pb: 3 }}>
            {[['Billed', 1248520, 100, 'primary'], ['Counted (cash, online, cleared cheques)', 1021340, 81.8, 'success'], ['Owed', 227180, 18.2, 'warning']].map(([l, v, pct, c]) => (
              <Box key={l}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">{l}</Typography>
                  <Typography variant="subtitle2">{formatBDT(v)}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={pct} color={c} />
              </Box>
            ))}
            <Typography variant="caption" color="text.disabled">Bank fallback payments count only after a second officer confirms them.</Typography>
          </Stack>
        </SectionCard>
      </Grid>
    </Grid>
  );
}

function Revenue() {
  const theme = useTheme();
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 3 }}><KpiCard title="Billed this month" value="BDT 3.42 cr" change={5.4} icon={<PaymentsRoundedIcon />} /></Grid>
      <Grid size={{ xs: 12, md: 3 }}><KpiCard title="Collection rate" value="88.6%" change={1.2} icon={<PaymentsRoundedIcon />} color="success" /></Grid>
      <Grid size={{ xs: 12, md: 3 }}><KpiCard title="Outstanding balance" value="BDT 38.9 L" change={-6.0} icon={<PaymentsRoundedIcon />} color="warning" /></Grid>
      <Grid size={{ xs: 12, md: 3 }}><KpiCard title="Uncleared cheques" value="7" caption="BDT 4.1 L awaiting clearance" icon={<PaymentsRoundedIcon />} color="error" /></Grid>
      <Grid size={12}>
        <SectionCard title="Billed vs counted" subheader="Last 12 months (BDT  lakh)">
          <Box sx={{ px: 1 }}>
            <LineChart
              height={340}
              xAxis={[{ scaleType: 'point', data: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'] }]}
              series={[
                { data: [281, 295, 302, 288, 310, 322, 318, 301, 327, 335, 330, 342], label: 'Billed', color: theme.palette.primary.main, area: true, showMark: false, curve: 'natural' },
                { data: [250, 262, 270, 259, 276, 290, 281, 268, 291, 299, 296, 303], label: 'Counted', color: theme.palette.warning.main, showMark: false, curve: 'natural' },
              ]}
              sx={{ '& .MuiAreaElement-root': { fillOpacity: 0.12 } }}
              slotProps={{ legend: { position: { vertical: 'top', horizontal: 'right' }, itemMarkWidth: 10, itemMarkHeight: 10 } }}
              margin={{ top: 40, right: 20, left: 40, bottom: 30 }}
            />
          </Box>
        </SectionCard>
      </Grid>
    </Grid>
  );
}

function Performance() {
  const rows = [
    ['Gate-to-gate dwell (median)', '18h 40m', '21h 05m', 11.5],
    ['Admission to weighing', '22m', '27m', 18.5],
    ['Weighing to allocation', '41m', '38m', -7.9],
    ['Release to departure', '2h 15m', '2h 50m', 20.6],
    ['Manifest cycle (open to closure)', '3.2 days', '3.6 days', 11.1],
  ];
  return (
    <Card>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ pl: 3 }}>Measure</TableCell>
            <TableCell>This period</TableCell>
            <TableCell>Preceding period</TableCell>
            <TableCell align="right" sx={{ pr: 3 }}>Change</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(([m, a, b, c]) => (
            <TableRow key={m} hover>
              <TableCell sx={{ pl: 3, fontWeight: 600 }}>{m}</TableCell>
              <TableCell>{a}</TableCell>
              <TableCell sx={{ color: 'text.secondary' }}>{b}</TableCell>
              <TableCell align="right" sx={{ pr: 3 }}><Label color={c >= 0 ? 'success' : 'error'}>{c >= 0 ? 'Faster' : 'Slower'} {Math.abs(c)}%</Label></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function Simple({ items }) {
  return (
    <Grid container spacing={3}>
      {items.map(([t, v, c, col]) => (
        <Grid key={t} size={{ xs: 12, md: 4 }}><KpiCard title={t} value={v} caption={c} color={col} /></Grid>
      ))}
    </Grid>
  );
}

function Reports() {
  return (
    <Card>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ pl: 3 }}>Report</TableCell>
            <TableCell>Contents</TableCell>
            <TableCell align="right" sx={{ pr: 3 }}>Export</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reports.map((r) => (
            <TableRow key={r.name} hover>
              <TableCell sx={{ pl: 3, fontWeight: 600, whiteSpace: 'nowrap' }}>{r.name}</TableCell>
              <TableCell sx={{ color: 'text.secondary' }}>{r.desc}</TableCell>
              <TableCell align="right" sx={{ pr: 3, whiteSpace: 'nowrap' }}>
                <Button size="small" color="inherit">Preview</Button>
                <Button size="small" color="inherit">CSV</Button>
                <Button size="small" color="inherit">Excel</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', px: 3, py: 2 }}>
        Only reports you are entitled to are listed. Downloads are named by port and date range and recorded in the audit log.
      </Typography>
    </Card>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState('operations');
  const [period, setPeriod] = useState('week');

  return (
    <>
      <PageHeader
        title="Dashboard"
        links={[{ name: 'Overview', href: '/' }, { name: 'Dashboard' }]}
        action={
          <>
            <ToggleButtonGroup size="small" exclusive value={period} onChange={(e, v) => v && setPeriod(v)}>
              <ToggleButton value="day">Today</ToggleButton>
              <ToggleButton value="week">Week</ToggleButton>
              <ToggleButton value="month">Month</ToggleButton>
              <ToggleButton value="year">Year</ToggleButton>
            </ToggleButtonGroup>
            <Button variant="contained" color="inherit" startIcon={<FileDownloadOutlinedIcon />}>Export</Button>
          </>
        }
      />
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="operations" label="Operations" />
        <Tab value="performance" label="Performance" />
        <Tab value="revenue" label="Revenue" />
        <Tab value="resources" label="Resources" />
        <Tab value="control" label="Control" />
        <Tab value="reports" label="Reports" />
      </Tabs>
      {tab === 'operations' && <Operations />}
      {tab === 'performance' && <Performance />}
      {tab === 'revenue' && <Revenue />}
      {tab === 'resources' && (
        <Simple items={[
          ['Tonnes weighed', '8,412 t', 'This week', 'primary'],
          ['Storage occupancy', '71%', 'Of usable bay capacity (blocked bays excluded)', 'info'],
          ['Blocked bays', '6', 'Across 3 facilities', 'warning'],
          ['Separation violations', '0', 'No active violations', 'success'],
          ['Transfer-yard utilisation', '54%', 'Yard T1', 'info'],
          ['Calibration due', '1 scale', 'Scale 2 due in 6 days', 'warning'],
        ]} />
      )}
      {tab === 'control' && (
        <Simple items={[
          ['Holds', '5', '2 Customs · 3 BLPA', 'error'],
          ['Management review', '2', 'Unregistered admissions to confirm', 'warning'],
          ['Approved overrides', '3', 'This week', 'info'],
          ['Corrections', '4', 'All with approved requests', 'info'],
          ['Unauthorised exits', '0', 'This week', 'success'],
          ['Audit integrity', 'No history', 'Comparison not available for this period', 'primary'],
        ]} />
      )}
      {tab === 'reports' && <Reports />}
    </>
  );
}
