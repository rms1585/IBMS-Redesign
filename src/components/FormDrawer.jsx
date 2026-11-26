import { useEffect, useState } from 'react';
import { Alert, Box, Button, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CloseRoundedIcon } from './icons';
import { tr } from '../i18n/LanguageContext';

// A create form that slides in from the right over the page: title and close at the top, the form scrolls in
// the middle, and the actions stay pinned at the bottom so they are always in reach. Full width on a phone.
// (Kept by the product owner's decision although M2 Annex 24.4 asks for in-place panels; see DESIGN_NOTES §15.)
// Keep it mounted and toggle `open`: a Drawer that mounts already open skips its slide-in.
// `width` is 480 for a plain form; a stepped form with more on each step can ask for more room.
// `dirty`: something has been typed. Escape, the close button or a click outside then asks before discarding,
// and leaving the page warns too (Annex 24.3).
// `why`: while the main action is disabled, the reason in plain words (Annex 24.4: a disabled action says why).
export default function FormDrawer({ open, onClose, title: titleText, subtitle: subtitleText, actions, width = 480, dirty = false, why, children }) {
  const [title, subtitle] = [tr(titleText), tr(subtitleText)];
  const titleId = `form-drawer-${String(titleText).replace(/\W+/g, '-').toLowerCase()}`;
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);
  useEffect(() => {
    if (!open || !dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [open, dirty]);
  const requestClose = () => (dirty ? setConfirming(true) : onClose());
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={requestClose}
      transitionDuration={{ enter: 300, exit: 250 }}
      // A light grey veil instead of MUI's 50% black, so the page stays readable behind the form.
      sx={{ '& .MuiBackdrop-root': { bgcolor: (t) => alpha(t.palette.grey[800], 0.24) } }}
      PaperProps={{ role: 'dialog', 'aria-modal': true, 'aria-labelledby': titleId, sx: { width: { xs: '100%', sm: width }, display: 'flex', flexDirection: 'column', boxShadow: (t) => t.customShadows.dialog } }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} sx={{ px: 3, pt: 3, pb: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography id={titleId} variant="h6" component="h2">{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
        </Box>
        <IconButton onClick={requestClose} aria-label={tr('Close')} edge="end"><CloseRoundedIcon /></IconButton>
      </Stack>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 3 }}>{children}</Box>
      <Divider />
      {confirming ? (
        <Alert
          severity="warning"
          sx={{ borderRadius: 0, alignItems: 'center' }}
          action={(
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" color="inherit" autoFocus onClick={() => setConfirming(false)}>{tr('Keep editing')}</Button>
              <Button size="small" variant="contained" color="error" onClick={() => { setConfirming(false); onClose(); }}>{tr('Discard')}</Button>
            </Stack>
          )}
        >
          {tr('Discard what you have typed?')}
        </Alert>
      ) : (
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end" sx={{ px: 3, py: 2 }}>
          {why && <Typography variant="caption" color="text.secondary" role="status" sx={{ flex: 1, minWidth: 0 }}>{tr(why)}</Typography>}
          {actions}
        </Stack>
      )}
    </Drawer>
  );
}

// Form state for a drawer that stays mounted (so it can slide out): it resets to `empty` each time the
// drawer opens. `empty` must be a constant. Returns the values, a field setter for onChange, and whether
// anything has been typed since it opened.
export function useFreshForm(open, empty) {
  const [values, setValues] = useState(empty);
  useEffect(() => {
    if (open) setValues(empty);
  }, [open, empty]);
  return [values, (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value })), values !== empty];
}
