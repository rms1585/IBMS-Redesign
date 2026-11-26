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
