import type { Core } from '@strapi/strapi';
import { ARTICLE_LOCATION_DEFAULT_ID } from '../options/constants';

/**
 * Strapi creates direct relation foreign keys with `ON DELETE SET NULL`.
 * Django's `on_delete` is more varied, so the parity layer installs one
 * PostgreSQL `BEFORE DELETE` trigger for each referenced table. The trigger
 * performs the Django action before Strapi's generated foreign key action can
 * run.
 *
 * This is intentionally a database policy, rather than a Document Service
 * lifecycle: it also applies to deletes issued by the query engine, the admin,
 * and direct SQL. It is PostgreSQL-only because the production parity target
 * uses PostgreSQL and the implementation depends on PL/pgSQL trigger bodies.
 *
 * Deliberate limits:
 * - Native Strapi morph relations do not have a physical cross-table foreign
 *   key. Their target existence is validated in `workflows/validation-hooks`.
 *   Comment/Like cascade and counter behavior is installed separately by the
 *   community workflow trigger layer.
 * - Strapi's many-to-many join tables retain Strapi's own lifecycle and are
 *   not redefined here.
 * - Django multi-table inheritance is represented as ordinary one-to-one
 *   Strapi records. The parent -> child `CASCADE` direction is covered, while
 *   deleting a child cannot also delete its parent without introducing a
 *   destructive bidirectional trigger cycle.
 */

export type DjangoDeleteAction = 'cascade' | 'protect' | 'set-null' | 'set-default';

export type DjangoDeletePolicy = Readonly<{
  /** The model being deleted (the Django relation target). */
  parentUid: string;
  /** The model that owns the direct Strapi foreign-key column. */
  childUid: string;
  /** The owning relation attribute on `childUid`. */
  relation: string;
  action: DjangoDeleteAction;
  /** Only valid for Django `SET_DEFAULT`; Article.location defaults to id 1. */
  defaultValue?: number;
  /** Human-readable source field used in PostgreSQL error details. */
  source: string;
}>;

/**
 * Every direct ForeignKey / OneToOneField in the non-auth Django domain.
 * SET_NULL mappings are retained explicitly so a database configured with a
 * changed Strapi FK default still keeps the Django action.
 *
 * The auth user itself is intentionally a Strapi Users & Permissions model,
 * but its relations to the ported application models are still included.
 */
