export type AttributeExpression = Readonly<{ kind: 'attribute'; field: string; lower?: boolean }>;
export type MorphExpression = Readonly<{ kind: 'morph-type' | 'morph-id'; field: string }>;
export type ConstraintExpression = AttributeExpression | MorphExpression;
export type UniqueIndexOption = Readonly<{ kind: 'unique'; uid: string; name: string; fields: readonly string[]; expressions?: readonly ConstraintExpression[]; predicate?: (columns: Record<string, string>) => string }>;
export type CheckOption = Readonly<{ kind: 'check'; uid: string; name: string; fields: readonly string[]; expression: (columns: Record<string, string>) => string }>;
export type ConstraintOption = UniqueIndexOption | CheckOption;
const unique = (uid: string, name: string, fields: readonly string[], options: Omit<UniqueIndexOption, 'kind' | 'uid' | 'name' | 'fields'> = {}): UniqueIndexOption => ({ kind: 'unique', uid, name, fields, ...options });
const check = (uid: string, name: string, fields: readonly string[], expression: CheckOption['expression']): CheckOption => ({ kind: 'check', uid, name, fields, expression });
const publicationLifecycleOptions = (uid: string, prefix: string): readonly CheckOption[] => [
  check(uid, `${prefix}_scheduled_at_check`, ['publication_status', 'scheduled_at'], ({ publication_status, scheduled_at }) => `(${publication_status} <> 'scheduled' OR ${scheduled_at} IS NOT NULL)`),
  check(uid, `${prefix}_published_at_check`, ['publication_status', 'publishedAt'], ({ publication_status, publishedAt }) => `(${publication_status} <> 'published' OR ${publishedAt} IS NOT NULL)`),
  check(uid, `${prefix}_archived_at_check`, ['publication_status', 'archived_at'], ({ publication_status, archived_at }) => `(${publication_status} <> 'archived' OR ${archived_at} IS NOT NULL)`),
];
export const DJANGO_CONSTRAINT_OPTIONS: readonly ConstraintOption[] = [
  unique('api::program-location.program-location', 'rwm_program_location_program_city_state_uniq', ['program', 'city', 'state']),
  unique('api::program-provider.program-provider', 'rwm_program_provider_program_provider_uniq', ['program', 'provider']),
  unique('api::program-provider.program-provider', 'rwm_program_provider_main_per_program_uniq', ['program', 'is_main'], { expressions: [{ kind: 'attribute', field: 'program' }], predicate: ({ is_main }) => `${is_main} IS TRUE` }),
  unique('api::program-provider.program-provider', 'rwm_program_provider_owner_per_program_uniq', ['program', 'relationship_type'], { expressions: [{ kind: 'attribute', field: 'program' }], predicate: ({ relationship_type }) => `${relationship_type} = 'owner'` }),
  check('api::program-provider.program-provider', 'rwm_program_provider_main_is_owner_check', ['is_main', 'relationship_type'], ({ is_main, relationship_type }) => `(${is_main} IS NOT TRUE OR ${relationship_type} = 'owner')`),
  check('api::program-term.program-term', 'rwm_program_term_end_after_start_check', ['end_date_time', 'start_date_time'], ({ end_date_time, start_date_time }) => `${end_date_time} >= ${start_date_time}`),
  unique('api::program-term.program-term', 'rwm_program_term_program_window_uniq', ['program', 'title', 'start_date_time', 'end_date_time']),
  check('api::author.author', 'rwm_author_identity_owner_check', ['identity_type', 'associated_user'], ({ identity_type, associated_user }) => `((${identity_type} = 'member' AND ${associated_user} IS NOT NULL) OR (${identity_type} IN ('contributor', 'anonymized') AND ${associated_user} IS NULL))`),
  unique('api::like.like', 'rwm_like_author_target_uniq', ['author'], { expressions: [{ kind: 'attribute', field: 'author' }, { kind: 'morph-type', field: 'subject' }, { kind: 'morph-id', field: 'subject' }], predicate: ({ author }) => `${author} IS NOT NULL` }),
  ...publicationLifecycleOptions('api::post.post', 'rwm_post'),
  ...publicationLifecycleOptions('api::article.article', 'rwm_article'),
  ...publicationLifecycleOptions('api::resource.resource', 'rwm_resource'),
  ...publicationLifecycleOptions('api::update.update', 'rwm_update'),
  ...publicationLifecycleOptions('api::tip.tip', 'rwm_tip'),
  ...publicationLifecycleOptions('api::guide.guide', 'rwm_guide'),
  ...publicationLifecycleOptions('api::itinerary.itinerary', 'rwm_itinerary'),
  ...publicationLifecycleOptions('api::academic-resource.academic-resource', 'rwm_academic_resource'),
  ...publicationLifecycleOptions('api::cultural-resource.cultural-resource', 'rwm_cultural_resource'),
  ...publicationLifecycleOptions('api::editorial-asset.editorial-asset', 'rwm_editorial_asset_publication'),
  unique('api::article-location.article-location', 'rwm_article_location_city_country_ci_uniq', ['city', 'country'], { expressions: [{ kind: 'attribute', field: 'city', lower: true }, { kind: 'attribute', field: 'country', lower: true }] }),
  unique('api::top-pick-article.top-pick-article', 'rwm_top_pick_slot_start_uniq', ['slot_key', 'starts_at']),
  check('api::top-pick-article.top-pick-article', 'rwm_top_pick_end_after_start_check', ['ends_at', 'starts_at'], ({ ends_at, starts_at }) => `(${ends_at} IS NULL OR ${ends_at} > ${starts_at})`),
  unique('api::resource-tag.resource-tag', 'rwm_resource_tag_name_ci_uniq', ['name'], { expressions: [{ kind: 'attribute', field: 'name', lower: true }] }),
  check('api::editorial-asset.editorial-asset', 'rwm_editorial_asset_ready_metadata_check', ['status', 'byte_size', 'ready_at'], ({ status, byte_size, ready_at }) => `(${status} <> 'ready' OR (${byte_size} IS NOT NULL AND ${ready_at} IS NOT NULL))`),
  check('api::editorial-asset.editorial-asset', 'rwm_editorial_asset_failed_timestamp_check', ['status', 'failed_at'], ({ status, failed_at }) => `(${status} <> 'failed' OR ${failed_at} IS NOT NULL)`),
  unique('api::editorial-asset-placement.editorial-asset-placement', 'rwm_asset_placement_owner_role_position_uniq', ['role', 'position'], { expressions: [{ kind: 'morph-type', field: 'owner' }, { kind: 'morph-id', field: 'owner' }, { kind: 'attribute', field: 'role' }, { kind: 'attribute', field: 'position' }] }),
  unique('api::editorial-asset-placement.editorial-asset-placement', 'rwm_asset_placement_owner_role_asset_uniq', ['role', 'asset'], { expressions: [{ kind: 'morph-type', field: 'owner' }, { kind: 'morph-id', field: 'owner' }, { kind: 'attribute', field: 'role' }, { kind: 'attribute', field: 'asset' }] }),
  unique('api::user-badge.user-badge', 'rwm_user_badge_profile_badge_uniq', ['user_profile', 'badge']), unique('api::saved-program.saved-program', 'rwm_saved_program_user_program_uniq', ['user', 'program']), unique('api::saved-scholarship.saved-scholarship', 'rwm_saved_scholarship_user_scholarship_uniq', ['user', 'scholarship']), unique('api::saved-postcard.saved-postcard', 'rwm_saved_postcard_user_article_uniq', ['user', 'article']), unique('api::saved-resource.saved-resource', 'rwm_saved_resource_user_resource_uniq', ['user'], { expressions: [{ kind: 'attribute', field: 'user' }, { kind: 'morph-type', field: 'resource' }, { kind: 'morph-id', field: 'resource' }] }),
  check('api::tracked-application.tracked-application', 'rwm_tracked_application_progress_range_check', ['progress'], ({ progress }) => `(${progress} >= 0 AND ${progress} <= 100)`),
  check('api::tracked-application.tracked-application', 'rwm_tracked_application_exact_target_check', ['type', 'for_scholarship', 'for_program', 'for_external'], ({ type, for_scholarship, for_program, for_external }) => `(( ${type} = 'scholarship' AND ${for_scholarship} IS NOT NULL AND ${for_program} IS NULL AND ${for_external} IS NULL) OR (${type} = 'program' AND ${for_scholarship} IS NULL AND ${for_program} IS NOT NULL AND ${for_external} IS NULL) OR (${type} = 'ext' AND ${for_scholarship} IS NULL AND ${for_program} IS NULL AND ${for_external} IS NOT NULL))`),
  check('api::tracked-application.tracked-application', 'rwm_tracked_application_submission_consistent_check', ['submitted', 'status', 'submission_on'], ({ submitted, status, submission_on }) => `((${submitted} = FALSE AND ${status} <> 'submitted' AND ${submission_on} IS NULL) OR (${submitted} = TRUE AND ${status} = 'submitted' AND ${submission_on} IS NOT NULL))`),
  unique('api::tracked-application.tracked-application', 'rwm_tracked_application_user_scholarship_uniq', ['user', 'for_scholarship'], { predicate: ({ for_scholarship }) => `${for_scholarship} IS NOT NULL` }), unique('api::tracked-application.tracked-application', 'rwm_tracked_application_user_program_uniq', ['user', 'for_program'], { predicate: ({ for_program }) => `${for_program} IS NOT NULL` }), unique('api::tracked-application.tracked-application', 'rwm_tracked_application_user_external_uniq', ['user', 'for_external'], { predicate: ({ for_external }) => `${for_external} IS NOT NULL` }),
  unique('api::ui-string-translation.ui-string-translation', 'rwm_ui_string_translation_string_language_uniq', ['ui_string', 'language']),
];
export const PROGRAM_PROVIDER_MAIN_SYNC_OPTION = { sourceUid: 'api::program-provider.program-provider', sourceFields: ['program', 'provider', 'is_main'], parentUid: 'api::program.program', parentId: 'id', parentField: 'provider', conditionField: 'is_main', conditionValue: true, functionName: 'rwm_program_provider_main_sync_fn', triggerName: 'rwm_program_provider_main_sync' } as const;
