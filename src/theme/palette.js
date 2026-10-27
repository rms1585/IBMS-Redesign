import { alpha } from '@mui/material/styles';

// Minimals-style neutral scale.
export const grey = {
  50: '#FCFDFD',
  100: '#F9FAFB',
  200: '#F4F6F8',
  300: '#DFE3E8',
  400: '#C4CDD5',
  500: '#919EAB',
  600: '#637381',
  700: '#454F5B',
  800: '#1C252E',
  900: '#141A21',
};

// Brand primary: IBMS action green #008F40.
export const primary = {
  lighter: '#C6F3D3',
  light: '#4CC27A',
  main: '#008F40',
  dark: '#006B3A',
  darker: '#00472E',
  contrastText: '#FFFFFF',
};

export const secondary = {
  lighter: '#EFD6FF',
  light: '#C684FF',
  main: '#8E33FF',
  dark: '#5119B7',
  darker: '#27097A',
  contrastText: '#FFFFFF',
};

export const info = {
  lighter: '#CAFDF5',
  light: '#61F3F3',
  main: '#00B8D9',
  dark: '#006C9C',
  darker: '#003768',
  contrastText: '#FFFFFF',
};

export const success = {
  lighter: '#D3FCD2',
  light: '#77ED8B',
  main: '#22C55E',
  dark: '#118D57',
  darker: '#065E49',
  contrastText: '#FFFFFF',
};

export const warning = {
  lighter: '#FFF5CC',
  light: '#FFD666',
  main: '#FFAB00',
  dark: '#B76E00',
  darker: '#7A4100',
  contrastText: grey[800],
};

export const error = {
  lighter: '#FFE9D5',
  light: '#FFAC82',
  main: '#FF5630',
  dark: '#B71D18',
  darker: '#7A0916',
  contrastText: '#FFFFFF',
};

export function createPalette(mode) {
  const light = mode === 'light';
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
    divider: alpha(grey[500], 0.2),
    text: light
      ? { primary: grey[800], secondary: grey[600], disabled: grey[500] }
      : { primary: '#FFFFFF', secondary: grey[500], disabled: grey[600] },
    background: light
      ? { paper: '#FFFFFF', default: '#FFFFFF', neutral: grey[200] }
      : { paper: grey[800], default: grey[900], neutral: '#28323D' },
    action: {
      hover: alpha(grey[500], 0.08),
      selected: alpha(grey[500], 0.16),
      focus: alpha(grey[500], 0.24),
      disabled: alpha(grey[500], 0.8),
      disabledBackground: alpha(grey[500], 0.24),
      hoverOpacity: 0.08,
      disabledOpacity: 0.48,
      active: light ? grey[600] : grey[500],
    },
  };
}