export const DJANGO_DELETE_POLICIES: readonly DjangoDeletePolicy[] = [
  // catalog.programs
  {
    parentUid: 'api::program.program',
    childUid: 'api::program-location.program-location',
    relation: 'program',
    action: 'cascade',
    source: 'ProgramLocation.program',
  },
  {
    parentUid: 'api::program.program',
    childUid: 'api::program-cost.program-cost',
    relation: 'program',
    action: 'cascade',
    source: 'ProgramCost.program',
  },
  {
    parentUid: 'api::program.program',
    childUid: 'api::program-campus.program-campus',
    relation: 'program',
    action: 'cascade',
    source: 'ProgramCampus.program',
  },
  {
    parentUid: 'api::program.program',
    childUid: 'api::program-requirement.program-requirement',
    relation: 'program',
    action: 'cascade',
    source: 'ProgramRequirements.program',
  },
  {
    parentUid: 'api::program.program',
    childUid: 'api::program-accomodation.program-accomodation',
    relation: 'program',
    action: 'cascade',
    source: 'ProgramAccomodations.program',
  },
  {
    parentUid: 'api::program.program',
    childUid: 'api::program-application-step.program-application-step',
    relation: 'program',
    action: 'cascade',
    source: 'ProgramApplicationStep.program',
  },
  {
    parentUid: 'api::program.program',
    childUid: 'api::program-testimonial.program-testimonial',
    relation: 'program',
    action: 'cascade',
    source: 'ProgramTestimonial.program',
  },
  {
    parentUid: 'api::program.program',
    childUid: 'api::program-academic.program-academic',
    relation: 'program',
    action: 'cascade',
    source: 'ProgramAcademics.program',
  },
  {
    parentUid: 'api::program.program',
    childUid: 'api::program-provider.program-provider',
    relation: 'program',
    action: 'cascade',
    source: 'ProgramProvider.program',
  },
  {
    parentUid: 'api::program.program',
    childUid: 'api::program-term.program-term',
    relation: 'program',
    action: 'cascade',
    source: 'ProgramTerm.program',
  },
  {
    parentUid: 'api::program.program',
    childUid: 'api::tracked-application.tracked-application',
    relation: 'for_program',
    action: 'protect',
    source: 'TrackedApplication.for_program',
  },
  {
    parentUid: 'api::program.program',
    childUid: 'api::saved-program.saved-program',
    relation: 'program',
    action: 'cascade',
    source: 'SavedProgram.program',
  },
  {
    parentUid: 'api::program.program',
    childUid: 'api::user-global-education-info.user-global-education-info',
    relation: 'current_program',
    action: 'set-null',
    source: 'UserGlobalEducationInfo.current_program',
  },
  {
    parentUid: 'api::provider.provider',
    childUid: 'api::program.program',
    relation: 'provider',
    action: 'protect',
    source: 'Program.provider',
  },
  {
    parentUid: 'api::provider.provider',
    childUid: 'api::program-provider.program-provider',
    relation: 'provider',
    action: 'protect',
    source: 'ProgramProvider.provider',
  },
  {
    parentUid: 'api::provider.provider',
    childUid: 'api::scholarship.scholarship',
    relation: 'provider',
    action: 'cascade',
    source: 'Scholarship.provider',
  },
  {
    parentUid: 'api::university.university',
    childUid: 'api::provider.provider',
    relation: 'university',
    action: 'protect',
    source: 'Provider.university',
  },
  {
    parentUid: 'api::university.university',
    childUid: 'api::user-education-info.user-education-info',
    relation: 'university',
    action: 'protect',
    source: 'UserEducationInfo.university',
  },
  {
    parentUid: 'api::provider-contact-info.provider-contact-info',
    childUid: 'api::provider.provider',
    relation: 'contact',
    action: 'protect',
    source: 'Provider.contact',
  },
  {
    parentUid: 'api::provider-address.provider-address',
    childUid: 'api::provider-contact-info.provider-contact-info',
    relation: 'address',
    action: 'protect',
    source: 'ProviderContactInfo.address',
  },
  {
    parentUid: 'api::university-contact-info.university-contact-info',
    childUid: 'api::university.university',
    relation: 'contact_info',
    action: 'set-null',
    source: 'University.contact_info',
  },
  {
    parentUid: 'api::university-location.university-location',
    childUid: 'api::university.university',
    relation: 'location',
    action: 'set-null',
    source: 'University.location',
  },
  {
    parentUid: 'api::university-social-media-link.university-social-media-link',
    childUid: 'api::university.university',
    relation: 'social_media_links',
    action: 'set-null',
    source: 'University.social_media_links',
  },
  {
    parentUid: 'api::university-school-url.university-school-url',
    childUid: 'api::university.university',
    relation: 'school_urls',
    action: 'set-null',
    source: 'University.school_urls',
  },
  {
    parentUid: 'api::university-academic-stat.university-academic-stat',
    childUid: 'api::university.university',
    relation: 'academic_stats',
    action: 'set-null',
    source: 'University.academic_stats',
  },
  {
    parentUid: 'api::university-campus-life.university-campus-life',
    childUid: 'api::university.university',
    relation: 'campus_life',
    action: 'set-null',
    source: 'University.campus_life',
  },

  // catalog.scholarships
  {
    parentUid: 'api::scholarship-requirement.scholarship-requirement',
    childUid: 'api::scholarship.scholarship',
    relation: 'requirements',
    action: 'cascade',
    source: 'Scholarship.requirements',
  },
  {
    parentUid: 'api::scholarship.scholarship',
    childUid: 'api::scholarship-event.scholarship-event',
    relation: 'scholarship',
    action: 'cascade',
    source: 'ScholarshipEvent.scholarship',
  },
  {
    parentUid: 'api::scholarship.scholarship',
    childUid: 'api::scholarship-application-process-step.scholarship-application-process-step',
    relation: 'scholarship',
    action: 'cascade',
    source: 'ScholarshipApplicationProcessStep.scholarship',
  },
  {
    parentUid: 'api::scholarship.scholarship',
    childUid: 'api::tracked-application.tracked-application',
    relation: 'for_scholarship',
    action: 'protect',
    source: 'TrackedApplication.for_scholarship',
  },
  {
    parentUid: 'api::scholarship.scholarship',
    childUid: 'api::saved-scholarship.saved-scholarship',
    relation: 'scholarship',
    action: 'cascade',
    source: 'SavedScholarship.scholarship',
  },

  // community and journeys
  {
    parentUid: 'api::post-category.post-category',
    childUid: 'api::post.post',
    relation: 'category',
    action: 'set-null',
    source: 'Post.category',
  },
  {
    parentUid: 'api::author.author',
    childUid: 'api::comment.comment',
    relation: 'author',
    action: 'protect',
    source: 'Comment.author',
  },
  {
    parentUid: 'api::author.author',
    childUid: 'api::like.like',
    relation: 'author',
    action: 'protect',
    source: 'Like.author',
  },
  {
    parentUid: 'api::author.author',
    childUid: 'api::post.post',
    relation: 'author',
    action: 'protect',
    source: 'Post.author',
  },
  {
    parentUid: 'api::author.author',
    childUid: 'api::article.article',
    relation: 'author',
    action: 'protect',
    source: 'Article.author',
  },
  {
    parentUid: 'api::author.author',
    childUid: 'api::resource.resource',
    relation: 'author',
    action: 'protect',
    source: 'Resource.author',
  },
  {
    parentUid: 'api::author.author',
    childUid: 'api::tip.tip',
    relation: 'author',
    action: 'protect',
    source: 'Tip.author',
  },
  {
    parentUid: 'api::author.author',
    childUid: 'api::guide.guide',
    relation: 'author',
    action: 'protect',
    source: 'Guide.author',
  },
  {
    parentUid: 'api::author.author',
    childUid: 'api::itinerary.itinerary',
    relation: 'author',
    action: 'protect',
    source: 'Itinerary.author',
  },
  {
    parentUid: 'api::author.author',
    childUid: 'api::academic-resource.academic-resource',
    relation: 'author',
    action: 'protect',
    source: 'AcademicResource.author',
  },
  {
    parentUid: 'api::author.author',
    childUid: 'api::cultural-resource.cultural-resource',
    relation: 'author',
    action: 'protect',
    source: 'CulturalResource.author',
  },
  {
    parentUid: 'api::external-tracked-application.external-tracked-application',
    childUid: 'api::tracked-application.tracked-application',
    relation: 'for_external',
    action: 'protect',
    source: 'TrackedApplication.for_external',
  },

  // editorial
  {
    parentUid: 'api::article-location.article-location',
    childUid: 'api::article.article',
    relation: 'location',
    action: 'set-default',
    defaultValue: ARTICLE_LOCATION_DEFAULT_ID,
    source: 'Article.location',
  },
  {
    parentUid: 'api::article-category.article-category',
    childUid: 'api::article.article',
    relation: 'category',
    action: 'set-null',
    source: 'Article.category',
  },
  {
    parentUid: 'api::article.article',
    childUid: 'api::top-pick-article.top-pick-article',
    relation: 'article',
    action: 'protect',
    source: 'TopPickArticle.article',
  },
  {
    parentUid: 'api::article.article',
    childUid: 'api::saved-postcard.saved-postcard',
    relation: 'article',
    action: 'cascade',
    source: 'SavedPostcard.article',
  },
  {
    parentUid: 'api::update-category.update-category',
    childUid: 'api::update.update',
    relation: 'category',
    action: 'set-null',
    source: 'Update.category',
  },
  {
    parentUid: 'api::editorial-asset.editorial-asset',
    childUid: 'api::editorial-asset-placement.editorial-asset-placement',
    relation: 'asset',
    action: 'protect',
    source: 'EditorialAssetPlacement.asset',
  },

  // siteconfig
  {
    parentUid: 'api::ui-string.ui-string',
    childUid: 'api::ui-string-translation.ui-string-translation',
    relation: 'ui_string',
    action: 'cascade',
    source: 'UIStringTranslation.ui_string',
  },
  {
    parentUid: 'api::lang.lang',
    childUid: 'api::ui-string-translation.ui-string-translation',
    relation: 'language',
    action: 'cascade',
    source: 'UIStringTranslation.language',
  },

  // Non-auth models that point to the Strapi Users & Permissions user.
  {
    parentUid: 'plugin::users-permissions.user',
    childUid: 'api::author.author',
    relation: 'associated_user',
    action: 'set-null',
    source: 'Author.associated_user',
  },
  {
    parentUid: 'plugin::users-permissions.user',
    childUid: 'api::editorial-asset.editorial-asset',
    relation: 'uploaded_by',
    action: 'set-null',
    source: 'EditorialAsset.uploaded_by',
  },
  {
    parentUid: 'plugin::users-permissions.user',
    childUid: 'api::tracked-application.tracked-application',
    relation: 'user',
    action: 'cascade',
    source: 'TrackedApplication.user',
  },
  {
    parentUid: 'plugin::users-permissions.user',
    childUid: 'api::user-sensitive-info.user-sensitive-info',
    relation: 'user',
    action: 'cascade',
    source: 'UserSensitiveInfo.user',
  },
  {
    parentUid: 'plugin::users-permissions.user',
    childUid: 'api::user-education-info.user-education-info',
    relation: 'user',
    action: 'cascade',
    source: 'UserEducationInfo.user',
  },
  {
    parentUid: 'plugin::users-permissions.user',
    childUid: 'api::user-global-education-info.user-global-education-info',
    relation: 'user',
    action: 'cascade',
    source: 'UserGlobalEducationInfo.user',
  },
  {
    parentUid: 'plugin::users-permissions.user',
    childUid: 'api::global-background.global-background',
    relation: 'user',
    action: 'cascade',
    source: 'GlobalBackground.user',
  },
  {
    parentUid: 'plugin::users-permissions.user',
    childUid: 'api::user-profile-info.user-profile-info',
    relation: 'user',
    action: 'cascade',
    source: 'UserProfileInfo.user',
  },
  {
    parentUid: 'plugin::users-permissions.user',
    childUid: 'api::saved-program.saved-program',
    relation: 'user',
    action: 'cascade',
    source: 'SavedProgram.user',
  },
  {
    parentUid: 'plugin::users-permissions.user',
    childUid: 'api::saved-scholarship.saved-scholarship',
    relation: 'user',
    action: 'cascade',
    source: 'SavedScholarship.user',
  },
  {
    parentUid: 'plugin::users-permissions.user',
    childUid: 'api::saved-postcard.saved-postcard',
    relation: 'user',
    action: 'cascade',
    source: 'SavedPostcard.user',
  },
  {
    parentUid: 'plugin::users-permissions.user',
    childUid: 'api::saved-resource.saved-resource',
    relation: 'user',
    action: 'cascade',
    source: 'SavedResource.user',
  },
  {
    parentUid: 'plugin::users-permissions.user',
    childUid: 'api::user-profile-activity.user-profile-activity',
    relation: 'user',
    action: 'set-null',
    source: 'UserProfileActivity.user',
  },

  // members.private and members.users
  {
    parentUid: 'api::address-info.address-info',
    childUid: 'api::user-sensitive-info.user-sensitive-info',
    relation: 'location_info',
    action: 'set-null',
    source: 'UserSensitiveInfo.location_info',
  },
  {
    parentUid: 'api::user-profile-info.user-profile-info',
    childUid: 'api::user-badge.user-badge',
    relation: 'user_profile',
    action: 'cascade',
    source: 'UserBadge.user_profile',
  },
  {
    parentUid: 'api::badge.badge',
    childUid: 'api::user-badge.user-badge',
    relation: 'badge',
    action: 'cascade',
    source: 'UserBadge.badge',
  },
];

