// The shared port record as Blocks tables: one table per record type, one row per record.
// Anything in the record that is not one of these lists (switches, counters, licence changes)
// is kept as a row of PortSetting under its own name.

export const PORT_TABLES = [
  { key: 'manifests', schema: 'PortManifest', description: 'A manifest with its lines.' },
  { key: 'pendingManifests', schema: 'PendingManifest', description: 'A manifest BNSW has not sent yet.' },
  { key: 'visits', schema: 'TruckVisit', description: 'One truck visit from gate in to exit.' },
  { key: 'boes', schema: 'BillOfEntry', description: 'A Bill of Entry with its release and exit notes.' },
  { key: 'holds', schema: 'PortHold', description: 'A hold placed by a named body.' },
  { key: 'deliveryRequests', schema: 'DeliveryRequest', description: 'A Delivery Request with its slots.' },
  { key: 'passes', schema: 'ExitPass', description: 'An Exit Pass with its approvals.' },
  { key: 'bills', schema: 'PortBill', description: 'A bill with its lines and payment.' },
  { key: 'events', schema: 'PortEvent', description: 'One entry of the event log.' },
  { key: 'corrections', schema: 'Correction', description: 'A correction request on a locked value.' },
  { key: 'truckChanges', schema: 'TruckChange', description: 'A proposed truck change on an Exit Pass.' },
];

export const SETTINGS_SCHEMA = 'PortSetting';

export const ALL_SCHEMAS = [...PORT_TABLES.map((t) => t.schema), SETTINGS_SCHEMA];
