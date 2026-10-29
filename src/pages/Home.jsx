import { Box, Card, Stack, Typography, ButtonBase, Grid2 as Grid } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { navConfig } from '../layouts/navConfig';
import { currentUser, manifests, arrivingTrucks, inboxRequests } from '../data/mock';
import Label from '../components/Label';
import { useRole } from '../RoleContext';

const homeGroups = [
  { title: 'Operations', paths: ['/cf-portal', '/trader-portal', '/manifests', '/border-gate', '/weighbridge', '/posting', '/warehousing', '/transshipment', '/billing', '/inland-gate'] },
  { title: 'Administration and configuration', paths: ['/port-setup', '/warehouse-layout', '/storage-rules', '/routing', '/vehicle-classes', '/equipment', '/charges', '/technical'] },
  { title: 'Access and control', paths: ['/roles', '/users', '/inbox', '/audit'] },
  { title: 'Platform', paths: ['/platform', '/dashboard'] },
];

const allItems = navConfig.flatMap((g) => g.items);

export default function Home() {
  const navigate = useNavigate();
  const { canOpen } = useRole();
  // Shortcuts follow the current role, like the left navigation; empty groups are dropped.
  const groups = homeGroups
    .map((g) => ({ ...g, paths: g.paths.filter(canOpen) }))
    .filter((g) => g.paths.length > 0);
  const open = manifests.filter((m) => m.status === 'Open').length;
  const waiting = inboxRequests.filter((r) => !r.mine).length;

  return (
    <>
      <Card
        sx={{
          p: 5, mb: 5, color: 'common.white', boxShadow: 'none',
          background: (t) => `linear-gradient(120deg, ${t.palette.primary.darker} 0%, ${t.palette.primary.main} 100%)`,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%', bgcolor: alpha('#fff', 0.06) }} />
        <Box sx={{ position: 'absolute', right: 120, bottom: -100, width: 200, height: 200, borderRadius: '50%', bgcolor: alpha('#fff', 0.05) }} />
        <Typography variant="overline" sx={{ opacity: 0.72 }}>Benapole (BEN) · Monday 27 October 2026</Typography>
        <Typography variant="h3" sx={{ mt: 1, mb: 1 }}>Good morning, {currentUser.name.split(' ')[0]}</Typography>
        <Typography sx={{ opacity: 0.8, maxWidth: 560 }}>
          {arrivingTrucks.length} trucks are expected at the border gate, {open} manifests are open and {waiting} requests are waiting for your decision.
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
          {canOpen('/inbox') && (
            <ButtonBase onClick={() => navigate('/inbox')} sx={{ px: 2, py: 1, borderRadius: 1, fontWeight: 700, bgcolor: '#fff', color: 'primary.dark', fontSize: 14 }}>
              Review inbox ({waiting})
            </ButtonBase>
          )}
          <ButtonBase onClick={() => navigate('/dashboard')} sx={{ px: 2, py: 1, borderRadius: 1, fontWeight: 700, color: '#fff', border: `1px solid ${alpha('#fff', 0.4)}`, fontSize: 14 }}>
            Open dashboard
          </ButtonBase>
        </Stack>
      </Card>

      <Stack spacing={5}>
        {groups.map((g) => (
          <Box key={g.title}>
            <Typography variant="h6" sx={{ mb: 2 }}>{g.title}</Typography>
            <Grid container spacing={2.5}>
              {g.paths.map((p) => {
                const item = allItems.find((i) => i.path === p);
                return (
                  <Grid key={p} size={{ xs: 6, md: 4, lg: 3 }}>
                    <Card
                      component={ButtonBase}
                      onClick={() => navigate(p)}
                      sx={{
                        width: '100%', p: 2.5, display: 'flex', justifyContent: 'flex-start', gap: 2, textAlign: 'left',
                        transition: (t) => t.transitions.create(['transform', 'box-shadow']),
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: (t) => t.customShadows.dialog },
                      }}
                    >
                      <Box sx={{ width: 44, height: 44, borderRadius: 1.5, display: 'grid', placeItems: 'center', flexShrink: 0, color: 'primary.main', bgcolor: (t) => alpha(t.palette.primary.main, 0.08) }}>
                        {item.icon}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" noWrap>{item.title}</Typography>
                      </Box>
                      {item.badge ? <Label color="error">{item.badge}</Label> : null}
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ))}
      </Stack>
    </>
  );
}
