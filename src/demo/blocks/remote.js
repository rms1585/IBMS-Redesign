import { blocks } from './client';
import { PORT_TABLES, SETTINGS_SCHEMA } from './tables';

// Reads and writes the shared port record in Blocks. Each list of the record (manifests, visits, …) is a
// table with one row per record; everything else is a PortSetting row under its own name. A row's `data`
// is the record as JSON with its position in the list, so the screens get their lists back in order.
//
// Every save also writes a new revision token. Other viewers poll only that token and reload the
// record when it changes, which keeps the polling to one small request.

const REVISION_KEY = '__revision';
const PAGE_SIZE = 200;
const PARALLEL_WRITES = 6;

// What Blocks holds, per table: record id -> { itemId, position, json }. Lets a save send only the
// rows that changed.
let index = new Map();
let lastRevision = null;

// ----- Blocks calls -----

function fieldOf(response, name) {
  if (response?.errors?.length) throw new Error(response.errors[0]?.message ?? 'Blocks refused the request.');
  return response?.data?.[name];
}

async function listAll(schema) {
  const rows = [];
  for (let pageNo = 1; ; pageNo += 1) {
    const page = fieldOf(
      await blocks().data.collection(schema, { fields: ['key', 'data'] }).list({ pageNo, pageSize: PAGE_SIZE }),
      `get${schema}s`,
    );
    const items = page?.items ?? [];
    rows.push(...items);
    if (items.length < PAGE_SIZE || rows.length >= (page?.totalCount ?? 0)) return rows;
  }
}

async function insertRow(schema, key, data) {
  const result = fieldOf(await blocks().data.collection(schema).create({ key, data }), `insert${schema}`);
  if (!result?.itemId) throw new Error(result?.message ?? `Blocks did not save ${key}.`);
  return result.itemId;
}

async function updateRow(schema, itemId, key, data) {
  const result = fieldOf(await blocks().data.collection(schema).update(itemId, { key, data }), `update${schema}`);
  if (result && result.acknowledged === false) throw new Error(result.message ?? `Blocks did not update ${key}.`);
}

async function deleteRow(schema, itemId) {
  fieldOf(await blocks().data.collection(schema).delete(itemId, { hardDelete: true }), `delete${schema}`);
}

async function runAll(tasks) {
  const queue = [...tasks];
  const worker = async () => {
    while (queue.length) await queue.shift()();
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL_WRITES, queue.length) }, worker));
}

const newToken = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// ----- Load -----

// Reads the record. Nothing changes here until the caller applies the result with applyLoaded(): saving
// from a record that never took the load would otherwise delete rows the viewer never saw.
// `record` is null when Blocks holds no port yet.
export async function loadRecord() {
  const settingRows = await listAll(SETTINGS_SCHEMA);
  if (!settingRows.length) return { record: null, index: new Map(), revision: null };
  const nextIndex = new Map();
  const record = {};
  const settings = new Map();
  let revision = null;
  for (const row of settingRows) {
    if (settings.has(row.key)) continue;
    settings.set(row.key, { itemId: row.ItemId, json: row.data });
    if (row.key === REVISION_KEY) revision = JSON.parse(row.data);
    else record[row.key] = JSON.parse(row.data);
  }
  nextIndex.set(SETTINGS_SCHEMA, settings);

  const tables = await Promise.all(PORT_TABLES.map((t) => listAll(t.schema)));
  PORT_TABLES.forEach((table, i) => {
    const rows = new Map();
    const parsed = tables[i]
      .map((row) => ({ row, value: JSON.parse(row.data) }))
      .sort((a, b) => a.value.position - b.value.position);
    record[table.key] = [];
    for (const { row, value } of parsed) {
      if (rows.has(row.key)) continue;
      rows.set(row.key, { itemId: row.ItemId, position: value.position, json: JSON.stringify(value.record) });
      record[table.key].push(value.record);
    }
    nextIndex.set(table.schema, rows);
  });
  return { record, index: nextIndex, revision };
}

