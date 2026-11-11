import { createContext, useContext, useMemo, useState } from 'react';
import { auditEvents } from './data/mock';

// One append-only list of audit events that screens write to and the Audit log reads (F16: every action is
// logged against the user). Demo state only: it resets when the page is refreshed.
const AuditContext = createContext(null);

const stamp = (d) => `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour12: false })}`;

export function AuditProvider({ children }) {
  const [events, setEvents] = useState(auditEvents);
  const value = useMemo(() => ({
    events,
    // Newest first, like the seeded events; ids continue from the highest seeded number.
    addEvent: (event) => setEvents((all) => {
      const next = Math.max(...all.map((e) => Number(e.id.replace('EV-', '')))) + 1;
      return [{ id: `EV-${next}`, time: stamp(new Date()), flags: [], ...event }, ...all];
    }),
  }), [events]);
  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

export const useAudit = () => useContext(AuditContext);
