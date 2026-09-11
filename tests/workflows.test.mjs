import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const rootRequire = createRequire(import.meta.url);
const typescript = rootRequire('typescript');
const testDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(testDirectory, '..');

function loadTypeScript(relativePath) {
  const path = resolve(projectDirectory, relativePath);
  const { outputText, diagnostics } = typescript.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2020,
    },
    fileName: path,
    reportDiagnostics: true,
  });
  assert.deepEqual(diagnostics ?? [], [], `${relativePath} must transpile.`);
  const module = { exports: {} };
  const localRequire = createRequire(path);
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
    module.exports,
    localRequire,
    module,
    path,
    dirname(path),
  );
  return module.exports;
}

const editorial = loadTypeScript('src/workflows/editorial-state.ts');
const validationTypes = loadTypeScript('src/workflows/validation-types.ts');
const applications = loadTypeScript('src/workflows/tracked-application-state.ts');
const siteConfig = loadTypeScript('src/workflows/site-config-validation.ts');
const postcardValidator = loadTypeScript('src/plugins/postcard-editor/validator.ts');

test('editorial transitions preserve Django status graph and derived fields', () => {
  const at = new Date('2026-08-31T12:00:00.000Z');
  const scheduled = editorial.buildEditorialTransition(
    'api::article.article',
    { publication_status: 'draft' },
    'scheduled',
    { at, scheduledFor: '2026-08-31T12:05:00.000Z' },
  );
  assert.deepEqual(scheduled, {
    publication_status: 'scheduled',
    scheduled_at: '2026-08-31T12:05:00.000Z',
    published: false,
    date_published: null,
  });

  const published = editorial.buildEditorialTransition(
    'api::article.article',
    { publication_status: 'scheduled', scheduled_at: scheduled.scheduled_at },
    'published',
    { at },
  );
  assert.deepEqual(published, {
    publication_status: 'published',
    publishedAt: '2026-08-31T12:00:00.000Z',
    published: true,
    date_published: '2026-08-31T12:00:00.000Z',
  });

  assert.deepEqual(
    editorial.buildEditorialTransition('api::article.article', { publication_status: 'archived' }, 'draft', { at }),
    {
      publication_status: 'draft',
      archived_at: null,
      scheduled_at: null,
      published: false,
      date_published: null,
    },
  );
  assert.deepEqual(
    editorial.buildEditorialTransition('api::article.article', { publication_status: 'archived' }, 'review', { at }),
    {
      publication_status: 'review',
      archived_at: null,
      reviewed_at: '2026-08-31T12:00:00.000Z',
      published: false,
      date_published: null,
    },
  );
  assert.deepEqual(
    editorial.buildEditorialTransition('api::article.article', { publication_status: 'archived' }, 'published', { at }),
    {
      publication_status: 'published',
      archived_at: null,
      publishedAt: '2026-08-31T12:00:00.000Z',
      published: true,
      date_published: '2026-08-31T12:00:00.000Z',
    },
  );
});
test('empty optional direct relations are omitted from create and update writes', () => {
  const createValue = { connect: [], disconnect: [] };
  const updateValue = { connect: [], disconnect: [] };
  assert.deepEqual(validationTypes.normalizeDirectRelationWrite(createValue), { action: 'omit' });
  assert.deepEqual(validationTypes.normalizeDirectRelationWrite(updateValue), { action: 'omit' });

  assert.deepEqual(
    validationTypes.normalizeDirectRelationWrite({ connect: [{ id: 41 }], disconnect: [] }),
    { action: 'set', value: 41 },
  );
  assert.deepEqual(
    validationTypes.normalizeDirectRelationWrite({ connect: [], disconnect: [{ id: 41 }] }),
    { action: 'set', value: null },
  );
});


