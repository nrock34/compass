'use strict';

// UP creates its defaults only when the entire roles table is empty. Ensure
// those defaults individually before adding a custom role, including repairs
// of databases initialized by an earlier catalog-editor version.
module.exports = async function ensureCatalogRoles(strapi) {
  const portalRole = await strapi.db.transaction(async ({ trx }) => {
    if (['postgres', 'pg', 'postgresql'].includes(strapi.db.config.connection.client)) {
      await trx.raw("SELECT pg_advisory_xact_lock(hashtext('rwm-catalog-editor-role-initialization'))");
    }
    const roles = strapi.db.query('plugin::users-permissions.role');
    const definitions = [
      { name: 'Authenticated', type: 'authenticated', description: 'Default role given to authenticated user.' },
      { name: 'Public', type: 'public', description: 'Default role given to unauthenticated user.' },
      { name: 'Catalog provider', type: 'catalog-provider', description: 'Provider portal only. No general content API permissions.' },
    ];
    // Standard UP 5.52 defaults. Seed only newly created defaults: an existing
    // role may intentionally have had any of these permissions revoked.
    const defaultActions = {
      public: ['auth.callback', 'auth.connect', 'auth.forgotPassword', 'auth.resetPassword', 'auth.register', 'auth.emailConfirmation', 'auth.sendEmailConfirmation', 'auth.refresh'],
      authenticated: ['auth.logout', 'auth.getSessions', 'auth.revokeSession', 'user.me', 'auth.changePassword'],
    };
    let result;
    for (const data of definitions) {
      let role = await roles.findOne({ where: { type: data.type } });
      if (!role) {
        role = await roles.create({ data });
        for (const action of defaultActions[data.type] || []) {
          await strapi.db.query('plugin::users-permissions.permission').create({ data: {
            action: `plugin::users-permissions.${action}`, role: role.id,
          } });
        }
      }
      if (data.type === 'catalog-provider') result = role;
    }
    return result;
  });
  // Reuse UP's permission initialization, regardless of plugin bootstrap order.
  await strapi.plugin('users-permissions').service('users-permissions').initialize();
  return portalRole;
};
