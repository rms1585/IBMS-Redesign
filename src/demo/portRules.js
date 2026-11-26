import { useStoredState } from './PortStore';

// Rules and limits a port administrator sets per port (M-12, Annex 7.12). Operational screens read them from here,
// so a change in Port setup shows at the bench straight away.
export const DEFAULT_RULES = {
  otherManifest: true,
  fields: { driverMobile: true, sealNumber: false, truckColour: false },
  holdingPlaces: '40',
  callMinutes: '20',
  agingFlag: '30',
  agingRefer: '60',
  approvals: [
    { act: 'Load lock co-approval (Customs ARO)', hours: '2', night: 'ARO on night duty' },
    { act: 'Exit Pass approval (shed in-charge)', hours: '1', night: 'Shift supervisor on duty' },
    { act: 'Truck change after the lock', hours: '4', night: 'Port in-charge' },
  ],
  openRecords: [
    { what: 'Visit open inside the port', days: '3', owner: 'Port supervisor' },
    { what: 'Bill of Entry with no release', days: '30', owner: 'Revenue desk' },
    { what: 'Manifest marked "Other" and unmatched', days: '2', owner: 'Posting officer' },
  ],
};

export const SCREEN_FIELDS = [
  ['driverMobile', 'Driver mobile number', 'Border gate'],
  ['sealNumber', 'Seal number', 'Weighbridge'],
  ['truckColour', 'Truck colour', 'Border gate'],
];

const NO_RULES = {};

export function usePortRules(code = 'BEN') {
  const [all, setAll] = useStoredState('portRules', NO_RULES);
  const rules = { ...DEFAULT_RULES, ...all[code], fields: { ...DEFAULT_RULES.fields, ...all[code]?.fields } };
  const setRules = (change) => setAll((a) => ({ ...a, [code]: { ...rules, ...change } }));
  return [rules, setRules];
}
