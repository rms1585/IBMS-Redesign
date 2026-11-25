import { Box, Stack, Typography } from '@mui/material';
import blpaLogo from '../assets/blpa-logo.png';
import Label from './Label';
import { useT } from '../i18n/LanguageContext';

// The Beta tag marks the whole prototype; in the collapsed rail it sits under the logo.
export default function Logo({ mini }) {
  const t = useT();
  const beta = <Label color="warning" sx={{ flexShrink: 0 }}>{t('Beta')}</Label>;
  return (
    <Stack direction={mini ? 'column' : 'row'} alignItems="center" spacing={mini ? 0.75 : 1.25} sx={{ px: mini ? 0 : 1, justifyContent: mini ? 'center' : 'flex-start' }}>
      {/* White disc keeps the logo's dark-green ring legible on dark backgrounds. */}
      <Box
        component="img"
        src={blpaLogo}
        alt="Bangladesh Land Port Authority"
        sx={{ width: 40, height: 40, flexShrink: 0, objectFit: 'contain', borderRadius: '50%', bgcolor: 'common.white', p: '2px' }}
      />
      {mini ? beta : (
        <Box sx={{ lineHeight: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>IBMS</Typography>
            {beta}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>Land port management</Typography>
        </Box>
      )}
    </Stack>
  );
}