type MetadataRecord = {
  tableName: string;
  attributes: Record<string, unknown>;
};

type ResolvedDeletePolicy = DjangoDeletePolicy & {
  parentTable: string;
  parentColumn: string;
  childTable: string;
  childColumn: string;
};

const TRIGGER_NAME = 'rwm_django_parity_before_delete';
const ADVISORY_LOCK_KEY = 862_714_235;

const ACTION_ORDER: Readonly<Record<DjangoDeleteAction, number>> = {
  protect: 0,
  'set-default': 1,
  'set-null': 2,
  cascade: 3,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDatabaseIdentifier(value: unknown): value is string {
  // Strapi table and join-column names are identifiers, never SQL fragments.
  return typeof value === 'string' && /^[A-Za-z_][A-Za-z0-9_$]*$/.test(value);
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.split('"').join('""')}"`;
}

function quoteLiteral(value: string): string {
  return `'${value.split("'").join("''")}'`;
}

function warning(strapi: Core.Strapi, message: string): void {
  strapi.log.warn(`[django-parity/delete-policy] ${message}`);
}

function getMetadata(strapi: Core.Strapi, uid: string): MetadataRecord | undefined {
  try {
    const metadata: unknown = strapi.db.metadata.get(uid);
    if (!isRecord(metadata) || !isDatabaseIdentifier(metadata.tableName) || !isRecord(metadata.attributes)) {
      warning(strapi, `Skipping ${uid}: metadata has no safe table name or attributes.`);
      return undefined;
    }

    return {
      tableName: metadata.tableName,
      attributes: metadata.attributes,
    };
  } catch {
    warning(strapi, `Skipping ${uid}: Strapi metadata is unavailable.`);
    return undefined;
  }
}

