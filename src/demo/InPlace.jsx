import { useEffect, useRef } from 'react';
import { Box, Card, Stack, Typography } from '@mui/material';

// Annex 24.4: create and edit happen in place, not in a pop-up. These keep the Dialog API so a screen swaps its
// import, and the panel opens in the page flow and scrolls into view.
export function Dialog({ open, children, sx }) {
  const ref = useRef(null);
  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  }, [open]);
  if (!open) return null;
  return <Card ref={ref} variant="outlined" sx={{ p: 3, my: 3, borderColor: 'primary.main', ...sx }}>{children}</Card>;
}

export function DialogTitle({ children }) {
  return <Typography variant="h6" component="h2" gutterBottom>{children}</Typography>;
}

export function DialogContent({ children }) {
  return <Box sx={{ py: 1 }}>{children}</Box>;
}

export function DialogContentText({ children }) {
  return <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{children}</Typography>;
}

export function DialogActions({ children }) {
  return <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>{children}</Stack>;
}
