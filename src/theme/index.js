import { createTheme, alpha } from '@mui/material/styles';
import { createPalette, grey, overlayBase } from './palette';

const pxToRem = (px) => `${px / 16}rem`;

const fontFamily = '"Public Sans Variable", "Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const cardShadow = (mode) =>
  mode === 'light'
    ? `0 0 2px 0 ${alpha(grey[500], 0.2)}, 0 12px 24px -4px ${alpha(grey[500], 0.12)}`
    : `0 0 2px 0 ${alpha('#000', 0.2)}, 0 12px 24px -4px ${alpha('#000', 0.12)}`;

const dialogShadow = (mode) => `-40px 40px 80px -8px ${alpha(mode === 'light' ? grey[500] : '#000', 0.24)}`;

export function createAppTheme(mode = 'light') {
  const palette = createPalette(mode);
  const light = mode === 'light';
  const overlay = overlayBase(mode);

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
      // Desktop type scale from the IBMS Figma design system (Public Sans).
      h1: { fontWeight: 700, fontSize: pxToRem(64), lineHeight: 80 / 64 },
      h2: { fontWeight: 700, fontSize: pxToRem(48), lineHeight: 64 / 48 },
      h3: { fontWeight: 700, fontSize: pxToRem(32), lineHeight: 48 / 32 },
      h4: { fontWeight: 700, fontSize: pxToRem(28), lineHeight: 36 / 28 },
      h5: { fontWeight: 700, fontSize: pxToRem(24), lineHeight: 32 / 24 },
      h6: { fontWeight: 700, fontSize: pxToRem(20), lineHeight: 30 / 20 },
      subtitle1: { fontWeight: 600, fontSize: pxToRem(16), lineHeight: 24 / 16 },
      subtitle2: { fontWeight: 600, fontSize: pxToRem(14), lineHeight: 20 / 14 },
      body1: { fontWeight: 400, fontSize: pxToRem(16), lineHeight: 24 / 16 },
      body2: { fontWeight: 400, fontSize: pxToRem(14), lineHeight: 20 / 14 },
      caption: { fontWeight: 400, fontSize: pxToRem(12), lineHeight: 16 / 12 },
      overline: { fontWeight: 700, fontSize: pxToRem(12), lineHeight: 16 / 12, textTransform: 'uppercase' },
      button: { fontWeight: 600, fontSize: pxToRem(14), lineHeight: 20 / 14, textTransform: 'none' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: palette.background.default },
          // Scrollbars stay hidden until their area is scrolled (see useAutoHideScrollbars).
          '*': { scrollbarWidth: 'thin', scrollbarColor: 'transparent transparent' },
          '.is-scrolling': { scrollbarColor: `${alpha(overlay, 0.4)} transparent` },
          // Browsers without scrollbar-color (older Safari) use the WebKit pseudo-elements.
          '@supports not (scrollbar-color: auto)': {
            '*::-webkit-scrollbar': { width: 8, height: 8, backgroundColor: 'transparent' },
            '*::-webkit-scrollbar-thumb': { borderRadius: 8, backgroundColor: 'transparent' },
            '.is-scrolling::-webkit-scrollbar-thumb': { backgroundColor: alpha(overlay, 0.4) },
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0 },
          // CTA sizes from the Figma design system: Large 48 / Medium 40 / Small 36.
          sizeLarge: { height: 48, padding: '0 20px', fontSize: pxToRem(16), lineHeight: 24 / 16 },
          sizeMedium: { height: 40, padding: '0 16px' },
          sizeSmall: { height: 36, padding: '0 16px', fontSize: pxToRem(14) },
          startIcon: { marginRight: 8 },
          endIcon: { marginLeft: 8 },
          containedInherit: {
            color: light ? '#FFFFFF' : grey[800],
            backgroundColor: light ? grey[800] : '#FFFFFF',
            '&:hover': { backgroundColor: light ? grey[700] : grey[400] },
          },
          outlined: { borderColor: alpha(overlay, 0.32) },
          outlinedInherit: { borderColor: alpha(overlay, 0.32), '&:hover': { backgroundColor: palette.action.hover } },
        },
      },
      MuiIconButton: { styleOverrides: { root: { borderRadius: 8 } } },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' }, outlined: { borderColor: alpha(overlay, 0.16) } },
      },
      MuiCard: {
        styleOverrides: {
          // overflowX lets wide tables scroll inside the card on tablets instead of squashing.
          root: { position: 'relative', borderRadius: 16, boxShadow: cardShadow(mode), zIndex: 0, overflowX: 'auto' },
        },
      },
      MuiTable: {
        styleOverrides: {
          // Full-size data tables keep a readable width; compact (size="small") side-panel tables flex.
          root: ({ ownerState }) => (ownerState.size === 'small' ? {} : { minWidth: 680 }),
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
            '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(overlay, 0.2) },
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
          // Data tables never squeeze columns: cell content stays on one line and the table scrolls
          // sideways inside its card when it is wider than the screen. Compact (size="small")
          // tables in side panels and dialogs still wrap.
          root: ({ ownerState }) => ({
            borderBottomStyle: 'dashed',
            borderBottomColor: alpha(overlay, 0.2),
            ...(ownerState.size !== 'small' && { whiteSpace: 'nowrap' }),
          }),
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
        styleOverrides: { root: { borderRadius: 8 }, standardInfo: { color: light ? palette.info.darker : palette.info.light } },
      },
      MuiStepIcon: {
        styleOverrides: { root: { '&.Mui-completed, &.Mui-active': { color: palette.primary.main } } },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: 8, height: 6, backgroundColor: alpha(overlay, 0.16) }, bar: { borderRadius: 8 } },
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
