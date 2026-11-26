// Payments a provider has not confirmed, each worked as a case by finance (M-09). Demo data, shared by Billing > Finance
// and Inbox > Reconciliation.
export const MISSING_PAYMENTS = [
  { id: 'PC-BEN-2026-012', paymentId: 'BLPA-BEN-0391-2', provider: 'Online payment gateway', amount: 18420, since: '24 Nov, 15:10', status: 'Provider asked for its settlement file' },
  { id: 'PC-BEN-2026-013', paymentId: 'BLPA-BEN-0402-6', provider: 'Sonali Bank e-payment', amount: 6230, since: '25 Nov, 11:42', status: 'Agent shows a debit; bank checking' },
];