function resolvePolicy(strapi: Core.Strapi, policy: DjangoDeletePolicy): ResolvedDeletePolicy | undefined {
  const parent = getMetadata(strapi, policy.parentUid);
  const child = getMetadata(strapi, policy.childUid);
  if (!parent || !child) return undefined;

  const relation = child.attributes[policy.relation];
  if (!isRecord(relation) || relation.type !== 'relation') {
    warning(strapi, `Skipping ${policy.source}: ${policy.childUid}.${policy.relation} is not a relation.`);
    return undefined;
  }

  if (relation.target !== policy.parentUid || relation.owner !== true || !isRecord(relation.joinColumn)) {
    warning(
      strapi,
      `Skipping ${policy.source}: expected an owning direct relation from ${policy.childUid} to ${policy.parentUid}.`,
    );
    return undefined;
  }

  const joinColumn = relation.joinColumn;
  if (
    !isDatabaseIdentifier(joinColumn.name) ||
    !isDatabaseIdentifier(joinColumn.referencedColumn) ||
    joinColumn.referencedTable !== parent.tableName
  ) {
    warning(strapi, `Skipping ${policy.source}: direct relation metadata does not match its parent table.`);
    return undefined;
  }

  if (policy.action === 'set-default' && !Number.isSafeInteger(policy.defaultValue)) {
    warning(strapi, `Skipping ${policy.source}: SET_DEFAULT needs an integer default value.`);
    return undefined;
  }

  return {
    ...policy,
    parentTable: parent.tableName,
    parentColumn: joinColumn.referencedColumn,
    childTable: child.tableName,
    childColumn: joinColumn.name,
  };
}

