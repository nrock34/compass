import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import {
  stripComputedArticleGalleryWrite,
  synchronizeArticleGallery,
} from './article-assets';
import {
  DOMAIN_VALIDATION_UIDS,
  validateDomainWrite,
} from './domain-validation';
import { lifecycleData, normalizeDirectRelationWrite, type Data, type LifecycleEvent } from './validation-types';
import { validateWorkflowWrite, WORKFLOW_GUARD_UIDS } from './workflow-write-guards';

const { ValidationError } = errors;
const CATALOG_ASSET_UID = 'api::catalog-asset.catalog-asset';
type CacheStore = { reset(): Promise<unknown> };
type CacheService = { getCacheInstance(): CacheStore };

async function invalidateCatalogAssetConsumers(strapi: Core.Strapi, event: LifecycleEvent): Promise<void> {
  if (event.model.uid !== CATALOG_ASSET_UID) return;
  const cacheService = strapi.plugin('strapi-cache').service('service') as CacheService;
  await cacheService.getCacheInstance().reset();
}


export const RWM_VALIDATED_UIDS = [
  ...new Set([...WORKFLOW_GUARD_UIDS, ...DOMAIN_VALIDATION_UIDS]),
];

type RelationAttribute = {
  type?: unknown;
  relation?: unknown;
  useJoinTable?: unknown;
};

/**
 * Strapi 5 leaves Content Manager `{ connect: [...] }` envelopes intact for
 * direct-FK to-one relations. The query engine expects the scalar FK instead.
 */
export function normalizeDirectRelationWrites(strapi: Core.Strapi, uid: string, data: Data): void {
  const model = (strapi as unknown as {
    getModel(modelUid: string): { attributes: Record<string, RelationAttribute> };
  }).getModel(uid);

  for (const [field, attribute] of Object.entries(model.attributes)) {
    if (
      attribute.type !== 'relation'
      || attribute.useJoinTable !== false
      || (attribute.relation !== 'manyToOne' && attribute.relation !== 'oneToOne')
    ) continue;

    const normalized = normalizeDirectRelationWrite(data[field]);
    if (normalized.action === 'set') data[field] = normalized.value;
    else if (normalized.action === 'omit') delete data[field];
  }
}

async function validateWrite(strapi: Core.Strapi, event: LifecycleEvent, creating: boolean): Promise<void> {
  const data = lifecycleData(event);
  if (!data) return;
  stripComputedArticleGalleryWrite(event.model.uid, data);

  validateWorkflowWrite(event.model.uid, data, creating);
  await validateDomainWrite(strapi, event, data, creating);
}

/**
 * Query-engine hooks protect generic admin, Content API, Document Service, and
 * internal query calls. Named workflow services perform the guarded state
 * writes; the domain module handles model-specific validation.
 */
export function installRwmValidationHooks(strapi: Core.Strapi): void {
  // Normalization is needed by every model with direct foreign keys, including
  // Program, Provider, and University, not only models with custom validators.
  strapi.db.lifecycles.subscribe({
    models: Object.keys(strapi.contentTypes).filter((uid) => uid.startsWith('api::')),
    beforeCreate: (event) => {
      const data = lifecycleData(event as LifecycleEvent);
      if (data) normalizeDirectRelationWrites(strapi, event.model.uid, data);
    },
    beforeUpdate: (event) => {
      const data = lifecycleData(event as LifecycleEvent);
      if (data) normalizeDirectRelationWrites(strapi, event.model.uid, data);
    },
  });
  strapi.db.lifecycles.subscribe({
    models: RWM_VALIDATED_UIDS,
    beforeCreate: (event) => validateWrite(strapi, event as LifecycleEvent, true),
    beforeUpdate: (event) => validateWrite(strapi, event as LifecycleEvent, false),
    beforeUpdateMany: (event) => {
      throw new ValidationError(
        `Bulk updates are not allowed for ${event.model.uid}; update records through the validated workflow/API path.`,
      );
    },
    afterCreate: async (event) => {
      await synchronizeArticleGallery(strapi, event as LifecycleEvent);
      await invalidateCatalogAssetConsumers(strapi, event as LifecycleEvent);
    },
    afterUpdate: async (event) => {
      await synchronizeArticleGallery(strapi, event as LifecycleEvent);
      await invalidateCatalogAssetConsumers(strapi, event as LifecycleEvent);
    },
    afterDelete: (event) => invalidateCatalogAssetConsumers(strapi, event as LifecycleEvent),
  });
}
