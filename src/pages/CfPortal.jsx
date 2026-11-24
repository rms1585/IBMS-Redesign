import { useState } from 'react';
import { Alert, Card, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common';
import { useRole } from '../RoleContext';
import { agencyOf, importerName, usePort, billTotals } from '../demo/PortStore';
import { formatBDT } from '../demo/format';
import { Id, ResponsiveTable, StatusPill } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// Which agency the portal shows: the signed-in agent's, or (for the demo presenter) one picked here.
export function useAgency() {
  const { role } = useRole();
  const [picked, setPicked] = useState(() => sessionStorage.getItem('ibms-demo-agency') ?? '301045');
  const ain = role.agency ?? picked;
  const pick = (v) => { setPicked(v); try { sessionStorage.setItem('ibms-demo-agency', v); } catch { /* storage unavailable */ } };
  return { ain, canPick: !role.agency, pick };
}

export function AgencyPicker({ ain, pick }) {
  const { parties } = usePort();
  return (
    <TextField select size="small" label="Viewing as agency (demo)" value={ain} onChange={(e) => pick(e.target.value)} sx={{ minWidth: 260 }}>
      {parties.agencies.map((a) => <MenuItem key={a.ain} value={a.ain}>{a.name}</MenuItem>)}
    </TextField>
  );
}

export function LicenceBanner({ ain }) {
  const p = usePort();
  const problem = p.licenceProblem(ain);
  if (!problem) return null;
  return (
    <Alert severity="error" variant="outlined" sx={{ mb: 3 }}>
      <Typography variant="subtitle2">Operations blocked</Typography>
      <Typography variant="body2">{problem} Truck entry, Bills of Entry, Delivery Requests and pass approvals are refused until BLPA verifies a valid licence.</Typography>
    </Alert>
  );
}

export default function CfPortal() {
  const p = usePort();
  const navigate = useNavigate();
  const t = useT();
  const { ain, canPick, pick } = useAgency();
  const agency = agencyOf(ain);
  // The agency sees only consignments with a line an importer has tagged it to (Annex 7.1).
  const mine = p.state.manifests.filter((m) => Object.values(m.tags).includes(ain));
  const rows = mine.map((m) => {
    const lines = m.lines.filter((l) => m.tags[l.importer] === ain);
    const v = p.visitOfManifest(m.id);
    const owed = p.state.bills.filter((b) => b.party === ain && b.status === 'Payment due' && p.boe(p.dr(b.for.id)?.boe)?.manifest === m.id).reduce((s, b) => s + billTotals(b).total, 0);
    const waiting = p.openReasons(m.id)[0];
    return { m, lines, v, owed, waiting, holds: p.holdsOnManifest(m.id) };
  });
  return (
    <>
      <PageHeader title={t('C&F portal')} subtitle={`${agency.name} · AIN ${agency.ain}`} action={canPick && <AgencyPicker ain={ain} pick={pick} />} />
      <LicenceBanner ain={ain} />
      <Card sx={{ p: { xs: 1.5, sm: 2 } }}>
        <ResponsiveTable
          rowKey={(r) => r.m.id}
          onRowClick={(r) => navigate(`/cf-portal/${encodeURIComponent(r.m.id)}`)}
          rows={rows}
          empty="No consignment is tagged to this agency yet. An importer tags its agency in its own portal."
          columns={[
            { label: 'Manifest', render: (r) => <Id>{r.m.id}</Id> },
            { label: 'Importer', render: (r) => [...new Set(r.lines.map((l) => importerName(l.importer)))].join(', ') },
            { label: 'Truck', render: (r) => (r.v ? <Stack direction="row" spacing={1} alignItems="center"><Typography variant="body2" fontWeight={700}>{r.v.plate}</Typography><StatusPill word={r.v.stage} /></Stack> : '–') },
            { label: 'Holds', priority: 'low', render: (r) => (r.holds.length ? <StatusPill word="Customs hold" /> : '–') },
            { label: 'Owed', align: 'right', render: (r) => (r.owed ? formatBDT(r.owed) : '–') },
            { label: 'Waiting for', priority: 'low', render: (r) => <Typography variant="body2" color="text.secondary">{r.waiting ?? 'Nothing'}</Typography> },
          ]}
        />
      </Card>
    </>
  );
}
