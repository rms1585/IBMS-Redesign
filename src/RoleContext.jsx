import { createContext, useContext, useMemo, useState } from 'react';

// Demo role switcher. `paths` lists the screens a role can open (null means every screen);
// `hidden` lists screens taken away from that set.
// More roles (Border Gate Manager, Warehouse Manager, …) will be added here later.
export const roles = [
  { id: 'super-admin', name: 'Super-Admin', paths: null },
  { id: 'admin', name: 'Admin', paths: null, hidden: ['/port-setup'] },
  { id: 'blpa-manager', name: 'BLPA Manager', paths: ['/', '/dashboard', '/border-gate'] },
];

const DEFAULT_ROLE = 'super-admin';
const STORAGE_KEY = 'ibms-role';

const readStoredRole = () => {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    return roles.some((r) => r.id === id) ? id : DEFAULT_ROLE;
  } catch {
    return DEFAULT_ROLE;
  }
};

const RoleContext = createContext({ role: roles[0], setRole: () => {}, canOpen: () => true });

export function RoleProvider({ children }) {
  const [roleId, setRoleId] = useState(readStoredRole);
  const value = useMemo(() => {
    const role = roles.find((r) => r.id === roleId);
    return {
      role,
      setRole: (id) => {
        setRoleId(id);
        try { localStorage.setItem(STORAGE_KEY, id); } catch { /* storage unavailable */ }
      },
      canOpen: (path) => (!role.paths || role.paths.includes(path)) && !role.hidden?.includes(path),
    };
  }, [roleId]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export const useRole = () => useContext(RoleContext);
