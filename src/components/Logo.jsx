import { Box, Stack, Typography } from '@mui/material';
import blpaLogo from '../assets/blpa-logo.png';

export default function Logo({ mini }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: mini ? 0 : 1, justifyContent: mini ? 'center' : 'flex-start' }}>
      {/* White disc keeps the logo's dark-green ring legible on dark backgrounds. */}
      <Box
        component="img"
        src={blpaLogo}
        alt="Bangladesh Land Port Authority"
        sx={{ width: 40, height: 40, flexShrink: 0, objectFit: 'contain', borderRadius: '50%', bgcolor: 'common.white', p: '2px' }}
      />
      {!mini && (
        <Box sx={{ lineHeight: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>IBMS</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>Land port management</Typography>
        </Box>
      )}
    </Stack>
  );
}
