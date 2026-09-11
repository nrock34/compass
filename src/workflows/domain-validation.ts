import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import {
  normalizeLanguageTag,
  type SitePropertyRecord,
  validateSiteProperty,
} from './site-config-validation';
import {
  existingRecord,
  hasOwn,
  isRecord,
  relationReference,
  relationId,
  type Data,
  type LifecycleEvent,
} from './validation-types';

const { ValidationError } = errors;

const PROGRAM_COST_UID = 'api::program-cost.program-cost';
const ARTICLE_UID = 'api::article.article';
const UPDATE_UID = 'api::update.update';
const PROGRAM_PROVIDER_UID = 'api::program-provider.program-provider';
const PROGRAM_TERM_UID = 'api::program-term.program-term';
const TOP_PICK_UID = 'api::top-pick-article.top-pick-article';
const SITE_PROPERTY_UID = 'api::site-property.site-property';
const LANG_UID = 'api::lang.lang';
const RESOURCE_TAG_UID = 'api::resource-tag.resource-tag';
const SAVED_RESOURCE_UID = 'api::saved-resource.saved-resource';
const USER_SENSITIVE_INFO_UID = 'api::user-sensitive-info.user-sensitive-info';
const USER_SAVED_ITEMS_UID = 'api::user-saved-item.user-saved-item';
const GLOBAL_BACKGROUND_UID = 'api::global-background.global-background';
const COMMENT_UID = 'api::comment.comment';
const LIKE_UID = 'api::like.like';
const ACTIVITY_UID = 'api::user-profile-activity.user-profile-activity';
const ASSET_PLACEMENT_UID = 'api::editorial-asset-placement.editorial-asset-placement';
const EDITORIAL_ASSET_UID = 'api::editorial-asset.editorial-asset';
const CATALOG_ASSET_UID = 'api::catalog-asset.catalog-asset';

const RESOURCE_UIDS = new Set<string>([
  'api::resource.resource',
  'api::tip.tip',
  'api::guide.guide',
  'api::itinerary.itinerary',
  'api::academic-resource.academic-resource',
  'api::cultural-resource.cultural-resource',
]);

const COMMENTABLE_UIDS = new Set<string>([
  'api::article.article',
  'api::post.post',
  'api::update.update',
]);

export const DOMAIN_VALIDATION_UIDS = [
  PROGRAM_COST_UID,
  PROGRAM_PROVIDER_UID,
  PROGRAM_TERM_UID,
  TOP_PICK_UID,
  SITE_PROPERTY_UID,
  LANG_UID,
  RESOURCE_TAG_UID,
  SAVED_RESOURCE_UID,
  USER_SENSITIVE_INFO_UID,
  USER_SAVED_ITEMS_UID,
  GLOBAL_BACKGROUND_UID,
  COMMENT_UID,
  LIKE_UID,
  ACTIVITY_UID,
  ASSET_PLACEMENT_UID,
  CATALOG_ASSET_UID,
];

