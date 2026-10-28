import { useState } from 'react';
import {
  Box, Stack, Typography, Breadcrumbs, Link, Card, InputAdornment, TextField, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { InboxOutlinedIcon, SearchRoundedIcon, TrendingDownRoundedIcon, TrendingUpRoundedIcon } from './icons';

export function PageHeader({ title, links = [], action, subtitle }) {
  return (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ mb: 4 }}>
      <Box sx={{ minWidth: 0, flex: '1 1 320px' }}>
        <Typography variant="h4" gutterBottom={links.length > 0 || Boolean(subtitle)}>
          {title}
        </Typography>
        {links.length > 0 && (
          <Breadcrumbs separator={<Box component="span" sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled' }} />}>
            {links.map((l, i) =>
              l.href ? (
                <Link key={l.name} component={RouterLink} to={l.href} underline="hover" color="text.primary" variant="body2">
                  {l.name}
                </Link>
              ) : (
                <Typography key={l.name} variant="body2" color={i === links.length - 1 ? 'text.disabled' : 'text.primary'}>
                  {l.name}
                </Typography>
              ),
            )}
          </Breadcrumbs>
        )}
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ flexShrink: 0 }}>{action}</Stack>}
    </Stack>
  );
}

export function SearchField({ placeholder = 'Search…', value, onChange, sx }) {
  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ minWidth: { xs: 0, sm: 260 }, ...sx }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export function EmptyState({ title = 'No data', description, sx }) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ py: 6, px: 3, textAlign: 'center', color: 'text.disabled', ...sx }}>
      <InboxOutlinedIcon sx={{ fontSize: 48, opacity: 0.6 }} />
      <Typography variant="subtitle1" color="text.secondary">{title}</Typography>
      {description && <Typography variant="body2">{description}</Typography>}
    </Stack>
  );
}

export function KpiCard({ title, value, change, icon, color = 'primary', caption }) {
  const theme = useTheme();
  const up = change == null ? null : change >= 0;
  return (
    <Card sx={{ p: 3, height: '100%', containerType: 'inline-size' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
          <Typography variant="h3" sx={{ mt: 1.5, mb: 1, fontSize: 'clamp(22px, 12cqi, 32px)', overflowWrap: 'anywhere' }}>{value}</Typography>
          {change != null ? (
            <Stack direction="row" alignItems="center" flexWrap="wrap" columnGap={0.5}>
              {up ? <TrendingUpRoundedIcon fontSize="small" color="success" /> : <TrendingDownRoundedIcon fontSize="small" color="error" />}
              <Typography variant="subtitle2" component="span">{up ? '+' : ''}{change}%</Typography>
              <Typography variant="body2" color="text.secondary" component="span">{caption ?? 'vs. last period'}</Typography>
            </Stack>
          ) : (
            caption && <Typography variant="body2" color="text.secondary">{caption}</Typography>
          )}
        </Box>
        {icon && (
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 1.5, display: 'grid', placeItems: 'center', flexShrink: 0,
              color: theme.palette.mode === 'light' ? theme.palette[color].text ?? theme.palette[color].dark : theme.palette[color].light,
              bgcolor: alpha(theme.palette[color].main, 0.12),
            }}
          >
            {icon}
          </Box>
        )}
      </Stack>
    </Card>
  );
}

export function SectionCard({ title, subheader, action, children, sx, contentSx }) {
  return (
    <Card sx={sx}>
      {(title || action) && (
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ px: 3, pt: 3, pb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            {title && <Typography variant="h6">{title}</Typography>}
            {subheader && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subheader}</Typography>}
          </Box>
          {action}
        </Stack>
      )}
      <Box sx={contentSx}>{children}</Box>
    </Card>
  );
}

export function UserAvatar({ name, size = 40, sx }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  const colors = ['primary', 'info', 'warning', 'secondary', 'error', 'success'];
  const c = colors[name.length % colors.length];
  return (
    <Avatar sx={{ width: size, height: size, fontSize: size * 0.38, bgcolor: (t) => alpha(t.palette[c].main, 0.16), color: (t) => (t.palette.mode === 'light' ? t.palette[c].text ?? t.palette[c].dark : t.palette[c].light), ...sx }}>
      {initials}
    </Avatar>
  );
}

export function DetailRow({ label, children, labelWidth = 120 }) {
  return (
    <Stack direction="row" flexWrap="wrap" columnGap={2} sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: labelWidth, flexShrink: 0 }}>{label}</Typography>
      <Typography variant="body2" component="div" sx={{ flex: '1 1 140px', minWidth: 0, overflowWrap: 'anywhere' }}>{children}</Typography>
    </Stack>
  );
}

// Confirmation that requires a written reason: used for safety-critical or audited actions.
export function ReasonDialog({ open, title, description, confirmLabel = 'Confirm', confirmColor = 'primary', onClose, onConfirm, extra }) {
  const [reason, setReason] = useState('');
  const close = () => { setReason(''); onClose(); };
  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {description && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{description}</Typography>}
        {extra}
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          label="Reason"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          helperText="Recorded in the audit log with your name and time."
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={close}>Cancel</Button>
        <Button variant="contained" color={confirmColor} disabled={!reason.trim()} onClick={() => { onConfirm(reason.trim()); setReason(''); }}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export const formatBDT = (n) =>
  `BDT ${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatKg = (n) => `${Number(n).toLocaleString('en-US')} kg`;
