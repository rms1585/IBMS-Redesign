import { useRef, useState } from 'react';
import { Box, Button, Card, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { navConfig } from '../layouts/navConfig';
import { useRole } from '../RoleContext';
import { usePort } from '../demo/PortStore';
import { dayKey } from '../demo/format';
import { useT } from '../i18n/LanguageContext';

// Bangladesh time, like every other time on screen.
function greeting() {
  const hour = (new Date().getUTCHours() + 6) % 24;
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// The welcome banner: who is signed in, today's date and the three counts that need attention.
function Welcome() {
  const { state } = usePort();
  const { canOpen, role } = useRole();
  const t = useT();
  const expected = state.visits.filter((v) => v.stage === 'Expected').length;
  const decisions = state.corrections.filter((c) => !c.decision).length + state.truckChanges.filter((c) => !c.done).length;
  const circle = (size, position) => ({ position: 'absolute', ...position, width: size, height: size, borderRadius: '50%', bgcolor: (th) => alpha(th.palette.common.white, 0.06), pointerEvents: 'none' });
  return (
    <Card
      component="section"
      aria-label={t('Welcome')}
      sx={{
        position: 'relative', overflow: 'hidden', p: { xs: 3, sm: 5 }, mb: 5, color: 'common.white', boxShadow: 'none',
        background: (th) => `linear-gradient(120deg, ${th.palette.primary.darker} 0%, ${th.palette.primary.main} 100%)`,
      }}
    >
      <Box sx={circle(280, { right: -60, top: -60 })} />
      <Box sx={circle(200, { right: 120, bottom: -100 })} />
      <Typography variant="overline" sx={{ opacity: 0.72 }}>Benapole (BEN) · {dayKey()}</Typography>
      <Typography variant="h3" component="h1" sx={{ mt: 1, mb: 1 }}>{t(greeting())}, {role.person}</Typography>
      <Typography sx={{ opacity: 0.8, maxWidth: 560 }}>
        {plural(expected, 'truck')} expected at the border gate, {plural(state.manifests.length, 'consignment')} on record and {plural(decisions, 'request')} waiting for a decision.
      </Typography>
      <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mt: 3 }}>
        {canOpen('/inbox') && (
          <Button component={RouterLink} to="/inbox" variant="contained" sx={{ bgcolor: 'common.white', color: 'primary.dark', '&:hover': { bgcolor: (th) => alpha(th.palette.common.white, 0.88) } }}>
            {t('Review inbox')} ({decisions})
          </Button>
        )}
        {canOpen('/dashboard') && (
          <Button component={RouterLink} to="/dashboard" variant="outlined" sx={{ color: 'common.white', borderColor: (th) => alpha(th.palette.common.white, 0.4), '&:hover': { borderColor: 'common.white', bgcolor: (th) => alpha(th.palette.common.white, 0.08) } }}>
            {t('Open dashboard')}
          </Button>
        )}
      </Stack>
    </Card>
  );
}

const twoLineTitle = { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', overflowWrap: 'anywhere', hyphens: 'auto' };

// Icon and name only, as on the earlier Home. A name cut to two lines shows in full in a tooltip.
function Tile({ item }) {
  const t = useT();
  const titleRef = useRef(null);
  const [clipped, setClipped] = useState(false);
  // Measured on hover and focus because whether a name clips depends on the tile's current width.
  const checkClipped = () => setClipped(titleRef.current.scrollHeight > titleRef.current.clientHeight);
  const lifted = { transform: 'translateY(-2px)', boxShadow: (th) => th.customShadows.dialog };
  return (
    <Tooltip title={clipped ? t(item.title) : ''} arrow disableInteractive describeChild>
      <Card
        component={RouterLink}
        to={item.path}
        onMouseEnter={checkClipped}
        onFocus={checkClipped}
        sx={{
          width: '100%', height: '100%', py: 2.5, px: { xs: 1.5, sm: 2.5 }, display: 'flex', justifyContent: 'flex-start', gap: { xs: 1.5, sm: 2 }, textAlign: 'left', alignItems: 'center', color: 'text.primary', textDecoration: 'none',
          transition: (th) => th.transitions.create(['transform', 'box-shadow']),
          '&:hover': lifted,
          '&:focus-visible': { ...lifted, outline: (th) => `2px solid ${th.palette.primary.main}`, outlineOffset: 2 },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover, &:focus-visible': { transform: 'none' } },
        }}
      >
        <Box sx={{ width: 44, height: 44, borderRadius: 1.5, display: 'grid', placeItems: 'center', flexShrink: 0, color: 'primary.main', bgcolor: (th) => alpha(th.palette.primary.main, 0.08) }}>
          {item.icon}
        </Box>
        <Typography ref={titleRef} variant="subtitle2" sx={{ ...twoLineTitle, minWidth: 0, flex: 1 }}>{t(item.title)}</Typography>
      </Card>
    </Tooltip>
  );
}

export default function Home() {
  const { canOpen } = useRole();
  const t = useT();
  // The side navigation's groups, filtered to the current role; empty groups drop out.
  const groups = navConfig
    .map((g) => ({ title: g.subheader, items: g.items.filter((i) => i.path !== '/' && canOpen(i.path)) }))
    .filter((g) => g.items.length);
  return (
    <>
      <Welcome />
      <Stack spacing={5}>
        {groups.map((g, i) => (
          <Box component="section" key={g.title} aria-labelledby={`home-group-${i}`}>
            <Typography id={`home-group-${i}`} variant="h6" component="h2" sx={{ mb: 2 }}>{t(g.title)}</Typography>
            <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: 'repeat(4, minmax(0,1fr))' } }}>
              {g.items.map((item) => <Tile key={item.path} item={item} />)}
            </Box>
          </Box>
        ))}
      </Stack>
    </>
  );
}
