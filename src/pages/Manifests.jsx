import { useState } from 'react';
import { Alert, Box, Card, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, SearchField } from '../components/common';
import { agencyName, importerName, usePort } from '../demo/PortStore';
import { formatBoe, formatDateTime, formatKg, searchKey } from '../demo/format';
import { Fact, Facts, HoldRow, Id, Plate, ResponsiveTable, SectionTitle, SourceMarker, StatusPill } from '../demo/ui';
import { tr, useT } from '../i18n/LanguageContext';

// M-02: one read-only record per consignment. It performs nothing (Annex 7.2).

function ManifestList() {
  const p = usePort();
  const navigate = useNavigate();
  const t = useT();
  const [q, setQ] = useState('');
  const k = searchKey(q);
  const rows = p.state.manifests.filter((m) => !k || searchKey(m.id).includes(k) || searchKey(m.alias).includes(k) || p.state.visits.some((v) => v.manifests.includes(m.id) && searchKey(v.plate).includes(k)) || p.state.boes.some((b) => b.manifest === m.id && searchKey(formatBoe(b)).includes(k)));
  const lateVisits = p.state.visits.filter((v) => v.late && v.gateIn);
  return (
    <>
      <PageHeader title={t('Manifest tracking')} subtitle="Read-only. Search by manifest number, Bill of Entry, plate or the port's alias, with any spacing, dashes or capitals." />
      {lateVisits.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {lateVisits.map((v) => `${v.plate} was admitted with manifest ${v.carPassManifest} not yet available (EXC-04).`).join(' ')} Nothing on the visit is routed, posted or unloaded until the manifest is matched.
        </Alert>
      )}
      <Card sx={{ p: { xs: 1.5, sm: 3 } }}>
        <SearchField value={q} onChange={setQ} placeholder="Search manifest, plate, Bill of Entry or alias" sx={{ width: '100%', mb: 3 }} />
        <ResponsiveTable
          rowKey={(m) => m.id}
          rows={rows}
          empty="Nothing matches. Try the plate without spaces, or the manifest number."
          onRowClick={(m) => navigate(`/manifests/${encodeURIComponent(m.id)}`)}
          columns={[
            { label: 'Manifest', render: (m) => <Stack direction="row" spacing={1} alignItems="center"><Id>{m.id}</Id>{m.source === 'Other' && <StatusPill word="Unmatched" />}</Stack> },
            { label: 'Alias', priority: 'low', render: (m) => m.alias },
            { label: 'Truck', render: (m) => { const v = p.visitOfManifest(m.id); return v ? <Stack direction="row" spacing={1} alignItems="center"><Plate>{v.plate}</Plate><StatusPill word={v.stage} /></Stack> : '–'; } },
            { label: 'Holds', render: (m) => { const h = p.holdsOnManifest(m.id); return h.length ? <StatusPill word={`${h[0].body === 'BGB' ? 'BGB stop' : `${h[0].body} hold`}`} /> : '–'; } },
            { label: 'Status', render: (m) => <StatusPill word={p.openReasons(m.id).length ? 'Open' : 'Closed'} /> },
          ]}
        />
      </Card>
    </>
  );
}

