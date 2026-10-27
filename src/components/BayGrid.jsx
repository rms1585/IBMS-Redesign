import { Box, Stack, Typography, Tooltip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { bayState } from '../data/mock';

export const bayLegend = [
  ['empty', 'Empty'],
  ['occupied', 'Occupied'],
  ['same', 'Same manifest'],
  ['blocked', 'Blocked'],
  ['disallowed', 'Not allowed by rule'],
  ['selected', 'Selected'],
];

export function useBayColors() {
  const t = useTheme();
  return {
    empty: { bg: t.palette.background.paper, border: alpha(t.palette.grey[500], 0.32), color: t.palette.text.secondary },
    occupied: { bg: alpha(t.palette.grey[500], 0.24), border: 'transparent', color: t.palette.text.secondary },
    same: { bg: alpha(t.palette.info.main, 0.2), border: t.palette.info.main, color: t.palette.info.dark },
    blocked: { bg: `repeating-linear-gradient(45deg, ${alpha(t.palette.error.main, 0.12)} 0 4px, transparent 4px 8px)`, border: alpha(t.palette.error.main, 0.4), color: t.palette.error.main },
    disallowed: { bg: alpha(t.palette.warning.main, 0.16), border: alpha(t.palette.warning.main, 0.5), color: t.palette.warning.dark },
    selected: { bg: t.palette.primary.main, border: t.palette.primary.main, color: '#fff' },
  };
}

export function BayLegend() {
  const c = useBayColors();
  return (
    <Stack direction="row" flexWrap="wrap" gap={2}>
      {bayLegend.map(([k, l]) => (
        <Stack key={k} direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 14, height: 14, borderRadius: '4px', background: c[k].bg, border: `1px solid ${c[k].border}` }} />
          <Typography variant="caption" color="text.secondary">{l}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}

// `isDisallowed(code, state)` lets the caller apply storage-separation rules for the cargo being placed.
export function BayGrid({ zone, selected, onSelect, isDisallowed, size = 44 }) {
  const c = useBayColors();
  const rows = Array.from({ length: zone.rows }, (_, r) => r);
  const cols = Array.from({ length: zone.cols }, (_, i) => i);
  return (
    <Box sx={{ display: 'inline-grid', gridTemplateColumns: `24px repeat(${zone.cols}, ${size}px)`, gap: 0.75 }}>
      <Box />
      {cols.map((i) => (
        <Typography key={i} variant="caption" color="text.disabled" align="center">C{String(i + 1).padStart(2, '0')}</Typography>
      ))}
      {rows.map((r) => (
        <Box key={r} sx={{ display: 'contents' }}>
          <Typography variant="caption" color="text.disabled" sx={{ alignSelf: 'center' }}>R{r + 1}</Typography>
          {cols.map((i) => {
            const code = `${zone.code}-R${r + 1}-C${String(i + 1).padStart(2, '0')}`;
            const s = bayState(zone.code, r, i);
            let state = s.state;
            if (state === 'empty' && isDisallowed?.(code, zone, r, i)) state = 'disallowed';
            if (code === selected) state = 'selected';
            const clickable = onSelect && (s.state === 'empty' || s.state === 'same') && state !== 'disallowed';
            const tip = s.state === 'blocked' ? `Blocked: ${s.reason}` : s.product ? `${s.product}${s.manifest ? ` · ${s.manifest}` : ''}` : state === 'disallowed' ? 'Not allowed: separation rule' : 'Empty';
            return (
              <Tooltip key={code} title={<><b>{code}</b><br />{tip}</>} arrow disableInteractive>
                <Box
                  onClick={() => clickable && onSelect(code)}
                  sx={{
                    height: size * 0.72, borderRadius: '6px', background: c[state].bg, border: `1px solid ${c[state].border}`,
                    cursor: clickable ? 'pointer' : 'default', transition: 'transform 120ms',
                    ...(clickable && { '&:hover': { transform: 'scale(1.08)', borderColor: c.selected.border } }),
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