function groupPoliciesByParent(policies: readonly ResolvedDeletePolicy[]): Map<string, ResolvedDeletePolicy[]> {
  const groups = new Map<string, ResolvedDeletePolicy[]>();

  for (const policy of policies) {
    const policiesForParent = groups.get(policy.parentTable) ?? [];
    if (!policiesForParent.some((candidate) => candidate.childTable === policy.childTable && candidate.childColumn === policy.childColumn)) {
      policiesForParent.push(policy);
    }
    groups.set(policy.parentTable, policiesForParent);
  }

  for (const policiesForParent of groups.values()) {
    policiesForParent.sort((left, right) => {
      const actionOrder = ACTION_ORDER[left.action] - ACTION_ORDER[right.action];
      if (actionOrder !== 0) return actionOrder;
      return left.source.localeCompare(right.source);
    });
  }

  return groups;
}

function stableHash(value: string): string {
  let hash = 5381;
  for (const character of value) {
    hash = (hash * 33) ^ character.charCodeAt(0);
  }
  return (hash >>> 0).toString(36);
}

function triggerFunctionName(parentTable: string): string {
  return `rwm_django_delete_${stableHash(parentTable)}`;
}

function protectSql(policy: ResolvedDeletePolicy): string {
  const parentColumn = quoteIdentifier(policy.parentColumn);
  const childColumn = quoteIdentifier(policy.childColumn);
  const childTable = quoteIdentifier(policy.childTable);
  const message = `Django on_delete=PROTECT prevents deleting ${policy.parentUid}; ${policy.source} still references it.`;
  const detail = `${policy.childTable}.${policy.childColumn} references ${policy.parentTable}.${policy.parentColumn}.`;

  return `
  IF EXISTS (SELECT 1 FROM ${childTable} WHERE ${childColumn} = OLD.${parentColumn}) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = ${quoteLiteral(message)},
      DETAIL = ${quoteLiteral(detail)};
  END IF;`;
}

function cascadeSql(policy: ResolvedDeletePolicy): string {
  return `
  DELETE FROM ${quoteIdentifier(policy.childTable)}
  WHERE ${quoteIdentifier(policy.childColumn)} = OLD.${quoteIdentifier(policy.parentColumn)};`;
}

function setNullSql(policy: ResolvedDeletePolicy): string {
  return `
  UPDATE ${quoteIdentifier(policy.childTable)}
  SET ${quoteIdentifier(policy.childColumn)} = NULL
  WHERE ${quoteIdentifier(policy.childColumn)} = OLD.${quoteIdentifier(policy.parentColumn)};`;
}

