export const CACHE_POLICY = {
  cacheableEntities: [
  'academic-resources',
  'article-categories',
  'article-locations',
  'article-tags',
  'articles',
  'authors',
  'badges',
  'catalog-assets',
  'cultural-resources',
  'guides',
  'itineraries',
  'langs',
  'post-categories',
  'post-tags',
  'posts',
  'program-academics',
  'program-accomodations',
  'program-application-steps',
  'program-campuses',
  'program-costs',
  'program-fields',
  'program-locations',
  'program-providers',
  'program-requirements',
  'program-terms',
  'program-testimonials',
  'programs',
  'provider-addresses',
  'provider-contact-infos',
  'providers',
  'resource-tags',
  'resources',
  'scholarship-application-process-steps',
  'scholarship-events',
  'scholarship-requirements',
  'scholarships',
  'site-properties',
  'tips',
  'top-pick-article',
  'ui-string-translations',
  'ui-strings',
  'universities',
  'university-academic-stats',
  'university-campus-lives',
  'university-contact-infos',
  'university-locations',
  'university-school-urls',
  'university-social-media-links',
  'update-categories',
  'updates',
  ] as const,
} as const;

export type CacheTtlClass = 'static' | 'editorial' | 'timeSensitive' | 'dynamic';
export type CacheTtlByClass = Readonly<Record<CacheTtlClass, number>>;

const DYNAMIC_ENTITIES = new Set<string>(['posts']);
const TIME_SENSITIVE_ENTITIES = new Set<string>([
  'scholarship-application-process-steps',
  'scholarship-events',
  'scholarship-requirements',
  'scholarships',
  'top-pick-article',
  'update-categories',
  'updates',
]);
const EDITORIAL_ENTITIES = new Set<string>([
  'articles',
  'program-academics',
  'program-accomodations',
  'program-application-steps',
  'program-campuses',
  'program-costs',
  'program-fields',
  'program-locations',
  'program-providers',
  'program-requirements',
  'program-terms',
  'program-testimonials',
  'programs',
  'site-properties',
]);

export function cacheTtlClassForEntity(entity: string): CacheTtlClass {
  if (DYNAMIC_ENTITIES.has(entity)) return 'dynamic';
  if (TIME_SENSITIVE_ENTITIES.has(entity)) return 'timeSensitive';
  if (EDITORIAL_ENTITIES.has(entity)) return 'editorial';
  return 'static';
}
function entitiesFromCacheKey(key: string): string[] {
  const graphqlMatch = /^(?:GET|POST):[^:]+:([^:]+):/.exec(key);
  if (graphqlMatch) return graphqlMatch[1].split(',').filter(Boolean);
  const restMatch = /^(?:GET|HEAD):\/api\/([^/?]+)/.exec(key);
  return restMatch ? [restMatch[1]] : [];
}

export function resolveCacheTtl(
  key: string,
  defaultTtl: number,
  ttlByClass: CacheTtlByClass,
): number {
  const entities = entitiesFromCacheKey(key);
  if (entities.length === 0) return defaultTtl;
  return Math.min(...entities.map((entity) => ttlByClass[cacheTtlClassForEntity(entity)]));
}

const camelCaseApiName = (name: string): string => name.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());

const singularApiName = (name: string): string => {
  if (name.endsWith('ies')) return `${name.slice(0, -3)}y`;
  if (name.endsWith('sses') || name.endsWith('uses')) return name.slice(0, -2);
  return name.endsWith('s') ? name.slice(0, -1) : name;
};

export const PUBLIC_GRAPHQL_ROOTS = new Map(CACHE_POLICY.cacheableEntities.flatMap((entity) => {
  const apiNames = entity === 'top-pick-article'
    ? [entity]
    : [entity, singularApiName(entity), `${entity}_connection`];
  return apiNames.map((apiName) => [camelCaseApiName(apiName), entity] as const);
}));
export function canonicalizePublicGraphqlCacheKey(defaultKey: string, rootFields: readonly string[]): string {
  const methodEnd = defaultKey.indexOf(':');
  const rootStart = defaultKey.indexOf(':', methodEnd + 1) + 1;
  const rootEnd = defaultKey.indexOf(':', rootStart);
  if (methodEnd < 0 || rootStart === 0 || rootEnd < 0) return defaultKey;

  const entitySegment = rootFields
    .map((field) => PUBLIC_GRAPHQL_ROOTS.get(field))
    .filter((entity): entity is Exclude<typeof entity, undefined> => entity !== undefined)
    .sort((left, right) => left.localeCompare(right))
    .join(',');
  if (!entitySegment) return defaultKey;
  return `${defaultKey.slice(0, rootStart)}${entitySegment}${defaultKey.slice(rootEnd)}`;
}

export function isPublicCacheRoute(path: string): boolean {
  if (!path.startsWith('/api/')) return false;
  const entity = path.slice('/api/'.length).split('/', 1)[0];
  return CACHE_POLICY.cacheableEntities.some((cacheableEntity) => cacheableEntity === entity);
}

export function isPrivateCacheRoute(path: string): boolean {
  return path.startsWith('/api/') && !isPublicCacheRoute(path);
}
