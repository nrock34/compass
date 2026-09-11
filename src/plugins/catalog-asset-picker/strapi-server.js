'use strict';

const CATALOG_ASSET_UID = 'api::catalog-asset.catalog-asset';

const fail = (message) => { throw new Error(message); };
const object = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Catalog asset must be an object.');
  return value;
};
const requiredString = (value, field, max) => {
  if (typeof value !== 'string' || !value.trim()) fail(`Catalog asset.${field} must be a non-empty string.`);
  const result = value.trim();
  if (result.length > max) fail(`Catalog asset.${field} must be ${max} characters or fewer.`);
  return result;
};
const optionalString = (value, field, max) => {
  if (value === undefined || value === null || value === '') return undefined;
  return requiredString(value, field, max);
};

function catalogAssetData(value) {
  const asset = object(value);
  const allowed = ['name', 'fileId', 'alt_text', 'caption', 'rights', 'source_url'];
  for (const key of Object.keys(asset)) if (!allowed.includes(key)) fail(`Catalog asset contains unsupported property "${key}".`);
  if (!Number.isSafeInteger(asset.fileId) || asset.fileId < 1) fail('Catalog asset.fileId must reference an uploaded image.');
  const sourceUrl = optionalString(asset.source_url, 'source_url', 2048);
  if (sourceUrl) {
    try {
      const parsed = new URL(sourceUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) fail('Catalog asset.source_url must use HTTP(S).');
    } catch {
      fail('Catalog asset.source_url must be an absolute HTTP(S) URL.');
    }
  }
  return {
    name: requiredString(asset.name, 'name', 255),
    file: asset.fileId,
    alt_text: requiredString(asset.alt_text, 'alt_text', 255),
    ...(optionalString(asset.caption, 'caption', 10000) ? { caption: asset.caption.trim() } : {}),
    ...(optionalString(asset.rights, 'rights', 255) ? { rights: asset.rights.trim() } : {}),
    ...(sourceUrl ? { source_url: sourceUrl } : {}),
  };
}

module.exports = () => ({
  controllers: {
    asset: ({ strapi }) => ({
      async list(ctx) {
        const search = typeof ctx.query.q === 'string' ? ctx.query.q.trim() : '';
        const ids = typeof ctx.query.ids === 'string'
          ? ctx.query.ids.split(',').map((id) => id.trim()).filter(Boolean)
          : [];
        const where = ids.length
          ? { documentId: { $in: ids } }
          : search
            ? { $or: [{ name: { $containsi: search } }, { alt_text: { $containsi: search } }] }
            : {};
        ctx.body = {
          data: await strapi.db.query(CATALOG_ASSET_UID).findMany({
            where,
            populate: { file: true },
            orderBy: { createdAt: 'desc' },
            limit: 50,
          }),
        };
      },
      async create(ctx) {
        ctx.body = {
          data: await strapi.db.query(CATALOG_ASSET_UID).create({
            data: catalogAssetData(ctx.request.body ?? {}),
            populate: { file: true },
          }),
        };
      },
    }),
  },
  routes: {
    admin: {
      type: 'admin',
      routes: [
        {
          method: 'GET',
          path: '/assets',
          handler: 'asset.list',
          config: { policies: ['admin::isAuthenticatedAdmin'] },
        },
        {
          method: 'POST',
          path: '/assets',
          handler: 'asset.create',
          config: { policies: ['admin::isAuthenticatedAdmin'] },
        },
      ],
    },
  },
});
