import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Label from '../components/Label';
import { CancelRoundedIcon, CheckCircleRoundedIcon, ChevronRightRoundedIcon, InfoOutlinedIcon } from '../components/icons';
import { muiColorOf } from './status';
import { formatDateTime } from './format';
import { useT } from '../i18n/LanguageContext';

// A status word in its one tone (Annex 24.5). Never a dot alone.
export function StatusPill({ word, sx }) {
  const t = useT();
  return <Label color={muiColorOf(word)} sx={sx}>{t(word)}</Label>;
}

// How a value was recorded, when it did not come from a device or BNSW (Annex 24.5).
const MARKED = ['Keyed at the gate', 'Keyed by the agency', "Keyed from Customs' reference", 'Typed by hand', 'Declared', 'Back-entered from form', 'Differs from BNSW, case open'];
export function SourceMarker({ source, always = false }) {
  const t = useT();
  if (!source) return null;
  if (MARKED.includes(source)) return <Label color="warning" variant="outlined" sx={{ borderWidth: 1, fontWeight: 600 }}>{t(source)}</Label>;
  if (source === 'Keyed, confirmed by BNSW') return <Label color="success" variant="outlined" sx={{ borderWidth: 1, fontWeight: 600 }}>{t(source)}</Label>;
  if (!always) return null;
  return <Typography component="span" variant="caption" color="text.secondary">{source === 'BNSW' ? t('From BNSW') : source === 'Device' ? t('From the device') : source}</Typography>;
}

// Plates in plain bold, as registered; no plate box (Annex 24.6).
// A hero plate is never wrapped or cut, so it scales with the bench record card: h3 when there is room,
// down to h5 in a narrow card (recorded exception to the fixed type scale).
export function Plate({ children, size = 'body', sx }) {
  const variant = size === 'hero' ? 'h3' : size === 'large' ? 'h5' : 'subtitle2';
  const fluid = size === 'hero' ? { fontSize: 'clamp(1.5rem, 7.5cqi, 3rem)' } : null;
  return <Typography component="span" variant={variant} sx={{ fontWeight: 700, whiteSpace: 'nowrap', ...fluid, ...sx }}>{children}</Typography>;
}

// Identifiers in the form their issuer prints them: never wrapped or shortened.
export function Id({ children, sx }) {
  return <Typography component="span" variant="body2" sx={{ whiteSpace: 'nowrap', fontWeight: 600, ...sx }}>{children}</Typography>;
}

