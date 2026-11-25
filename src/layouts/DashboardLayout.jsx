import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Stack, Typography, IconButton, Tooltip, Badge, ListSubheader, ButtonBase, Divider,
  Menu, MenuItem, ListItemIcon, ListItemText, Collapse, Drawer, Paper, TextField, useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { flatNav, navConfig } from './navConfig';
import { UserAvatar } from '../components/common';
import Label from '../components/Label';
import { useColorMode } from '../ColorModeContext';
import { roles, useRole } from '../RoleContext';
import { usePort } from '../demo/PortStore';
import { formatDateTime } from '../demo/format';
import { useLanguage, useT } from '../i18n/LanguageContext';
import Logo from '../components/Logo';
import { CheckRoundedIcon, ChevronLeftRoundedIcon, ChevronRightRoundedIcon, CloudOffRoundedIcon, DarkModeOutlinedIcon, FullscreenRoundedIcon, InfoOutlinedIcon, LightModeOutlinedIcon, MenuRoundedIcon, NotificationsNoneRoundedIcon, SearchRoundedIcon, TranslateRoundedIcon, WarningAmberRoundedIcon } from '../components/icons';

const NAV_WIDTH = 280;
const NAV_MINI = 88;
const HEADER = 72;


function NavItem({ item, mini }) {
  const theme = useTheme();
  const t = useT();
  const { pathname } = useLocation();
  const active = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
  const light = theme.palette.mode === 'light';

  const activeSx = {
    color: light ? theme.palette.primary.main : theme.palette.primary.light,
    bgcolor: alpha(theme.palette.primary.main, 0.08),
    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) },
    '& .nav-title': { fontWeight: 600 },
  };

  const content = (
    <ButtonBase
      component={item.disabled ? 'div' : NavLink}
      to={item.disabled ? undefined : item.path}
      disabled={item.disabled}
      sx={{
        width: '100%',
        borderRadius: 1,
        color: 'text.secondary',
        transition: theme.transitions.create(['background-color', 'color'], { duration: 150 }),
        '&:hover': { bgcolor: 'action.hover' },
        ...(mini
          ? { flexDirection: 'column', minHeight: 56, py: 0.75, px: 0.5, gap: 0.5 }
          : { minHeight: 44, pl: 1.5, pr: 1, py: 0.5, gap: 1.5, justifyContent: 'flex-start' }),
        ...(active && activeSx),
        ...(item.disabled && { opacity: 0.48, cursor: 'default' }),
      }}
    >
      <Box sx={{ width: 24, height: 24, display: 'grid', placeItems: 'center', flexShrink: 0, '& svg': { fontSize: 22 } }}>
        {item.badge && mini ? (
          <Badge badgeContent={item.badge} color="error"
            /* 10px is below the type scale on purpose: a 16px badge on a collapsed-nav icon has no room for caption. */
            sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
            {item.icon}
          </Badge>
        ) : (
          item.icon
        )}
      </Box>
      <Typography
        className="nav-title"
        variant={mini ? 'caption' : 'body2'}
        noWrap
        sx={{
          fontWeight: 400,
          // Collapsed-nav labels sit under 24px icons in an 88px rail; caption (12px) clips most titles, so 10px is a
          // recorded exception to the type scale.
          ...(mini ? { fontSize: 10, lineHeight: 1.2, maxWidth: '100%', textAlign: 'center' } : { flex: 1, textAlign: 'left' }),
        }}
      >
        {t(item.title)}
      </Typography>
      {!mini && item.badge ? <Label color="error">{item.badge}</Label> : null}
      {!mini && item.disabled ? <Label>Soon</Label> : null}
    </ButtonBase>
  );

  return mini ? (
    <Tooltip title={t(item.title)} placement="right" arrow>
      <Box>{content}</Box>
    </Tooltip>
  ) : (
    content
  );
}

