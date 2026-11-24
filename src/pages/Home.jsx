import { Box, Card, CardActionArea, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '../components/common';
import { flatNav } from '../layouts/navConfig';
import { useRole } from '../RoleContext';
import { usePort } from '../demo/PortStore';
import { formatDuration } from '../demo/format';
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

export default function Home() {
  const { canOpen, role } = useRole();
  const lines = useTileLines();
  const t = useT();
  const tiles = flatNav.filter((i) => i.path !== '/' && canOpen(i.path));
  return (
    <>
      <PageHeader title={t('Home')} subtitle={`${role.person} · ${role.name} · Benapole`} />
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,1fr))', md: 'repeat(3, minmax(0,1fr))', xl: 'repeat(4, minmax(0,1fr))' } }}>
        {tiles.map((item) => {
          const live = (lines[item.path] ?? []).filter(Boolean);
          return (
            <Card key={item.path}>
              <CardActionArea component={RouterLink} to={item.path} sx={{ p: 2.5, height: '100%', alignItems: 'flex-start', display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1, color: 'primary.main' }}>
                  {item.icon}
                  <Typography variant="subtitle1" color="text.primary">{t(item.title)}</Typography>
                </Stack>
                {live.length ? (
                  live.map((l) => <Typography key={l} variant="body2" color="text.secondary">{l}</Typography>)
                ) : (
                  <Typography variant="body2" color="text.secondary">{t(item.group)}</Typography>
                )}
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </>
  );
}
