// Annex 24.5: five tones with fixed meanings, and the status words each one carries.
// A screen uses only these words; a new word is added here first.
export const TONES = {
  green: 'success', // done, cleared, admitted, valid, paid
  blue: 'info', // waiting on someone else
  amber: 'warning', // needs attention soon; stops nothing
  red: 'error', // stopped
  grey: 'default', // closed, used, replaced, not applicable
};

export const STATUS_WORDS = {
  // Holds and stops
  'Customs hold': 'red',
  'BLPA hold': 'red',
  'BGB stop': 'red',
  'Immigration hold': 'red',
  'Held at the barrier': 'red',
  'Exit lock': 'red',
  'Hold lifted': 'grey',
  // Customs and BNSW
  'Waiting for BNSW': 'blue',
  'Awaiting Customs': 'blue',
  'Waiting for release': 'blue',
  Released: 'green',
  'Exit note received': 'green',
  'No exit note': 'blue',
  'Release revoked': 'red',
  'For information': 'grey',
  // Bills and payment
  'Payment due': 'amber',
  Paid: 'green',
  'Paid, awaiting settlement': 'blue',
  'Waiting for confirmation': 'blue',
  'Payment failed': 'red',
  'Not priced': 'amber',
  // Passes
  'Pass valid': 'green',
  'Pass used': 'grey',
  'Pass invalidated': 'red',
  'Waiting approval': 'amber',
  Approved: 'green',
  Rejected: 'red',
  'Sent for approval': 'amber',
  // Truck journey (portals, tracking and dashboards only)
  Expected: 'blue',
  'Waiting outside': 'blue',
  Admitted: 'green',
  Weighed: 'green',
  'In the holding area': 'blue',
  'Manifest not yet available': 'amber',
  Posted: 'green',
  Unloaded: 'green',
  Loading: 'blue',
  'Load locked': 'green',
  Exited: 'grey',
  Refused: 'red',
  // Records
  Open: 'blue',
  Closed: 'grey',
  Overdue: 'amber',
  Locked: 'grey',
  Superseded: 'grey',
  Matched: 'green',
  Unmatched: 'red',
  'Weight over tolerance': 'amber',
  'Re-weigh flagged': 'amber',
  // Links, licences and workforce
  Live: 'green',
  Down: 'red',
  Verified: 'green',
  Unverified: 'amber',
  Expired: 'red',
  Suspended: 'red',
  Present: 'green',
  Absent: 'grey',
  Draft: 'grey',
  Active: 'green',
  Inactive: 'grey',
};

export const toneOf = (word) => STATUS_WORDS[word] ?? 'grey';
export const muiColorOf = (word) => TONES[toneOf(word)];
