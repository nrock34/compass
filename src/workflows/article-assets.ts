import { AsyncLocalStorage } from 'node:async_hooks';
import type { Core } from '@strapi/strapi';
import { isRecord, type Data, type LifecycleEvent } from './validation-types';

const ARTICLE_UID = 'api::article.article';
const EDITORIAL_ASSET_UID = 'api::editorial-asset.editorial-asset';
const computedGalleryWrite = new AsyncLocalStorage<boolean>();

type AssetReference = { id?: number | string; documentId?: string };

type ArticleDocumentService = {
  findOne(input: {
    documentId: string;
    populate: { banner_img: true };
  }): Promise<unknown>;
  update(input: {
    documentId: string;
    data: { gallery: { set: Array<{ documentId: string }> } };
  }): Promise<unknown>;
};

function referenceFrom(value: unknown): AssetReference | undefined {
  if (typeof value === 'number' || typeof value === 'string') return { id: value };
  if (!isRecord(value)) return undefined;
  const id = typeof value.id === 'number' || typeof value.id === 'string' ? value.id : undefined;
  const documentId = typeof value.documentId === 'string' ? value.documentId : undefined;
  return id !== undefined || documentId ? { id, documentId } : undefined;
}

function collectContentAssetReferences(value: unknown, references: AssetReference[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectContentAssetReferences(item, references);
    return;
  }
  if (!isRecord(value)) return;

  if ('assetId' in value) {
    const reference = referenceFrom(value.assetId);
    if (reference) references.push(reference);
  }
  if ('asset' in value) {
    const reference = referenceFrom(value.asset);
    if (reference) references.push(reference);
  }

  for (const nested of Object.values(value)) collectContentAssetReferences(nested, references);
}

async function imageAssetDocumentIds(strapi: Core.Strapi, article: Data): Promise<string[]> {
  const references: AssetReference[] = [];
  const banner = referenceFrom(article.banner_img);
  if (banner) references.push(banner);
  collectContentAssetReferences(article.content, references);

  const documentIds = new Map<string, string>();
  for (const reference of references) {
    const where = reference.documentId ? { documentId: reference.documentId } : { id: reference.id };
    const asset = await strapi.db.query(EDITORIAL_ASSET_UID).findOne({ where });
    if (
      !isRecord(asset)
      || typeof asset.documentId !== 'string'
      || typeof asset.mime_type !== 'string'
      || !asset.mime_type.startsWith('image/')
    ) continue;
    documentIds.set(asset.documentId, asset.documentId);
  }
  return [...documentIds.values()];
}

/** Ignore client-supplied gallery relations; the after-write synchronizer owns them. */
export function stripComputedArticleGalleryWrite(uid: string, data: Data): void {
  if (uid === ARTICLE_UID && !computedGalleryWrite.getStore()) delete data.gallery;
}

/** Rebuild Article.gallery from banner and postcard-content image references. */
export async function synchronizeArticleGallery(strapi: Core.Strapi, event: LifecycleEvent): Promise<void> {
  if (event.model.uid !== ARTICLE_UID || computedGalleryWrite.getStore() || !isRecord(event.result)) return;
  const documentId = event.result.documentId;
  if (typeof documentId !== 'string') return;

  const documents = strapi.documents(ARTICLE_UID) as unknown as ArticleDocumentService;
  const article = await documents.findOne({
    documentId,
    populate: { banner_img: true },
  });
  if (!isRecord(article)) return;

  const gallery = await imageAssetDocumentIds(strapi, article);
  await computedGalleryWrite.run(true, () => documents.update({
    documentId,
    data: { gallery: { set: gallery.map((assetDocumentId) => ({ documentId: assetDocumentId })) } },
  }));
}
