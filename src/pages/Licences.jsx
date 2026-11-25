import { useState } from 'react';
import { Box, Button, Card, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { usePort } from '../demo/PortStore';
import { dayKey } from '../demo/format';
import { Confirmation, Fact, Facts, SectionTitle, StatusPill } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-18: licence evidence and the validity gate. IBMS records and verifies; it never issues or renews a licence.

function statusWord(l) {
  if (l.status !== 'Verified') return l.status;
  return l.validTo < dayKey() ? 'Expired' : 'Verified';
}

function AgencyLicence({ agency, onDone }) {
  const p = usePort();
  const l = p.licenceOf(agency.ain);
  const [editing, setEditing] = useState(false);
  const [number, setNumber] = useState('');
  const [validTo, setValidTo] = useState('');
  const word = statusWord(l);
  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
        <Typography variant="h6">{agency.name}</Typography>
        <Typography variant="body2" color="text.secondary">AIN {agency.ain}</Typography>
        <StatusPill word={word} />
      </Stack>
      <Facts cols={4}>
        <Fact label="Licence number">{l.number}</Fact>
        <Fact label="Issuer">{l.issuer}</Fact>
        <Fact label="Valid to">{l.validTo}</Fact>
        <Fact label="Verified by">{l.verifiedBy ?? '–'}</Fact>
      </Facts>
      {word !== 'Verified' && (
        <Typography variant="body2" color="error.text" sx={{ mt: 2 }}>
          {p.licenceProblem(agency.ain)} Truck entry, Bills of Entry, Delivery Requests, billing and pass approvals are blocked. No role or setting can waive this.
        </Typography>
      )}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
        {l.status === 'Unverified' && <Button variant="contained" onClick={() => { p.verifyLicence(agency.ain); onDone(`Licence ${l.number} verified`); }}>Verify licence</Button>}
        {!editing && <Button variant="outlined" onClick={() => setEditing(true)}>Record a renewed licence</Button>}
      </Stack>
      {editing && (
        <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Renewed licence, as issued by the licensing authority</Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField required label="Licence number" value={number} onChange={(e) => setNumber(e.target.value)} />
            <TextField required label="Valid to" type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" disabled={!number.trim() || !validTo} onClick={() => { p.recordLicence(agency.ain, { number: number.trim(), validTo }); setEditing(false); setNumber(''); setValidTo(''); onDone('Licence recorded. It stays unverified until checked'); }}>Record licence</Button>
            <Button variant="outlined" color="inherit" onClick={() => setEditing(false)}>Cancel</Button>
          </Stack>
        </Box>
      )}
    </Card>
  );
}

export default function Licences() {
  const p = usePort();
  const t = useT();
  const [msg, setMsg] = useState('');
  return (
    <>
      <PageHeader title={t('C&F licences')} subtitle="Each check reads the one status at NDC Agargaon, so an expiry or a suspension applies at every port at once." />
      <SectionTitle>Agencies onboarded on AIN</SectionTitle>
      <Stack spacing={2}>
        {p.parties.agencies.map((a) => <AgencyLicence key={a.ain} agency={a} onDone={setMsg} />)}
      </Stack>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
