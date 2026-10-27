import { createTheme, alpha } from '@mui/material/styles';
import { createPalette, grey } from './palette';

const fontFamily = '"Public Sans Variable", "Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const cardShadow = (mode) =>
  mode === 'light'
    ? `0 0 2px 0 ${alpha(grey[500], 0.2)}, 0 12px 24px -4px ${alpha(grey[500], 0.12)}`
    : `0 0 2px 0 ${alpha('#000', 0.2)}, 0 12px 24px -4px ${alpha('#000', 0.12)}`;

const dialogShadow = (mode) => `-40px 40px 80px -8px ${alpha(mode === 'light' ? grey[500] : '#000', 0.24)}`;

export function createAppTheme(mode = 'light') {
  const palette = createPalette(mode);
  const light = mode === 'light';

  return createTheme({
    palette,
    shape: { borderRadius: 8 },
    customShadows: { card: cardShadow(mode), dialog: dialogShadow(mode) },
    typography: {
      fontFamily,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightSemiBold: 600,
      fontWeightBold: 700,
      h1: { fontWeight: 800, fontSize: '3rem', lineHeight: 1.25 },
      h2: { fontWeight: 800, fontSize: '2.5rem', lineHeight: 1.33 },
      h3: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.5 },
      h4: { fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.5 },
      h5: { fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.5 },
      h6: { fontWeight: 700, fontSize: '1.0625rem', lineHeight: 1.55 },
      subtitle1: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 },
      subtitle2: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.57 },
      body1: { fontSize: '1rem', lineHeight: 1.5 },
      body2: { fontSize: '0.875rem', lineHeight: 1.57 },
      caption: { fontSize: '0.75rem', lineHeight: 1.5 },
      overline: { fontWeight: 700, fontSize: '0.75rem', lineHeight: 1.5, textTransform: 'uppercase' },
      button: { fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.71, textTransform: 'none' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: palette.background.default },
          '*::-webkit-scrollbar': { width: 8, height: 8 },
          '*::-webkit-scrollbar-thumb': { borderRadius: 8, backgroundColor: alpha(grey[500], 0.32) },
          '*::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0 },
          sizeLarge: { height: 48, fontSize: 15, padding: '8px 22px' },
          sizeMedium: { height: 36 },
          sizeSmall: { height: 30, fontSize: 13 },
          containedInherit: {
            color: light ? '#FFFFFF' : grey[800],
            backgroundColor: light ? grey[800] : '#FFFFFF',
            '&:hover': { backgroundColor: light ? grey[700] : grey[400] },
          },
          outlined: { borderColor: alpha(grey[500], 0.32) },
          outlinedInherit: { borderColor: alpha(grey[500], 0.32), '&:hover': { backgroundColor: palette.action.hover } },
        },
      },
      MuiIconButton: { styleOverrides: { root: { borderRadius: 8 } } },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' }, outlined: { borderColor: alpha(grey[500], 0.16) } },
      },
      MuiCard: {
        styleOverrides: {
          root: { position: 'relative', borderRadius: 16, boxShadow: cardShadow(mode), zIndex: 0 },
        },
      },
      MuiCardHeader: {
        defaultProps: { titleTypographyProps: { variant: 'h6' }, subheaderTypographyProps: { variant: 'body2', mt: 0.5 } },
        styleOverrides: { root: { padding: '24px 24px 0' } },
      },
      MuiCardContent: { styleOverrides: { root: { padding: 24, '&:last-child': { paddingBottom: 24 } } } },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 16, boxShadow: dialogShadow(mode) } },
      },
      MuiDialogTitle: { styleOverrides: { root: { padding: 24, fontSize: '1.125rem', fontWeight: 700 } } },
      MuiDialogContent: { styleOverrides: { root: { padding: '0 24px' } } },
      MuiDialogActions: { styleOverrides: { root: { padding: 24, gap: 8, '& > :not(:first-of-type)': { marginLeft: 0 } } } },
      MuiDrawer: { styleOverrides: { paper: { backgroundImage: 'none' } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(grey[500], 0.2) },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: light ? grey[800] : '#FFFFFF' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2, borderColor: light ? grey[800] : '#FFFFFF' },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: { root: { '&.Mui-focused': { color: light ? grey[800] : '#FFFFFF' } } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottomStyle: 'dashed', borderBottomColor: alpha(grey[500], 0.2) },
          head: {
            fontSize: 14,
            fontWeight: 600,
            color: palette.text.secondary,
            backgroundColor: palette.background.neutral,
            borderBottomStyle: 'solid',
          },
          stickyHeader: { backgroundColor: palette.background.neutral },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&.Mui-selected': { backgroundColor: alpha(palette.primary.main, 0.08), '&:hover': { backgroundColor: alpha(palette.primary.main, 0.12) } },
            '&:last-of-type .MuiTableCell-root': { borderBottom: 0 },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { backgroundColor: light ? grey[800] : '#FFFFFF' },
          flexContainer: { gap: 40 },
        },
      },
      MuiTab: {
        defaultProps: { disableRipple: true, iconPosition: 'start' },
        styleOverrides: {
          root: {
            padding: 0,
            minWidth: 48,
            minHeight: 48,
            fontWeight: 600,
            color: palette.text.secondary,
            '&.Mui-selected': { color: palette.text.primary },
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } },
      },
      MuiTooltip: {
        styleOverrides: { tooltip: { backgroundColor: grey[800], borderRadius: 6 }, arrow: { color: grey[800] } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 8 }, standardInfo: { color: light ? '#003768' : '#CAFDF5' } },
      },
      MuiStepIcon: {
        styleOverrides: { root: { '&.Mui-completed, &.Mui-active': { color: palette.primary.main } } },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: 8, height: 6, backgroundColor: alpha(grey[500], 0.16) }, bar: { borderRadius: 8 } },
      },
      MuiAvatar: {
        styleOverrides: { root: { fontWeight: 600 } },
      },
      MuiListItemButton: { styleOverrides: { root: { borderRadius: 8 } } },
      MuiMenu: {
        styleOverrides: { paper: { borderRadius: 10, padding: 4, boxShadow: dialogShadow(mode) } },
      },
      MuiMenuItem: { styleOverrides: { root: { borderRadius: 6, fontSize: 14, padding: '6px 8px' } } },
      MuiBackdrop: {
        styleOverrides: { root: { backgroundColor: alpha(grey[900], 0.6), '&.MuiBackdrop-invisible': { backgroundColor: 'transparent' } } },
      },
    },
  });
}
