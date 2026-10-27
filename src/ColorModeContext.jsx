import { createContext, useContext, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from './theme';

const ColorModeContext = createContext({ mode: 'light', toggle: () => {} });

const readStoredMode = () => {
  try {
    return localStorage.getItem('ibms-color-mode') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(readStoredMode);
  const value = useMemo(
    () => ({
      mode,
      toggle: () =>
        setMode((m) => {
          const next = m === 'light' ? 'dark' : 'light';
          try { localStorage.setItem('ibms-color-mode', next); } catch { /* storage unavailable */ }
          return next;
        }),
    }),
    [mode],
  );
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export const useColorMode = () => useContext(ColorModeContext);