function NavGroup({ group, mini }) {
  const [open, setOpen] = useState(true);
  const t = useT();
  return (
    <Box component="li" sx={{ listStyle: 'none', mb: mini ? 1 : 0.5 }}>
      {!mini && (
        <ListSubheader
          component="div"
          disableSticky
          onClick={() => setOpen((o) => !o)}
          sx={{
            typography: 'overline', letterSpacing: 0.4, cursor: 'pointer',
            // The overline's own 16px line height, so a heading that wraps stays one block; the padding keeps the
            // single-line heading at its earlier 48px.
            color: 'text.secondary', bgcolor: 'transparent', lineHeight: 16 / 12, pl: 1.5, pt: 2.5, pb: 1.5,
            display: 'flex', alignItems: 'center', gap: 0.5, '&:hover': { color: 'text.primary' },
          }}
        >
          {t(group.subheader)}
        </ListSubheader>
      )}
      <Collapse in={mini || open}>
        <Stack component="ul" spacing={0.5} sx={{ p: 0, m: 0 }}>
          {group.items.map((item) => (
            <Box component="li" key={item.path} sx={{ listStyle: 'none' }}>
              <NavItem item={item} mini={mini} />
            </Box>
          ))}
        </Stack>
      </Collapse>
      {mini && <Divider sx={{ mt: 1, borderStyle: 'dashed' }} />}
    </Box>
  );
}

// Lookup on every screen: plate, manifest, Bill of Entry, pass number or the port's alias (Annex 24.3).
function Lookup() {
  const navigate = useNavigate();
  const phoneHeader = useMediaQuery(useTheme().breakpoints.down('sm'));
  const { lookup } = usePort();
  const t = useT();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const results = lookup(q);
  const go = (r) => { setQ(''); setOpen(false); navigate(r.to); };
  return (
    <Box sx={{ position: 'relative', width: { xs: 160, sm: 240, lg: 300 } }}>
      <TextField
        size="small"
        fullWidth
        value={q}
        // The full hint does not fit a phone's header, so phones show just "Search" (audit m8).
        placeholder={phoneHeader ? t('Search') : t('Plate, manifest, Bill of Entry or pass')}
        inputProps={{ 'aria-label': t('Lookup') }}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) go(results[0]); if (e.key === 'Escape') setOpen(false); }}
        InputProps={{ startAdornment: <SearchRoundedIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} aria-hidden /> }}
      />
      {open && q.trim().length >= 3 && (
        <Paper sx={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 1300, boxShadow: 8, py: 0.5 }}>
          {results.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ px: 1.5, py: 1 }}>{t('Nothing matches')}. Try the plate without spaces, or the manifest number.</Typography>}
          {results.map((r) => (
            <MenuItem key={`${r.kind}-${r.label}`} onMouseDown={() => go(r)} sx={{ display: 'block', whiteSpace: 'normal' }}>
              <Typography variant="caption" color="text.secondary" component="div">{t(r.kind)}</Typography>
              <Typography variant="subtitle2" sx={{ whiteSpace: 'nowrap' }}>{r.label}</Typography>
              <Typography variant="caption" color="text.secondary">{r.sub}</Typography>
            </MenuItem>
          ))}
        </Paper>
      )}
    </Box>
  );
}

