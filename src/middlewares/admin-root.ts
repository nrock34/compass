import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<unknown>) => {
    if (ctx.state.providerPortal) return;

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

    ctx.vary('Accept');
    const pageRequest = ctx.get('accept').includes('text/html') &&
      /^\/(?:auth|usecase|me|settings|plugins|content-manager|content-type-builder|marketplace)(?:\/|$)/.test(ctx.path);
    if (ctx.path !== '/' && !pageRequest) return next();

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
