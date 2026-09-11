import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import {
  buildTrackedApplicationTransition,
  type TrackedApplicationStatus,
} from './tracked-application-state';

const { NotFoundError, ValidationError } = errors;
const UID = 'api::tracked-application.tracked-application';
const POSTGRES_CLIENTS = new Set(['pg', 'postgres', 'postgresql']);

type MetadataAttribute = { columnName?: string };
type MetadataModel = { tableName: string; attributes: Record<string, MetadataAttribute> };
type MetadataStore = { get(uid: string): MetadataModel };
type Transaction = { raw(sql: string, bindings?: unknown[]): Promise<unknown> };

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function metadata(strapi: Core.Strapi): MetadataModel {
  return ((strapi.db as unknown as { metadata: MetadataStore }).metadata).get(UID);
}

function requirePostgres(strapi: Core.Strapi): void {
  const connection = strapi.db.connection as unknown as {
    client?: { config?: { client?: unknown } };
  };
  const client = connection.client?.config?.client;
  if (typeof client !== 'string' || !POSTGRES_CLIENTS.has(client.toLowerCase())) {
    throw new ValidationError('Tracked-application workflow transitions require the PostgreSQL deployment database.');
  }
}

function table(strapi: Core.Strapi): string {
  const schema = (strapi.db as unknown as { getSchemaName?: () => string | undefined }).getSchemaName?.();
  return schema ? `${quoteIdentifier(schema)}.${quoteIdentifier(metadata(strapi).tableName)}` : quoteIdentifier(metadata(strapi).tableName);
}

function column(strapi: Core.Strapi, field: string): string {
  return metadata(strapi).attributes[field]?.columnName ?? field;
}

function rows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return Array.isArray(result[0]) ? result[0] as Array<Record<string, unknown>> : result as Array<Record<string, unknown>>;
  if (result && typeof result === 'object' && Array.isArray((result as { rows?: unknown }).rows)) {
    return (result as { rows: Array<Record<string, unknown>> }).rows;
  }
  return [];
}

function assertId(value: unknown): number | string {
  if ((typeof value === 'number' && Number.isInteger(value) && value >= 0) || (typeof value === 'string' && value !== '')) return value;
  throw new ValidationError('A saved tracked-application ID is required.');
}

function locator(
  strapi: Core.Strapi,
  input: { id?: unknown; documentId?: unknown },
): { column: string; value: number | string } {
  if (typeof input.documentId === 'string' && input.documentId !== '') {
    return { column: column(strapi, 'documentId'), value: input.documentId };
  }
  return { column: column(strapi, 'id'), value: assertId(input.id) };
}

export type TrackedApplicationTransitionInput = {
  /** Native Strapi document ID for custom routes/admin actions. */
  documentId?: string;
  /** Internal row ID is accepted only for internal jobs/adapters. */
  id?: number | string;
  status: TrackedApplicationStatus;
  submittedOn?: Date | string | null;
  progress?: number | null;
  at?: Date;
};

/**
 * Apply the Django transition graph after locking the physical application
 * row. Authorization/ownership belongs to the caller's route policy.
 */
export async function transitionTrackedApplication(
  strapi: Core.Strapi,
  input: TrackedApplicationTransitionInput,
): Promise<Record<string, unknown>> {
  requirePostgres(strapi);
  const target = locator(strapi, input);
  return strapi.db.transaction(async ({ trx }) => {
    const current = rows(await trx.raw(
      `SELECT * FROM ${table(strapi)} WHERE ${quoteIdentifier(target.column)} = ? FOR UPDATE`,
      [target.value],
    ))[0];
    if (!current) throw new NotFoundError('The tracked application does not exist.');

    const patch = buildTrackedApplicationTransition(current, input.status, {
      submittedOn: input.submittedOn,
      progress: input.progress,
      at: input.at,
    });
    const mapped = Object.fromEntries(Object.entries(patch).map(([field, value]) => [column(strapi, field), value]));
    const columns = Object.keys(mapped);
    const updated = rows(await trx.raw(
      `UPDATE ${table(strapi)} SET ${columns.map((field) => `${quoteIdentifier(field)} = ?`).join(', ')} WHERE ${quoteIdentifier(column(strapi, 'id'))} = ? RETURNING *`,
      [...columns.map((field) => mapped[field]), assertId(current[column(strapi, 'id')])],
    ))[0];
    if (!updated) throw new NotFoundError('The tracked application no longer exists.');
    return updated;
  });
}
