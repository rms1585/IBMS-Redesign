import { Box, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material';
import { CloseRoundedIcon } from './icons';

// A create or edit form that slides in from the right over the page: title and close at the top, the form
// scrolls in the middle, and the actions stay pinned at the bottom so they are always in reach.
// Full width on a phone. Escape, the close button or a click outside closes it.
export default function FormDrawer({ open, onClose, title, subtitle, actions, children }) {
  const titleId = `form-drawer-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ 'aria-labelledby': titleId, sx: { width: { xs: '100%', sm: 480 }, display: 'flex', flexDirection: 'column', boxShadow: (t) => t.customShadows.dialog } }}
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
