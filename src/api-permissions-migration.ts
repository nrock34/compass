import type { Core } from '@strapi/strapi';

const ROLE = 'plugin::api-permissions.role';
const LEGACY_ROLE = 'plugin::users-permissions.role';
const USER = 'plugin::users-permissions.user';

/** Copy existing grants once, before accepting requests under the new system. */
export async function migrateApiPermissions(strapi: Core.Strapi): Promise<void> {
  if (!strapi.plugin('api-permissions')) return;
  await strapi.db.transaction(async ({ trx }) => {
    await trx.raw('SELECT pg_advisory_xact_lock(?, ?)', [184713, 2]);
    const marker = strapi.store({ type: 'plugin', name: 'api-permissions' });
    if (await marker.get({ key: 'rwm-legacy-migration-v1' })) return;

    const legacyRoles = await strapi.db.query(LEGACY_ROLE).findMany({ populate: ['permissions'] });
    for (const legacy of legacyRoles) {
      let target = await strapi.db.query(ROLE).findOne({ where: { type: legacy.type }, populate: ['permissions'] });
      const actions: string[] = [...new Set<string>(legacy.permissions.map((p: { action: string }) => p.action))];
      if (target?.permissions?.length) {
        const current = new Set(target.permissions.map((p: { action: string }) => p.action));
        if (current.size !== actions.length || actions.some((action) => !current.has(action))) {
          throw new Error(`API Permissions migration stopped: role ${legacy.type} already has different grants. Reconcile it before switching authorization.`);
        }
      }
      if (!target) {
        target = await strapi.documents(ROLE).create({ data: {
          name: legacy.name, description: legacy.description, type: legacy.type,
        } });
      }
      await strapi.plugin('api-permissions').service('permission')
        .connectRolesToPermissions(target.documentId, actions);

      // Preserve explicitly assigned plugin memberships; migrate only untouched users.
      const users = await strapi.db.query(USER).findMany({
        where: { role: { id: legacy.id } }, populate: ['roles'], orderBy: { id: 'asc' },
      });
      for (const user of users) {
        if (user.roles?.length) continue;
        await strapi.db.query(USER).update({
          where: { id: user.id }, data: { roles: { set: [target.id] } },
        });
      }
    }
    await marker.set({ key: 'rwm-legacy-migration-v1', value: true });
  });
}
