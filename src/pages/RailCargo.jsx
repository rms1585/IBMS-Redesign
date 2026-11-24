import { useState } from 'react';
import { Alert, Box, Button, Card, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { formatKg } from '../demo/format';
import { Confirmation, Fact, Facts, ResponsiveTable, SectionTitle, StatusPill } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';
import { useStoredState } from '../demo/PortStore';

// M-16: a train is known by its train and wagon numbers and its railway receipt, not by a plate.
// The rake record opens when the train is on record and closes when the wagons leave. Demo data local to this screen.

const INITIAL = [
  { wagon: 'WGN-40217', seal: 'RS-883102', handling: 'Unload to Shed 7', goods: 'Fly ash', kg: 58000, checked: null },
  { wagon: 'WGN-40218', seal: 'RS-883103', handling: 'Transfer to road trucks', goods: 'Fly ash', kg: 58000, checked: null },
  { wagon: 'WGN-40219', seal: 'RS-883104', handling: 'Self-driven vehicles (6)', goods: 'Tractors', kg: 21600, checked: null },
  { wagon: 'WGN-40220', seal: 'RS-883105', handling: 'Pass-through, no unloading', goods: 'Sealed containers', kg: 40000, checked: null },
];

export default function RailCargo() {
  const t = useT();
  const [wagons, setWagons] = useStoredState('railWagons', INITIAL);
  const [rep, setRep] = useState('');
  const [signed, setSigned] = useStoredState('railWagonListSignedBy', null);
  const [msg, setMsg] = useState('');
  const check = (wagon, ok) => {
    setWagons((ws) => ws.map((w) => (w.wagon === wagon ? { ...w, checked: ok ? 'Seal intact' : 'Difference recorded, photo attached' } : w)));
    setMsg(ok ? `${wagon}: seal matches the wagon list` : `${wagon}: difference recorded with a photo`);
  };
  const allChecked = wagons.every((w) => w.checked);
  return (
    <>
      <PageHeader title={t('Rail cargo')} subtitle="Rail module is on at Benapole and Bhomra. BLPA bills storage and handling only; freight and demurrage are settled outside IBMS." />
      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
            <Typography variant="h6">Rake record RK-BEN-112</Typography>
            <StatusPill word={signed ? 'Closed' : 'Open'} />
          </Stack>
          <Facts cols={4}>
            <Fact label="Train">Up goods 4417, Petrapole to Benapole</Fact>
            <Fact label="Railway receipt">RR-ER-2026-558120</Fact>
            <Fact label="Manifest">2026/601/08902 · from BNSW</Fact>
            <Fact label="Wagons">{wagons.length}</Fact>
          </Facts>
        </Card>
        <Card sx={{ p: 3 }}>
          <SectionTitle>Joint check at the hand-over</SectionTitle>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>BLPA and the railway check each wagon's seal and condition against the wagon list. Any difference is recorded with a photo.</Typography>
          <ResponsiveTable
            rowKey={(w) => w.wagon}
            rows={wagons}
            columns={[
              { label: 'Wagon', render: (w) => w.wagon },
              { label: 'Seal', render: (w) => w.seal },
              { label: 'Goods', priority: 'low', render: (w) => `${w.goods} · ${formatKg(w.kg)}` },
              { label: 'Handling', render: (w) => w.handling },
              {
                label: 'Check',
                render: (w) => (w.checked ? <Typography variant="body2">{w.checked}</Typography> : (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => check(w.wagon, true)}>Seal intact</Button>
                    <Button size="small" color="warning" onClick={() => check(w.wagon, false)}>Record a difference</Button>
                  </Stack>
                )),
              },
            ]}
          />
        </Card>
        <Card sx={{ p: 3 }}>
          <SectionTitle>Sign the joint wagon list</SectionTitle>
          {signed ? (
            <Typography variant="body2">Signed by Anwar Hossain, rail siding officer, and {signed}, railway representative, on the officer's device with a signature image.</Typography>
          ) : (
            <Stack spacing={2}>
              {!allChecked && <Alert severity="info">Check every wagon before the hand-over is signed. The rake record cannot close while a wagon is unaccounted for.</Alert>}
              <TextField label="Railway representative's name and organisation" value={rep} onChange={(e) => setRep(e.target.value)} sx={{ maxWidth: 480 }} helperText="The representative has no IBMS account and countersigns on the officer's device." />
              <Box><Button variant="contained" disabled={!allChecked || !rep.trim()} onClick={() => { setSigned(rep.trim()); setMsg('Joint wagon list signed'); }}>Sign wagon list</Button></Box>
            </Stack>
          )}
        </Card>
      </Stack>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
