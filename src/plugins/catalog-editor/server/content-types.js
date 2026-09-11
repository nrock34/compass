'use strict';
const str = (extra = {}) => ({ type: 'string', ...extra });
const json = () => ({ type: 'json' });
const integer = () => ({ type: 'integer' });
function model(name, attributes) {
  return { schema: {
    kind: 'collectionType', collectionName: `rwm_catalog_editor_${name.replaceAll('-', '_')}`,
    info: { singularName: name, pluralName: `${name}s`, displayName: `Catalog editor ${name}` },
    options: { draftAndPublish: false },
    pluginOptions: { 'content-manager': { visible: false }, 'content-type-builder': { visible: false } },
    attributes,
  } };
}
module.exports = {
  draft: model('draft', {
    kind: { type: 'enumeration', enum: ['program', 'scholarship'], required: true },
    organization: str({ required: true }), target: str(), payload: json(), baseline: json(), baseline_hash: str(),
    revision: { type: 'integer', default: 1 }, payload_version: { type: 'integer', default: 1 },
    status: { type: 'enumeration', enum: ['draft', 'submitted', 'changes_requested', 'applied'], default: 'draft' },
    author: str(), last_actor: str(), feedback: { type: 'text' }, applied_at: { type: 'datetime' },
  }),
  membership: model('membership', { user_id: integer(), organization: str(), active: { type: 'boolean', default: true }, membership_key: str({ unique: true, required: true }) }),
  'asset-ownership': model('asset-ownership', { asset: str({ unique: true }), organization: str(), actor: str() }),
  audit: model('audit', { actor: str(), action: str(), target: str(), organization: str(), revision: integer(), detail: json(), correlation_id: str() }),
};
