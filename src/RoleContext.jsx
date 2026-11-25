import { createContext, useContext, useMemo, useState } from 'react';

// Demo role switcher with the Annex 8 template roles (a demo aid allowed by Annex 24.12).
// `paths` lists the screens a role can open (null means every screen); `landing` is where the role starts.
// `person` signs every action the role takes, so the audit log and approvals carry a name.
const LOOKUP = '/manifests';

export const roles = [
  { id: 'super-admin', ref: 'Demo', name: 'Demo presenter (demo aid, not a live role)', person: 'Demo presenter', paths: null, landing: '/' },
  { id: 'border-gate', ref: 'TR-01', name: 'Border gate operator', person: 'Abdul Karim', paths: ['/border-gate', LOOKUP], landing: '/border-gate' },
  { id: 'weighbridge', ref: 'TR-02', name: 'Weighbridge operator', person: 'Mizanur Rahman', paths: ['/weighbridge', LOOKUP], landing: '/weighbridge' },
  { id: 'posting', ref: 'TR-04', name: 'Posting officer', person: 'Farhana Yasmin', paths: ['/posting', LOOKUP], landing: '/posting' },
  { id: 'transshipment', ref: 'TR-05', name: 'Transshipment officer', person: 'Shahidul Islam', paths: ['/transshipment', LOOKUP], landing: '/transshipment' },
  { id: 'shed', ref: 'TR-06', name: 'Shed in-charge', person: 'Habibur Rahman', paths: ['/warehousing', LOOKUP], landing: '/warehousing' },
  { id: 'warehouse-manager', ref: 'TR-07', name: 'Warehouse manager', person: 'Selina Parvin', paths: ['/warehousing', '/labour', LOOKUP], landing: '/warehousing' },
  { id: 'billing', ref: 'TR-09', name: 'Billing officer (revenue desk)', person: 'Tanvir Ahmed', paths: ['/billing', LOOKUP], landing: '/billing' },
  { id: 'inland-gate', ref: 'TR-12', name: 'Inland gate operator', person: 'Ruhul Amin', paths: ['/inland-gate', LOOKUP], landing: '/inland-gate' },
  { id: 'supervisor', ref: 'TR-13', name: 'Supervisor', person: 'Jahangir Alam', paths: ['/', '/inbox', '/dashboard', '/audit', '/back-entry', LOOKUP, '/border-gate', '/inland-gate', '/weighbridge', '/posting', '/warehousing'], landing: '/inbox' },
  { id: 'port-incharge', ref: 'TR-14', name: 'Port in-charge', person: 'Md. Shafiqul Islam', paths: null, landing: '/inbox' },
  { id: 'management', ref: 'TR-15', name: 'Management (head office)', person: 'Director (Traffic), BLPA HQ', paths: ['/', '/dashboard', LOOKUP], landing: '/dashboard' },
  { id: 'port-admin', ref: 'TR-16', name: 'Port configuration administrator', person: 'Arif Chowdhury', paths: ['/', '/port-setup', '/warehouse-layout', '/storage-rules', '/routing', '/vehicle-classes', '/equipment', '/charges', '/technical', '/exceptions'], landing: '/port-setup' },
  { id: 'access-admin', ref: 'TR-17', name: 'Access administrator', person: 'Sabina Yasmin', paths: ['/', '/roles', '/users', '/audit'], landing: '/users' },
  { id: 'auditor', ref: 'TR-21', name: 'Auditor', person: 'Audit Directorate', paths: ['/audit', LOOKUP, '/dashboard'], landing: '/audit' },
  { id: 'integration', ref: 'TR-22', name: 'Integration support', person: 'Integration desk, NDC Agargaon', paths: ['/external', LOOKUP], landing: '/external' },
  { id: 'cf', ref: 'TR-23', name: 'C&F agent user (authorized signer)', person: 'Kamal Hossain', agency: '301045', paths: ['/cf-portal'], landing: '/cf-portal' },
  { id: 'customs', ref: 'TR-24', name: 'Customs user (Assistant Revenue Officer)', person: 'Md. Jahid Hasan', paths: ['/customs', LOOKUP], landing: '/customs' },
  { id: 'licence-admin', ref: 'TR-25', name: 'Licence administrator', person: 'Nasrin Akter', paths: ['/licences'], landing: '/licences' },
  { id: 'workforce', ref: 'TR-26', name: 'Workforce officer', person: 'Monirul Haque', paths: ['/labour'], landing: '/labour' },
  { id: 'bank', ref: 'TR-28', name: 'Bank counter', person: 'Sonali Bank counter, Benapole', paths: ['/billing'], landing: '/billing' },
  { id: 'rail', ref: 'TR-29', name: 'Rail siding officer', person: 'Anwar Hossain', paths: ['/rail', LOOKUP], landing: '/rail' },
  { id: 'passenger', ref: 'TR-30', name: 'Passenger terminal officer', person: 'Lipi Akter', paths: ['/passenger'], landing: '/passenger' },
  { id: 'trader', ref: 'TR-31', name: 'Importer (trader)', person: 'Delta Foods Ltd user', importer: '000234567-0202', paths: ['/trader-portal'], landing: '/trader-portal' },
  { id: 'bgb', ref: 'TR-32', name: 'BGB officer', person: 'Capt. Nazmul Huda, BGB', paths: ['/customs'], landing: '/customs' },
  { id: 'immigration', ref: 'TR-33', name: 'Immigration officer', person: 'Rokeya Begum, Immigration', paths: ['/customs'], landing: '/customs' },
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
      // A sub-page such as /cf-portal/<manifest> follows the access of its parent screen.
      canOpen: (path) => {
        const within = (p) => path === p || (p !== '/' && path.startsWith(`${p}/`));
        return (!role.paths || role.paths.some(within)) && !role.hidden?.some(within);
      },
    };
  }, [roleId]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export const useRole = () => useContext(RoleContext);
