import { useState } from 'react';
import { Alert, Box, Button, Card, Stack, Tab, Tabs, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { formatBDT, formatDateTime } from '../demo/format';
import { Confirmation, Plate, ResponsiveTable, SectionTitle, StatusPill } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M2 3.5 and 3.6: export trucks stay loaded (export storage is off at every port by default), the consignment's trucks
// wait for each other billed as halting, each leaves on a single-use pass, and the empty truck is recognised by plate.
// Demo data local to this screen.

const ago = (h) => new Date(Date.now() - h * 3600000).toISOString();
const HALTING = 300;

const CONSIGNMENTS = [
  {
    id: 'BOX-601-2026-0412', exporter: 'Akij Jute Mills', goods: 'Jute yarn', released: true, billPaid: true,
    trucks: [
      { plate: 'Jessore-TA 14-1180', arrived: ago(30), state: 'Exited', pass: 'BEN-XP-00812', returned: ago(4) },
      { plate: 'Jessore-TA 14-1203', arrived: ago(28), state: 'Pass valid', pass: 'BEN-XP-00813', returned: null },
      { plate: 'Khulna-TA 11-0907', arrived: ago(9), state: 'Waiting for release', pass: null, returned: null },
    ],
  },
  {
    id: 'BOX-601-2026-0419', exporter: 'Pran Foods', goods: 'Packaged snacks', released: false, billPaid: false,
    trucks: [{ plate: 'Dhaka Metro-TA 15-3321', arrived: ago(14), state: 'Waiting for release', pass: null, returned: null }],
  },
];

const RETURNS = [
  { id: 'RX-601-2026-0031', kind: 'Re-export of a temporary import', goods: 'Exhibition equipment', ref: 'Customs TI-601-2026-118', state: 'Waiting for release' },
  { id: 'RT-601-2026-0007', kind: 'Refused export returning loaded', goods: 'Ceramic tiles', ref: 'Revenue desk approval, refusal noted by the foreign side', state: 'Approved' },
];

export default function ExportCargo() {
  const t = useT();
  const [tab, setTab] = useState(0);
  const [returned, setReturned] = useState({});
  const [msg, setMsg] = useState('');
  return (
    <>
      <PageHeader title={t('Export')} subtitle="Export storage is off at Benapole, so export trucks stay loaded until the consignment leaves." />
      <Card sx={{ px: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          {['Export consignments', 'Re-export and returns'].map((x) => <Tab key={x} label={x} />)}
        </Tabs>
      </Card>
      <Stack spacing={2} sx={{ mt: 2 }}>
        {tab === 0 && CONSIGNMENTS.map((c) => {
          const waiting = c.trucks.filter((x) => !x.pass);
          const haltDays = c.trucks.reduce((s, x) => s + (x.state === 'Exited' ? 0 : Math.ceil((Date.now() - new Date(x.arrived)) / 86400000)), 0);
          return (
            <Card key={c.id} sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
                <Typography variant="h6">Bill of Export {c.id}</Typography>
                <StatusPill word={c.released ? 'Released' : 'Waiting for release'} />
                <StatusPill word={c.billPaid ? 'Paid' : 'Payment due'} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{c.exporter} · {c.goods} · halting so far {haltDays} truck-days, {formatBDT(haltDays * HALTING)} on the export bill</Typography>
              {waiting.length > 0 && <Alert severity="info" sx={{ mb: 2 }}>{waiting.length} truck{waiting.length === 1 ? '' : 's'} still waiting for Customs' release. The others wait loaded in the holding area and pay halting.</Alert>}
              <ResponsiveTable
                rowKey={(x) => x.plate}
                rows={c.trucks}
                columns={[
                  { label: 'Plate', render: (x) => <Plate>{x.plate}</Plate> },
                  { label: 'Arrived', priority: 'low', render: (x) => formatDateTime(x.arrived) },
                  { label: 'Exit Pass', render: (x) => x.pass ?? '–' },
                  { label: 'Status', render: (x) => <StatusPill word={returned[x.plate] || x.returned ? 'Closed' : x.state} /> },
                  {
                    label: 'Empty return',
                    render: (x) => (x.returned || returned[x.plate]
                      ? `Back empty ${formatDateTime(x.returned ?? returned[x.plate])}`
                      : x.state === 'Exited'
                        ? <Button size="small" variant="outlined" onClick={() => { setReturned({ ...returned, [x.plate]: new Date().toISOString() }); setMsg(`${x.plate} recognised by plate as returning empty`); }}>Read plate at the border gate</Button>
                        : '–'),
                  },
                ]}
              />
            </Card>
          );
        })}
        {tab === 1 && (
          <Card sx={{ p: 3 }}>
            <SectionTitle>Re-export of temporary imports, and returns of refused exports</SectionTitle>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Re-export goods are already in custody and are billed for storage to the date of the bill. A refused export truck returns against its export visit, which closes as refused and returned.</Typography>
            <ResponsiveTable
              rowKey={(r) => r.id}
              rows={RETURNS}
              columns={[
                { label: 'Record', render: (r) => r.id },
                { label: 'Kind', render: (r) => r.kind },
                { label: 'Goods', priority: 'low', render: (r) => r.goods },
                { label: 'Reference', priority: 'low', render: (r) => r.ref },
                { label: 'Status', render: (r) => <StatusPill word={r.state} /> },
              ]}
            />
          </Card>
        )}
      </Stack>
      <Box />
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
