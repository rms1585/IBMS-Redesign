// Annex 24.6: how identifiers, dates, money and weights read on every screen.

const pad = (n) => String(n).padStart(2, '0');

// Bangladesh time (UTC+6, no daylight saving), whatever the viewer's own time zone is.
const toBdt = (iso) => new Date(new Date(iso).getTime() + 6 * 3600 * 1000);

const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const hm = (d) => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;

export const dayKey = (iso = new Date().toISOString()) => ymd(toBdt(iso));

// "2026-11-24 14:05", or "Today 14:05" for an event earlier today.
export function formatDateTime(iso) {
  if (!iso) return '–';
  const d = toBdt(iso);
  return ymd(d) === dayKey() ? `Today ${hm(d)}` : `${ymd(d)} ${hm(d)}`;
}

export const formatDate = (iso) => (iso ? ymd(toBdt(iso)) : '–');

// Durations in hours and minutes.
export function formatDuration(fromIso, toIso = new Date().toISOString()) {
  if (!fromIso) return '–';
  const mins = Math.max(0, Math.round((new Date(toIso) - new Date(fromIso)) / 60000));
  const h = Math.floor(mins / 60);
  return h ? `${h} h ${mins % 60} min` : `${mins} min`;
}

// Storage and halting count in days.
export function daysSince(iso, toIso = new Date().toISOString()) {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(toIso) - new Date(iso)) / 86400000));
}

export const formatBDT = (n) =>
  n == null ? '–' : `BDT ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatKg = (n) => (n == null ? '–' : `${Number(n).toLocaleString('en-US')} kg`);

// Billable weight: whole tonnes, always rounded up.
export const billableTonnes = (kg) => (kg == null ? null : Math.ceil(kg / 1000));
export const formatTonnes = (t) => (t == null ? '–' : `${t} t`);

// Searching ignores spaces, dashes, slashes and capitals (Annex 24.6).
export const searchKey = (s) => String(s ?? '').replace(/[\s\-/.]/g, '').toUpperCase();

// The Bill of Entry in its four parts: type, office, registration number, date.
export const formatBoe = (boe) => (boe ? `${boe.type} ${boe.office} ${boe.reg} ${boe.date}` : '–');
