import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<unknown>) => {
    if (strapi.config.get('admin.path') !== '/' || ctx.path !== '/' || !['GET', 'HEAD'].includes(ctx.method)) {
      return next();
    }

    const file = path.join(strapi.dirs.dist.root, 'build', 'index.html');
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