function setDefaultSql(policy: ResolvedDeletePolicy): string {
  const defaultValue = policy.defaultValue as number;
  const parentTable = quoteIdentifier(policy.parentTable);
  const parentColumn = quoteIdentifier(policy.parentColumn);
  const childTable = quoteIdentifier(policy.childTable);
  const childColumn = quoteIdentifier(policy.childColumn);
  const message = `Django on_delete=SET_DEFAULT cannot delete ${policy.parentUid}: Article.location default id ${defaultValue} is unavailable.`;

  return `
  IF EXISTS (SELECT 1 FROM ${childTable} WHERE ${childColumn} = OLD.${parentColumn}) THEN
    IF OLD.${parentColumn} = ${defaultValue}
      OR NOT EXISTS (SELECT 1 FROM ${parentTable} WHERE ${parentColumn} = ${defaultValue}) THEN
      RAISE EXCEPTION USING
        ERRCODE = '23503',
        MESSAGE = ${quoteLiteral(message)};
    END IF;

    UPDATE ${childTable}
    SET ${childColumn} = ${defaultValue}
    WHERE ${childColumn} = OLD.${parentColumn};
  END IF;`;
}

function policySql(policy: ResolvedDeletePolicy): string {
  switch (policy.action) {
    case 'protect':
      return protectSql(policy);
    case 'cascade':
      return cascadeSql(policy);
    case 'set-null':
      return setNullSql(policy);
    case 'set-default':
      return setDefaultSql(policy);
  }
}

function createTriggerFunctionSql(parentTable: string, policies: readonly ResolvedDeletePolicy[]): string {
  const functionName = quoteIdentifier(triggerFunctionName(parentTable));
  const statements = policies.map(policySql).join('\n');

  return `
CREATE OR REPLACE FUNCTION ${functionName}()
RETURNS trigger
LANGUAGE plpgsql
AS $rwm_django_delete$
BEGIN
${statements}
  RETURN OLD;
END;
$rwm_django_delete$;`;
}

function createTriggerSql(parentTable: string): string {
  const quotedTable = quoteIdentifier(parentTable);
  const quotedTrigger = quoteIdentifier(TRIGGER_NAME);
  const quotedFunction = quoteIdentifier(triggerFunctionName(parentTable));

  return `
DROP TRIGGER IF EXISTS ${quotedTrigger} ON ${quotedTable};
CREATE TRIGGER ${quotedTrigger}
BEFORE DELETE ON ${quotedTable}
FOR EACH ROW
EXECUTE FUNCTION ${quotedFunction}();`;
}

/** Kept exported for a narrow, database-free unit test surface. */
export function isPostgresClient(client: unknown): boolean {
  return typeof client === 'string' && ['pg', 'postgres', 'postgresql'].includes(client.toLowerCase());
}

function isPostgresDatabase(strapi: Core.Strapi): boolean {
  return isPostgresClient(strapi.db.config.connection.client) || isPostgresClient(strapi.db.getInfo().client);
}

/**
 * Install idempotent PostgreSQL triggers that reproduce Django's direct
 * `on_delete` actions. It intentionally does nothing for SQLite, MySQL, and
 * any incomplete/renamed metadata rather than guessing physical table names.
 */
export async function installDjangoParityDeletePolicy(strapi: Core.Strapi): Promise<void> {
  if (!isPostgresDatabase(strapi)) {
    strapi.log.info('[django-parity/delete-policy] Skipped: database client is not PostgreSQL.');
    return;
  }

  const resolvedPolicies = DJANGO_DELETE_POLICIES.flatMap((policy) => {
    const resolved = resolvePolicy(strapi, policy);
    return resolved ? [resolved] : [];
  });
  const groups = groupPoliciesByParent(resolvedPolicies);

  if (groups.size === 0) {
    warning(strapi, 'No delete policies matched live Strapi metadata; no triggers were installed.');
    return;
  }

  await strapi.db.connection.transaction(async (transaction) => {
    // Multiple application instances can bootstrap together. The advisory lock
    // makes the DROP/CREATE trigger pair deterministic without touching data.
    await transaction.raw('SELECT pg_advisory_xact_lock(?)', [ADVISORY_LOCK_KEY]);

    for (const [parentTable, policies] of groups) {
      await transaction.raw(createTriggerFunctionSql(parentTable, policies));
      await transaction.raw(createTriggerSql(parentTable));
    }
  });

  strapi.log.info(
    `[django-parity/delete-policy] Installed ${resolvedPolicies.length} relation actions across ${groups.size} table triggers.`,
  );
}