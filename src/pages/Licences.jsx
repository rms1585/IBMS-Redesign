import { useState } from 'react';
import { Box, Button, Card, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { usePort, useStoredState } from '../demo/PortStore';
import { dayKey } from '../demo/format';
import { Confirmation, Fact, Facts, SectionTitle, StatusPill } from '../demo/ui';
import { useT, tr } from '../i18n/LanguageContext';

// M-18: licence evidence and the validity gate. IBMS records and verifies; it never issues or renews a licence.

const NO_MAP = {};

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
  const [file, setFile] = useState('');
  const [authRef, setAuthRef] = useState('');
  const [evidence, setEvidence] = useStoredState('licenceEvidence', NO_MAP);
  const doc = evidence[agency.ain];
  const word = statusWord(l);
  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
        <Typography variant="h6">{agency.name}</Typography>
        <Typography variant="body2" color="text.secondary">AIN {agency.ain}</Typography>
        <StatusPill word={word} />
      </Stack>
      <Facts cols={4}>
        <Fact label={tr("Licence number")}>{l.number}</Fact>
        <Fact label={tr("Issuer")}>{l.issuer}</Fact>
        <Fact label={tr("Valid to")}>{l.validTo}</Fact>
        <Fact label={tr("Verified by")}>{l.verifiedBy ?? '–'}</Fact>
        <Fact label={tr("Evidence")}>{doc ? `${doc.file} · ${doc.ref}` : 'No document on file'}</Fact>
      </Facts>
      {word !== 'Verified' && (
        <Typography variant="body2" color="error.text" sx={{ mt: 2 }}>
          {p.licenceProblem(agency.ain)} Truck entry, Bills of Entry, Delivery Requests, billing and pass approvals are blocked. No role or setting can waive this.
        </Typography>
      )}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
        {l.status === 'Unverified' && <Button variant="contained" onClick={() => { p.verifyLicence(agency.ain); onDone(`Licence ${l.number} verified`); }}>{tr("Verify licence")}</Button>}
        {!editing && <Button variant="outlined" onClick={() => setEditing(true)}>{tr("Record a renewed licence")}</Button>}
      </Stack>
      {editing && (
        <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>{tr("Renewed licence, as issued by the licensing authority")}</Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField required label={tr("Licence number")} value={number} onChange={(e) => setNumber(e.target.value)} />
            <TextField required label={tr("Valid to")} type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField required label={tr("Authority's reference")} placeholder="NBR licensing letter or portal ID" value={authRef} onChange={(e) => setAuthRef(e.target.value)} helperText={tr("Checked against the licensing authority, not the copy alone")} />
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button component="label" variant="outlined" color="inherit">
                {file ? 'Replace licence copy' : 'Upload licence copy'}
                <input hidden type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f.name); e.target.value = ''; }} />
              </Button>
              <Typography variant="caption" color={file ? 'text.secondary' : 'error.text'}>{file || 'A copy is required'}</Typography>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" disabled={!number.trim() || !validTo || !file || !authRef.trim()} onClick={() => { p.recordLicence(agency.ain, { number: number.trim(), validTo }); setEvidence((all) => ({ ...all, [agency.ain]: { file, ref: authRef.trim() } })); setEditing(false); setNumber(''); setValidTo(''); setFile(''); setAuthRef(''); onDone('Licence recorded with its evidence. It stays unverified until checked'); }}>{tr("Record licence")}</Button>
            <Button variant="outlined" color="inherit" onClick={() => setEditing(false)}>{tr("Cancel")}</Button>
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
      <PageHeader title={t('C&F licences')} subtitle={tr("Each check reads the one status at NDC Agargaon, so an expiry or a suspension applies at every port at once.")} />
      <SectionTitle>{tr("Agencies onboarded on AIN")}</SectionTitle>
      <Stack spacing={2}>
        {p.parties.agencies.map((a) => <AgencyLicence key={a.ain} agency={a} onDone={setMsg} />)}
      </Stack>
      <Confirmation text={msg} onClose={() => setMsg('')} />
    </>
  );
}
