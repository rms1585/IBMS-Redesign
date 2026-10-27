import { Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

// Minimals-style status label: soft tinted background with dark text.
export default function Label({ color = 'default', variant = 'soft', startIcon, children, sx }) {
  const theme = useTheme();
  const light = theme.palette.mode === 'light';
  const isDefault = color === 'default';
  const p = isDefault ? null : theme.palette[color];

  const styles = {
    soft: isDefault
      ? { color: theme.palette.text.secondary, backgroundColor: alpha(theme.palette.grey[500], 0.16) }
      : { color: light ? p.dark : p.light, backgroundColor: alpha(p.main, 0.16) },
    filled: isDefault
      ? { color: light ? '#fff' : theme.palette.grey[800], backgroundColor: theme.palette.text.primary }
      : { color: p.contrastText, backgroundColor: p.main },
    outlined: isDefault
      ? { color: theme.palette.text.primary, border: `2px solid ${theme.palette.text.primary}` }
      : { color: p.main, border: `2px solid ${p.main}` },
  };

  return (
    <Box
      component="span"
      sx={{
        height: 24,
        minWidth: 24,
        lineHeight: 0,
        borderRadius: '6px',
        cursor: 'default',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        justifyContent: 'center',
        gap: 0.5,
        px: 0.75,
        fontSize: 12,
        fontWeight: 700,
        ...styles[variant],
        '& svg': { width: 16, height: 16 },
        ...sx,
      }}
    >
      {startIcon}
      {children}
    </Box>
  );
}
