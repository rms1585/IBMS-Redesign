import { useEffect, useState } from 'react';
import { Box, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CloseRoundedIcon } from './icons';
import { tr } from '../i18n/LanguageContext';

// A create or edit form that slides in from the right over the page: title and close at the top, the form
// scrolls in the middle, and the actions stay pinned at the bottom so they are always in reach.
// Full width on a phone. Escape, the close button or a click outside closes it.
// Keep it mounted and toggle `open`: a Drawer that mounts already open skips its slide-in.
// `width` is 480 for a plain form; a stepped form with more on each step can ask for more room.
export default function FormDrawer({ open, onClose, title: titleText, subtitle: subtitleText, actions, width = 480, children }) {
  const [title, subtitle] = [tr(titleText), tr(subtitleText)];
  const titleId = `form-drawer-${String(titleText).replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      transitionDuration={{ enter: 300, exit: 250 }}
      // A light grey veil instead of MUI's 50% black, so the page stays readable behind the form.
      sx={{ '& .MuiBackdrop-root': { bgcolor: (t) => alpha(t.palette.grey[800], 0.24) } }}
      PaperProps={{ 'aria-labelledby': titleId, sx: { width: { xs: '100%', sm: width }, display: 'flex', flexDirection: 'column', boxShadow: (t) => t.customShadows.dialog } }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} sx={{ px: 3, pt: 3, pb: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography id={titleId} variant="h6" component="h2">{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
        </Box>
        <IconButton onClick={onClose} aria-label="Close" edge="end"><CloseRoundedIcon /></IconButton>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 3 }}>{children}</Box>
      <Divider />
      <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ px: 3, py: 2 }}>{actions}</Stack>
    </Drawer>
  );
}

// Form state for a drawer that stays mounted (so it can slide out): it resets to `empty` each time the
// drawer opens. `empty` must be a constant. Returns the values and a field setter for onChange.
export function useFreshForm(open, empty) {
  const [values, setValues] = useState(empty);
  useEffect(() => {
    if (open) setValues(empty);
  }, [open, empty]);
  return [values, (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))];
}