// Checklist with only three marks: a tick the system made, a cross with its reason, a grey information mark.
export function Checklist({ checks }) {
  const t = useT();
  return (
    <Stack component="ul" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0, mb: 1.5 }}>
      {checks.map((c) => (
        <Stack component="li" key={c.label} direction="row" spacing={1.25} alignItems="flex-start">
          <Box sx={{ mt: '2px', color: c.state === 'pass' ? 'success.main' : c.state === 'fail' ? 'error.main' : 'text.disabled', display: 'flex' }}>
            {c.state === 'pass' ? <CheckCircleRoundedIcon fontSize="small" /> : c.state === 'fail' ? <CancelRoundedIcon fontSize="small" /> : <InfoOutlinedIcon fontSize="small" />}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2">
              <Box component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{c.state === 'pass' ? `${t('Passed')}: ` : c.state === 'fail' ? `${t('Failed')}: ` : `${t('Information')}: `}</Box>
              {t(c.label)}
            </Typography>
            {c.text && <Typography variant="body2" color="text.secondary">{c.text}</Typography>}
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

// The one blocking reason and the one main action, pinned together (Annex 24.3).
export function ActionFoot({ checks = [], label, onClick, keyHint, disabled, extraBlocker, color = 'primary' }) {
  const blocker = extraBlocker ?? checks.find((c) => c.state === 'fail');
  return (
    // Sticks to the bottom of the window while its card runs below it, so the main action is in reach at 1366×768 (M2 B2).
    <Stack spacing={1} sx={{ pt: 1.5, pb: 0.5, mt: 'auto', borderTop: 1, borderColor: 'divider', position: 'sticky', bottom: 0, zIndex: 1, bgcolor: 'background.paper' }}>
      {blocker && (
        <Typography variant="body2" color="error.text" role="status">
          <Box component="span" sx={{ fontWeight: 600 }}>{blocker.label ?? 'Blocked'}: </Box>{blocker.text}
        </Typography>
      )}
      <Button size="large" variant="contained" color={color} disabled={Boolean(blocker) || disabled} onClick={onClick} fullWidth>
        {label}{keyHint && <Box component="kbd" sx={{ ml: 1, px: 0.75, borderRadius: 0.5, border: 1, borderColor: 'currentColor', typography: 'caption', fontWeight: 700, fontFamily: 'inherit', opacity: 0.8 }}>{keyHint}</Box>}
      </Button>
    </Stack>
  );
}

// Bench: context strip, then queue (oldest first, never paginated) | the subject | checks and the action.
// Columns follow the content area (the `main` container), not the window, so an open navigation counts:
// three columns from 860px of content, with the side columns giving up width first so the record keeps
// room for the plate and its facts; below that the checks card moves under queue and record; on a phone
// everything stacks.
const BENCH_TWO = '@container main (min-width: 600px)';
const BENCH_THREE = '@container main (min-width: 860px)';
export function Bench({ context, queue, center, right }) {
  return (
    <Stack spacing={2}>
      {context && (
        <Card sx={{ px: 2.5, py: 1.5 }}>
          <Stack direction="row" flexWrap="wrap" columnGap={4} rowGap={1} alignItems="center">
            {context.map((c) => (
              <Box key={c.label}>
                <Typography variant="caption" color="text.secondary" component="div">{c.label}</Typography>
                <Typography variant="subtitle2">{c.value}</Typography>
              </Box>
            ))}
          </Stack>
        </Card>
      )}
      <Box
        sx={{
          display: 'grid', gap: 2, alignItems: 'start', gridTemplateColumns: 'minmax(0,1fr)',
          [BENCH_TWO]: { gridTemplateColumns: 'clamp(220px, 30cqi, 260px) minmax(0,1fr)' },
          [BENCH_THREE]: { gridTemplateColumns: 'clamp(200px, 22cqi, 280px) minmax(0,1fr) clamp(240px, 27cqi, 340px)' },
        }}
      >
        <Card sx={{ p: 2, minWidth: 0 }}>{queue}</Card>
        {/* A size container, so the hero plate can scale to the card. */}
        <Card sx={{ p: { xs: 2, sm: 3 }, minWidth: 0, containerType: 'inline-size' }}>{center}</Card>
        <Card sx={{ p: 2.5, minWidth: 0, overflow: 'visible', display: 'flex', flexDirection: 'column', [BENCH_TWO]: { gridColumn: '1 / -1' }, [BENCH_THREE]: { gridColumn: 'auto', minHeight: 440 } }}>{right}</Card>
      </Box>
    </Stack>
  );
}

export function QueueList({ title, items, selected, onSelect, render, empty }) {
  const t = useT();
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{t(title)} · {items.length}</Typography>
      {items.length === 0 && <Typography variant="body2" color="text.secondary">{empty}</Typography>}
      <Stack component="ul" role="listbox" aria-label={t(title)} spacing={0.5} sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {items.map((it) => (
          <Box
            component="li"
            role="option"
            aria-selected={selected === it.id}
            tabIndex={0}
            key={it.id}
            onClick={() => onSelect(it.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(it.id); } }}
            sx={{ p: 1.25, borderRadius: 1, cursor: 'pointer', border: 1, borderColor: selected === it.id ? 'primary.main' : 'divider', bgcolor: selected === it.id ? 'action.selected' : 'transparent', '&:hover': { bgcolor: 'action.hover' }, '&:focus-visible': { outline: 2, outlineColor: 'primary.main', outlineStyle: 'solid' } }}
          >
            {render(it)}
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

export function Fact({ label, children }) {
  const t = useT();
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" component="div">{t(label)}</Typography>
      <Box sx={{ typography: 'body2', fontWeight: 600 }}>{children ?? '–'}</Box>
    </Box>
  );
}

// Up to `cols` facts per row, fewer when the card is narrow, so identifiers (never wrapped) always fit.
export function Facts({ children, cols = 3 }) {
  const gap = 16;
  const track = `max(150px, calc((100% - ${(cols - 1) * gap}px) / ${cols}))`;
  return <Box sx={{ display: 'grid', gap: `${gap}px`, gridTemplateColumns: `repeat(auto-fill, minmax(${track}, 1fr))` }}>{children}</Box>;
}

export function SectionTitle({ children, action }) {
  const t = useT();
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, mt: 3, '&:first-of-type': { mt: 0 } }}>
      <Typography variant="subtitle1">{typeof children === 'string' ? t(children) : children}</Typography>
      {action}
    </Stack>
  );
}

// A hold always names its body, person, time and reference (Annex 24.5).
export function HoldRow({ hold, onLift, liftLabel = 'Lift hold' }) {
  return (
    <Alert severity="error" variant="outlined" sx={{ alignItems: 'flex-start' }} action={onLift && <Button color="error" variant="outlined" size="small" onClick={onLift}>{liftLabel}</Button>}>
      <Typography variant="subtitle2">{hold.body === 'BGB' ? 'BGB stop' : `${hold.body} hold`} on {hold.target.label ?? hold.target.id}</Typography>
      <Typography variant="body2">{hold.reason}</Typography>
      <Typography variant="caption" color="text.secondary">{hold.person} · {formatDateTime(hold.at)}{hold.ref ? ` · ${hold.ref}` : ''}{hold.source === 'BNSW' ? ' · Received through BNSW' : ''}</Typography>
    </Alert>
  );
}

// A row that opens something is a keyboard stop too: Tab reaches it, Enter or Space opens it, and a chevron
// shows it leads somewhere (audit M1).
function openable(onOpen, row) {
  if (!onOpen) return {};
  return {
    tabIndex: 0,
    role: 'link',
    onClick: () => onOpen(row),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen(row);
      }
    },
  };
}

