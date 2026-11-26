import { useState } from 'react';
import {
  Box, Stack, Typography, Breadcrumbs, Link, Card, InputAdornment, TextField, Avatar, Button,
} from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '../demo/InPlace';
import { alpha, useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { InboxOutlinedIcon, SearchRoundedIcon, TrendingDownRoundedIcon, TrendingUpRoundedIcon } from './icons';
import Label from './Label';
import { tr } from '../i18n/LanguageContext';

export function PageHeader({ title, links = [], action, subtitle }) {
  // Shared pieces translate their own text, so every screen gets Bangla headings and labels (audit M3).
  [title, subtitle] = [tr(title), tr(subtitle)];
  links = links.map((l) => ({ ...l, name: tr(l.name) }));
  return (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ mb: 4 }}>
      <Box sx={{ minWidth: 0, flex: '1 1 320px' }}>
        {/* The page title is the page's one h1, styled as h4 (audit m4). */}
        <Typography variant="h4" component="h1" gutterBottom={links.length > 0 || Boolean(subtitle)}>
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
                <Typography key={l.name} variant="body2" color={i === links.length - 1 ? 'text.secondary' : 'text.primary'}>
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
      {action && <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ flexShrink: 0, maxWidth: '100%', minWidth: 0 }}>{action}</Stack>}
    </Stack>
  );
}

export function SearchField({ placeholder: hint = 'Search…', value, onChange, sx }) {
  const placeholder = tr(hint);
  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ minWidth: { xs: 0, sm: 260 }, ...sx }}
      slotProps={{
        // The placeholder is the only visible label, so it also names the field for screen readers.
        htmlInput: { 'aria-label': placeholder.replace(/…$/, '') },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ color: 'text.secondary' }} aria-hidden />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

// Keeps sideways scrolling inside a table's own area, for tables in drawers and other panels.
export function TableScroll({ children }) {
  return <Box sx={{ overflowX: 'auto' }}>{children}</Box>;
}

export function EmptyState({ title = 'No data', description, sx }) {
  [title, description] = [tr(title), tr(description)];
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ py: 6, px: 3, textAlign: 'center', color: 'text.secondary', ...sx }}>
      <InboxOutlinedIcon sx={{ fontSize: 48, opacity: 0.6 }} />
      <Typography variant="subtitle1" color="text.secondary">{title}</Typography>
      {description && <Typography variant="body2">{description}</Typography>}
    </Stack>
  );
}

export function KpiCard({ title, value, change, icon, color = 'primary', caption, note, noteTo }) {
  [title, caption] = [tr(title), tr(caption)];
  const theme = useTheme();
  const up = change == null ? null : change >= 0;
  return (
    <Card sx={{ p: 2, height: '100%', containerType: 'inline-size' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
          {/* Short note under the title, e.g. "(View queue)"; a link when noteTo is given. */}
          {note && (noteTo ? (
            <Link component={RouterLink} to={noteTo} variant="caption" underline="hover" sx={{ display: 'block' }}>({note})</Link>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>({note})</Typography>
          ))}
        </Box>
        {icon && (
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 1.25, display: 'grid', placeItems: 'center', flexShrink: 0,
              color: theme.palette.mode === 'light' ? theme.palette[color].text ?? theme.palette[color].dark : theme.palette[color].light,
              bgcolor: alpha(theme.palette[color].main, 0.12),
            }}
          >
            {icon}
          </Box>
        )}
      </Stack>
      {/* The value spans the card under the title/icon row and stays on one line,
          shrinking with the card (cqi = 1% of the card's content width). A recorded exception to the type
          scale: it is h3 at full width and never goes below body1. */}
      <Typography variant="h3" noWrap sx={{ mt: 1.5, mb: 0.5, fontSize: 'clamp(16px, 13cqi, 32px)' }}>{value}</Typography>
      {change != null ? (
        <Stack direction="row" alignItems="center" flexWrap="wrap" columnGap={0.5}>
          {up ? <TrendingUpRoundedIcon fontSize="small" color="success" /> : <TrendingDownRoundedIcon fontSize="small" color="error" />}
          <Typography variant="subtitle2" component="span">{up ? '+' : ''}{change}%</Typography>
          <Typography variant="body2" color="text.secondary" component="span">{caption ?? 'vs. last period'}</Typography>
        </Stack>
      ) : (
        caption && <Typography variant="body2" color="text.secondary">{caption}</Typography>
      )}
    </Card>
  );
}

export function SectionCard({ title, subheader, action, children, sx, contentSx }) {
  [title, subheader] = [tr(title), tr(subheader)];
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
    <Avatar sx={{ width: size, height: size, typography: size > 40 ? 'subtitle1' : 'subtitle2', bgcolor: (t) => alpha(t.palette[c].main, 0.16), color: (t) => (t.palette.mode === 'light' ? t.palette[c].text ?? t.palette[c].dark : t.palette[c].light), ...sx }}>
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

// Marks a design choice that rests on an open stakeholder decision (F-numbers refer to the
// feedback register in the 28–29 Oct 2026 consultation minutes), so reviewers can tell it apart
// from agreed behaviour.
export function AssumptionNote({ code, children, sx }) {
  return (
    // In a narrow column the text drops under the label instead of squeezing into a thin strip.
    <Stack direction="row" flexWrap="wrap" alignItems="flex-start" gap={1} sx={sx}>
      <Label color="warning" sx={{ flexShrink: 0 }}>Assumption · {code}</Label>
      <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5, flex: '1 1 180px' }}>{children}</Typography>
    </Stack>
  );
}

// Confirmation that requires a written reason: used for safety-critical or audited actions.
export function ReasonDialog({ open, title, description, confirmLabel = 'Confirm', confirmColor = 'primary', onClose, onConfirm, extra, canConfirm = true }) {
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
        <Button variant="contained" color={confirmColor} disabled={!reason.trim() || !canConfirm} onClick={() => { onConfirm(reason.trim()); setReason(''); }}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export const formatBDT = (n) =>
  `BDT\u00a0${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatKg = (n) => `${Number(n).toLocaleString('en-US')}\u00a0kg`;
