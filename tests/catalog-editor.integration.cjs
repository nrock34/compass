'use strict';
// Explicitly targets a disposable database. Never falls back to the application DB.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const createService = require('../src/plugins/catalog-editor/server/service');
const { PRIVATE } = require('../src/plugins/catalog-editor/server/model');
let app, service, staff, providerActor, org, other, asset, subject, account;
const suffix = randomUUID().slice(0, 8);
const fixturePassword = randomUUID();
const enabled = process.env.CATALOG_EDITOR_TEST_DATABASE === 'rwm_catalog_editor_test';

test('catalog editor PostgreSQL integration', { skip: !enabled }, async t => {
  process.env.DATABASE_NAME = 'rwm_catalog_editor_test';
  process.env.DATABASE_URL = '';
  process.env.DATABASE_HOST = '127.0.0.1';
  process.env.DATABASE_PORT = '54325';
  process.env.DATABASE_FORCE_MIGRATION = 'true';
  process.env.CATALOG_EDITOR_ENABLED = 'true';
  process.env.STRAPI_TELEMETRY_DISABLED = 'true';
  process.env.PORT = '14379';
  const { createStrapi } = require('@strapi/strapi');
  app = await createStrapi({ appDir: path.resolve(__dirname, '..'), distDir: path.resolve(__dirname, '../dist') }).load();
  t.after(async () => { try { if (subject) await service.docs('program-field').delete({ documentId: subject.documentId }); } finally { await app.destroy(); } });
  await t.test('default roles exist and missing defaults are repaired without replacing existing roles', async () => {
    const roles = app.db.query('plugin::users-permissions.role');
    const authenticated = await roles.findOne({ where: { type: 'authenticated' } });
    const publicRole = await roles.findOne({ where: { type: 'public' } });
    const providerRole = await roles.findOne({ where: { type: 'catalog-provider' } });
    assert(authenticated, 'fresh startup must create Authenticated');
    assert(publicRole, 'fresh startup must create Public');
    assert(providerRole, 'fresh startup must create Catalog provider');
    const ensureRoles = require('../src/plugins/catalog-editor/server/roles');
    await roles.delete({ where: { id: publicRole.id } });
    await ensureRoles(app);
    await ensureRoles(app);
    assert.equal((await roles.findOne({ where: { type: 'authenticated' } })).id, authenticated.id);
    assert.equal((await roles.findOne({ where: { type: 'catalog-provider' } })).id, providerRole.id);
    for (const type of ['authenticated', 'public', 'catalog-provider']) {
      assert.equal(await roles.count({ where: { type } }), 1, `${type} must exist exactly once`);
    }
  });
  service = createService(app);
  staff = { id: 1, staff: true, publish: true };
  org = await service.docs('provider').create({ data: { name: `Editor integration ${suffix}` } });
  other = await service.docs('provider').create({ data: { name: `Other integration ${suffix}` } });
  subject = await service.docs('program-field').create({ data: { name: `History ${suffix}` } });

  const role = await app.db.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });
  account = await app.plugin('users-permissions').service('user').add({ email: `editor-${suffix}@example.test`, username: `editor-${suffix}`, password: fixturePassword, provider: 'local', confirmed: true, blocked: false, role: role.id });
  providerActor = { id: account.id, staff: false, publish: false };
  await service.write('membership', { user_id: account.id, organization: org.documentId, active: true, membership_key: `${account.id}:${org.documentId}` });
  const image = await app.db.query('plugin::upload.file').create({ data: { name: 'integration.png', hash: `integration_${suffix}`, ext: '.png', mime: 'image/png', size: 1, url: '/uploads/integration.png', provider: 'local' } });
  asset = await service.docs('catalog-asset').create({ data: { name: 'Campus', file: image.id, alt_text: 'Campus courtyard' } });
  await service.write('asset-ownership', { asset: asset.documentId, organization: org.documentId, actor: 'admin:1' });
  function program() { return { title: `Rome semester ${randomUUID().slice(0, 8)}`, provider: org.documentId, duration: 'sem', application_link: 'https://example.test/apply', fields: [subject.documentId], language: 'English', rating: 4.5, shortDescription: 'A semester in Rome', description: 'Study history and language in Rome.', highlights: ['Small classes'], image: asset.documentId, gallery: [asset.documentId], featured: false,
    locations: [{ city: 'Rome', state: 'Lazio' }], campuses: [{ name: 'Rome campus', accreditation: 'Accredited', has_accommodation: true }], terms: [{ title: 'Spring', duration: 'sem', start_date_time: '2027-01-10T12:00:00.000Z', end_date_time: '2027-05-10T12:00:00.000Z' }], cost: { program_fee: 100, accommodation_fee: 20, extra_fee: 5 }, requirements: { gpa: '3.0', language: 'English', prerequisites: ['History'], active_credits_needed: 12, level: 'Undergraduate' }, accomodations: { location: 'Rome', amenities: ['Wi-Fi'], description: 'Student housing', type: 'Apartment' }, academics: { courses: ['History'], trips: ['Museum'], class_size: '20' }, application_steps: [{ step: 1, title: 'Apply', description: 'Submit your application', deadline: '2026-12-01' }], testimonials: [{ name: 'Student', time_period: '2025', rating: 5, text: 'A useful experience.' }], provider_links: [{ provider: other.documentId, relationship_type: 'partner' }] }; }
  async function filled(actor = staff, kind = 'program', payload = program()) { let d = await service.create(actor, { kind, organization: org.documentId }); d = await service.save(actor, d.documentId, { revision: d.revision, payload }); return d; }
  let published;
  await t.test('partial save and resume do not create catalog rows', async () => {
    const before = await service.docs('program').count({});
    const d = await filled(providerActor, 'program', { title: 'Incomplete', provider: org.documentId });
    assert.equal((await service.get(providerActor, d.documentId)).payload.title, 'Incomplete');
    assert.equal(await service.docs('program').count({}), before);
  });
  await t.test('cross-organization access and forged internal fields are rejected', async () => {
    await assert.rejects(service.create(providerActor, { kind: 'program', organization: other.documentId }), e => e.status === 403);
    const d = await service.create(providerActor, { kind: 'program', organization: org.documentId });
    await assert.rejects(service.save(providerActor, d.documentId, { revision: d.revision, payload: { provider: org.documentId, rating: 5 } }), e => e.status === 422);
    await assert.rejects(service.transition(providerActor, d.documentId, 'apply', { revision: d.revision }), e => e.status === 403);
    await assert.rejects(app.documents(PRIVATE.draft).findMany({}), e => e.status === 403);
  });
  await t.test('concurrent saves use row locks and reject stale revision', async () => {
    const d = await filled();
    const results = await Promise.allSettled([1, 2].map(n => service.save(staff, d.documentId, { revision: d.revision, payload: { ...d.payload, description: `Writer ${n}` } })));
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(results.find(r => r.status === 'rejected').reason.status, 409);
  });
  await t.test('publishes all program relationships and approval is idempotent', async () => {
    const d = await filled();
    published = await service.transition(staff, d.documentId, 'apply', { revision: d.revision });
    assert.equal(published.status, 'applied');
    const entry = await service.docs('program').findOne({ documentId: published.target, populate: '*' });
    assert.equal(entry.cost.total_fee, 125);
    for (const name of ['locations', 'campuses', 'terms', 'application_steps', 'testimonials']) assert.equal(entry[name].length, 1, name);
    for (const name of ['requirements', 'academics', 'accomodations']) assert(entry[name], name);
    const repeated = await service.transition(staff, d.documentId, 'apply', { revision: d.revision });
    assert.equal(repeated.target, published.target);
    assert.equal((await service.docs('program-provider').findMany({ filters: { program: { documentId: published.target } } })).length, 2);
  });
  await t.test('a child failure rolls back the entire new aggregate', async () => {
    const d = await filled();
    const subscription = { models: ['api::program-campus.program-campus'], beforeCreate() { throw new Error('Injected child failure'); } };
    const unsubscribe = app.db.lifecycles.subscribe(subscription);
    const count = await service.docs('program').count({});
    try { await assert.rejects(service.transition(staff, d.documentId, 'apply', { revision: d.revision }), /Injected child failure/); }
    finally { unsubscribe(); }
    assert.equal(await service.docs('program').count({}), count);
    assert.equal((await service.get(staff, d.documentId)).status, 'draft');
  });
  await t.test('provider submits, staff returns feedback, provider resubmits', async () => {
    const payload = program(); delete payload.rating; delete payload.featured;
    let d = await filled(providerActor, 'program', payload);
    d = await service.transition(providerActor, d.documentId, 'submit', { revision: d.revision });
    await assert.rejects(service.save(providerActor, d.documentId, { revision: d.revision, payload }), e => e.status === 409);
    d = await service.transition(staff, d.documentId, 'request-changes', { revision: d.revision, feedback: 'Please check the dates.' });
    assert.equal((await service.get(providerActor, d.documentId)).feedback, 'Please check the dates.');
    d = await service.transition(providerActor, d.documentId, 'submit', { revision: d.revision });
    d = await service.save(staff, d.documentId, { revision: d.revision, payload: { ...d.payload, rating: 4, featured: false } });
    d = await service.transition(staff, d.documentId, 'apply', { revision: d.revision }); assert.equal(d.status, 'applied');
  });
  await t.test('detects live child edits and preserves shared records on removal', async () => {
    let d = await service.create(staff, { kind: 'program', organization: org.documentId, target: published.target });
    const requirementId = d.payload.requirements.documentId;
    await service.docs('program-requirement').update({ documentId: requirementId, data: { gpa: '3.5' } });
    await assert.rejects(service.transition(staff, d.documentId, 'apply', { revision: d.revision }), e => e.status === 409);
    const current = await service.live(staff, d.documentId);
    d = await service.transition(staff, d.documentId, 'reconcile', { revision: d.revision, liveHash: current.hash, useLive: true });
    const payload = { ...d.payload }; delete payload.requirements; payload.locations = [];
    d = await service.save(staff, d.documentId, { revision: d.revision, payload });
    await service.transition(staff, d.documentId, 'apply', { revision: d.revision });
    assert.equal(await service.docs('program-requirement').findOne({ documentId: requirementId }), null);
    assert(await service.docs('catalog-asset').findOne({ documentId: asset.documentId }));
    assert(await service.docs('provider').findOne({ documentId: org.documentId }));
  });
  await t.test('scholarship lifecycle creates and removes owned requirements correctly', async () => {
    let d = await filled(staff, 'scholarship', { name: 'Study award', summary: 'Tuition support', description: 'An award for study abroad.', categories: ['Merit'], benefits: ['Tuition'], provider: org.documentId, lower_bound: 1000, upper_bound: 2000, deadline: '2027-01-01', status: 'upcoming', rating: 5, featured: false, requirements: { eligibility: 'Enrolled student', grad_year: 'n/a' }, events: [{ name: 'Results', date: '2027-02-01' }], application_steps: [{ step: 1, title: 'Apply', description: 'Complete the form', complete_by: '2027-01-01' }] });
    const applied = await service.transition(staff, d.documentId, 'apply', { revision: d.revision });
    d = await service.create(staff, { kind: 'scholarship', organization: org.documentId, target: applied.target });
    const previous = d.payload.requirements.documentId;
    const payload = { ...d.payload }; delete payload.requirements;
    d = await service.save(staff, d.documentId, { revision: d.revision, payload });
    await service.transition(staff, d.documentId, 'apply', { revision: d.revision });
    assert.equal(await service.docs('scholarship-requirement').findOne({ documentId: previous }), null);
  });
  await t.test('HTTP portal routes authenticate and keep admin controls private', async () => {
    await new Promise(resolve => app.server.listen(14379, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:14379';
    const login = await fetch(`${base}/api/catalog-editor/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: account.email, password: fixturePassword }) });
    assert.equal(login.status, 200, await login.clone().text());
    const { jwt } = await login.json(); assert(jwt);
    const genericLogin = await fetch(`${base}/api/auth/local`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: account.email, password: fixturePassword }) });
    assert.equal(genericLogin.status, 403, await genericLogin.clone().text());
    for (const route of ['/api/users/me', '/api/programs', '/api/providers', '/api/upload/files', '/api/graphql']) {
      const denied = await fetch(`${base}${route}`, { headers: { Authorization: `Bearer ${jwt}` } });
      assert.equal(denied.status, 403, `${route}: ${await denied.text()}`);
    }
    const normal = await app.plugin('users-permissions').service('user').add({ email: `normal-${suffix}@example.test`, username: `normal-${suffix}`, password: fixturePassword, provider: 'local', confirmed: true, blocked: false, role: role.id });
    const normalLogin = await fetch(`${base}/api/auth/local`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: normal.email, password: fixturePassword }) });
    assert.equal(normalLogin.status, 200, await normalLogin.clone().text());
    const adminLogin = await fetch(`${base}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: account.email, password: fixturePassword }) });
    assert.notEqual(adminLogin.status, 200);

    const headers = { Authorization: `Bearer ${jwt}` };
    const me = await fetch(`${base}/api/catalog-editor/me`, { headers });
    assert.equal(me.status, 200, await me.clone().text());
    assert.deepEqual((await me.json()).data.organizations.map(o => o.documentId), [org.documentId]);
    const spec = await fetch(`${base}/api/catalog-editor/contract/program`, { headers });
    assert(!(await spec.json()).data.fields.some(f => f.name === 'rating'));
    assert.equal((await fetch(`${base}/catalog-editor/me`, { headers })).status, 403);
    assert.equal((await fetch(`${base}/api/catalog-editor/entries?organization=${other.documentId}`, { headers })).status, 403);
    const portal = await fetch(`${base}/provider/deep/link`);
    assert.equal(portal.status, 200); assert((await portal.text()).includes('RWM Provider Portal'));
    const adminRole = await app.admin.services.role.getSuperAdmin();
    const admin = await app.admin.services.user.create({ email: `admin-${suffix}@example.test`, firstname: 'Catalog', lastname: 'Tester', password: fixturePassword, isActive: true, roles: [adminRole.id] });
    const session = await app.sessionManager('admin').generateRefreshToken(String(admin.id), randomUUID(), { type: 'refresh' });
    const adminToken = await app.sessionManager('admin').generateAccessToken(session.token);
    const adminResponse = await fetch(`${base}/catalog-editor/me`, { headers: { Authorization: `Bearer ${adminToken.token}` } });
    assert.equal(adminResponse.status, 200, await adminResponse.clone().text());
    assert.equal((await adminResponse.json()).data.publish, true);
    assert.equal((await fetch(`${base}/api/catalog-editor/me`, { headers: { Authorization: `Bearer ${adminToken.token}` } })).status, 401);
    // Forged asset/child references are rejected before any graph writes.
    const d = await service.create(providerActor, { kind: 'program', organization: org.documentId });
    await assert.rejects(service.save(providerActor, d.documentId, { revision: d.revision, payload: { provider: org.documentId, image: 'unowned-image' } }), e => e.status === 403);
    await assert.rejects(service.save(providerActor, d.documentId, { revision: d.revision, payload: { provider: org.documentId, locations: [{ documentId: 'foreign-location', city: 'Rome', state: 'Lazio' }] } }), e => e.status === 403);
  });
  await t.test('membership revocation immediately removes draft access', async () => {
    const d = await service.create(providerActor, { kind: 'program', organization: org.documentId });
    const membership = await service.query('membership').findOne({ where: { user_id: account.id, organization: org.documentId } });
    await service.write('membership', { active: false }, membership.id);
    await assert.rejects(service.get(providerActor, d.documentId), e => e.status === 403);
    const genericLogin = await fetch('http://127.0.0.1:14379/api/auth/local', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: account.email, password: fixturePassword }) });
    assert.equal(genericLogin.status, 403);

  });
});
