import type { Core } from '@strapi/strapi';
type Context = {
  request: { body?: { username?: unknown } };
  status: number;
  body: unknown;
  set(name: string, value: string): void;
};

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async check(ctx: Context) {
    const username = ctx.request.body?.username;
    if (typeof username !== 'string' || username.length < 3) {
      ctx.status = 400;
      ctx.body = { error: 'Enter a username with at least 3 characters.' };
      return;
    }
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { username },
      select: ['id'],
    });
    ctx.set('Cache-Control', 'no-store');
    ctx.body = { exists: Boolean(user) };
  },
});
