import { useState } from 'react';
import { Alert, Box, Button, Card, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { useRole } from '../RoleContext';
import { usePort } from '../demo/PortStore';
import { formatDateTime, formatKg } from '../demo/format';
import { Confirmation, Fact, Facts, HoldRow, LockedValue, Plate, SectionTitle, StatusPill } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-07: truck-to-truck transfer of perishable lines against the agency's transfer request.
// The transfer request is demo data local to this screen; holds come from the shared record.

const REQUEST = {
  id: 'TR-2026-0088', manifest: '2026/601/08841', importer: 'Delta Foods Ltd', agency: 'Jamuna C&F Services',
  foreign: 'WB 37 C 5512', line: 'Line 2: Lentils, red, split', totalKg: 8000,
  slots: ['Jessore-TA 11-4418', 'Jessore-TA 11-5021', null],
};

const ASSOCIATIONS = ['Benapole Port Labour Association No. 1', 'Benapole Port Labour Association No. 2'];

export default function Transshipment() {
  const p = usePort();
  const t = useT();
  const { role } = useRole();
  const [moves, setMoves] = useState([]);
  const [truck, setTruck] = useState('');
  const [kg, setKg] = useState('');
  const [assoc, setAssoc] = useState('');
  const [msg, setMsg] = useState('');
  const moved = moves.reduce((s, m) => s + m.kg, 0);
  const left = REQUEST.totalKg - moved;
  const holds = p.holdsOnManifest(REQUEST.manifest);
  const admitted = REQUEST.slots.filter(Boolean);
  const n = Number(kg);
  const blockers = [holds.length && `${holds[0].body} hold: ${holds[0].reason}. The transfer stops until it is lifted.`, n > left && `Only ${formatKg(left)} is left on the foreign truck.`, !assoc && 'Tag the labour association first.'].filter(Boolean);
  const lock = () => {
    setMoves([...moves, { truck, kg: n, by: role.person, at: new Date().toISOString(), assoc }]);
    setMsg(`Transfer to ${truck} locked`);
    setTruck(''); setKg('');
  };
  return (
    <>
      <PageHeader title={t('Transshipment')} subtitle="Only perishables go truck to truck. Customs assesses the goods during the transfer, outside IBMS." />
      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
            <Typography variant="h6">Transfer request {REQUEST.id}</Typography>
            <StatusPill word={left === 0 ? 'Closed' : 'Open'} />
          </Stack>
          <Facts cols={4}>
            <Fact label="Foreign truck"><Plate>{REQUEST.foreign}</Plate></Fact>
            <Fact label="Importer">{REQUEST.importer}</Fact>
            <Fact label="C&F agency">{REQUEST.agency}</Fact>
            <Fact label="Line">{REQUEST.line}</Fact>
            <Fact label="Moved">{formatKg(moved)}</Fact>
            <Fact label="Left on the foreign truck">{formatKg(left)}</Fact>
            <Fact label="Receiving trucks admitted">{admitted.length} of {REQUEST.slots.length} slots</Fact>
          </Facts>
          {holds.map((h) => <Box key={h.id} sx={{ mt: 2 }}><HoldRow hold={h} /></Box>)}
        </Card>

        <Card sx={{ p: 3 }}>
          <SectionTitle>Record a transfer</SectionTitle>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
            <TextField select label="Receiving truck" value={truck} onChange={(e) => setTruck(e.target.value)}>
              {admitted.filter((x) => !moves.some((m) => m.truck === x)).map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}
            </TextField>
            <TextField type="number" label="Quantity moved (kg)" value={kg} onChange={(e) => setKg(e.target.value)} helperText="What this truck actually took, never an even split" />
            <TextField select label="Labour association" value={assoc} onChange={(e) => setAssoc(e.target.value)}>
              {ASSOCIATIONS.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
          </Box>
          {blockers.length > 0 && truck && <Alert severity="error" variant="outlined" sx={{ mt: 2 }}>{blockers.join(' ')}</Alert>}
          <Button variant="contained" sx={{ mt: 2 }} disabled={!truck || !n || blockers.length > 0} onClick={lock}>Lock transfer</Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>The warehouse manager enters the start and end times of each transfer. Each receiving truck leaves on its own Customs exit note, once the foreign truck's exit is recorded and its bill is paid.</Typography>
        </Card>

        <Card sx={{ p: 3 }}>
          <SectionTitle>Transfers</SectionTitle>
          {moves.length === 0 && <Typography variant="body2" color="text.secondary">No transfer locked yet.</Typography>}
          {moves.map((m) => (
            <Stack key={m.truck} direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Plate>{m.truck}</Plate>
              <LockedValue>{formatKg(m.kg)}</LockedValue>
              <Typography variant="body2" color="text.secondary">{m.assoc} · {m.by}, {formatDateTime(m.at)}</Typography>
            </Stack>
          ))}
        </Card>
      </Stack>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
