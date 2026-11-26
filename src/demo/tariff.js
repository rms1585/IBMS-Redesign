// The charges each module can create, as keys of the tariff order's rates (RC-2). The go-live check and
// What this port charges use it to show a charge that the order in force has no rate for.
export const MODULE_CHARGES = {
  gates: { name: 'Gates, weighing and billing', keys: ['gateEntry', 'weighbridge', 'overnight', 'entrance'] },
  warehousing: { name: 'Warehousing', keys: ['storage', 'handling'] },
  rail: { name: 'Rail cargo', keys: ['railHandling'] },
  busTerminal: { name: 'Bus terminal', keys: ['busTerminal'] },
  outsideYard: { name: 'Outside yard (stone route)', keys: ['stone'] },
  exportStorage: { name: 'Export storage', keys: ['exportStorage'] },
  truckScanner: { name: 'Truck scanner', keys: ['scanner'] },
};

// Names for a charge the order may not price at all.
const CHARGE_NAMES = { exportStorage: 'Export storage', scanner: 'Truck scanner' };

// Every charge the port's switched-on modules can create, with the rate in force or none.
export function chargesFor(modules, tariff) {
  return Object.entries(MODULE_CHARGES)
    .filter(([k]) => k === 'gates' || modules[k])
    .flatMap(([, m]) => m.keys.map((key) => ({ key, module: m.name, what: tariff.rates[key]?.what ?? CHARGE_NAMES[key] ?? key, unit: tariff.rates[key]?.unit, rate: tariff.rates[key]?.rate })));
}

export const missingRates = (modules, tariff) => chargesFor(modules, tariff).filter((c) => c.rate == null);
