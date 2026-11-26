// What waits in a person's inbox: approvals they may decide and open reconciliation items (M-13).
// Shared by the Inbox and by the landing rule, so a supervisor starts on the Inbox only when something waits.
export function inboxWaiting(p) {
  const s = p.state;
  const corrections = s.corrections.filter((c) => !c.decision && c.by !== p.actor.name).length;
  const overrides = (s.overrideRequests ?? []).filter((o) => !o.decision && o.by !== p.actor.name).length;
  const passes = s.passes.filter((x) => p.passStatus(x) === 'Waiting approval').length;
  const tariffs = (s.tariffOrders ?? []).filter((o) => o.status === 'Waiting for approval' && o.sentBy !== p.actor.name).length;
  const cases = (s.outageCases ?? []).filter((c) => !c.referred && c.cls !== 'A').length;
  return corrections + overrides + passes + cases + tariffs;
}

// An approval past its time limit, or waiting at night, goes to the night delegate Port setup names for the act
// (XC-7). Night is 22:00 to 06:00 at the port (UTC+6).
export function escalation(sinceIso, rule) {
  if (!rule || !sinceIso) return null;
  const hours = (Date.now() - new Date(sinceIso).getTime()) / 3600000;
  const hour = new Date(Date.now() + 6 * 3600000).getUTCHours();
  const night = hour >= 22 || hour < 6;
  const late = hours > Number(rule.hours);
  return late || night ? { delegate: rule.night, why: late ? `past its ${rule.hours}-hour limit` : 'waiting at night' } : null;
}

// A person tried to approve their own request: refused, and the attempt is written to the audit trail (AU-2).
export const SELF_APPROVAL_PREFIX = 'Refused self-approval:';
export function refuseSelfApproval(p, what, record) {
  p.logEvent(`${SELF_APPROVAL_PREFIX} ${p.actor.name} tried to approve ${what} they raised themselves`, record);
}
