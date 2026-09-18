'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes, randomUUID } = require('node:crypto');
const contentTypes = require('./server/content-types');
const createService = require('./server/service');
const { PRIVATE, INTERNAL, fail } = require('./server/model');

const actions = ['edit', 'publish', 'members'];
const actionName = name => `plugin::catalog-editor.${name}`;
module.exports = () => {
  let strapi;
  let service;
  const enabled = () => strapi.config.get('plugin::catalog-editor.enabledPortal', false);
  const portalOrigin = () => strapi.config.get('plugin::catalog-editor.publicOrigin', '');
  const separatePortalHost = () => Boolean(portalOrigin() && new URL(portalOrigin()).host !== new URL(strapi.config.get('server.url')).host);
  const buckets = new Map();
  function rateLimit(key, limit) {
    const now = Date.now();
    if (buckets.size > 10000) for (const [id, bucket] of buckets) if (bucket.until < now) buckets.delete(id);
    let bucket = buckets.get(key);
    if (!bucket || bucket.until < now) { bucket = { until: now + 60000, count: 0 }; buckets.set(key, bucket); }
    if (++bucket.count > limit) fail(429, 'Too many requests. Please wait a minute.');
  }
  const checkOrigin = ctx => {
    if (ctx.method === 'GET') return;
    const origin = ctx.get('origin');
    const publicOrigin = strapi.config.get('plugin::catalog-editor.publicOrigin');
    if (origin && origin !== (publicOrigin || ctx.origin)) fail(403, 'Request origin is not allowed.');
  };
  async function actor(ctx, staff, capability = 'edit', signingOut = false) {
    if (staff) {
      const ability = ctx.state.userAbility;
      if (!ctx.state.user || !ability?.can(actionName(capability))) fail(403, 'You do not have permission for this action.');
      return { id: ctx.state.user.id, staff: true, publish: ability.can(actionName('publish')), members: ability.can(actionName('members')), correlationId: randomUUID() };
    }
    let token;
    try { token = await strapi.plugin('users-permissions').service('jwt').getToken(ctx); } catch { fail(401, 'Please sign in again.'); }
    if (!token?.id || token.sessionId && !await strapi.sessionManager('users-permissions').isSessionActive(token.sessionId)) fail(401, 'Please sign in.');
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: token.id } });
    if (!user || (!signingOut && (user.blocked || !user.confirmed))) fail(403, 'Your account is not authorized.');
    ctx.state.user = user;
    const result = { id: user.id, staff: false, publish: false, correlationId: randomUUID() };
    if (!signingOut && !(await service.organizations(result)).length) fail(403, 'Your account has no active provider membership.');
    return result;
  }
  const endpoint = (staff, fn, capability = 'edit') => async ctx => {
    ctx.set('Cache-Control', 'no-store');
    try {
      if (!enabled()) fail(404, 'Not found.');
      checkOrigin(ctx);
      const who = await actor(ctx, staff, capability);
      if (ctx.method !== 'GET') rateLimit(`write:${who.staff}:${who.id}`, 180);
      ctx.body = { data: await fn(ctx, who) };
    } catch (error) {
      const status = error.status || (error.name === 'ValidationError' ? 422 : 500);
      if (status === 500) strapi.log.error('Catalog editor request failed', error);
      ctx.status = status;
      ctx.body = { error: { message: status === 500 ? 'The request could not be completed. Your saved draft is safe.' : error.message, details: error.details } };
    }
  };
  async function identity(ctx, who) {
    const permitted = await service.organizations(who);
    const providers = await service.docs('provider').findMany({ filters: permitted ? { documentId: { $in: permitted } } : {}, fields: ['name'], limit: 1000 });
    return { staff: who.staff, publish: who.publish, members: who.members || false, organizations: providers.map(p => ({ documentId: p.documentId, name: p.name })) };
  }
  async function lookup(ctx, who) {
    const { type, organization, draft: draftId, q = '' } = ctx.query;
    await service.authorize(who, organization);
    if (!['provider', 'program-field', 'catalog-asset'].includes(type)) fail(400, 'Unknown reference type.');
    const filters = { name: { $containsi: String(q).slice(0, 200) } };
    const requestedIds = typeof ctx.query.ids === 'string' ? ctx.query.ids.split(',').filter(Boolean).slice(0, 100) : null;
    if (requestedIds) filters.documentId = { $in: requestedIds };
    if (type === 'catalog-asset') {
      const draft = draftId ? await service.find(who, draftId) : null;
      if (draft && draft.organization !== organization) fail(403, 'Organization does not match.');
      const ids = await service.allowedAssets(who, organization, draft?.target, draft?.kind);
      if (ids) filters.documentId = { $in: requestedIds ? ids.filter(id => requestedIds.includes(id)) : ids };
    }
    const rows = await service.docs(type).findMany({ filters, ...(type === 'catalog-asset' ? { populate: { file: true } } : {}), limit: 100 });
    return rows.map(r => ({ documentId: r.documentId, name: r.name, ...(type === 'catalog-asset' ? { alt_text: r.alt_text, url: r.file?.url } : {}) }));
  }
  async function upload(ctx, who) {
    const { organization, alt_text, name, rights = '' } = ctx.request.body || {};
    await service.authorize(who, organization);
    if (typeof alt_text !== 'string' || !alt_text.trim() || alt_text.length > 255) fail(400, 'Describe the image in 255 characters or fewer.');
    const file = ctx.request.files?.file;
    if (!file || Array.isArray(file) || !['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'].includes(file.mimetype) || file.size > 10 * 1024 * 1024) fail(400, 'Upload one JPEG, PNG, WebP, AVIF, or GIF image up to 10 MB.');
    // Decode the file instead of trusting the supplied MIME type.
    try { await require('sharp')(file.filepath).metadata(); } catch { fail(400, 'The file is not a readable image.'); }
    const [uploaded] = await strapi.plugin('upload').service('upload').upload({ data: {}, files: file });
    try {
      return await strapi.db.transaction(async ({ trx }) => {
        await service.authorize(who, organization, trx);
        const asset = await service.docs('catalog-asset').create({ data: { name: String(name || file.originalFilename || 'Image').slice(0, 255), file: uploaded.id, alt_text: alt_text.trim(), rights: String(rights).slice(0, 255) } });
        await service.write('asset-ownership', { organization, asset: asset.documentId, actor: service.actorName(who) });
        await service.audit(who, 'uploaded', { documentId: asset.documentId, organization }, {});
        return { documentId: asset.documentId, name: asset.name, alt_text: asset.alt_text, url: uploaded.url };
      });
    } catch (error) { await strapi.plugin('upload').service('upload').remove(uploaded); throw error; }
  }
  async function members(ctx, who) {
    const organization = ctx.query.organization || ctx.request.body?.organization;
    await service.authorize(who, organization);
    if (ctx.method === 'GET') {
      const rows = await service.query('membership').findMany({ where: { organization } });
      return Promise.all(rows.map(async m => {
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: m.user_id } });
        return { documentId: m.documentId, email: user?.email, active: m.active };
      }));
    }
    const body = ctx.request.body || {};
    return strapi.db.transaction(async ({ trx }) => {
      if (body.documentId) {
        const m = await service.query('membership').findOne({ where: { documentId: body.documentId, organization } });
        if (!m) fail(404, 'Membership not found.');
        await service.lock(trx, PRIVATE.membership, m.id);
        if (typeof body.active !== 'boolean') fail(400, 'Specify whether access is active.');
        await service.write('membership', { active: body.active }, m.id);
        await service.audit(who, body.active ? 'membership-authorized' : 'membership-revoked', m);
        return { documentId: m.documentId, active: body.active };
      }
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Enter a valid email address.');
      let user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { email } });
      if (!user) {
        // Staff supplies a temporary password; the existing UP service hashes it.
        if (typeof body.password !== 'string' || body.password.length < 12) fail(400, 'New accounts need a temporary password of at least 12 characters.');
        const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'catalog-provider' } });
        user = await strapi.plugin('users-permissions').service('user').add({ email, username: email, password: body.password, provider: 'local', confirmed: true, blocked: false, role: role.id });
      }
      const portalRole = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'catalog-provider' } });
      await strapi.plugin('users-permissions').service('user').edit(user.id, { role: portalRole.id });
      if (!user.confirmed || user.blocked) fail(400, 'Confirm and unblock this account before authorizing provider access.');
      const key = `${user.id}:${organization}`;
      const existing = await service.query('membership').findOne({ where: { membership_key: key } });
      if (existing) await service.lock(trx, PRIVATE.membership, existing.id);
      const m = await service.write('membership', { user_id: user.id, organization, active: true, membership_key: key }, existing?.id);
      await service.audit(who, 'membership-authorized', m);
      return { documentId: m.documentId, email, active: true };
    });
  }
  const controllers = {};
  const routes = { admin: { type: 'admin', routes: [] }, 'content-api': { type: 'content-api', routes: [] } };
  for (const staff of [true, false]) {
    const key = staff ? 'staff' : 'portal';
    controllers[key] = {
      identity: endpoint(staff, identity),
      contract: endpoint(staff, (ctx) => {
        const spec = service.contract(ctx.params.kind);
        if (!staff) { spec.fields = spec.fields.filter(f => !INTERNAL.includes(f.name)); spec.sections = spec.sections.map(s => ({ ...s, fields: s.fields.filter(f => !INTERNAL.includes(f)) })); }
        return spec;
      }),
      list: endpoint(staff, (ctx, who) => service.list(who, ctx.query.organization)),
      create: endpoint(staff, (ctx, who) => service.create(who, ctx.request.body || {})),
      get: endpoint(staff, (ctx, who) => service.get(who, ctx.params.id)),
      save: endpoint(staff, (ctx, who) => service.save(who, ctx.params.id, ctx.request.body || {})),
      live: endpoint(staff, (ctx, who) => service.live(who, ctx.params.id)),
      validate: endpoint(staff, (ctx, who) => service.validateDraft(who, ctx.params.id)),
      transition: endpoint(staff, (ctx, who) => service.transition(who, ctx.params.id, ctx.params.action, ctx.request.body || {})),
      lookup: endpoint(staff, lookup), upload: endpoint(staff, upload),
    };
    const specs = [['GET', '/me', 'identity'], ['GET', '/contract/:kind', 'contract'], ['GET', '/entries', 'list'], ['POST', '/drafts', 'create'], ['GET', '/drafts/:id', 'get'], ['PUT', '/drafts/:id', 'save'], ['GET', '/drafts/:id/live', 'live'], ['GET', '/drafts/:id/validation', 'validate'], ['POST', '/drafts/:id/:action', 'transition'], ['GET', '/references', 'lookup'], ['POST', '/assets', 'upload']];
    if (staff) {
      controllers[key].members = endpoint(true, members, 'members');
      controllers[key].referenceCreate = endpoint(true, async (ctx, who) => {
        const { type, name } = ctx.request.body || {};
        if (!['provider', 'program-field'].includes(type) || typeof name !== 'string' || !name.trim()) fail(400, 'Enter a provider or subject name.');
        const entry = await service.docs(type).create({ data: { name: name.trim() } });
        await service.audit(who, 'reference-created', { documentId: entry.documentId }, { type });
        return { documentId: entry.documentId, name: entry.name };
      });
      specs.push(['GET', '/members', 'members'], ['POST', '/members', 'members'], ['POST', '/references', 'referenceCreate']);
    }
    for (const [method, routePath, handler] of specs) routes[staff ? 'admin' : 'content-api'].routes.push({ method, path: routePath, handler: `${key}.${handler}`, config: staff ? { policies: ['admin::isAuthenticatedAdmin'] } : { auth: false } });
  }
  controllers.auth = {};
  for (const method of ['login', 'refresh', 'logout', 'forgot', 'reset']) {
    controllers.auth[method] = async ctx => {
      ctx.set('Cache-Control', 'no-store');
      try {
        if (!enabled()) fail(404, 'Not found.');
        checkOrigin(ctx); rateLimit(`auth:${ctx.ip}`, 20);
        const body = ctx.request.body || {};
        const auth = strapi.plugin('users-permissions').controller('auth');
        if (method === 'logout') { await actor(ctx, false, 'edit', true); await auth.logout(ctx); return; }
        if (method === 'refresh') { await auth.refresh(ctx); return; }
        if (method === 'login') {
          const identifier = String(body.identifier || '').toLowerCase();
          const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { $or: [{ email: identifier }, { username: identifier }] } });
          if (!user || user.blocked || !user.confirmed || !(await service.query('membership').findOne({ where: { user_id: user.id, active: true } }))) fail(401, 'Unable to sign in with these credentials.');
          ctx.params.provider = 'local'; await auth.callback(ctx);
          if (ctx.body?.user) ctx.body = { jwt: ctx.body.jwt };
          return;
        }
        if (method === 'reset') { await auth.resetPassword(ctx); if (ctx.body?.user) ctx.body = { jwt: ctx.body.jwt }; return; }
        const email = String(body.email || '').trim().toLowerCase();
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { email } });
        if (user && !user.blocked && await service.query('membership').findOne({ where: { user_id: user.id, active: true } })) {
          const token = randomBytes(64).toString('hex');
          await strapi.plugin('users-permissions').service('user').edit(user.id, { resetPasswordToken: token });
          const origin = strapi.config.get('plugin::catalog-editor.publicOrigin') || strapi.config.get('server.absoluteUrl');
          if (!/^https?:\/\//.test(origin || '')) fail(503, 'Password recovery is not configured. Please contact your RWM administrator.');
          await strapi.plugin('email').service('email').send({ to: email, subject: 'Reset your RWM provider password', text: `Reset your password: ${origin.replace(/\/$/, '')}${separatePortalHost() ? '' : '/provider'}/reset?code=${token}\n\nIf you did not request this, ignore this email.` });
        }
        ctx.body = { ok: true };
      } catch (error) { ctx.status = error.status || 400; ctx.body = { error: { message: error.status ? error.message : 'Unable to complete this request. Please try again or contact RWM.' } }; }
    };
    routes['content-api'].routes.push({ method: 'POST', path: `/auth/${method}`, handler: `auth.${method}`, config: { auth: false } });
  }
  return {
    contentTypes, controllers, routes,
    register({ strapi: instance }) {
      strapi = instance;
      service = createService(strapi);
      for (const privateUid of Object.values(PRIVATE)) strapi.plugin('graphql')?.service('extension').shadowCRUD(privateUid).disable();
      strapi.documents.use(async (ctx, next) => {
        if (Object.values(PRIVATE).includes(ctx.uid)) fail(403, 'Use the catalog editor workflow.');
        return next();
      });
      // Mounted separately from the admin SPA: no admin bundle, sidebar, or login chrome.
      strapi.server.use(async (ctx, next) => {
        const dedicatedHost = separatePortalHost();
        const providerHost = dedicatedHost && ctx.host === new URL(portalOrigin()).host;
        const providerApi = /^\/api\/catalog-editor(?:\/|$)/.test(ctx.path);
        if (dedicatedHost && providerApi && !providerHost) { ctx.status = 404; return; }
        if (providerHost) {
          if (ctx.path === '/_health' || providerApi) return next();
          if (!['GET', 'HEAD'].includes(ctx.method)) { ctx.status = 404; return; }
          const legacyPage = /^\/provider(?:\/(reset|drafts\/[a-zA-Z0-9_-]+))?\/?$/.exec(ctx.path);
          if (legacyPage) {
            ctx.redirect('/' + (legacyPage[1] || '') + (ctx.querystring ? '?' + ctx.querystring : ''));
            return;
          }
        } else {
          if (!/^\/provider(?:\/|$)/.test(ctx.path) || !['GET', 'HEAD'].includes(ctx.method)) return next();
          if (dedicatedHost) { ctx.status = 404; return; }
        }
        if (!enabled()) { ctx.status = 404; return; }
        const pagePath = providerHost ? ctx.path : ctx.path.slice('/provider'.length) || '/';
        const page = /^(?:\/|\/reset\/?|\/drafts\/[a-zA-Z0-9_-]+\/?)$/.test(pagePath);
        const asset = /^\/provider\/assets\/([a-zA-Z0-9_-][a-zA-Z0-9._-]*\.[a-zA-Z0-9]+)$/.exec(ctx.path);
        if (!page && !asset) { ctx.status = 404; return; }
        if (page && ctx.path.endsWith('/') && ctx.path !== '/') {
          ctx.redirect(ctx.path.slice(0, -1) + (ctx.querystring ? '?' + ctx.querystring : ''));
          return;
        }
        const root = path.join(strapi.dirs.app.root, 'public', 'provider');
        const file = asset ? path.join(root, 'assets', asset[1]) : path.join(root, 'index.html');
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
          ctx.status = asset ? 404 : 503;
          if (!asset) ctx.body = 'Provider portal is being prepared. Please try again later.';
          return;
        }
        ctx.state.providerPortal = true;
        // Let the application's security middleware set its response headers.
        await next();
        ctx.status = 200; ctx.type = path.extname(file); ctx.set('Cache-Control', asset ? 'public, max-age=31536000, immutable' : 'no-store'); ctx.body = fs.createReadStream(file);
      });
    },
    async bootstrap() {
      const portalRole = await require('./server/roles')(strapi);
      const memberships = await service.query('membership').findMany({ select: ['user_id'] });
      for (const userId of new Set(memberships.map(m => m.user_id))) {
        await strapi.plugin('users-permissions').service('user').edit(userId, { role: portalRole.id });
      }

      const guard = () => { if (!require('./server/write-context').getStore()) fail(403, 'Use the catalog editor workflow.'); };
      strapi.db.lifecycles.subscribe({ models: Object.values(PRIVATE), beforeCreate: guard, beforeUpdate: guard, beforeDelete: guard, beforeCreateMany: guard, beforeUpdateMany: guard, beforeDeleteMany: guard });
      await strapi.admin.services.permission.actionProvider.registerMany(actions.map(name => ({ section: 'plugins', displayName: name === 'edit' ? 'Create and edit catalog drafts' : name === 'publish' ? 'Review and publish catalog entries' : 'Manage provider accounts', uid: name, pluginName: 'catalog-editor' })));
    },
  };
};
