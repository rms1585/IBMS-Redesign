import { useState } from 'react';
import { Card, Stack, Tab, Tabs, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { usePort } from '../demo/PortStore';
import { formatBDT, formatDateTime, formatKg } from '../demo/format';
import { Plate, ResponsiveTable, SectionTitle, StatusPill } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-19: the labour association is tagged to each job; IBMS never tags individual labourers.
// Attendance shows present or absent only; raw card reads never appear on a screen.

const ROSTER = [
  { card: 'RF-BEN-0412', name: 'Md. Rahim Uddin', association: 'Association No. 1', shift: 'Morning', present: true },
  { card: 'RF-BEN-0413', name: 'Abul Kashem', association: 'Association No. 1', shift: 'Morning', present: true },
  { card: 'RF-BEN-0588', name: 'Shah Alam', association: 'Association No. 2', shift: 'Morning', present: false },
  { card: 'RF-BEN-0590', name: 'Nurul Islam', association: 'Association No. 2', shift: 'Evening', present: true },
  { card: 'DAY-1124-07', name: 'Day card, issued at the gate', association: 'Association No. 3', shift: 'Morning', present: true },
];

const CONTRACT = [
  { what: 'Labour, unloading and loading', qty: 412, unit: 'tonne', rate: 38 },
  { what: 'Forklift, 3 t', qty: 64, unit: 'hour', rate: 650 },
  { what: 'Mobile crane, 25 t', qty: 18, unit: 'lift', rate: 1200 },
];

export default function Labour() {
  const p = usePort();
  const t = useT();
  const [tab, setTab] = useState(0);
  const jobs = p.state.visits.filter((v) => v.receipt?.association).map((v) => ({ v, kg: Object.values(v.receipt.lines ?? {}).reduce((s, l) => s + l.receiptKg, 0) }));
  const total = CONTRACT.reduce((s, l) => s + l.qty * l.rate, 0);
  return (
    <>
      <PageHeader title={t('Labour and roster')} subtitle="Labourers enter on RFID cards. The association chooses who comes; the job records the labour and equipment actually used." />
      <Card sx={{ px: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          {['Tagged jobs', 'Attendance', 'Contractor bill'].map((x) => <Tab key={x} label={x} />)}
        </Tabs>
      </Card>
      <Card sx={{ p: 3, mt: 2 }}>
        {tab === 0 && (
          <ResponsiveTable
            rowKey={(r) => r.v.id}
            rows={jobs}
            empty="No job is tagged yet. The shed tags the association as soon as a consignment is posted."
            columns={[
              { label: 'Truck', render: (r) => <Plate>{r.v.plate}</Plate> },
              { label: 'Place', render: (r) => r.v.posting?.shed },
              { label: 'Association', render: (r) => r.v.receipt.association },
              { label: 'Handled', align: 'right', priority: 'low', render: (r) => (r.kg ? formatKg(r.kg) : '–') },
              { label: 'Job times', priority: 'low', render: (r) => (r.v.receipt.times ? `${formatDateTime(r.v.receipt.times.start)} to ${formatDateTime(r.v.receipt.times.end)}` : 'Not entered yet') },
              { label: 'Status', render: (r) => <StatusPill word={r.v.receipt.locked ? 'Locked' : 'Open'} /> },
            ]}
          />
        )}
        {tab === 1 && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>From the card readers at labour points. A card has one active use at a time and is read again at exit. Nobody is marked present without a device record or a recorded reason.</Typography>
            <ResponsiveTable
              rowKey={(r) => r.card}
              rows={ROSTER}
              columns={[
                { label: 'Card', render: (r) => r.card },
                { label: 'Name', render: (r) => r.name },
                { label: 'Association', priority: 'low', render: (r) => r.association },
                { label: 'Shift', priority: 'low', render: (r) => r.shift },
                { label: 'Status', render: (r) => <StatusPill word={r.present ? 'Present' : 'Absent'} /> },
              ]}
            />
          </>
        )}
        {tab === 2 && (
          <>
            <SectionTitle>Labour and equipment contractor · November 2026</SectionTitle>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Built from the association tags, requisitions and each lift and shift, at the contract rates. It is not a wage calculation; BLPA accounts approve it for payment outside IBMS.</Typography>
            <ResponsiveTable
              rowKey={(l) => l.what}
              rows={CONTRACT}
              columns={[
                { label: 'For', render: (l) => l.what },
                { label: 'Quantity × rate', nowrap: true, render: (l) => `${l.qty} ${l.unit} × ${formatBDT(l.rate)}` },
                { label: 'Amount', align: 'right', render: (l) => formatBDT(l.qty * l.rate) },
              ]}
            />
            <Stack alignItems="flex-end" sx={{ mt: 2 }}><Typography variant="subtitle1">Total {formatBDT(total)}</Typography></Stack>
          </>
        )}
      </Card>
    </>
  );
}
