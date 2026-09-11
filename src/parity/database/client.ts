import type { Core } from '@strapi/strapi';
const CLIENTS = new Set(['pg', 'postgres', 'postgresql']);
export function isPostgresClient(client: unknown): boolean { return typeof client === 'string' && CLIENTS.has(client.toLowerCase()); }
export function isPostgresDatabase(strapi: Core.Strapi): boolean {
  const db = strapi.db as unknown as { config?: { connection?: { client?: unknown } }; getInfo?: () => { client?: unknown }; connection?: { client?: { config?: { client?: unknown } } } };
  return isPostgresClient(db.config?.connection?.client) || isPostgresClient(db.getInfo?.().client) || isPostgresClient(db.connection?.client?.config?.client);
}