// Read by screen readers, not shown.
const visuallyHidden = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };

const focusRing = (t) => ({ outline: `2px solid ${t.palette.primary.main}`, outlineOffset: -2 });

// On a phone every table becomes a stack of cards: each column is a label-value line, and columns with no
// label (row actions) sit at the bottom right. Shared by ResponsiveTable and the admin DataTable.
export function RowCards({ columns, rows, rowKey, onRowClick }) {
  const t = useT();
  const fields = columns.filter((c) => c.priority !== 'low' && c.label);
  const actions = columns.filter((c) => !c.label);
  return (
    <Stack spacing={1} component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {rows.map((r, i) => (
        <Card
          component="li"
          key={rowKey(r, i)}
          variant="outlined"
          {...openable(onRowClick, r)}
          sx={{ p: 1.5, boxShadow: 'none', cursor: onRowClick ? 'pointer' : 'default', '&:focus-visible': focusRing }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
              {fields.map((c) => (
                <Stack key={c.label} direction="row" justifyContent="space-between" spacing={2}>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{t(c.label)}</Typography>
                  <Box sx={{ typography: 'body2', textAlign: 'right', minWidth: 0, overflowWrap: 'anywhere', '& .ibms-label': { whiteSpace: 'normal', height: 'auto', minHeight: 24, py: 0.25, lineHeight: 1.4 } }}>{c.render(r)}</Box>
                </Stack>
              ))}
              {actions.length > 0 && (
                <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap sx={{ pt: 0.5 }}>
                  {actions.map((c, j) => <Box key={j}>{c.render(r)}</Box>)}
                </Stack>
              )}
            </Stack>
            {onRowClick && <ChevronRightRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} aria-hidden />}
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}

// Tables never scroll sideways: low-priority columns drop when narrow; on a phone each row becomes a card.
// Laid out like the administration tables: edge to edge in a card padded 24px, with roomy rows. The negative
// margins assume that padding; when the table is the card's last child it also runs to the card's bottom edge.
// Figures never wrap: right-aligned columns, and any column marked `nowrap`, stay on one line, so the
// description columns take the extra lines instead.
const noWrap = (column) => column.nowrap ?? column.align === 'right';

export function ResponsiveTable({ columns, rows, rowKey, onRowClick, empty = 'Nothing here yet.' }) {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('sm'));
  const narrow = useMediaQuery(theme.breakpoints.down('lg'));
  const t = useT();
  const visible = columns.filter((c) => !(narrow && c.priority === 'low'));
  if (!rows.length) return <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>{empty}</Typography>;
  if (phone) return <RowCards columns={columns} rows={rows} rowKey={rowKey} onRowClick={onRowClick} />;
  return (
    <Box sx={{ mx: -3, '&:last-child': { mb: -3 } }}>
    <Table size="small" sx={{ tableLayout: 'auto', '& .MuiTableCell-root': { py: 2 }, '& .MuiTableCell-root:first-of-type': { pl: 3 }, '& .MuiTableCell-root:last-of-type': { pr: 3 } }}>
      <TableHead>
        <TableRow>
          {visible.map((c) => <TableCell key={c.label} align={c.align}>{t(c.label)}</TableCell>)}
          {onRowClick && <TableCell sx={{ width: 40 }}><Box component="span" sx={visuallyHidden}>Open</Box></TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={rowKey(r, i)} hover={Boolean(onRowClick)} {...openable(onRowClick, r)} sx={{ cursor: onRowClick ? 'pointer' : 'default', '&:focus-visible': focusRing }}>
            {visible.map((c) => <TableCell key={c.label} align={c.align} sx={noWrap(c) ? { whiteSpace: 'nowrap' } : undefined}>{c.render(r)}</TableCell>)}
            {onRowClick && <TableCell align="right"><ChevronRightRoundedIcon fontSize="small" sx={{ color: 'text.secondary', verticalAlign: 'middle' }} aria-hidden /></TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </Box>
  );
}

// A reason is mandatory wherever the report asks for one; the box is never pre-filled.
export function ReasonField({ value, onChange, label = 'Reason', helper }) {
  const [touched, setTouched] = useState(false);
  const t = useT();
  const err = touched && !value.trim();
  return (
    <TextField
      label={t(label)}
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => setTouched(true)}
      error={err}
      helperText={err ? t('Give a reason so the record shows why.') : helper}
      multiline
      minRows={2}
      fullWidth
    />
  );
}

// "Locked" with a link to request a correction in place (Annex 24.9).
export function LockedValue({ children, onRequestCorrection }) {
  const t = useT();
  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      <Box>{children}</Box>
      <StatusPill word="Locked" />
      {onRequestCorrection && <Button size="small" variant="outlined" color="inherit" onClick={onRequestCorrection}>{t('Request a correction')}</Button>}
    </Stack>
  );
}

// A refusal sits beside the action and lists each blocker (Annex 24.4).
export function Refusal({ title, items }) {
  if (!items?.length) return null;
  return (
    <Alert severity="error" variant="outlined">
      <Typography variant="subtitle2">{title}</Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {items.map((i) => <li key={i}><Typography variant="body2">{i}</Typography></li>)}
      </Box>
    </Alert>
  );
}

// Confirms only, in the action's own words, then clears itself (Annex 24.4).
export function Confirmation({ text, onClose }) {
  useEffect(() => {
    if (!text) return undefined;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [text, onClose]);
  if (!text) return null;
  return (
    <Alert severity="success" onClose={onClose} role="status" sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1400, boxShadow: 6, minWidth: 280, maxWidth: 'calc(100% - 32px)' }}>
      {text}
    </Alert>
  );
}

// Signed approval record: name, role, time and device (Annex 24.9).
export function ApprovalRow({ title, approval, action }) {
  const t = useT();
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ py: 1.25, borderBottom: 1, borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2">{t(title)}</Typography>
        <Typography variant="body2" color="text.secondary">
          {approval ? `${approval.name} · ${formatDateTime(approval.at)}${approval.device ? ` · ${approval.device}` : ''}` : t('Not signed yet')}
        </Typography>
      </Box>
      {approval ? <StatusPill word="Approved" /> : action ?? <StatusPill word="Waiting approval" />}
    </Stack>
  );
}

// Camera still and plate read for a bench's right column. Grey surface: colour is kept for state.
export function CameraStill({ lane, read, expected, label = 'Plate read' }) {
  const match = read && expected ? read === expected : null;
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ height: 84, borderRadius: 1, bgcolor: 'background.neutral', display: 'grid', placeItems: 'center', border: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">Camera still · {lane}</Typography>
      </Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        {read ? <Plate>{read}</Plate> : <Typography variant="body2" color="text.secondary">No read</Typography>}
      </Stack>
      {match === false && <Typography variant="body2" color="error.text">The read does not match the selected truck.</Typography>}
    </Box>
  );
}

// The bench's main action can be pressed with its printed key letter when no field has focus.
export function useKeyAction(letter, run, enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === letter.toLowerCase()) { e.preventDefault(); run(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [letter, run, enabled]);
}
