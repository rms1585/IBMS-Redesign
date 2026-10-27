import { alpha } from '@mui/material/styles';

// Colours from the IBMS Figma design system ("Color & Typo" page / Minimals · Redesign styles).
// `text` is the shade the design system uses for text on a soft (tinted) background.

export const grey = {
  50: '#FCFDFD',
  100: '#F4F5F7',
  200: '#EAECF0',
  300: '#DFE3E8',
  400: '#C4CDD5',
  500: '#919EAB',
  600: '#677481',
  700: '#49525B',
  800: '#2B3136',
  // Not in the design system; used only for dark-mode surfaces.
  900: '#161B1F',
};

// Forest Green (Primary)
export const primary = {
  lighter: '#D6FFE9',
  light: '#ADFFD3',
  main: '#008F40',
  dark: '#00662E',
  darker: '#002912',
  text: '#00753A',
  contrastText: '#FFFFFF',
};

// Sky Blue (Support)
export const info = {
  lighter: '#EFF3FF',
  light: '#BDCFFF',
  main: '#4166FB',
  dark: '#0C1BC7',
  darker: '#141E87',
  text: '#0C1BC7',
  contrastText: '#FFFFFF',
};

// The design system has no secondary palette; Sky Blue is its support colour.
export const secondary = info;

export const success = {
  lighter: '#D8FBEC',
  light: '#86E8BF',
  main: '#1A9C65',
  dark: '#1B8056',
  darker: '#0A5536',
  text: '#1B8056',
  contrastText: '#FFFFFF',
};

// Orange
export const warning = {
  lighter: '#FFF6E7',
  light: '#FFE4B5',
  main: '#FFA70F',
  dark: '#E8980E',
  darker: '#B5770B',
  text: '#945700',
  contrastText: grey[800],
};

export const error = {
  lighter: '#FFF1F1',
  light: '#FF9D9D',
  main: '#FF3030',
  dark: '#C80D0D',
  darker: '#881414',
  text: '#C80D0D',
  contrastText: '#FFFFFF',
};

// Translucent overlays: the design system's Grey/8–48% styles are tints of Grey/800.
// On dark surfaces Grey/800 disappears, so dark mode tints Grey/500 instead.
export const overlayBase = (mode) => (mode === 'light' ? grey[800] : grey[500]);

export function createPalette(mode) {
  const light = mode === 'light';
  const overlay = overlayBase(mode);
  return {
    mode,
    primary,
    secondary,
    info,
    success,
    warning,
    error,
    grey,
    common: { black: '#000000', white: '#FFFFFF' },
    divider: alpha(overlay, light ? 0.12 : 0.2),
    text: light
      ? { primary: grey[800], secondary: grey[600], disabled: grey[500] }
      : { primary: '#FFFFFF', secondary: grey[500], disabled: grey[600] },
    background: light
      ? { paper: '#FFFFFF', default: '#FFFFFF', neutral: grey[100] }
      : { paper: '#22292F', default: grey[900], neutral: '#2E363D' },
    action: {
      hover: alpha(overlay, 0.08),
      selected: alpha(overlay, 0.12),
      focus: alpha(overlay, 0.24),
      disabled: alpha(overlay, 0.48),
      disabledBackground: alpha(overlay, 0.16),
      hoverOpacity: 0.08,
      disabledOpacity: 0.48,
      active: light ? grey[600] : grey[500],
    },
  };
}
