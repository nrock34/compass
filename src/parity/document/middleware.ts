import { randomUUID } from 'node:crypto';
import type { Core, Modules } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { applyDjangoDocumentOptions, type DocumentData } from './apply-options';
import { isRecord, normalizeDirectRelationWrite } from '../../workflows/validation-types';

function documentData(ctx: Modules.Documents.Middleware.Context): DocumentData | undefined {
  const data = (ctx.params as { data?: unknown }).data;
  return data && typeof data === 'object' && !Array.isArray(data) ? data as DocumentData : undefined;
}

/** Strapi's document-ID transformer explicitly skips useJoinTable:false. */
async function resolveDirectRelations(strapi: Core.Strapi, uid: Modules.Documents.Middleware.Context['uid'], data: DocumentData): Promise<void> {
  for (const [field, attribute] of Object.entries(strapi.getModel(uid).attributes)) {
    if (attribute.type !== 'relation' || !('target' in attribute)
      || attribute.useJoinTable !== false
      || !['oneToOne', 'manyToOne'].includes(attribute.relation)) continue;
    let reference = data[field];
    if (isRecord(reference)) {
      if (Array.isArray(reference.set)) reference = reference.set.at(-1) ?? { set: [] };
      else if (Array.isArray(reference.connect) && reference.connect.length) reference = reference.connect.at(-1);
    }
    if (Array.isArray(reference)) reference = reference.at(-1) ?? { set: [] };
    const documentId = typeof reference === 'string' && !/^\d+$/.test(reference)
      ? reference : isRecord(reference) && typeof reference.documentId === 'string' ? reference.documentId : undefined;
    if (documentId) {
      const related = await strapi.documents(attribute.target).findOne({
        documentId,
        ...(isRecord(reference) && typeof reference.locale === 'string' ? { locale: reference.locale } : {}),
        ...(isRecord(reference) && (reference.status === 'draft' || reference.status === 'published') ? { status: reference.status } : {}),
      });
      if (!related) throw new errors.ValidationError(`${field}: related document was not found.`);
      data[field] = related.id;
    } else {
      const normalized = normalizeDirectRelationWrite(reference);
      if (normalized.action === 'set') data[field] = normalized.value;
      else if (normalized.action === 'omit') delete data[field];
    }
  }
}

export function registerDjangoDocumentParity(strapi: Core.Strapi): void {
  strapi.documents.use(async (ctx, next) => {
    const data = documentData(ctx);
    if (data) {
      applyDjangoDocumentOptions({ uid: ctx.uid, action: ctx.action, data, now: new Date(), uuid: randomUUID });
      if (ctx.action === 'create' || ctx.action === 'update') await resolveDirectRelations(strapi, ctx.uid, data);
    }
    return next();
  });
}
