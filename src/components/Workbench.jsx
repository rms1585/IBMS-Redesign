import { Box, Card, Stack, Typography, ButtonBase, Divider } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import { SearchField, EmptyState } from './common';
import Label from './Label';

// Operational workbench: searchable queue on the left, selected record in the centre,
// contextual rail (camera, movement, progress) on the right.
export function Workbench({ queue, center, rail }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: rail ? '296px minmax(0,1fr) 272px' : '296px minmax(0,1fr)', gap: 3, alignItems: 'start' }}>
      {queue}
      <Box sx={{ minWidth: 0 }}>{center}</Box>
      {rail && <Stack spacing={3}>{rail}</Stack>}
    </Box>
  );
}

export function QueueCard({ title, count, search, onSearch, placeholder, items, selectedKey, onSelect, renderItem, getKey, emptyText, header }) {
  const theme = useTheme();
  return (
    <Card sx={{ position: 'sticky', top: 88 }}>
      <Box sx={{ p: 2.5, pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">{title}</Typography>
          <Label>{count}</Label>
        </Stack>
        {header}
        <SearchField placeholder={placeholder} value={search} onChange={onSearch} sx={{ minWidth: 0, width: '100%' }} />
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', p: 1 }}>
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
