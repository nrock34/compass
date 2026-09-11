import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

type SessionContext = {
  request: { header: Record<string, string | undefined> };
  state: Record<string, unknown>;
};

export function registerApiPermissionsSession(strapi: Core.Strapi): void {
  const plugin = strapi.plugin('api-permissions');
  if (!plugin) return;

  plugin.service('session').registerSessionResolver(async (ctx: SessionContext) => {
    if (!ctx.request.header.authorization) return null;

    // Use the existing verifier, including support for refresh-mode access tokens.
    const token = await strapi.plugin('users-permissions').service('jwt').getToken(ctx);
    if (!token?.id) throw new errors.UnauthorizedError();
    if (strapi.config.get('plugin::users-permissions.jwtManagement') === 'refresh') {
      if (!token.sessionId || !await strapi.sessionManager('users-permissions').isSessionActive(token.sessionId)) {
        throw new errors.UnauthorizedError();
      }
    }

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: token.id },
      populate: ['roles'],
    });
    const settings = await strapi.store({ type: 'plugin', name: 'users-permissions' })
      .get({ key: 'advanced' }) as { email_confirmation?: boolean } | null;

    if (!user || user.blocked || (settings?.email_confirmation && !user.confirmed)) {
      throw new errors.UnauthorizedError();
    }

    const roles = user.roles?.length ? user.roles : await strapi.db
      .query('plugin::api-permissions.role')
      .findMany({ where: { type: 'authenticated' } });
    if (!roles.length) throw new errors.UnauthorizedError();

    ctx.state.user = user;
    if (token.sessionId) ctx.state.session = { id: token.sessionId };
    return { user, roles };
  });
}