function ManifestRecord({ id }) {
  const p = usePort();
  const m = p.manifest(id);
  if (!m) return <Alert severity="info">Nothing matches {id}. It may not have reached IBMS from BNSW yet.</Alert>;
  const visits = p.state.visits.filter((v) => v.manifests.includes(m.id));
  const boes = p.state.boes.filter((b) => b.manifest === m.id);
  const passes = p.state.passes.filter((x) => boes.some((b) => p.dr(x.dr)?.boe === b.id));
  const holds = p.holdsOnManifest(m.id);
  const lifted = p.state.holds.filter((h) => h.lifted && (h.target.id === m.id || m.lines.some((l) => l.id === h.target.id)));
  const reasons = p.openReasons(m.id);
  const events = p.state.events.filter((e) => e.record === m.id || boes.some((b) => p.state.deliveryRequests.some((d) => d.boe === b.id && (d.id === e.record || passes.some((x) => x.id === e.record)))));
  return (
    <>
      <PageHeader title={m.id} links={[{ name: 'Manifest tracking', href: '/manifests' }, { name: m.id }]} subtitle={`${m.alias} · ${m.exporter}`} />
      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Facts cols={4}>
            <Fact label="Source"><SourceMarker source={m.source} always /></Fact>
            <Fact label="Received">{formatDateTime(m.receivedAt)}</Fact>
            <Fact label="Lines">{m.lines.length}</Fact>
            <Fact label="Status"><StatusPill word={reasons.length ? 'Open' : 'Closed'} /></Fact>
          </Facts>
          {m.versions && (
            <Box sx={{ mt: 2 }}>
              <SectionTitle>{tr('Versions received from BNSW')}</SectionTitle>
              {m.versions.map((x) => <Typography key={`${x.no}-${x.arrivedAt}`} variant="body2" color={x.applied ? 'text.primary' : 'text.secondary'}>{tr('Version')} {x.no} · {formatDateTime(x.arrivedAt)} · {x.change} · {x.applied ? (x.no === m.version ? tr('in force') : tr('applied')) : `${tr('not applied')}: ${x.note}`}</Typography>)}
            </Box>
          )}
        </Card>

        {holds.length > 0 && (
          <Stack spacing={1}>{holds.map((h) => <HoldRow key={h.id} hold={h} />)}</Stack>
        )}

        <Card sx={{ p: 3 }}>
          <SectionTitle>Why this record is still open</SectionTitle>
          {reasons.length ? (
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>{reasons.map((r) => <li key={r}><Typography variant="body2">{r}</Typography></li>)}</Box>
          ) : (
            <Typography variant="body2" color="text.secondary">Every Bill of Entry and the truck visit are closed.</Typography>
          )}
        </Card>

        <Card sx={{ p: 3 }}>
          <SectionTitle>Lines and Bills of Entry</SectionTitle>
          <ResponsiveTable
            rowKey={(l) => l.id}
            rows={m.lines}
            columns={[
              { label: 'Line', render: (l) => l.no },
              { label: 'Goods', render: (l) => l.goods },
              { label: 'Importer', render: (l) => importerName(l.importer) },
              { label: 'C&F agency', priority: 'low', render: (l) => (m.tags[l.importer] ? agencyName(m.tags[l.importer]) : <StatusPill word="Open" />) },
              { label: 'Declared weight', align: 'right', render: (l) => formatKg(l.declaredKg) },
              { label: 'Receipt weight', align: 'right', priority: 'low', render: (l) => { const v = visits.find((x) => x.receipt?.lines?.[l.id]); return v ? formatKg(v.receipt.lines[l.id].receiptKg) : '–'; } },
              { label: 'Bill of Entry', render: (l) => { const b = p.boeOfLine(l.id); return b ? <Stack spacing={0.5}><Id>{formatBoe(b)}</Id><SourceMarker source={b.source} /></Stack> : '–'; } },
            ]}
          />
          {boes.map((b) => (
            <Box key={b.id} sx={{ mt: 2.5, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2"><Id>{formatBoe(b)}</Id></Typography>
                <StatusPill word={b.closed ? 'Closed' : b.release ? 'Released' : 'Awaiting Customs'} />
                {b.release && <SourceMarker source={b.release.source} always />}
              </Stack>
              <Facts cols={4}>
                <Fact label="Released">{b.release ? `${formatKg(b.release.kg)} · ${b.release.ref}` : '–'}</Fact>
                <Fact label="Delivered">{formatKg(b.deliveredKg)}</Fact>
                <Fact label="Balance in custody">{b.release ? formatKg(p.releasedBalance(b)) : '–'}</Fact>
                <Fact label="Exit notes">{b.release ? Object.keys(b.release.exitNotes).join(', ') || 'None yet' : '–'}</Fact>
              </Facts>
            </Box>
          ))}
        </Card>

        <Card sx={{ p: 3 }}>
          <SectionTitle>Truck visits</SectionTitle>
          {visits.length === 0 && <Typography variant="body2" color="text.secondary">No truck visit yet.</Typography>}
          {visits.map((v) => (
            <Box key={v.id} sx={{ pb: 2, mb: 2, borderBottom: 1, borderColor: 'divider', '&:last-of-type': { borderBottom: 0, mb: 0, pb: 0 } }}>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 1.5 }}>
                <Plate size="large">{v.plate}</Plate>
                <StatusPill word={v.stage} />
                <Typography variant="body2" color="text.secondary">Manifests on this truck: {v.manifests.join(', ')}</Typography>
              </Stack>
              <Facts cols={4}>
                <Fact label="Gate in">{v.gateIn ? `${formatDateTime(v.gateIn.at)} · ${v.gateIn.gate}` : '–'}</Fact>
                <Fact label="Weight">{v.weigh ? <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap"><span>{formatKg(v.weigh.kg)}</span>{v.weigh.overTolerance && <StatusPill word="Weight over tolerance" />}<SourceMarker source={v.weigh.source} /></Stack> : '–'}</Fact>
                <Fact label="Drop point">{v.posting?.accepted ? v.posting.shed : '–'}</Fact>
                <Fact label="Exit">{v.exitAt ? formatDateTime(v.exitAt) : '–'}</Fact>
              </Facts>
            </Box>
          ))}
        </Card>

        {passes.length > 0 && (
          <Card sx={{ p: 3 }}>
            <SectionTitle>Exit Passes</SectionTitle>
            {passes.map((x) => (
              <Stack key={x.id} direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ py: 0.75 }}>
                <Id>{x.id}</Id>
                <Plate>{x.plate}</Plate>
                <Typography variant="body2" color="text.secondary">{formatKg(x.kg)}</Typography>
                <StatusPill word={p.passStatus(x)} />
              </Stack>
            ))}
          </Card>
        )}

        {lifted.length > 0 && (
          <Card sx={{ p: 3 }}>
            <SectionTitle>Lifted holds</SectionTitle>
            {lifted.map((h) => (
              <Typography key={h.id} variant="body2" sx={{ py: 0.5 }}>{h.body} hold by {h.person}, lifted by {h.lifted.by} {formatDateTime(h.lifted.at)}{h.lifted.ref ? ` · ${h.lifted.ref}` : ''}</Typography>
            ))}
          </Card>
        )}

        <Card sx={{ p: 3 }}>
          <SectionTitle>Timeline</SectionTitle>
          <Stack spacing={1.25}>
            {events.map((e) => (
              <Stack key={e.id} direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.25, sm: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, whiteSpace: 'nowrap' }}>{formatDateTime(e.at)}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">{e.text}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">{e.by} · {e.role}</Typography>
                    <SourceMarker source={e.source} always />
                  </Stack>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Card>
      </Stack>
    </>
  );
}

export default function Manifests() {
  const { manifestId } = useParams();
  return manifestId ? <ManifestRecord id={decodeURIComponent(manifestId)} /> : <ManifestList />;
}
