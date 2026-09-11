import type { Core } from '@strapi/strapi';

export type Data = Record<string, unknown>;

export type LifecycleEvent = {
  model: { uid: string };
  params: {
    data?: unknown;
    where?: unknown;
  };
  result?: unknown;
};

export function isRecord(value: unknown): value is Data {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function hasOwn(data: Data, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(data, field);
}

export function lifecycleData(event: LifecycleEvent): Data | undefined {
  return isRecord(event.params.data) ? event.params.data : undefined;
}

export function relationId(value: unknown): number | string | undefined {
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (isRecord(value) && (typeof value.id === 'number' || typeof value.id === 'string')) return value.id;
  if (isRecord(value) && Array.isArray(value.set) && value.set.length > 0) return relationId(value.set[value.set.length - 1]);
  if (isRecord(value) && Array.isArray(value.connect) && value.connect.length > 0) return relationId(value.connect[value.connect.length - 1]);
  return undefined;
}
export type DirectRelationWrite =
  | { action: 'set'; value: number | string | null }
  | { action: 'omit' }
  | { action: 'ignore' };

export function normalizeDirectRelationWrite(value: unknown): DirectRelationWrite {
  const id = relationId(value);
  if (id !== undefined) return { action: 'set', value: id };
  if (!isRecord(value)) return { action: 'ignore' };

  if (
    (Array.isArray(value.disconnect) && value.disconnect.length > 0)
    || (Array.isArray(value.set) && value.set.length === 0)
  ) return { action: 'set', value: null };

  const operations = [value.connect, value.disconnect, value.set];
  if (
    operations.some(Array.isArray)
    && operations.every((operation) => !Array.isArray(operation) || operation.length === 0)
  ) return { action: 'omit' };

  return { action: 'ignore' };
}


export function relationReference(value: unknown): { id: number | string; uid: string } | undefined {
  const candidate = isRecord(value) && Array.isArray(value.set)
    ? value.set[0]
    : isRecord(value) && Array.isArray(value.connect)
      ? value.connect[0]
      : value;

  if (!isRecord(candidate)) return undefined;
  const id = candidate.id;
  const uid = candidate.__type;
  if ((typeof id !== 'number' && typeof id !== 'string') || typeof uid !== 'string') return undefined;
  return { id, uid };
}

export async function existingRecord(strapi: Core.Strapi, event: LifecycleEvent): Promise<Data | undefined> {
  if (!isRecord(event.params.where)) return undefined;
  const existing = await strapi.db.query(event.model.uid).findOne({ where: event.params.where });
  return isRecord(existing) ? existing : undefined;
}
