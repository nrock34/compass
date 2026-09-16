/** Provider identities are confined to the catalog portal, even after revocation. */
import type { Core } from '@strapi/strapi';

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  const isProvider = async (id: number) => Boolean(await strapi.db.query('plugin::catalog-editor.membership').findOne({ where: { user_id: id } }) || await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id, role: { type: 'catalog-provider' } } }));
  const deny = (ctx: any) => {
    ctx.status = 403;
    ctx.remove('Set-Cookie');
    ctx.set('Cache-Control', 'no-store');
    ctx.body = { error: { status: 403, message: 'This account can only sign in to the provider portal.' } };
  };
  return async (ctx: any, next: () => Promise<unknown>) => {
    if (/^\/api\/catalog-editor(?:\/|$)/.test(ctx.path)) return next();
    // Verify the existing Users & Permissions session; never trust decoded claims.
    let token;
    try { token = await strapi.plugin('users-permissions').service('jwt').getToken(ctx); } catch { /* Other authentication strategies handle invalid tokens. */ }
    if (token?.sessionId && !await strapi.sessionManager('users-permissions').isSessionActive(token.sessionId)) token = null;
    if (token?.id && await isProvider(token.id)) return deny(ctx);
    if (/^\/api\/auth(?:\/|$)/.test(ctx.path)) {
      const body = ctx.request.body || {};
      const identifier = String(body.identifier || body.email || '').trim().toLowerCase();
      const where = identifier ? { $or: [{ email: identifier }, { username: identifier }] } : typeof body.code === 'string' && body.code ? { resetPasswordToken: body.code } : null;
      if (where) {
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where });
        if (user && await isProvider(user.id)) return deny(ctx);
      }
    }
    await next();
    // Also cover refresh and third-party login responses, which have no identifier.
    if (/^\/api\/auth(?:\/|$)/.test(ctx.path) && ctx.body?.jwt) {
      let issued;
      try { issued = await strapi.plugin('users-permissions').service('jwt').verify(ctx.body.jwt); } catch { return; }
      if (issued?.id && await isProvider(issued.id)) deny(ctx);
    }
  };
};
