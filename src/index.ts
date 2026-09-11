import type { Core } from '@strapi/strapi';
import { transitionEditorialPublication, type EditorialTransitionInput } from './workflows/editorial-publications';
import { bootstrapDjangoParity, registerDjangoParity } from './parity';
import { registerApiPermissionsSession } from './api-permissions-session';
import { migrateApiPermissions } from './api-permissions-migration';
import { installCommunityInteractionTriggers } from './workflows/community-interactions';
import { installRwmValidationHooks } from './workflows/validation-hooks';
import { idColumn, morphColumns } from './workflows/community-interaction-support';
import { configureContentManager } from './content-manager';

type WorkflowEnabledStrapi = Core.Strapi & {
  rwmEditorialWorkflow?: {
    transition(input: EditorialTransitionInput): Promise<Record<string, unknown>>;
  };
};

/**
 * The content model is declared directly in the collection-type schemas.
 *
 * The application mirrors the Django domain as standalone Strapi collection
 * types. Bootstrap installs only parity constraints, validation hooks, and
 * lock-safe workflow infrastructure; it does not create alternate model
 * tables, legacy import machinery, or a separate domain plugin.
 */

type LegacyIdParent = { id?: number | string };
type GraphqlDefinitionBuilder = {
  nonNull: {
    id(name: string, config: { resolve(parent: LegacyIdParent): string }): void;
  };
  field(name: string, config: Record<string, unknown>): void;
};

type NexusExtensionApi = {
  extendType(config: { type: string; definition(builder: GraphqlDefinitionBuilder): void }): unknown;
  idArg(): unknown;
  intArg(): unknown;
  stringArg(): unknown;
  list(value: unknown): unknown;
  nonNull(value: unknown): unknown;
};

type GraphqlExtensionService = {
  use(factory: (input: { nexus: NexusExtensionApi }) => {
    types: unknown[];
    resolversConfig: Record<string, unknown>;
  }): void;
};


function legacyRestId(parent: LegacyIdParent): string {
  if (parent.id == null) throw new Error('Legacy REST identifier is unavailable.');
  return String(parent.id);
}

