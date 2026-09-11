import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import {
  buildEditorialTransition,
  type EditorialStatus,
  type EditorialWorkflowUid,
  EDITORIAL_WORKFLOW_UIDS,
} from './editorial-state';

const { NotFoundError, ValidationError } = errors;
const POSTGRES_CLIENTS = new Set(['pg', 'postgres', 'postgresql']);

type MetadataAttribute = { type: string; columnName?: string };
type MetadataModel = { tableName: string; attributes: Record<string, MetadataAttribute> };
type MetadataStore = { get(uid: string): MetadataModel };
type Transaction = { raw(sql: string, bindings?: unknown[]): Promise<unknown> };
type CacheStore = { reset(): Promise<unknown> };
type CacheService = { getCacheInstance(): CacheStore };

async function purgeResponseCache(strapi: Core.Strapi): Promise<void> {
  const cacheService = strapi.plugin('strapi-cache').service('service') as CacheService;
  await cacheService.getCacheInstance().reset();
}


function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function qualified(schema: string | undefined, table: string): string {
  return schema ? `${quoteIdentifier(schema)}.${quoteIdentifier(table)}` : quoteIdentifier(table);
}

function metadata(strapi: Core.Strapi): MetadataStore {
  return (strapi.db as unknown as { metadata: MetadataStore }).metadata;
}

function isPostgres(strapi: Core.Strapi): boolean {
  const connection = strapi.db.connection as unknown as {
    client?: { config?: { client?: unknown } };
  };
  const client = connection.client?.config?.client;
  return typeof client === 'string' && POSTGRES_CLIENTS.has(client.toLowerCase());
}

function requirePostgres(strapi: Core.Strapi): void {
  if (!isPostgres(strapi)) {
    throw new ValidationError('Editorial workflow transitions require the PostgreSQL deployment database.');
  }
}

function schemaName(strapi: Core.Strapi): string | undefined {
  return (strapi.db as unknown as { getSchemaName?: () => string | undefined }).getSchemaName?.();
}

function model(strapi: Core.Strapi, uid: string): MetadataModel {
  return metadata(strapi).get(uid);
}

function table(strapi: Core.Strapi, uid: string): string {
  return qualified(schemaName(strapi), model(strapi, uid).tableName);
}

function idColumn(strapi: Core.Strapi, uid: string): string {
  return model(strapi, uid).attributes.id?.columnName ?? 'id';
}

function attributeColumn(strapi: Core.Strapi, uid: string, attribute: string): string {
  return model(strapi, uid).attributes[attribute]?.columnName ?? attribute;
}

function rows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return Array.isArray(result[0]) ? result[0] as Array<Record<string, unknown>> : result as Array<Record<string, unknown>>;
  if (result && typeof result === 'object' && Array.isArray((result as { rows?: unknown }).rows)) {
    return (result as { rows: Array<Record<string, unknown>> }).rows;
  }
  return [];
}

function assertUid(uid: string): asserts uid is EditorialWorkflowUid {
  if (!(EDITORIAL_WORKFLOW_UIDS as readonly string[]).includes(uid)) {
    throw new ValidationError(`Editorial workflow does not manage ${uid}.`);
  }
}

function assertId(value: unknown): number | string {
  if ((typeof value === 'number' && Number.isInteger(value) && value >= 0) || (typeof value === 'string' && value !== '')) return value;
  throw new ValidationError('A saved editorial entry ID is required.');
}

function locator(
  strapi: Core.Strapi,
  uid: EditorialWorkflowUid,
  input: { id?: unknown; documentId?: unknown },
): { column: string; value: number | string } {
  if (typeof input.documentId === 'string' && input.documentId !== '') {
    return {
      column: attributeColumn(strapi, uid, 'documentId'),
      value: input.documentId,
    };
  }
  return { column: idColumn(strapi, uid), value: assertId(input.id) };
}

function updatePatch(
  strapi: Core.Strapi,
  uid: EditorialWorkflowUid,
  patch: Record<string, unknown>,
  at: Date,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(patch)) result[attributeColumn(strapi, uid, field)] = value;
  for (const field of ['updated_at', 'updatedAt']) {
    if (model(strapi, uid).attributes[field]) result[attributeColumn(strapi, uid, field)] = at;
  }
  return result;
}

