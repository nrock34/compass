import type { Core } from '@strapi/strapi';
import { isPrivateCacheRoute } from '../cache/policy';

interface MiddlewareContext {
  path: string;
  state: Record<string, unknown>;
  request: {
    headers: Record<string, string | string[] | undefined>;
  };
  set(name: string, value: string): void;
  vary(field: string): void;
}

type Next = () => Promise<unknown>;


function disableRequestCache(ctx: MiddlewareContext): void {
  ctx.request.headers['cache-control'] = 'no-cache';
}

function disableResponseCache(ctx: MiddlewareContext): void {
  ctx.set('Cache-Control', 'private, no-store, max-age=0');
  ctx.set('Surrogate-Control', 'no-store');
  ctx.set('Pragma', 'no-cache');
  ctx.set('Expires', '0');
  ctx.vary('Authorization');
  ctx.vary('Cookie');
}

/**
 * Keep authentication, user-specific data, uploads, and GraphQL writes outside
 * every application or intermediary cache. Anonymous REST reads and allowlisted
 * GraphQL content queries are handled by strapi-cache's Redis provider.
 */
export default (_config: unknown, { strapi: _strapi }: { strapi: Core.Strapi }) => (
  async (ctx: MiddlewareContext, next: Next): Promise<void> => {
    const hasCredentials = Boolean(ctx.request.headers.authorization || ctx.request.headers.cookie);
    const privateResponse = hasCredentials || isPrivateCacheRoute(ctx.path) || Boolean(ctx.state.strapiCacheBypass);
    if (privateResponse) disableRequestCache(ctx);

    await next();

    if (privateResponse) {
      // strapi-cache wraps this stack. The marker makes its post-response
      // Authorization guard skip writes as control unwinds into the plugin.
      ctx.request.headers.authorization ||= 'Strapi-Cache-Bypass';
      disableResponseCache(ctx);
    }
  }
);
