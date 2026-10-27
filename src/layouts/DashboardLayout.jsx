import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Stack, Typography, IconButton, Tooltip, Badge, ListSubheader, ButtonBase, Divider,
  Menu, MenuItem, Select, Collapse,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import { navConfig } from './navConfig';
import { currentUser, ports, alerts } from '../data/mock';
import { UserAvatar } from '../components/common';
import Label from '../components/Label';
import { useColorMode } from '../ColorModeContext';

const NAV_WIDTH = 280;
const NAV_MINI = 88;
const HEADER = 72;

function Logo({ mini }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: mini ? 0 : 1, justifyContent: mini ? 'center' : 'flex-start' }}>
      <Box
        sx={{
          width: 36, height: 36, borderRadius: 1.25, display: 'grid', placeItems: 'center', flexShrink: 0,
          background: (t) => `linear-gradient(135deg, ${t.palette.primary.light}, ${t.palette.primary.dark})`,
          color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: -0.5,
        }}
      >
        IB
      </Box>
      {!mini && (
        <Box sx={{ lineHeight: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>IBMS</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>Land port management</Typography>
        </Box>
      )}
    </Stack>
  );
}

function NavItem({ item, mini }) {
  const theme = useTheme();
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
          <Badge badgeContent={item.badge} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
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
          fontWeight: 500,
          ...(mini ? { fontSize: 10, lineHeight: 1.2, maxWidth: '100%', textAlign: 'center' } : { flex: 1, textAlign: 'left' }),
        }}
      >
        {item.title}
      </Typography>
      {!mini && item.badge ? <Label color="error">{item.badge}</Label> : null}
      {!mini && item.disabled ? <Label>Soon</Label> : null}
    </ButtonBase>
  );

  return mini ? (
    <Tooltip title={item.title} placement="right" arrow>
      <Box>{content}</Box>
    </Tooltip>
  ) : (
    content
  );
}