// Top bar: menu, lookup and port on the left | bell, full screen and user on the right. The Beta tag sits by the logo.
function Header({ navWidth, onOpenNav }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode, toggle } = useColorMode();
  const { lang, setLang } = useLanguage();
  const t = useT();
  const { state, reset } = usePort();
  const [anchor, setAnchor] = useState(null);
  const items = state.events.slice(0, 10);
  const [userAnchor, setUserAnchor] = useState(null);
  const { role, setRole } = useRole();
  const fullScreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  };

  return (
    <Box
      component="header"
      sx={{
        position: 'fixed', top: 0, right: 0, left: navWidth, height: HEADER, zIndex: 1100, px: { xs: 2, sm: 3, lg: 5 },
        display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 },
        bgcolor: alpha(theme.palette.background.default, 0.92), backdropFilter: 'blur(6px)',
        transition: theme.transitions.create('left', { duration: 200 }),
      }}
    >
      {onOpenNav && (
        <IconButton onClick={onOpenNav} aria-label="Open navigation" edge="start"><MenuRoundedIcon /></IconButton>
      )}
      <Lookup />
      {/* The port name must not shrink: a squeezed nowrap label spills past its box. */}
      <Typography variant="subtitle2" sx={{ display: { xs: 'none', md: 'block' }, whiteSpace: 'nowrap', flexShrink: 0 }}>{t('Port')}: Benapole</Typography>

      <Box sx={{ flex: 1 }} />
      <Tooltip title="Notifications">
        <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Notifications">
          <Badge badgeContent={items.length} color="error"><NotificationsNoneRoundedIcon /></Badge>
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { width: 380 } } }}>
        <Typography variant="subtitle1" sx={{ px: 1.5, py: 1 }}>Latest events</Typography>
        <Divider sx={{ borderStyle: 'dashed' }} />
        {items.map((a) => (
          <MenuItem key={a.id} onClick={() => { setAnchor(null); navigate(state.manifests.some((m) => m.id === a.record) ? `/manifests/${encodeURIComponent(a.record)}` : '/audit'); }} sx={{ whiteSpace: 'normal', alignItems: 'flex-start', py: 1.25 }}>
            <Box>
              <Typography variant="body2">{a.text}</Typography>
              <Typography variant="caption" color="text.secondary">{formatDateTime(a.at)} · {a.by}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
      <Tooltip title={t('Full screen')}>
        <IconButton onClick={fullScreen} aria-label={t('Full screen')} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}><FullscreenRoundedIcon /></IconButton>
      </Tooltip>

      <ButtonBase onClick={(e) => setUserAnchor(e.currentTarget)} aria-label={t('Switch role')} sx={{ borderRadius: 1.5, p: 0.5, pr: 1, gap: 1.25, '&:hover': { bgcolor: 'action.hover' } }}>
        <UserAvatar name={role.person} size={36} />
        <Box sx={{ textAlign: 'left', display: { xs: 'none', md: 'block' }, maxWidth: 200 }}>
          <Typography variant="subtitle2" noWrap sx={{ lineHeight: 1.3 }}>{role.person}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="div">{role.name}</Typography>
        </Box>
      </ButtonBase>
      <Menu anchorEl={userAnchor} open={Boolean(userAnchor)} onClose={() => setUserAnchor(null)} slotProps={{ paper: { sx: { width: 320, maxHeight: '80vh' } } }}>
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography variant="subtitle2">{role.person}</Typography>
          <Typography variant="body2" color="text.secondary">{role.name} · Benapole</Typography>
        </Box>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <MenuItem onClick={() => { setUserAnchor(null); navigate('/external'); }}>BNSW simulator (demo tool)</MenuItem>
        {/* Only the presenter role offers Reset, so a demo isn't wiped by accident mid-journey. */}
        {role.id === 'super-admin' && (
          <MenuItem onClick={() => { reset(); setUserAnchor(null); navigate(role.landing); }}>
            <ListItemText primary={t('Reset demo')} secondary="Restores the starting data in this browser" primaryTypographyProps={{ variant: 'body2' }} secondaryTypographyProps={{ variant: 'caption' }} />
          </MenuItem>
        )}
        <Divider sx={{ borderStyle: 'dashed' }} />
        <MenuItem onClick={() => { setLang(lang === 'en' ? 'bn' : 'en'); setUserAnchor(null); }}>
          <ListItemIcon><TranslateRoundedIcon fontSize="small" /></ListItemIcon>
          {t('Language')}: {lang === 'en' ? 'English' : 'বাংলা'}
        </MenuItem>
        <MenuItem onClick={() => { toggle(); setUserAnchor(null); }}>
          <ListItemIcon>{mode === 'light' ? <DarkModeOutlinedIcon fontSize="small" /> : <LightModeOutlinedIcon fontSize="small" />}</ListItemIcon>
          {mode === 'light' ? 'Dark mode' : 'Light mode'}
        </MenuItem>
        <Divider sx={{ borderStyle: 'dashed' }} />
        {/* Demo role switcher with the Annex 8 template roles. */}
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', px: 1.5, pt: 1, pb: 0.5 }}>{t('Switch role')} (demo)</Typography>
        {roles.map((r) => (
          <MenuItem key={r.id} selected={r.id === role.id} onClick={() => { setRole(r.id); setUserAnchor(null); navigate(r.landing); }}>
            <ListItemText primary={r.name} secondary={r.person} primaryTypographyProps={{ variant: 'body2', fontWeight: r.id === role.id ? 600 : 400 }} secondaryTypographyProps={{ variant: 'caption' }} />
            {r.id === role.id && <CheckRoundedIcon fontSize="small" color="primary" />}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

// Any state that changes what a user can do shows as a full-width strip on every screen (Annex 24.10).
function StatusStrips() {
  const { state } = usePort();
  const t = useT();
  const keyed = state.boes.filter((b) => b.source === 'Keyed by the agency').length + state.boes.filter((b) => b.release?.source === "Keyed from Customs' reference").length;
  return (
    <Stack spacing={1} sx={{ mb: 2, '&:empty': { display: 'none' } }}>
      {state.bnswDown && (
        <Alert severity="warning" icon={<CloudOffRoundedIcon />}>
          <Typography variant="subtitle2">{t('BNSW-down mode')}</Typography>
          <Typography variant="body2">{t("BNSW is down. The port works in BNSW-down mode: the gate keys manifest lines from the Car Pass, the C&F agency keys the Bill of Entry number and the revenue desk records releases from Customs' reference. The importer's tag and the agency's truck entry are still required.")}</Typography>
        </Alert>
      )}
      {state.exitCheckDown && (
        <Alert severity="warning" icon={<WarningAmberRoundedIcon />}>
          <Typography variant="subtitle2">Exit check down</Typography>
          <Typography variant="body2">{t('The exit check is down. Every truck at the exit lanes is held at the barrier until it is repaired or another gate is used.')}</Typography>
        </Alert>
      )}
      {!state.bnswDown && keyed > 0 && (
        <Alert severity="warning" icon={<InfoOutlinedIcon />}>
          <Typography variant="body2">{keyed} keyed value{keyed === 1 ? '' : 's'} waiting to be checked against BNSW.</Typography>
        </Alert>
      )}
    </Stack>
  );
}

function NavContent({ mini, onToggle }) {
  const theme = useTheme();
  const { state } = usePort();
  const { canOpen } = useRole();
  const groups = navConfig
    .map((g) => ({ ...g, items: g.items.filter((item) => canOpen(item.path)) }))
    .filter((g) => g.items.length > 0);
  return (
    <>
      {/* Collapsed, the Beta tag sits under the logo, so the block grows past the header height there. */}
      <Box sx={{ minHeight: HEADER, display: 'flex', alignItems: 'center', px: mini ? 1 : 2.5, py: mini ? 1.5 : 0, justifyContent: mini ? 'center' : 'flex-start' }}>
        <Logo mini={mini} />
      </Box>
      {onToggle && (
        <IconButton
          size="small"
          onClick={onToggle}
          aria-label={mini ? 'Expand navigation' : 'Collapse navigation'}
          sx={{
            position: 'absolute', top: 24, right: -13, width: 26, height: 26, p: 0, borderRadius: '50%', zIndex: 1,
            bgcolor: 'background.default', border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
            '&:hover': { bgcolor: 'background.neutral' },
          }}
        >
          {mini ? <ChevronRightRoundedIcon sx={{ fontSize: 18 }} /> : <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      )}
      <Box component="ul" sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: mini ? 0.5 : 2, pb: 3, m: 0 }}>
        {groups.map((g) => (
          <NavGroup key={g.subheader} group={g} mini={mini} />
        ))}
      </Box>
      {!mini && (
        <Box sx={{ p: 2.5, pt: 0 }}>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
            <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
              Benapole · {state.bnswDown ? 'BNSW-down mode' : 'BNSW live'}
            </Typography>
            <Typography variant="caption" color="text.secondary">Demo data. Reset from the user menu.</Typography>
          </Box>
        </Box>
      )}
    </>
  );
}

export default function DashboardLayout() {
  const theme = useTheme();
  const { pathname } = useLocation();
  const { canOpen, role } = useRole();
  // ≥1200px: full navigation. 900–1199px (iPad landscape): icon rail by default.
  // <900px (iPad portrait): navigation slides in from the menu button.
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isTablet = useMediaQuery(theme.breakpoints.up('md'));
  const [miniChoice, setMiniChoice] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mini = miniChoice ?? !isDesktop;
  const t = useT();
  const { lang } = useLanguage();
  // Each screen names the browser tab after itself (audit m9).
  useEffect(() => {
    const item = flatNav.filter((i) => pathname === i.path || (i.path !== '/' && pathname.startsWith(`${i.path}/`))).pop();
    document.title = item && item.path !== '/' ? `${t(item.title)} · IBMS` : 'IBMS';
  }, [pathname, t]);
  const navWidth = isTablet ? (mini ? NAV_MINI : NAV_WIDTH) : 0;

  useEffect(() => setDrawerOpen(false), [pathname]);
  // Re-apply the automatic choice when the window crosses the desktop breakpoint.
  useEffect(() => setMiniChoice(null), [isDesktop]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isTablet ? (
        <Box
          component="nav"
          sx={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: navWidth, zIndex: 1200,
            borderRight: `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
            bgcolor: 'background.default', display: 'flex', flexDirection: 'column',
            transition: theme.transitions.create('width', { duration: 200 }),
          }}
        >
          <NavContent mini={mini} onToggle={() => setMiniChoice(!mini)} />
        </Box>
      ) : (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          slotProps={{ paper: { sx: { width: NAV_WIDTH, bgcolor: 'background.default', display: 'flex', flexDirection: 'column' } } }}
        >
          <NavContent mini={false} />
        </Drawer>
      )}

      {/* First stop for keyboard users: jumps past the navigation and header (audit m9). */}
      <Box
        component="a"
        href="#main-content"
        onClick={(e) => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}
        sx={{
          position: 'fixed', top: 8, left: 8, zIndex: 2000, px: 2, py: 1, borderRadius: 1, typography: 'subtitle2',
          bgcolor: 'background.paper', color: 'text.primary', boxShadow: (t) => t.customShadows.dialog,
          transform: 'translateY(-200%)', '&:focus': { transform: 'none', outline: (t) => `2px solid ${t.palette.primary.main}` },
        }}
      >
        {t('Skip to content')}
      </Box>
      <Header navWidth={navWidth} onOpenNav={isTablet ? null : () => setDrawerOpen(true)} />

      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          flex: 1, minWidth: 0, pl: `${navWidth}px`, pt: `${HEADER + 8}px`, '&:focus': { outline: 'none' },
          transition: theme.transitions.create('padding-left', { duration: 200 }),
        }}
      >
        {/* Named container: page layouts use @container main queries against this width. */}
        <Box sx={{ px: { xs: 2, sm: 3, lg: 5 }, pb: 8, maxWidth: 1600, mx: 'auto', containerType: 'inline-size', containerName: 'main' }}>
          {/* Screens outside the current role's modules send the user back to Home. */}
          <StatusStrips />
          {/* Keyed by language so screens that use tr() re-read their strings when the language changes. */}
          {canOpen(pathname) ? <Outlet key={lang} /> : <Navigate to={role.landing} replace />}
        </Box>
      </Box>
    </Box>
  );
}