function assertArray(value: unknown, field: string, maxItems: number, maxItemLength?: number): void {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${field} must be an array.`);
  }
  if (value.length > maxItems) {
    throw new ValidationError(`${field} may contain at most ${maxItems} items.`);
  }
  if (maxItemLength !== undefined && value.some((item) => typeof item !== 'string' || item.length > maxItemLength)) {
    throw new ValidationError(`${field} entries must be strings no longer than ${maxItemLength} characters.`);
  }
}

function validateProgramCost(data: Data): void {
  const fields = ['program_fee', 'accommodation_fee', 'extra_fee'];
  if (!fields.every((field) => typeof data[field] === 'number' && Number.isFinite(data[field] as number))) return;
  data.total_fee = fields.reduce((total, field) => total + Number(data[field]), 0);
}

function validateProgramProvider(data: Data): void {
  if (data.is_main === true && data.relationship_type !== 'owner') {
    throw new ValidationError('The main provider must be the owner relationship.');
  }
}

function validateChronology(data: Data, startField: string, endField: string, label: string): void {
  if (data[startField] === undefined || data[endField] === undefined || data[endField] === null) return;
  const start = new Date(String(data[startField]));
  const end = new Date(String(data[endField]));
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end < start) {
    throw new ValidationError(`${label} end must not be before its start.`);
  }
}

function validatePhoneE164(data: Data): void {
  if (!hasOwn(data, 'phone_e164')) return;
  const value = data.phone_e164;
  if (value === '' || value === null || value === undefined) return;
  if (typeof value !== 'string' || !/^\+[1-9]\d{1,14}$/.test(value)) {
    throw new ValidationError('phone_e164 must be a valid E.164 phone number.');
  }
}

function validateSavedItemArrays(data: Data): void {
  const limits: Record<string, number> = {
    programs: 10,
    scholarships: 50,
    postcards: 100,
    resources: 50,
  };
  for (const [field, maxItems] of Object.entries(limits)) {
    if (!hasOwn(data, field)) continue;
    assertArray(data[field], field, maxItems);
    if ((data[field] as unknown[]).some((item) => !Number.isInteger(item))) {
      throw new ValidationError(`${field} entries must be integer IDs.`);
    }
  }
}

function validateBackgroundArrays(data: Data): void {
  if (hasOwn(data, 'interested_regions')) assertArray(data.interested_regions, 'interested_regions', Number.MAX_SAFE_INTEGER, 32);
  if (hasOwn(data, 'completed_steps')) assertArray(data.completed_steps, 'completed_steps', Number.MAX_SAFE_INTEGER, 64);
}

async function assertMorphTarget(
  strapi: Core.Strapi,
  data: Data,
  field: string,
  allowedUids?: ReadonlySet<string>,
): Promise<void> {
  if (!hasOwn(data, field)) return;
  const relation = relationReference(data[field]);
  if (!relation) {
    throw new ValidationError(`${field} must be a native Strapi polymorphic relation with id and __type.`);
  }
  if (allowedUids && !allowedUids.has(relation.uid)) {
    throw new ValidationError(`${field} cannot target ${relation.uid}.`);
  }

  if (!strapi.db.metadata.get(relation.uid)) {
    throw new ValidationError(`${field} target type is not installed: ${relation.uid}.`);
  }

  const target = await strapi.db.query(relation.uid).findOne({ where: { id: relation.id } });
  if (!target) {
    throw new ValidationError(`${field} target does not exist.`);
  }
}
function galleryReferences(value: unknown): Data[] {
  const candidates = Array.isArray(value)
    ? value
    : isRecord(value)
      ? [
          ...(Array.isArray(value.set) ? value.set : []),
          ...(Array.isArray(value.connect) ? value.connect : []),
        ]
      : [];

  const references = new Map<string, Data>();
  for (const candidate of candidates) {
    const reference: Data = isRecord(candidate) ? candidate : { id: candidate };
    const id = reference.id;
    const documentId = reference.documentId;
    if (typeof id !== 'number' && typeof id !== 'string' && typeof documentId !== 'string') {
      throw new ValidationError('Article gallery entries must reference EditorialAsset records.');
    }
    references.set(documentId ? `document:${documentId}` : `id:${String(id)}`, reference);
  }
  return [...references.values()];
}

async function validateArticleGallery(strapi: Core.Strapi, value: unknown): Promise<void> {
  for (const reference of galleryReferences(value)) {
    const where = typeof reference.documentId === 'string'
      ? { documentId: reference.documentId }
      : { id: reference.id };
    const asset = await strapi.db.query(EDITORIAL_ASSET_UID).findOne({ where });
    if (!isRecord(asset)) {
      throw new ValidationError('Article gallery asset does not exist.');
    }
    if (typeof asset.mime_type !== 'string' || !asset.mime_type.startsWith('image/')) {
      throw new ValidationError('Article galleries may contain only EditorialAsset images.');
    }
  }
}

async function validateEditorialImageAsset(
  strapi: Core.Strapi,
  value: unknown,
  field: string,
): Promise<void> {
  const id = relationId(value);
  if (id === undefined) throw new ValidationError(`${field} must reference an EditorialAsset image.`);
  const asset = await strapi.db.query(EDITORIAL_ASSET_UID).findOne({ where: { id } });
  if (!isRecord(asset) || typeof asset.mime_type !== 'string' || !asset.mime_type.startsWith('image/')) {
    throw new ValidationError(`${field} must reference an EditorialAsset image.`);
  }
}

function validateCatalogAsset(data: Data): void {
  for (const field of ['name', 'alt_text'] as const) {
    if (!hasOwn(data, field)) continue;
    if (typeof data[field] !== 'string' || data[field].trim() === '') {
      throw new ValidationError(`CatalogAsset ${field} cannot be blank.`);
    }
    data[field] = data[field].trim();
  }
  if (hasOwn(data, 'source_url') && data.source_url !== null && data.source_url !== '') {
    try {
      const sourceUrl = new URL(String(data.source_url));
      if (sourceUrl.protocol !== 'http:' && sourceUrl.protocol !== 'https:') throw new Error('unsupported protocol');
    } catch {
      throw new ValidationError('CatalogAsset source_url must be an absolute HTTP(S) URL.');
    }
  }
}

/** Apply non-workflow validation rules to an incoming model mutation. */
export async function validateDomainWrite(
  strapi: Core.Strapi,
  event: LifecycleEvent,
  data: Data,
  creating: boolean,
): Promise<void> {
  const uid = event.model.uid;
  const current = creating ? undefined : await existingRecord(strapi, event);
  const effective = { ...(current ?? {}), ...data };

  if (uid === SITE_PROPERTY_UID) {
    validateSiteProperty({
      type: 'string',
      is_public: false,
      json_schema: {},
      ...effective,
    } as SitePropertyRecord);
  }
  if (uid === LANG_UID && hasOwn(data, 'code')) data.code = normalizeLanguageTag(data.code);
  if (uid === RESOURCE_TAG_UID && hasOwn(data, 'name')) {
    if (typeof data.name !== 'string' || data.name.trim() === '') throw new ValidationError('Resource tag names cannot be blank.');
    data.name = data.name.trim();
  }
  if (uid === ARTICLE_UID && hasOwn(data, 'gallery')) await validateArticleGallery(strapi, data.gallery);
  if (uid === ARTICLE_UID && hasOwn(data, 'banner_img')) await validateEditorialImageAsset(strapi, data.banner_img, 'banner_img');
  if (uid === UPDATE_UID && hasOwn(data, 'image')) await validateEditorialImageAsset(strapi, data.image, 'image');
  if (uid === PROGRAM_COST_UID) {
    validateProgramCost(effective);
    if (effective.total_fee !== undefined) data.total_fee = effective.total_fee;
  }
  if (uid === PROGRAM_PROVIDER_UID) validateProgramProvider(effective);
  if (uid === PROGRAM_TERM_UID) validateChronology(effective, 'start_date_time', 'end_date_time', 'Program term');
  if (uid === TOP_PICK_UID) validateChronology(effective, 'starts_at', 'ends_at', 'Top pick');
  if (uid === USER_SENSITIVE_INFO_UID) validatePhoneE164(data);
  if (uid === USER_SAVED_ITEMS_UID) validateSavedItemArrays(data);
  if (uid === GLOBAL_BACKGROUND_UID) validateBackgroundArrays(data);
  if (uid === COMMENT_UID || uid === LIKE_UID) await assertMorphTarget(strapi, data, 'subject', COMMENTABLE_UIDS);
  if (uid === SAVED_RESOURCE_UID) await assertMorphTarget(strapi, data, 'resource', RESOURCE_UIDS);
  if (uid === ACTIVITY_UID) await assertMorphTarget(strapi, data, 'subject');
  if (uid === ASSET_PLACEMENT_UID) await assertMorphTarget(strapi, data, 'owner');
  if (uid === CATALOG_ASSET_UID) validateCatalogAsset(data);
}
