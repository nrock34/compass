'use strict';

const BLOCK_TYPES = ['header', 'subtext', 'paragraph', 'smallText', 'image', 'quote', 'embed', 'slideshow', 'poll', 'layout'];
const TEXT_SIZES = ['sm', 'md', 'lg'];
const EMBED_KINDS = ['spotify', 'youtube', 'map'];
const ARTICLE_UID = 'api::article.article';

const fail = (message) => { throw new Error(message); };
function object(value, label) { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object.`); return value; }
function keys(value, allowed, label) { for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(`${label} contains unsupported property "${key}".`); }
function stringValue(value, label, max, required = true) { if (value == null && !required) return; if (typeof value !== 'string' || !value.trim()) fail(`${label} must be a non-empty string.`); const result = value.trim(); if (result.length > max) fail(`${label} must be ${max} characters or fewer.`); return result; }
function optionalString(value, label, max) { if (value == null) return; if (typeof value !== 'string') fail(`${label} must be a string.`); if (value.trim().length > max) fail(`${label} must be ${max} characters or fewer.`); }
function enumValue(value, values, label, required = true) { if (value == null && !required) return; if (typeof value !== 'string' || !values.includes(value)) fail(`${label} must be one of: ${values.join(', ')}.`); return value; }
function urlValue(value, label) { const source = stringValue(value, label, 2048); try { const parsed = new URL(source); if (!['http:', 'https:'].includes(parsed.protocol)) fail(`${label} must use http or https.`); } catch { fail(`${label} must be a valid URL.`); } }
function assertAsset(value, label) { const asset = object(value, label); keys(asset, ['id', 'public_url', 'alt_text', 'caption'], label); if (asset.id != null && !((Number.isSafeInteger(asset.id) && asset.id > 0) || (typeof asset.id === 'string' && asset.id.trim()))) fail(`${label}.id must be a positive integer or non-empty string.`); if (asset.public_url != null && asset.public_url !== '') urlValue(asset.public_url, `${label}.public_url`); optionalString(asset.alt_text, `${label}.alt_text`, 255); optionalString(asset.caption, `${label}.caption`, 500); }
function assertMediaData(data, label, slide = false) { keys(data, ['src', 'alt', 'caption', 'withBorder', 'withBackground', 'stretched', 'assetId', 'asset'], label); urlValue(data.src, `${label}.src`); optionalString(data.alt, `${label}.alt`, 180); optionalString(data.caption, `${label}.caption`, 280); if (data.assetId !== undefined && !((Number.isSafeInteger(data.assetId) && data.assetId > 0) || (typeof data.assetId === 'string' && data.assetId.trim()))) fail(`${label}.assetId must be a positive integer or non-empty string.`); if (data.asset !== undefined) assertAsset(data.asset, `${label}.asset`); if (!slide) for (const flag of ['withBorder', 'withBackground', 'stretched']) if (data[flag] !== undefined && typeof data[flag] !== 'boolean') fail(`${label}.${flag} must be a boolean.`); }
function assertBlock(value, label, allowLayout) {
  const block = object(value, label); keys(block, ['id', 'type', 'data', 'mb'], label); stringValue(block.id, `${label}.id`, 120); const allowedTypes = allowLayout ? BLOCK_TYPES : BLOCK_TYPES.filter((entry) => entry !== 'layout'); const type = enumValue(block.type, allowedTypes, `${label}.type`); optionalString(block.mb, `${label}.mb`, 120); const data = object(block.data, `${label}.data`);
  switch (type) {
    case 'header': case 'subtext': keys(data, ['text', 'fontSize'], `${label}.data`); stringValue(data.text, `${label}.data.text`, type === 'header' ? 180 : 360); enumValue(data.fontSize, TEXT_SIZES, `${label}.data.fontSize`, false); break;
    case 'paragraph': keys(data, ['text'], `${label}.data`); stringValue(data.text, `${label}.data.text`, 4000); break;
    case 'smallText': keys(data, ['text'], `${label}.data`); stringValue(data.text, `${label}.data.text`, 1200); break;
    case 'image': assertMediaData(data, `${label}.data`); break;
    case 'quote': keys(data, ['text', 'attribution'], `${label}.data`); stringValue(data.text, `${label}.data.text`, 1500); optionalString(data.attribution, `${label}.data.attribution`, 180); break;
    case 'embed': keys(data, ['kind', 'url', 'caption'], `${label}.data`); enumValue(data.kind, EMBED_KINDS, `${label}.data.kind`); urlValue(data.url, `${label}.data.url`); optionalString(data.caption, `${label}.data.caption`, 280); break;
    case 'slideshow': keys(data, ['slides'], `${label}.data`); if (!Array.isArray(data.slides) || data.slides.length < 1) fail(`${label}.data.slides must contain at least one slide.`); data.slides.forEach((slide, index) => { const entry = object(slide, `${label}.data.slides[${index}]`); keys(entry, ['src', 'alt', 'caption', 'assetId', 'asset'], `${label}.data.slides[${index}]`); assertMediaData(entry, `${label}.data.slides[${index}]`, true); }); break;
    case 'poll': keys(data, ['question', 'options'], `${label}.data`); stringValue(data.question, `${label}.data.question`, 220); if (!Array.isArray(data.options) || data.options.length < 2) fail(`${label}.data.options must contain at least two options.`); data.options.forEach((option, index) => { const entry = object(option, `${label}.data.options[${index}]`); keys(entry, ['id', 'label'], `${label}.data.options[${index}]`); stringValue(entry.id, `${label}.data.options[${index}].id`, 120); stringValue(entry.label, `${label}.data.options[${index}].label`, 120); }); break;
    case 'layout': keys(data, ['style', 'columns'], `${label}.data`); optionalString(data.style, `${label}.data.style`, 600); if (!Array.isArray(data.columns) || data.columns.length < 2) fail(`${label}.data.columns must contain at least two columns.`); data.columns.forEach((column, index) => { const entry = object(column, `${label}.data.columns[${index}]`); keys(entry, ['width', 'style', 'blocks'], `${label}.data.columns[${index}]`); optionalString(entry.width, `${label}.data.columns[${index}].width`, 20); optionalString(entry.style, `${label}.data.columns[${index}].style`, 600); if (!Array.isArray(entry.blocks) || entry.blocks.length < 1) fail(`${label}.data.columns[${index}].blocks must contain at least one block.`); entry.blocks.forEach((child, childIndex) => assertBlock(child, `${label}.data.columns[${index}].blocks[${childIndex}]`, false)); }); break;
    default: fail(`${label} has an unsupported block type.`);
  }
}
function assertPostcardDocument(value) { const document = object(value, 'Article content'); keys(document, ['format', 'version', 'blocks'], 'Article content'); if (document.format !== 'editorjs' || document.version !== 1) fail('Article content must be an Editor.js version 1 document.'); if (!Array.isArray(document.blocks) || document.blocks.length < 1) fail('Article content must contain at least one block.'); document.blocks.forEach((block, index) => assertBlock(block, `Article content.blocks[${index}]`, true)); }
function assertEditorialAsset(value) {
  const asset = object(value, 'Editorial asset');
  keys(asset, ['object_key', 'public_url', 'original_filename', 'mime_type', 'byte_size', 'checksum', 'status', 'width', 'height', 'alt_text', 'caption', 'rights', 'source'], 'Editorial asset');
  stringValue(asset.object_key, 'Editorial asset.object_key', 512);
  urlValue(asset.public_url, 'Editorial asset.public_url');
  stringValue(asset.original_filename, 'Editorial asset.original_filename', 255);
  stringValue(asset.mime_type, 'Editorial asset.mime_type', 127);
  stringValue(asset.checksum, 'Editorial asset.checksum', 128);
  enumValue(asset.status, ['pending'], 'Editorial asset.status');
  stringValue(asset.alt_text, 'Editorial asset.alt_text', 255);
  stringValue(asset.caption, 'Editorial asset.caption', 10000);
  stringValue(asset.rights, 'Editorial asset.rights', 255);
  stringValue(asset.source, 'Editorial asset.source', 32);
  if (!Number.isSafeInteger(asset.byte_size) || asset.byte_size < 0) fail('Editorial asset.byte_size must be a non-negative integer.');
  for (const field of ['width', 'height']) {
    if (asset[field] !== undefined && (!Number.isSafeInteger(asset[field]) || asset[field] < 0)) fail(`Editorial asset.${field} must be a non-negative integer.`);
  }
  return asset;
}



module.exports = () => ({
  register({ strapi }) {
    strapi.customFields.register({ name: 'postcard-document', plugin: 'postcard-editor', type: 'json', inputSize: { default: 12, isResizable: true }, validator: assertPostcardDocument });
    strapi.db?.lifecycles?.subscribe({ models: [ARTICLE_UID], beforeCreate(event) { const content = event.params?.data?.content; if (content !== undefined) assertPostcardDocument(content); }, beforeUpdate(event) { const content = event.params?.data?.content; if (content !== undefined) assertPostcardDocument(content); } });
  },
  controllers: {
    publication: ({ strapi }) => ({
      async transition(ctx) {
        const transitionEditorialPublication = strapi.rwmEditorialWorkflow?.transition;
        if (typeof transitionEditorialPublication !== 'function') {
          ctx.throw(503, 'Editorial publication workflow is unavailable.');
        }
        const input = ctx.request.body ?? {};
        ctx.body = {
          data: await transitionEditorialPublication({
            uid: input.uid,
            documentId: input.documentId,
            status: input.status,
            scheduledFor: input.scheduledFor,
          }),
        };
      },
    }),
    asset: ({ strapi }) => ({
      async create(ctx) {
        const data = assertEditorialAsset(ctx.request.body ?? {});
        ctx.body = {
          data: await strapi.documents('api::editorial-asset.editorial-asset').create({ data }),
        };
      },
    }),
  },
  routes: {
    admin: {
      type: 'admin',
      routes: [
        {
          method: 'POST',
          path: '/editorial-publications/transition',
          handler: 'publication.transition',
          config: { policies: ['admin::isAuthenticatedAdmin'] },
        },
        {
          method: 'POST',
          path: '/editorial-assets',
          handler: 'asset.create',
          config: { policies: ['admin::isAuthenticatedAdmin'] },
        },
      ],
    },
  },
});