export function applyLoaded(loaded) {
  index = loaded.index;
  lastRevision = loaded.revision;
}

// True when someone else has saved since this viewer last loaded or saved.
export async function changedElsewhere() {
  const page = fieldOf(
    await blocks().data.collection(SETTINGS_SCHEMA, { fields: ['key', 'data'] }).list({ pageNo: 1, pageSize: 1, filter: { key: REVISION_KEY } }),
    `get${SETTINGS_SCHEMA}s`,
  );
  const row = page?.items?.[0];
  return Boolean(row) && JSON.parse(row.data) !== lastRevision;
}

// ----- Save -----

// A new record's position sits between its neighbours', so lists keep their order whether records were
// added at the front (the event log) or the end.
function positionFor(list, i, rows, assigned) {
  const positionOf = (record) => assigned.get(record.id) ?? rows.get(record.id)?.position;
  let before = null;
  for (let j = i - 1; j >= 0 && before === null; j -= 1) before = positionOf(list[j]) ?? null;
  let after = null;
  for (let j = i + 1; j < list.length && after === null; j += 1) after = rows.get(list[j].id)?.position ?? null;
  if (before === null && after === null) return i;
  if (before === null) return after - 1;
  if (after === null) return before + 1;
  return (before + after) / 2;
}

function tableTasks(table, list) {
  const rows = index.get(table.schema) ?? new Map();
  index.set(table.schema, rows);
  const tasks = [];
  const ids = new Set(list.map((r) => r.id));
  for (const [id, row] of rows) {
    if (ids.has(id)) continue;
    rows.delete(id);
    tasks.push(() => deleteRow(table.schema, row.itemId));
  }
  const assigned = new Map();
  list.forEach((record, i) => {
    const json = JSON.stringify(record);
    const row = rows.get(record.id);
    if (!row) {
      const position = positionFor(list, i, rows, assigned);
      assigned.set(record.id, position);
      tasks.push(async () => {
        const itemId = await insertRow(table.schema, record.id, JSON.stringify({ position, record }));
        rows.set(record.id, { itemId, position, json });
      });
    } else if (row.json !== json) {
      tasks.push(async () => {
        await updateRow(table.schema, row.itemId, record.id, JSON.stringify({ position: row.position, record }));
        row.json = json;
      });
    }
  });
  return tasks;
}

function settingTask(name, value) {
  const rows = index.get(SETTINGS_SCHEMA) ?? new Map();
  index.set(SETTINGS_SCHEMA, rows);
  const json = JSON.stringify(value);
  const row = rows.get(name);
  if (row?.json === json) return null;
  if (row) {
    return async () => {
      await updateRow(SETTINGS_SCHEMA, row.itemId, name, json);
      row.json = json;
    };
  }
  return async () => {
    const itemId = await insertRow(SETTINGS_SCHEMA, name, json);
    rows.set(name, { itemId, json });
  };
}

// Sends the difference between what Blocks holds and `record`, then a new revision token.
export async function saveRecord(record) {
  const tableKeys = new Set(PORT_TABLES.map((t) => t.key));
  const tasks = PORT_TABLES.flatMap((table) => tableTasks(table, record[table.key] ?? []));
  for (const [name, value] of Object.entries(record)) {
    if (tableKeys.has(name) || value === undefined) continue;
    const task = settingTask(name, value);
    if (task) tasks.push(task);
  }
  if (!tasks.length) return;
  await runAll(tasks);
  const token = newToken();
  await runAll([settingTask(REVISION_KEY, token)]);
  lastRevision = token;
}

// Reset demo: empties every table, then writes the starting record.
export async function replaceRecord(record) {
  applyLoaded(await loadRecord());
  const deletes = [];
  for (const [schema, rows] of index) {
    for (const row of rows.values()) deletes.push(() => deleteRow(schema, row.itemId));
  }
  await runAll(deletes);
  index = new Map();
  await saveRecord(record);
}
