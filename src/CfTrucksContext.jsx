import { createContext, useContext, useMemo, useState } from 'react';
import { registeredTrucks, localBookings } from './data/mock';

// One copy of the C&F agency's truck lists, so the portal's drawers and a manifest's page show the same
// trucks. Keyed by manifest number. Demo state only: it resets when the page is refreshed.
const CfTrucksContext = createContext(null);

export function CfTrucksProvider({ children }) {
  const [foreign, setForeign] = useState(registeredTrucks);
  const [local, setLocal] = useState(localBookings);
  const value = useMemo(() => ({
    foreign,
    local,
    setForeignFor: (manifestId, trucks) => setForeign((all) => ({ ...all, [manifestId]: trucks })),
    setLocalFor: (manifestId, trucks) => setLocal((all) => ({ ...all, [manifestId]: trucks })),
  }), [foreign, local]);
  return <CfTrucksContext.Provider value={value}>{children}</CfTrucksContext.Provider>;
}

export const useCfTrucks = () => useContext(CfTrucksContext);
