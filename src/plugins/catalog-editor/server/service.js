'use strict';
const { randomUUID } = require('node:crypto');
const writeContext = require('./write-context');
const { uid, PRIVATE, CHILDREN, INTERNAL, contract, defaults, fail, fingerprint, assertValid, validate } = require('./model');

module.exports = function createService(strapi) {
  const query = name => strapi.db.query(PRIVATE[name]);
  const docs = name => strapi.documents(uid(name));
  const actorName = actor => `${actor.staff ? 'admin' : 'user'}:${actor.id}`;
  const write = async (name, data, id) => writeContext.run(true, () => id ? query(name).update({ where: { id }, data }) : query(name).create({ data: { documentId: randomUUID().replaceAll('-', ''), ...data } }));
  async function audit(actor, action, draft, detail = {}) {
    await write('audit', { actor: actorName(actor), action, target: draft.documentId, organization: draft.organization, revision: draft.revision, detail, correlation_id: actor.correlationId || randomUUID() });
  }
  async function lock(trx, modelUid, id) {
    const meta = strapi.db.metadata.get(modelUid);
    await trx(meta.tableName).where(meta.attributes.id.columnName || 'id', id).forUpdate().first();
  }
  async function organizations(actor, trx) {
    if (actor.staff) return null;
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: actor.id } });
    if (!user || user.blocked || !user.confirmed) fail(403, 'Your account is not authorized.');
    const memberships = await query('membership').findMany({ where: { user_id: actor.id, active: true } });
    if (trx) for (const m of memberships) await lock(trx, PRIVATE.membership, m.id);
    // Re-read after acquiring locks: revocation may have committed while waiting.
    const current = trx ? await query('membership').findMany({ where: { user_id: actor.id, active: true } }) : memberships;
    return current.map(m => m.organization);
  }
  async function authorize(actor, organization, trx) {
    const allowed = await organizations(actor, trx);
    if (allowed && !allowed.includes(organization)) fail(403, 'You do not have access to this organization.');
    if (!await docs('provider').findOne({ documentId: organization })) fail(404, 'Provider not found.');
  }
  function visible(draft, actor) {
    const data = structuredClone(draft);
    delete data.id;
    delete data.baseline_hash;
    if (!actor.staff) {
      delete data.author; delete data.last_actor;
      for (const key of INTERNAL) { delete data.payload?.[key]; delete data.baseline?.payload?.[key]; }
    }
    return data;
  }
  async function find(actor, documentId, trx) {
    if (typeof documentId !== 'string') fail(400, 'Invalid draft.');
    let draft = await query('draft').findOne({ where: { documentId } });
    if (!draft) fail(404, 'Draft not found.');
    await authorize(actor, draft.organization, trx);
    if (trx) { await lock(trx, PRIVATE.draft, draft.id); draft = await query('draft').findOne({ where: { id: draft.id } }); }
    return draft;
  }
  function revision(draft, expected) { if (!Number.isInteger(expected) || draft.revision !== expected) fail(409, 'This draft has changed. Reload it before continuing.'); }
  function editable(draft, actor) {
    if (draft.status === 'applied' || (draft.status === 'submitted' && !actor.staff)) fail(409, 'Withdraw this submission before editing it.');
  }
  async function snapshot(kind, documentId, trx) {
    const fields = contract(kind).fields;
    const populate = {};
    for (const f of fields.filter(f => f.type === 'relation')) populate[f.name] = f.children ? { populate: Object.fromEntries(f.children.filter(c => c.type === 'relation').map(c => [c.name, true])) } : true;
    let row = await docs(kind).findOne({ documentId, populate });
    if (!row) fail(404, 'Catalog entry no longer exists.');
    if (trx) {
      await lock(trx, uid(kind), row.id);
      row = await docs(kind).findOne({ documentId, populate });
      for (const [field, name] of Object.entries(CHILDREN[kind])) {
        const children = Array.isArray(row[field]) ? row[field] : row[field] ? [row[field]] : [];
        for (const child of [...children].sort((a, b) => a.id - b.id)) await lock(trx, uid(name), child.id);
      }
      row = await docs(kind).findOne({ documentId, populate });
    }
    function pick(defs, source) {
      const result = {};
      for (const f of defs) {
        const v = source[f.name];
        if (v == null) continue;
        if (f.children) {
          const convert = child => ({ documentId: child.documentId, ...pick(f.children, child) });
          result[f.name] = f.many ? [...v].filter(c => f.name !== 'provider_links' || c.relationship_type !== 'owner').sort((a, b) => (a.step ?? a.id) - (b.step ?? b.id)).map(convert) : convert(v);
        } else if (f.type === 'relation') result[f.name] = Array.isArray(v) ? v.map(x => x.documentId) : v.documentId;
        else result[f.name] = f.type === 'decimal' ? Number(v) : v;
      }
      return result;
    }
    const payload = pick(fields, row);
    const stamps = { parent: row.updatedAt, children: Object.fromEntries(Object.keys(CHILDREN[kind]).map(k => [k, (Array.isArray(row[k]) ? row[k] : row[k] ? [row[k]] : []).map(c => [c.documentId, c.updatedAt]).sort()])) };
    return { payload, stamps };
  }
  async function allowedAssets(actor, organization, target, kind) {
    if (actor.staff) return null;
    const owned = await query('asset-ownership').findMany({ where: { organization } });
    const ids = owned.map(a => a.asset);
    if (target) {
      const current = await snapshot(kind, target);
      if (current.payload.provider !== organization) fail(403, 'Entry ownership has changed.');
      if (current.payload.image) ids.push(current.payload.image);
      ids.push(...current.payload.gallery || []);
    }
    return [...new Set(ids)];
  }
  async function references(actor, draft, payload) {
    if (payload.provider !== draft.organization) fail(403, 'The provider must match this draft’s organization.');
    const assets = await allowedAssets(actor, draft.organization, draft.target, draft.kind);
    for (const id of [payload.image, ...(payload.gallery || [])].filter(Boolean)) {
      if (assets && !assets.includes(id)) fail(403, 'This image is not available to your organization.');
      const asset = await docs('catalog-asset').findOne({ documentId: id, populate: { file: true } });
      if (!asset?.file || !asset.alt_text?.trim()) fail(422, 'Choose a photo with a description.', [{ path: payload.image === id ? 'image' : 'gallery', message: 'Choose a photo with a description, or upload a new one.' }]);
    }
    for (const id of payload.fields || []) if (!await docs('program-field').findOne({ documentId: id })) fail(422, 'A selected subject no longer exists.', [{ path: 'fields', message: 'Choose an available subject from the list.' }]);
    const partners = payload.provider_links || [];
    if (new Set(partners.map(p => p.provider)).size !== partners.length) fail(422, 'Choose each partner provider once.');
    for (const partner of partners) {
      if (partner.provider === draft.organization || !await docs('provider').findOne({ documentId: partner.provider })) fail(422, 'Choose a different, existing partner provider.');
    }
    // Existing child IDs are accepted only from this draft’s original aggregate.
    for (const [field] of Object.entries(CHILDREN[draft.kind])) {
      const before = draft.baseline?.payload?.[field];
      const ids = new Set((Array.isArray(before) ? before : before ? [before] : []).map(c => c.documentId));
      const after = payload[field];
      for (const child of Array.isArray(after) ? after : after ? [after] : []) if (child.documentId && !ids.has(child.documentId)) fail(403, 'A related record does not belong to this entry.');
    }
  }
  async function get(actor, documentId) {
    const draft = await find(actor, documentId);
    const history = await query('audit').findMany({ where: { target: documentId }, orderBy: { createdAt: 'asc' }, limit: 200 });
    return { ...visible(draft, actor), history: history.map(h => ({ action: h.action, at: h.createdAt, feedback: h.detail?.feedback, changedFields: Object.keys(h.detail?.changes || {}).filter(key => actor.staff || !INTERNAL.includes(key)), actor: actor.staff ? h.actor : undefined })) };
  }
  async function validateDraft(actor, documentId) {
    const draft = await find(actor, documentId);
    const payload = { ...draft.payload };
    if (!actor.staff) INTERNAL.forEach(key => delete payload[key]);
    const issues = validate(draft.kind, payload, { complete: true, provider: !actor.staff });
    try { await references(actor, draft, draft.payload); }
    catch (error) { if (error.status === 422 && error.details) issues.push(...error.details); else throw error; }
    return issues;
  }
  async function create(actor, input) {
    const { kind, organization, target } = input;
    contract(kind);
    return strapi.db.transaction(async ({ trx }) => {
      await authorize(actor, organization, trx);
      const baseline = target ? await snapshot(kind, target, trx) : null;
      if (baseline && baseline.payload.provider !== organization) fail(403, 'Entry does not belong to this organization.');
      const payload = baseline ? baseline.payload : { ...defaults(contract(kind).fields), provider: organization };
      const draft = await write('draft', { kind, organization, target: target || null, payload, baseline, baseline_hash: baseline ? fingerprint(baseline) : null, revision: 1, payload_version: 1, status: 'draft', author: actorName(actor), last_actor: actorName(actor) });
      await audit(actor, 'created', draft);
      return visible(draft, actor);
    });
  }
  async function save(actor, documentId, input) {
    return strapi.db.transaction(async ({ trx }) => {
      const draft = await find(actor, documentId, trx); revision(draft, input.revision); editable(draft, actor);
      assertValid(draft.kind, input.payload, { provider: !actor.staff });
      const payload = { ...input.payload };
      if (!actor.staff) for (const k of INTERNAL) if (draft.payload[k] !== undefined) payload[k] = draft.payload[k];
      const organization = actor.staff ? payload.provider : draft.organization;
      await authorize(actor, organization, trx);
      await references(actor, { ...draft, organization }, payload);
      const updated = await write('draft', { payload, organization, revision: draft.revision + 1, last_actor: actorName(actor) }, draft.id);
      const changes = Object.fromEntries([...new Set([...Object.keys(draft.payload), ...Object.keys(payload)])].filter(key => fingerprint(draft.payload[key] ?? null) !== fingerprint(payload[key] ?? null)).map(key => [key, { before: draft.payload[key] ?? null, after: payload[key] ?? null }]));
      await audit(actor, 'saved', updated, { changes });
      return visible(updated, actor);
    });
  }
  async function apply(draft, actor, trx) {
    const current = draft.target ? await snapshot(draft.kind, draft.target, trx) : null;
    if (current && fingerprint(current) !== draft.baseline_hash) fail(409, 'The live entry has changed. Compare and reconcile it before publishing.');
    assertValid(draft.kind, draft.payload, { complete: true });
    await references(actor, draft, draft.payload);
    const parent = { ...draft.payload };
    // Updates are complete aggregates: an absent optional value clears its previous value.
    const completeData = (fields, data) => Object.fromEntries(fields.filter(f => !f.children).map(f => [f.name, data[f.name] ?? (f.relation === 'manyToMany' ? [] : null)]));
    Object.assign(parent, completeData(contract(draft.kind).fields, parent));
    for (const key of Object.keys(CHILDREN[draft.kind])) delete parent[key];
    if (draft.kind === 'program') parent.publication_status = 'published';
    // Scholarship owns its requirements foreign key; create/update that record first.
    let scholarshipRequirement;
    if (draft.kind === 'scholarship' && draft.payload.requirements) {
      const { documentId, ...values } = draft.payload.requirements;
      const data = completeData(contract(draft.kind).fields.find(f => f.name === 'requirements').children, values);
      scholarshipRequirement = documentId ? await docs('scholarship-requirement').update({ documentId, data }) : await docs('scholarship-requirement').create({ data });
      parent.requirements = scholarshipRequirement.documentId;
    } else if (draft.kind === 'scholarship') parent.requirements = null;
    const entry = draft.target ? await docs(draft.kind).update({ documentId: draft.target, data: parent }) : await docs(draft.kind).create({ data: parent });
    for (const [field, name] of Object.entries(CHILDREN[draft.kind])) {
      const before = current?.payload?.[field];
      const previous = Array.isArray(before) ? before : before ? [before] : [];
      const value = draft.payload[field];
      const next = Array.isArray(value) ? value : value ? [value] : [];
      // Omission in the complete aggregate is an explicit removal, with baseline IDs checked above.
      const retained = new Set(next.map(c => c.documentId).filter(Boolean));
      for (const old of previous) if (!retained.has(old.documentId)) await docs(name).delete({ documentId: old.documentId });
      if (scholarshipRequirement && field === 'requirements') continue;
      for (let i = 0; i < next.length; i++) {
        const { documentId, ...values } = next[i];
        const data = completeData(contract(draft.kind).fields.find(f => f.name === field).children, values);
        data[draft.kind] = entry.documentId;
        if (field === 'application_steps') data.step = i + 1;
        if (field === 'provider_links') data.is_main = false;
        if (documentId) await docs(name).update({ documentId, data }); else await docs(name).create({ data });
      }
    }
    if (draft.kind === 'program') {
      const owners = await docs('program-provider').findMany({ filters: { program: { documentId: entry.documentId }, relationship_type: 'owner' } });
      const owner = owners[0];
      const data = { program: entry.documentId, provider: draft.organization, relationship_type: 'owner', is_main: true };
      if (owner) await docs('program-provider').update({ documentId: owner.documentId, data }); else await docs('program-provider').create({ data });
    }
    return entry;
  }
  async function transition(actor, documentId, action, input) {
    let applied = false;
    const result = await strapi.db.transaction(async ({ trx, onCommit }) => {
      const draft = await find(actor, documentId, trx);
      if (['apply', 'request-changes'].includes(action) && !actor.publish) fail(403, 'Publishing permission is required.');
      if (action === 'apply' && draft.status === 'applied') return visible(draft, actor);
      revision(draft, input.revision);
      const patch = { revision: draft.revision + 1, last_actor: actorName(actor) };
      if (action === 'submit') {
        if (!['draft', 'changes_requested'].includes(draft.status)) fail(409, 'This entry cannot be submitted.');
        const candidate = { ...draft.payload }; if (!actor.staff) INTERNAL.forEach(k => delete candidate[k]);
        assertValid(draft.kind, candidate, { complete: true, provider: !actor.staff });
        await references(actor, draft, draft.payload); patch.status = 'submitted'; patch.feedback = null;
      } else if (action === 'withdraw') {
        if (draft.status !== 'submitted') fail(409, 'Only submitted entries can be withdrawn.'); patch.status = 'draft';
      } else if (action === 'request-changes') {
        if (!actor.publish) fail(403, 'Review permission is required.');
        if (draft.status !== 'submitted') fail(409, 'Only submitted entries can be returned.');
        if (typeof input.feedback !== 'string' || !input.feedback.trim() || input.feedback.length > 5000) fail(400, 'Enter review feedback (up to 5,000 characters).');
        patch.status = 'changes_requested'; patch.feedback = input.feedback.trim();
      } else if (action === 'apply') {
        if (!actor.publish) fail(403, 'Publishing permission is required.');
        if (draft.author.startsWith('user:') && draft.status !== 'submitted') fail(409, 'Providers must submit this draft before it can be approved.');
        const entry = await apply(draft, actor, trx);
        patch.status = 'applied'; patch.target = entry.documentId; patch.applied_at = new Date().toISOString(); applied = true;
        onCommit(async () => {
          try { await strapi.plugin('strapi-cache')?.service('service').getCacheInstance().clearByRegexp([/program/, /scholarship/, /provider/]); }
          catch (error) { strapi.log.error('Catalog editor cache invalidation failed', error); }
        });
      } else if (action === 'reconcile') {
        editable(draft, actor);
        if (!draft.target) fail(400, 'This is a new entry.');
        const live = await snapshot(draft.kind, draft.target, trx);
        if (input.liveHash !== fingerprint(live)) fail(409, 'Live content changed again. Reload the comparison.');
        if (live.payload.provider !== draft.organization) fail(409, 'Ownership changed. Start a new draft with the current organization.');
        // Explicit field-level decisions are made in the UI; validate old child IDs against the new live baseline.
        patch.baseline = live; patch.baseline_hash = fingerprint(live);
        if (input.useLive) patch.payload = live.payload;
        else await references(actor, { ...draft, baseline: live }, draft.payload);
      } else fail(400, 'Unknown action.');
      const updated = await write('draft', patch, draft.id);
      await audit(actor, action, updated, { feedback: patch.feedback, target: patch.target, applied });
      return visible(updated, actor);
    });
    return result;
  }
  async function live(actor, documentId) {
    const draft = await find(actor, documentId);
    if (!draft.target) return null;
    const current = await snapshot(draft.kind, draft.target);
    if (!actor.staff && current.payload.provider !== draft.organization) fail(403, 'Entry ownership has changed.');
    const hash = fingerprint(current), changed = draft.status !== 'applied' && hash !== draft.baseline_hash;
    if (!actor.staff) INTERNAL.forEach(k => delete current.payload[k]);
    return { payload: current.payload, hash, changed };
  }
  async function list(actor, organization) {
    await authorize(actor, organization);
    const drafts = await query('draft').findMany({ where: { organization }, orderBy: { updatedAt: 'desc' }, limit: 1000 });
    const entries = [];
    for (const kind of ['program', 'scholarship']) {
      const rows = await docs(kind).findMany({ filters: { provider: { documentId: organization } }, fields: kind === 'program' ? ['title', 'updatedAt'] : ['name', 'updatedAt'], limit: 1000 });
      entries.push(...rows.map(r => ({ documentId: r.documentId, title: r.title || r.name, kind, updatedAt: r.updatedAt })));
    }
    return { drafts: drafts.map(d => ({ documentId: d.documentId, kind: d.kind, title: d.payload.title || d.payload.name || 'Untitled entry', status: d.status, updatedAt: d.updatedAt })), entries };
  }
  return { query, docs, write, audit, lock, organizations, authorize, actorName, visible, find, get, create, save, transition, live, list, allowedAssets, contract, validate, validateDraft };
};
