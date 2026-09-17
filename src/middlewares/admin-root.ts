import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<unknown>) => {
    if (strapi.config.get('admin.path') !== '/' || !['GET', 'HEAD'].includes(ctx.method)) {
      return next();
    }

    const build = path.join(strapi.dirs.dist.root, 'build');
    const assetName = ctx.path.slice(1);
    if (/^[a-zA-Z0-9_-][a-zA-Z0-9._-]*\.[a-zA-Z0-9]+$/.test(assetName) && assetName !== 'index.html') {
      const asset = path.join(build, assetName);
      if (existsSync(asset) && statSync(asset).isFile()) {
        ctx.status = 200;
        ctx.type = path.extname(asset);
        ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
        ctx.body = createReadStream(asset);
        return;
      }
    }

    if (ctx.path !== '/') {
      await next();
      if (ctx.status !== 404 || path.extname(ctx.path) ||
          /^\/(?:api|admin|graphql|uploads|provider|_health)(?:\/|$)/.test(ctx.path)) return;
    }

    const file = path.join(build, 'index.html');
    if (!existsSync(file)) {
      ctx.status = 503;
      ctx.body = 'The admin panel must be built before starting the server.';
      return;
    }

    ctx.status = 200;
    ctx.type = 'html';
    ctx.set('Cache-Control', 'no-cache');
    ctx.body = createReadStream(file);
  };
};
