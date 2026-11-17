import { createContext, useContext, useMemo, useState } from 'react';
import { alerts as seededAlerts } from './data/mock';

// Alerts sent to C&F agencies, so a screen that acts on a consignment (for example Posting) can reach the
// agency's portal. Newest first. Demo state only: it resets when the page is refreshed.
const CfAlertsContext = createContext(null);

const clock = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export function CfAlertsProvider({ children }) {
  const [alerts, setAlerts] = useState(seededAlerts);
  const value = useMemo(() => ({
    alerts,
    addAlert: (alert) => setAlerts((all) => [{ at: clock(), ...alert }, ...all]),
  }), [alerts]);
  return <CfAlertsContext.Provider value={value}>{children}</CfAlertsContext.Provider>;
}

export const useCfAlerts = () => useContext(CfAlertsContext);