async function updateLockedRecord(
  strapi: Core.Strapi,
  trx: Transaction,
  uid: EditorialWorkflowUid,
  id: number | string,
  patch: Record<string, unknown>,
  at: Date,
): Promise<Record<string, unknown>> {
  const values = updatePatch(strapi, uid, patch, at);
  const columns = Object.keys(values);
  const row = rows(await trx.raw(
    `UPDATE ${table(strapi, uid)} SET ${columns.map((column) => `${quoteIdentifier(column)} = ?`).join(', ')} WHERE ${quoteIdentifier(idColumn(strapi, uid))} = ? RETURNING *`,
    [...columns.map((column) => values[column]), id],
  ))[0];
  if (!row) throw new NotFoundError('The editorial entry no longer exists.');
  return row;
}

export type EditorialTransitionInput = {
  uid: EditorialWorkflowUid;
  /** Native Strapi document ID for custom routes/admin actions. */
  documentId?: string;
  /** Internal row ID is accepted only for internal jobs/adapters. */
  id?: number | string;
  status: EditorialStatus;
  scheduledFor?: Date | string | null;
  at?: Date;
};

/**
 * Row-locked editorial publication transition. Routes/admin actions must call
 * this instead of writing publication_status or its derived fields directly.
 */
export async function transitionEditorialPublication(
  strapi: Core.Strapi,
  input: EditorialTransitionInput,
): Promise<Record<string, unknown>> {
  requirePostgres(strapi);
  assertUid(input.uid);
  const target = locator(strapi, input.uid, input);
  const at = input.at ?? new Date();

  const updated = await strapi.db.transaction(async ({ trx }) => {
    const current = rows(await trx.raw(
      `SELECT * FROM ${table(strapi, input.uid)} WHERE ${quoteIdentifier(target.column)} = ? FOR UPDATE`,
      [target.value],
    ))[0];
    if (!current) throw new NotFoundError('The editorial entry does not exist.');
    const patch = buildEditorialTransition(input.uid, current, input.status, {
      at,
      scheduledFor: input.scheduledFor,
    });
    return updateLockedRecord(strapi, trx, input.uid, assertId(current[idColumn(strapi, input.uid)]), patch, at);
  });
  // Raw SQL intentionally bypasses Strapi lifecycles, so the cache plugin
  // cannot observe this write. Purge only after the transaction commits.
  await purgeResponseCache(strapi);
  return updated;
}

/**
 * Release due scheduled entries using `FOR UPDATE SKIP LOCKED`, so concurrent
 * Render/Strapi processes can safely run the same cron expression.
 */
export async function releaseScheduledEditorialPublications(
  strapi: Core.Strapi,
  at = new Date(),
): Promise<Record<EditorialWorkflowUid, number>> {
  const result = Object.fromEntries(EDITORIAL_WORKFLOW_UIDS.map((uid) => [uid, 0])) as Record<EditorialWorkflowUid, number>;
  if (!isPostgres(strapi)) return result;

  for (const uid of EDITORIAL_WORKFLOW_UIDS) {
    await strapi.db.transaction(async ({ trx }) => {
      const pending = rows(await trx.raw(
        `SELECT * FROM ${table(strapi, uid)} WHERE ${quoteIdentifier(attributeColumn(strapi, uid, 'publication_status'))} = 'scheduled' AND ${quoteIdentifier(attributeColumn(strapi, uid, 'scheduled_at'))} <= ? ORDER BY ${quoteIdentifier(idColumn(strapi, uid))} FOR UPDATE SKIP LOCKED`,
        [at],
      ));
      for (const current of pending) {
        const id = current[idColumn(strapi, uid)];
        const patch = buildEditorialTransition(uid, current, 'published', { at });
        await updateLockedRecord(strapi, trx, uid, assertId(id), patch, at);
        result[uid] += 1;
      }
    });
  }

  if (Object.values(result).some((count) => count > 0)) await purgeResponseCache(strapi);
  return result;
}
