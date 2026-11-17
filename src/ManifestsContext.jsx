import { createContext, useContext, useMemo, useState } from 'react';
import { manifests as seededManifests } from './data/mock';

// One copy of the manifests, so a change made on one screen (for example a new C&F agent) shows on the others.
// Demo state only: it resets when the page is refreshed.
const ManifestsContext = createContext(null);

export function ManifestsProvider({ children }) {
  const [manifests, setManifests] = useState(seededManifests);
  const value = useMemo(() => ({
    manifests,
    // Keeps the earlier agents, so the manifest shows who handled it before and why it changed.
    changeAgency: (id, agency, change) => setManifests((all) => all.map((m) => (
      m.id === id ? { ...m, agency, agencyChanges: [change, ...(m.agencyChanges ?? [])] } : m
    ))),
  }), [manifests]);
  return <ManifestsContext.Provider value={value}>{children}</ManifestsContext.Provider>;
}

export const useManifests = () => useContext(ManifestsContext);