function registerCommunityGraphqlBridge(strapi: Core.Strapi): void {
  const extension = strapi.plugin('graphql').service('extension') as GraphqlExtensionService;
  extension.use(({ nexus }) => ({
    types: [
      nexus.extendType({
        type: 'University',
        definition(t) {
          t.nonNull.id('restId', { resolve: legacyRestId });
        },
      }),
      nexus.extendType({
        type: 'Post',
        definition(t) {
          t.nonNull.id('restId', { resolve: legacyRestId });
          t.field('commentsPage', {
            type: nexus.nonNull(nexus.list(nexus.nonNull('Comment'))),
            args: {
              page: nexus.nonNull(nexus.intArg()),
              pageSize: nexus.nonNull(nexus.intArg()),
              sort: nexus.stringArg(),
            },
            async resolve(
              parent: LegacyIdParent,
              { page, pageSize, sort }: { page: number; pageSize: number; sort?: string },
            ) {
              const subjectId = Number(parent.id);
              if (!Number.isSafeInteger(subjectId) || subjectId <= 0) return [];
              const safePage = Number.isSafeInteger(page) && page > 0 ? page : 1;
              const safePageSize = Number.isSafeInteger(pageSize) && pageSize > 0
                ? Math.min(pageSize, 100)
                : 20;
              const order = sort === 'createdAt:desc' ? 'desc' : 'asc';
              const commentUid = 'api::comment.comment';
              const columns = morphColumns(strapi, commentUid, 'subject');
              const primaryKey = idColumn(strapi, commentUid);
              const tableName = (strapi.db as unknown as {
                metadata: { get(uid: string): { tableName: string } };
              }).metadata.get(commentUid).tableName;
              const idRows = await strapi.db.connection(tableName)
                .select(primaryKey)
                .where({ [columns.id]: subjectId, [columns.type]: 'api::post.post' })
                .orderBy('created_at', order)
                .offset((safePage - 1) * safePageSize)
                .limit(safePageSize) as Array<Record<string, number | string>>;
              const ids = idRows.map((row) => row[primaryKey]);
              if (ids.length === 0) return [];
              const comments = await strapi.db.query(commentUid).findMany({
                where: { id: { $in: ids } },
              }) as Array<Record<string, unknown>>;
              const byId = new Map(comments.map((comment) => [
                String(comment.id),
                { ...comment, documentId: comment.documentId ?? String(comment.id) },
              ]));
              return ids.flatMap((id) => byId.get(String(id)) ?? []);
            },
          });
        },
      }),
      nexus.extendType({
        type: 'Comment',
        definition(t) {
          t.nonNull.id('restId', { resolve: legacyRestId });
        },
      }),
      nexus.extendType({
        type: 'Query',
        definition(t) {
          t.field('postByLegacyId', {
            type: 'Post',
            args: { id: nexus.nonNull(nexus.idArg()) },
            async resolve(_parent: unknown, { id }: { id: string }) {
              const legacyId = Number(id);
              if (!Number.isSafeInteger(legacyId) || legacyId <= 0) return null;
              return strapi.db.query('api::post.post').findOne({
                where: {
                  id: legacyId,
                  published: true,
                  publication_status: 'published',
                },
              });
            },
          });
        },
      }),
    ],
    resolversConfig: {
      'Query.universities_connection': { auth: false },
      'Query.articles_connection': { auth: false },
      'Query.articleCategories_connection': { auth: false },
      'Query.articleTags_connection': { auth: false },
      'Query.resources_connection': { auth: false },
      'Query.academicResources_connection': { auth: false },
      'Query.culturalResources_connection': { auth: false },
      'Query.guides_connection': { auth: false },
      'Query.itineraries_connection': { auth: false },
      'Query.tips_connection': { auth: false },
      'Query.programs_connection': { auth: false },
      'Query.scholarships_connection': { auth: false },
      'Query.posts_connection': { auth: false },
      'Query.postTags_connection': { auth: false },
      'Query.updates_connection': { auth: false },
      'Query.siteProperty': { auth: false },
      'Query.postByLegacyId': { auth: false },
      'Post.commentsPage': { auth: false },
      'Article.location': { auth: false },
      'Article.author': { auth: false },
      'Article.category': { auth: false },
      'Article.tags': { auth: false },
      'Article.banner_img': { auth: false },
      'Article.gallery': { auth: false },
      'Resource.author': { auth: false },
      'Resource.tags': { auth: false },
      'AcademicResource.author': { auth: false },
      'AcademicResource.tags': { auth: false },
      'CulturalResource.author': { auth: false },
      'CulturalResource.tags': { auth: false },
      'Guide.author': { auth: false },
      'Guide.tags': { auth: false },
      'Itinerary.author': { auth: false },
      'Itinerary.tags': { auth: false },
      'Tip.author': { auth: false },
      'Tip.tags': { auth: false },
      'Program.provider': { auth: false },
      'Program.fields': { auth: false },
      'Program.image': { auth: false },
      'Program.gallery': { auth: false },
      'Program.locations': { auth: false },
      'Program.cost': { auth: false },
      'Program.requirements': { auth: false },
      'Program.accomodations': { auth: false },
      'Program.application_steps': { auth: false },
      'Program.testimonials': { auth: false },
      'Program.academics': { auth: false },
      'Provider.contact': { auth: false },
      'Provider.university': { auth: false },
      'ProviderContactInfo.address': { auth: false },
      'University.location': { auth: false },
      'University.contact_info': { auth: false },
      'University.academic_stats': { auth: false },
      'Scholarship.provider': { auth: false },
      'Scholarship.requirements': { auth: false },
      'Scholarship.image': { auth: false },
      'Scholarship.gallery': { auth: false },
      'Scholarship.events': { auth: false },
      'Scholarship.application_steps': { auth: false },
      'EditorialAsset.file': { auth: false },
      'Post.category': { auth: false },
      'Post.author': { auth: false },
      'Post.tags': { auth: false },
      'Comment.author': { auth: false },
      'Update.category': { auth: false },
      'Update.image': { auth: false },
    },
  }));
}



export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerDjangoParity(strapi);
    registerCommunityGraphqlBridge(strapi);
    (strapi as WorkflowEnabledStrapi).rwmEditorialWorkflow = {
      transition: (input) => transitionEditorialPublication(strapi, input),
    };

    strapi.log.info('RWM Django-parity schema registered');
  },
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    registerApiPermissionsSession(strapi);
    await bootstrapDjangoParity(strapi);
    await installCommunityInteractionTriggers(strapi);
    installRwmValidationHooks(strapi);
    await configureContentManager(strapi);
    await migrateApiPermissions(strapi);
    strapi.log.info('RWM Django-parity schema bootstrapped');
  },
};