function NavGroup({ group, mini }) {
  const [open, setOpen] = useState(true);
  return (
    <Box component="li" sx={{ listStyle: 'none', mb: mini ? 1 : 0.5 }}>
      {!mini && (
        <ListSubheader
          disableSticky
          onClick={() => setOpen((o) => !o)}
          sx={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, cursor: 'pointer',
            color: 'text.disabled', bgcolor: 'transparent', lineHeight: '36px', pl: 1.5, pt: 1.5,
            display: 'flex', alignItems: 'center', gap: 0.5, '&:hover': { color: 'text.primary' },
          }}
        >
          {group.subheader}
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

function Header({ navWidth }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode, toggle } = useColorMode();
  const [port, setPort] = useState(currentUser.port);
  const [anchor, setAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);

  return (
    <Box
      component="header"
      sx={{
        position: 'fixed', top: 0, right: 0, left: navWidth, height: HEADER, zIndex: 1100, px: 5,
        display: 'flex', alignItems: 'center', gap: 1.5,
        bgcolor: alpha(theme.palette.background.default, 0.8), backdropFilter: 'blur(6px)',
        transition: theme.transitions.create('left', { duration: 200 }),
      }}
    >
      <Select
        size="small"
        value={port}
        onChange={(e) => setPort(e.target.value)}
        IconComponent={KeyboardArrowDownRoundedIcon}
        sx={{ minWidth: 220, '& .MuiSelect-select': { py: 0.9, fontWeight: 600, fontSize: 14 } }}
        renderValue={(v) => {
          const p = ports.find((x) => x.code === v);
          return `${p.name} (${p.code})`;
        }}
      >
        {ports.map((p) => (
          <MenuItem key={p.code} value={p.code}>
            <Stack direction="row" justifyContent="space-between" sx={{ width: '100%' }} spacing={2}>
              <span>{p.name} ({p.code})</span>
              <Label color={p.state === 'Live' ? 'success' : 'warning'}>{p.state === 'Live' ? 'Live' : 'Setup'}</Label>
            </Stack>
          </MenuItem>
        ))}
      </Select>
      <Label color="warning" sx={{ ml: 0.5 }}>DEMO DATA</Label>

      <Box sx={{ flex: 1 }} />

      <Tooltip title="Live cameras">
        <IconButton onClick={() => navigate('/border-gate')}><VideocamOutlinedIcon /></IconButton>
      </Tooltip>
      <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
        <IconButton onClick={toggle}>{mode === 'light' ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}</IconButton>
      </Tooltip>
      <Tooltip title="Notifications">
        <IconButton onClick={(e) => setAnchor(e.currentTarget)}>
          <Badge badgeContent={alerts.length} color="error"><NotificationsNoneRoundedIcon /></Badge>
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { width: 360 } } }}>
        <Typography variant="subtitle1" sx={{ px: 1.5, py: 1 }}>Notifications</Typography>
        <Divider sx={{ borderStyle: 'dashed' }} />
        {alerts.map((a) => (
          <MenuItem key={a.text} onClick={() => { setAnchor(null); navigate('/manifests'); }} sx={{ whiteSpace: 'normal', alignItems: 'flex-start', py: 1.25 }}>
            <Box>
              <Typography variant="body2">{a.text}</Typography>
              <Typography variant="caption" color="text.disabled">{a.at} · {a.manifest}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      <ButtonBase onClick={(e) => setUserAnchor(e.currentTarget)} sx={{ borderRadius: 1.5, p: 0.5, pr: 1, gap: 1.25, '&:hover': { bgcolor: 'action.hover' } }}>
        <UserAvatar name={currentUser.name} size={36} />
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>{currentUser.name}</Typography>
          <Typography variant="caption" color="text.secondary">{currentUser.role}</Typography>
        </Box>
      </ButtonBase>
      <Menu anchorEl={userAnchor} open={Boolean(userAnchor)} onClose={() => setUserAnchor(null)} slotProps={{ paper: { sx: { width: 220 } } }}>
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography variant="subtitle2">{currentUser.name}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>{currentUser.email}</Typography>
        </Box>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <MenuItem onClick={() => setUserAnchor(null)}>Profile</MenuItem>
        <MenuItem onClick={() => setUserAnchor(null)}>Language: English</MenuItem>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <MenuItem onClick={() => setUserAnchor(null)} sx={{ color: 'error.main', fontWeight: 600 }}>Sign out</MenuItem>
      </Menu>
    </Box>
  );
}

export default function DashboardLayout() {
  const theme = useTheme();
  const [mini, setMini] = useState(false);
  const navWidth = mini ? NAV_MINI : NAV_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box
        component="nav"
        sx={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: navWidth, zIndex: 1200,
          borderRight: `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
          bgcolor: 'background.default', display: 'flex', flexDirection: 'column',
          transition: theme.transitions.create('width', { duration: 200 }),
        }}
      >
        <Box sx={{ height: HEADER, display: 'flex', alignItems: 'center', px: mini ? 1 : 2.5, justifyContent: mini ? 'center' : 'flex-start' }}>
          <Logo mini={mini} />
        </Box>
        <IconButton
          size="small"
          onClick={() => setMini((m) => !m)}
          aria-label={mini ? 'Expand navigation' : 'Collapse navigation'}
          sx={{
            position: 'absolute', top: 24, right: -13, width: 26, height: 26, p: 0, borderRadius: '50%', zIndex: 1,
            bgcolor: 'background.default', border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
            '&:hover': { bgcolor: 'background.neutral' },
          }}
        >
          {mini ? <ChevronRightRoundedIcon sx={{ fontSize: 18 }} /> : <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />}
        </IconButton>
        <Box component="ul" sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: mini ? 0.5 : 2, pb: 3, m: 0 }}>
          {navConfig.map((g) => (
            <NavGroup key={g.subheader} group={g} mini={mini} />
          ))}
        </Box>
        {!mini && (
          <Box sx={{ p: 2.5, pt: 0 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
              <Typography variant="subtitle2" color="primary.dark" sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark' }}>
                Benapole (BEN) · Live
              </Typography>
              <Typography variant="caption" color="text.secondary">NSW feed healthy · Synced 10:58</Typography>
            </Box>
          </Box>
        )}
      </Box>

      <Header navWidth={navWidth} />

      <Box
        component="main"
        sx={{
          flex: 1, minWidth: 0, pl: `${navWidth}px`, pt: `${HEADER + 8}px`,
          transition: theme.transitions.create('padding-left', { duration: 200 }),
        }}
      >
        <Box sx={{ px: 5, pb: 8, maxWidth: 1600, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
