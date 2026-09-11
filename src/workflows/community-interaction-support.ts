import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { NotFoundError, ValidationError } = errors;
const POSTGRES_CLIENTS = new Set(['pg', 'postgres', 'postgresql']);

export const COMMUNITY_INTERACTION_TARGETS = [
  'api::article.article',
  'api::post.post',
  'api::update.update',
] as const;

export type CommunityInteractionTargetUid = (typeof COMMUNITY_INTERACTION_TARGETS)[number];

export type MetadataAttribute = {
  type: string;
  columnName?: string;
  relation?: string;
  owner?: boolean;
  joinColumn?: { name?: string };
  morphColumn?: {
    typeColumn?: { name?: string };
    idColumn?: { name?: string };
  };
};

export type MetadataModel = {
  uid: string;
  tableName: string;
  attributes: Record<string, MetadataAttribute>;
};

type MetadataStore = {
  get(uid: string): MetadataModel;
};

export type Transaction = {
  raw(sql: string, bindings?: unknown[]): Promise<unknown>;
};

export type CounterTarget = {
  uid: CommunityInteractionTargetUid;
  table: string;
  id: string;
  like: string;
  comment: string;
};

export function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function quoteLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function qualified(schema: string | undefined, tableName: string): string {
  return schema ? `${quoteIdentifier(schema)}.${quoteIdentifier(tableName)}` : quoteIdentifier(tableName);
}

function databaseMetadata(strapi: Core.Strapi): MetadataStore {
  return (strapi.db as unknown as { metadata: MetadataStore }).metadata;
}

export function schemaName(strapi: Core.Strapi): string | undefined {
  return (strapi.db as unknown as { getSchemaName?: () => string | undefined }).getSchemaName?.();
}

export function isPostgres(strapi: Core.Strapi): boolean {
  const connection = strapi.db.connection as unknown as { client?: { config?: { client?: unknown } } };
  const client = connection.client?.config?.client;
  return typeof client === 'string' && POSTGRES_CLIENTS.has(client.toLowerCase());
}

export function model(strapi: Core.Strapi, uid: string): MetadataModel {
  try {
    return databaseMetadata(strapi).get(uid);
  } catch {
    throw new ValidationError(`Workflow target type is not installed: ${uid}.`);
  }
}

export function scalarColumn(strapi: Core.Strapi, uid: string, attributeName: string): string {
  const attribute = model(strapi, uid).attributes[attributeName];
  if (!attribute) throw new ValidationError(`${uid}.${attributeName} is not configured.`);
  if (attribute.type === 'relation') {
    const relationColumn = attribute.owner ? attribute.joinColumn?.name : undefined;
    if (!relationColumn) throw new ValidationError(`${uid}.${attributeName} requires a direct relation column.`);
    return relationColumn;
  }
  return attribute.columnName ?? attributeName;
}

export function morphColumns(strapi: Core.Strapi, uid: string, attributeName: string): { type: string; id: string } {
  const attribute = model(strapi, uid).attributes[attributeName];
  if (attribute?.relation !== 'morphToOne' || !attribute.owner) {
    throw new ValidationError(`${uid}.${attributeName} must be an owning morphToOne relation.`);
  }
  const type = attribute.morphColumn?.typeColumn?.name;
  const id = attribute.morphColumn?.idColumn?.name;
  if (!type || !id) throw new ValidationError(`${uid}.${attributeName} has no native morph columns.`);
  return { type, id };
}

export function table(strapi: Core.Strapi, uid: string): string {
  return qualified(schemaName(strapi), model(strapi, uid).tableName);
}

export function idColumn(strapi: Core.Strapi, uid: string): string {
  return model(strapi, uid).attributes.id?.columnName ?? 'id';
}

export function assertIdentifier(value: unknown, label: string): number | string {
  if ((typeof value === 'number' && Number.isInteger(value) && value >= 0) || (typeof value === 'string' && value !== '')) {
    return value;
  }
  throw new ValidationError(`${label} must be a saved numeric or string identifier.`);
}

export function assertTargetUid(value: string): asserts value is CommunityInteractionTargetUid {
  if (!(COMMUNITY_INTERACTION_TARGETS as readonly string[]).includes(value)) {
    throw new ValidationError(`Community interactions cannot target ${value}.`);
  }
}

export function resultRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) {
    if (Array.isArray(result[0])) return result[0] as Array<Record<string, unknown>>;
    return result as Array<Record<string, unknown>>;
  }
  if (result && typeof result === 'object' && Array.isArray((result as { rows?: unknown }).rows)) {
    return (result as { rows: Array<Record<string, unknown>> }).rows;
  }
  return [];
}

export function timestampColumns(strapi: Core.Strapi, uid: string, now: Date, creating: boolean): Record<string, Date> {
  const attributes = model(strapi, uid).attributes;
  const values: Record<string, Date> = {};
  for (const field of creating ? ['created_at', 'updated_at', 'createdAt', 'updatedAt'] : ['updated_at', 'updatedAt']) {
    const attribute = attributes[field];
    if (attribute && attribute.type !== 'relation') values[attribute.columnName ?? field] = now;
  }
  return values;
}

export async function lockTarget(
  strapi: Core.Strapi,
  trx: Transaction,
  uid: CommunityInteractionTargetUid,
  targetId: number | string,
): Promise<void> {
  const rows = resultRows(await trx.raw(
    `SELECT ${quoteIdentifier(idColumn(strapi, uid))} FROM ${table(strapi, uid)} WHERE ${quoteIdentifier(idColumn(strapi, uid))} = ? FOR UPDATE`,
    [targetId],
  ));
  if (rows.length === 0) throw new NotFoundError('The interaction target does not exist.');
}

export async function advisoryInteractionLock(
  trx: Transaction,
  targetUid: string,
  targetId: number | string,
  authorId: number | string,
): Promise<void> {
  await trx.raw('SELECT pg_advisory_xact_lock(hashtext(?))', [
    `rwm:like:${targetUid}:${String(targetId)}:${String(authorId)}`,
  ]);
}

export function counterTargets(strapi: Core.Strapi): CounterTarget[] {
  return COMMUNITY_INTERACTION_TARGETS.map((uid) => ({
    uid,
    table: table(strapi, uid),
    id: idColumn(strapi, uid),
    like: scalarColumn(strapi, uid, 'like_count'),
    comment: scalarColumn(strapi, uid, 'comment_count'),
  }));
}
