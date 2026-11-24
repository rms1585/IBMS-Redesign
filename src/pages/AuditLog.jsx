import { useState } from 'react';
import { Box, Card, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/common';
import { usePort } from '../demo/PortStore';
import { formatDateTime, searchKey } from '../demo/format';
import { SourceMarker } from '../demo/ui';
import { useT } from '../i18n/LanguageContext';

// M-13: every action as a plain sentence. No screen offers to edit or delete an entry, for any role.

const SOURCES = ['Every source', 'BNSW', 'Device', 'IBMS', 'Keyed by the agency', 'Keyed at the gate', "Keyed from Customs' reference", 'Typed by hand', 'Back-entered from form', 'Payment provider'];

export default function AuditLog() {
  const p = usePort();
  const t = useT();
  const [q, setQ] = useState('');
  const [source, setSource] = useState('Every source');
  const k = searchKey(q);
  const rows = p.state.events.filter((e) => (source === 'Every source' || e.source === source) && (!k || searchKey(`${e.text} ${e.record} ${e.by}`).includes(k)));
  return (
    <>
      <PageHeader title={t('Audit log')} subtitle="Who, in which role, did what, to which record, and how each value was recorded. Entries cannot be changed or deleted." />
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField size="small" label="Search records, people or words" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flex: 1 }} />
          <TextField select size="small" label="How the value was recorded" value={source} onChange={(e) => setSource(e.target.value)} sx={{ minWidth: 260 }}>
            {SOURCES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Stack>
        {rows.length === 0 && <Typography variant="body2" color="text.secondary">Nothing matches. Clear the filter or search for a plate or manifest number.</Typography>}
        <Stack spacing={1.5}>
          {rows.map((e) => (
            <Box key={e.id} sx={{ pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="body2">{e.by}, {e.role}: {e.text}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="caption" color="text.secondary">{formatDateTime(e.at)} · Benapole · {e.record}</Typography>
                <SourceMarker source={e.source} always />
              </Stack>
            </Box>
          ))}
        </Stack>
      </Card>
    </>
  );
}
