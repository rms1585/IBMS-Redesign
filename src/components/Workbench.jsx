import { Box, Card, Stack, Typography, ButtonBase, Divider } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { SearchField, EmptyState } from './common';
import Label from './Label';
import { VideocamRoundedIcon } from './icons';

// Operational workbench: searchable queue on the left, selected record in the centre,
// contextual rail (camera, movement, progress) on the right.
// Breakpoints are container queries on the page content area (see DashboardLayout), so the
// layout responds to the space actually available whether the navigation is open or collapsed.
export const WIDE = '@container main (max-width: 1180px)';
export const NARROW = '@container main (max-width: 760px)';

export function Workbench({ queue, center, rail }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        alignItems: 'start',
        gridTemplateColumns: rail ? '296px minmax(0,1fr) 272px' : '296px minmax(0,1fr)',
        gridTemplateAreas: rail ? '"queue center rail"' : '"queue center"',
        // Medium: the rail drops under the record, beside the queue.
        [WIDE]: rail ? { gridTemplateColumns: '280px minmax(0,1fr)', gridTemplateAreas: '"queue center" "queue rail"' } : {},
        // Narrow (e.g. iPad portrait): everything stacks.
        [NARROW]: { gridTemplateColumns: 'minmax(0,1fr)', gridTemplateAreas: rail ? '"queue" "center" "rail"' : '"queue" "center"' },
      }}
    >
      <Box sx={{ gridArea: 'queue', minWidth: 0 }}>{queue}</Box>
      <Box sx={{ gridArea: 'center', minWidth: 0 }}>{center}</Box>
      {rail && (
        <Box sx={{ gridArea: 'rail', minWidth: 0, display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', alignItems: 'start' }}>
          {rail}
        </Box>
      )}
    </Box>
  );
}

export function QueueCard({ title, count, search, onSearch, placeholder, items, selectedKey, onSelect, renderItem, getKey, emptyText, header }) {
  const theme = useTheme();
  return (
    <Card sx={{ position: 'sticky', top: 88, [NARROW]: { position: 'static' } }}>
      <Box sx={{ p: 2.5, pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">{title}</Typography>
          <Label>{count}</Label>
        </Stack>
        {header}
        <SearchField placeholder={placeholder} value={search} onChange={onSearch} sx={{ minWidth: 0, width: '100%' }} />
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', p: 1, [NARROW]: { maxHeight: 320 } }}>
        {items.length === 0 ? (
          <EmptyState title={emptyText ?? 'Nothing in the queue'} sx={{ py: 4 }} />
        ) : (
          items.map((it) => {
            const key = getKey(it);
            const selected = key === selectedKey;
            return (
              <ButtonBase
                key={key}
                onClick={() => onSelect(key)}
                sx={{
                  width: '100%', display: 'block', textAlign: 'left', p: 1.5, mb: 0.5, borderRadius: 1.5,
                  borderLeft: '3px solid transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                  ...(selected && {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    borderLeftColor: theme.palette.primary.main,
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) },
                  }),
                }}
              >
                {renderItem(it, selected)}
              </ButtonBase>
            );
          })
        )}
      </Box>
    </Card>
  );
}

export function CameraCard({ lane, plate, expected, onReread }) {
  const theme = useTheme();
  const match = plate && expected ? plate === expected : null;
  return (
    <Card>
      <Box
        sx={{
          height: 170, position: 'relative', display: 'grid', placeItems: 'center',
          background: `repeating-linear-gradient(135deg, ${theme.palette.grey[800]} 0 12px, ${theme.palette.grey[900]} 12px 24px)`,
          color: alpha('#fff', 0.4),
        }}
      >
        <VideocamRoundedIcon sx={{ fontSize: 40 }} />
        <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 1 }}>
          <Label color="error" variant="filled">● LIVE</Label>
          <Label variant="filled" sx={{ bgcolor: alpha('#000', 0.5), color: '#fff' }}>{lane}</Label>
        </Box>
        {plate && (
          <Box sx={{ position: 'absolute', bottom: 12, left: 12, right: 12, px: 1.5, py: 0.75, borderRadius: 1, bgcolor: alpha('#000', 0.6), color: '#fff', fontFamily: 'monospace', fontSize: 15, letterSpacing: 1 }}>
            {plate}
          </Box>
        )}
      </Box>
      <Stack spacing={1.25} sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2">Plate read</Typography>
          {match === null ? <Label>No read</Label> : match ? <Label color="success">Matches selected truck</Label> : <Label color="error">Does not match</Label>}
        </Stack>
        {match === false && (
          <Typography variant="body2" color="error.main">
            Camera read {plate}, expected {expected}. Check the vehicle before admitting.
          </Typography>
        )}
        <Typography variant="caption" color="text.disabled">A camera match supports, but does not replace, the operator&apos;s identity check.</Typography>
        {onReread && <ButtonBase onClick={onReread} sx={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 700, color: 'primary.main' }}>Re-read plate</ButtonBase>}
      </Stack>
    </Card>
  );
}
