// Writes blocks/data/schemas/*.json and blocks/data/rules.json: one Blocks table per record type of the
// shared port record, each readable and writable by signed-in users only (access level 1, all four operations).
// Each row is one record: `key` is the record's own id and `data` its JSON, so the record's shape can
// change with the design without a schema change. Run with `node scripts/blocks-schemas.mjs`, then
// `blocks data sync`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { PORT_TABLES, SETTINGS_SCHEMA } from '../src/demo/blocks/tables.js';

const dir = new URL('../blocks/data/schemas/', import.meta.url);
mkdirSync(dir, { recursive: true });
const tables = [...PORT_TABLES, { schema: SETTINGS_SCHEMA, description: 'A named value of the record that is not a list, such as a switch or a counter.' }];
for (const { schema, description } of tables) {
  writeFileSync(new URL(`${schema}.json`, dir), `${JSON.stringify({
    schemaName: schema,
    collectionName: `blx_${schema}s`,
    schemaType: 1,
    fields: [
      { name: 'key', type: 'String', description: 'The record id used across the app, e.g. a manifest number or a visit id.' },
      { name: 'data', type: 'String', description: `The record as JSON. ${description}` },
    ],
  }, null, 2)}\n`);
}
const security = tables.flatMap(({ schema }) => [0, 1, 2, 3].map((operation) => ({ schemaName: schema, operation, policyType: 0, accessLevel: 1, fieldNames: [] })));
writeFileSync(new URL('../rules.json', dir), `${JSON.stringify({ security, policies: [] }, null, 2)}\n`);
console.log(`${tables.length} schemas and their access rules written`);