test('standalone resource models share the editorial publication workflow', () => {
  const resourceUids = [
    'api::resource.resource',
    'api::tip.tip',
    'api::guide.guide',
    'api::itinerary.itinerary',
    'api::academic-resource.academic-resource',
    'api::cultural-resource.cultural-resource',
  ];

  for (const uid of resourceUids) {
    assert.equal(editorial.EDITORIAL_WORKFLOW_UIDS.includes(uid), true);
    assert.deepEqual(
      editorial.buildEditorialTransition(uid, { publication_status: 'draft' }, 'review', {
        at: new Date('2026-08-31T12:00:00.000Z'),
      }),
      {
        publication_status: 'review',
        reviewed_at: '2026-08-31T12:00:00.000Z',
      },
    );
  }
});

test('tracked application state transitions synchronize submitted fields atomically', () => {
  const patch = applications.buildTrackedApplicationTransition(
    { status: 'reviewing', submitted: false, progress: 80 },
    'submitted',
    { at: new Date('2026-08-31T12:00:00.000Z') },
  );
  assert.deepEqual(patch, {
    status: 'submitted',
    submitted: true,
    submission_on: '2026-08-31',
    progress: 100,
  });

  assert.throws(
    () => applications.buildTrackedApplicationTransition({ status: 'completed' }, 'in-progress'),
    /Cannot move an application/,
  );
});

test('site property and language validation mirror Django rules', () => {
  assert.equal(siteConfig.normalizeLanguageTag(' EN_us '), 'en-US');
  assert.throws(() => siteConfig.normalizeLanguageTag('invalid tag'), /BCP 47/);

  siteConfig.validateSiteProperty({
    key: 'public_footer_links',
    value: '{"links":["/about"]}',
    type: 'json',
    is_public: true,
    json_schema: {
      type: 'object',
      required: ['links'],
      properties: { links: { type: 'array', items: { type: 'string' } } },
      additionalProperties: false,
    },
  });
  assert.throws(
    () => siteConfig.validateSiteProperty({
      key: 'api_token', value: 'abc', type: 'string', is_public: true, json_schema: {},
    }),
    /secret-like/,
  );
});
test('postcard validation accepts the frontend Editor.js contract', () => {
  const paragraph = (id, text) => ({ id, type: 'paragraph', data: { text } });
  const document = {
    format: 'editorjs',
    version: 1,
    blocks: [
      {
        id: 'image-1',
        type: 'image',
        mb: 'mb-[3.25rem]',
        data: {
          src: 'https://cdn.example.com/rome.jpg',
          alt: '',
          caption: '',
          withBorder: true,
          withBackground: false,
          stretched: true,
          asset: { id: 42, alt_text: '', caption: '' },
        },
      },
      {
        id: 'layout-1',
        type: 'layout',
        mb: 'mb-12',
        data: {
          style: 'grid-template-columns: repeat(4, minmax(0, 1fr))',
          columns: [
            { width: '0.75fr', style: 'padding-inline: 1rem', blocks: [paragraph('column-1', 'One')] },
            { width: '1.25fr', blocks: [paragraph('column-2', 'Two')] },
            { width: '1fr', blocks: [paragraph('column-3', 'Three')] },
            { width: '2fr', blocks: [paragraph('column-4', 'Four')] },
          ],
        },
      },
      {
        id: 'embed-1',
        type: 'embed',
        data: { kind: 'spotify', url: 'https://open.spotify.com/track/example', caption: '' },
      },
    ],
  };

  assert.doesNotThrow(() => postcardValidator.assertPostcardDocument(document));
});


test('interaction modules install native morph counters, cascades, and locks', () => {
  const counters = readFileSync(resolve(projectDirectory, 'src/workflows/community-counter-triggers.ts'), 'utf8');
  const support = readFileSync(resolve(projectDirectory, 'src/workflows/community-interaction-support.ts'), 'utf8');
  const interactions = readFileSync(resolve(projectDirectory, 'src/workflows/community-interactions.ts'), 'utf8');
  assert.match(counters, /AFTER INSERT OR DELETE OR UPDATE OF/);
  assert.match(counters, /AFTER DELETE ON/);
  assert.match(support, /pg_advisory_xact_lock/);
  assert.match(support, /FOR UPDATE/);
  assert.match(interactions, /toggleLike/);
});
