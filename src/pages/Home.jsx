import { Box, Button, Card, CardActionArea, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { navConfig } from '../layouts/navConfig';
import { useRole } from '../RoleContext';
import { usePort } from '../demo/PortStore';
import { dayKey, formatDuration } from '../demo/format';
import { useT } from '../i18n/LanguageContext';

// Home is a grid of module tiles; each tile says in one or two live lines what waits there (Annex 24.3).
function useTileLines() {
  const p = usePort();
  const { state } = p;
  const oldest = (list, key) => {
    const times = list.map(key).filter(Boolean).sort();
    return times[0] ? `${formatDuration(times[0])} oldest` : null;
  };
  const atGate = state.visits.filter((v) => v.stage === 'Expected');
  const toWeigh = state.visits.filter((v) => (v.stage === 'Admitted' || (v.stage === 'Manifest not yet available' && !v.weigh)) && !v.weigh);
  const toPost = state.visits.filter((v) => v.stage === 'Weighed' && !v.posting);
  const holding = state.visits.filter((v) => v.holding || (v.weigh && v.late));
  const atShed = state.visits.filter((v) => (v.posting && v.posting.accepted === null) || (v.stage === 'Posted' && !v.receipt?.locked));
  const loads = state.deliveryRequests.flatMap((d) => d.slots.filter((s) => s.enteredAt && !s.load));
  const unpaid = state.bills.filter((b) => b.status === 'Payment due');
  const passesWaiting = state.passes.filter((x) => p.passStatus(x) === 'Waiting approval');
  return {
    '/border-gate': [`${atGate.length} truck${atGate.length === 1 ? '' : 's'} expected`, oldest(atGate, (v) => v.enteredAt)],
    '/weighbridge': [`${toWeigh.length} to weigh`, oldest(toWeigh, (v) => v.gateIn?.at)],
    '/posting': [`${toPost.length} to post · ${holding.length} in the holding area`],
    '/warehousing': [`${atShed.length} at the shed · ${loads.length} load${loads.length === 1 ? '' : 's'} to lock`],
    '/inland-gate': [`${passesWaiting.length} Exit Pass${passesWaiting.length === 1 ? '' : 'es'} waiting approval`],
    '/billing': [`${unpaid.length} bill${unpaid.length === 1 ? '' : 's'} with payment due`],
    '/customs': [`${p.activeHolds.length} hold${p.activeHolds.length === 1 ? '' : 's'} open`, `${state.visits.filter((v) => v.weigh?.overTolerance).length} weight flag`],
    '/manifests': [`${state.manifests.length} consignments on record`],
    '/inbox': [`${state.corrections.filter((c) => !c.decision).length + state.truckChanges.filter((t) => !t.done).length} waiting decision`],
    '/external': [state.bnswDown ? 'BNSW down' : 'BNSW live', state.exitCheckDown ? 'Exit check down' : null],
    '/cf-portal': [`${state.manifests.length} consignments`],
  };
}

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

function Tile({ item, lines }) {
  const t = useT();
  const live = (lines[item.path] ?? []).filter(Boolean);
  return (
    <Card>
      <CardActionArea component={RouterLink} to={item.path} sx={{ p: 2.5, height: '100%', alignItems: 'flex-start', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: live.length ? 1 : 0, color: 'primary.main' }}>
          {item.icon}
          <Typography variant="subtitle1" color="text.primary">{t(item.title)}</Typography>
        </Stack>
        {live.map((l) => <Typography key={l} variant="body2" color="text.secondary">{l}</Typography>)}
      </CardActionArea>
    </Card>
  );
}

export default function Home() {
  const { canOpen } = useRole();
  const lines = useTileLines();
  const t = useT();
  // Same categories as the side navigation, filtered to the current role; empty categories drop out.
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
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,1fr))', md: 'repeat(3, minmax(0,1fr))', xl: 'repeat(4, minmax(0,1fr))' } }}>
              {g.items.map((item) => <Tile key={item.path} item={item} lines={lines} />)}
            </Box>
          </Box>
        ))}
      </Stack>
    </>
  );
}
