'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { contract, validate, fingerprint } = require('../src/plugins/catalog-editor/server/model');

test('partial drafts accept a title without manufacturing catalog values', () => {
  assert.deepEqual(validate('program', { title: 'Rome semester' }), []);
  assert(validate('program', { title: 'Rome semester' }, { complete: true }).some(e => e.path === 'provider'));
});
test('provider payload rejects internal controls and unknown nested fields', () => {
  assert(validate('program', { rating: 5 }, { provider: true }).some(e => e.path === 'rating'));
  assert(validate('program', { locations: [{ city: 'Rome', program: 'another' }] }).some(e => e.path === 'locations.0.program'));
  assert(validate('scholarship', { publication_status: 'published' }).length);
});
test('numeric, date, URL, relation, and award constraints return field paths', () => {
  const errors = validate('program', { application_link: 'javascript:alert(1)', fields: ['same', 'same'], terms: [{ start_date_time: '2027-02-01T00:00:00Z', end_date_time: '2027-01-01T00:00:00Z' }], cost: { program_fee: -1 } });
  for (const path of ['application_link', 'fields', 'terms.0.end_date_time', 'cost.program_fee']) assert(errors.some(e => e.path === path), path);
  assert(validate('scholarship', { lower_bound: 1000, upper_bound: 100 }).some(e => e.path === 'upper_bound'));
});
test('optional sections are absent until added; added records must be complete', () => {
  assert(!validate('program', {}, { complete: true }).some(e => e.path.startsWith('cost.')));
  assert(validate('program', { cost: {} }, { complete: true }).some(e => e.path === 'cost.program_fee'));
});
test('contract includes owned records and excludes member relationships', () => {
  const spec = contract('program');
  assert.equal(spec.fields.filter(f => f.children).length, 10);
  assert(!spec.fields.some(f => ['user_apps', 'saved_by_users', 'users'].includes(f.name)));
  assert.deepEqual(spec.fields.find(f => f.name === 'provider_links').children.find(f => f.name === 'relationship_type').enum, ['partner', 'external']);
});
test('fingerprints ignore object ordering, detect relation changes, and preserve list order', () => {
  assert.equal(fingerprint({ a: 1, b: 2 }), fingerprint({ b: 2, a: 1 }));
  assert.notEqual(fingerprint({ gallery: ['a', 'b'] }), fingerprint({ gallery: ['b', 'a'] }));
});
