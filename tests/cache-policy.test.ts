import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CACHE_POLICY,
  PUBLIC_GRAPHQL_ROOTS,
  canonicalizePublicGraphqlCacheKey,
  cacheTtlClassForEntity,
  isPrivateCacheRoute,
  isPublicCacheRoute,
  resolveCacheTtl,
} from '../src/cache/policy.ts';

test('one cacheable-entity allowlist classifies REST routes', () => {
  for (const entity of CACHE_POLICY.cacheableEntities) {
    assert.equal(isPublicCacheRoute(`/api/${entity}`), true, entity);
    assert.equal(isPrivateCacheRoute(`/api/${entity}`), false, entity);
  }

  assert.equal(isPublicCacheRoute('/api/posts/example'), true);
  assert.equal(isPrivateCacheRoute('/api/auth/local'), true);
  assert.equal(isPrivateCacheRoute('/api/users/me'), true);
  assert.equal(isPrivateCacheRoute('/api/upload'), true);
  assert.equal(isPrivateCacheRoute('/api/health'), true);
  assert.equal(isPrivateCacheRoute('/graphql'), false);
});

test('route matching respects entity boundaries', () => {
  assert.equal(isPrivateCacheRoute('/api/auth/local'), true);
  assert.equal(isPublicCacheRoute('/api/authors'), true);
  assert.equal(isPrivateCacheRoute('/api/authors'), false);
});

test('GraphQL allowlist is derived from the same cacheable entities', () => {
  assert.equal(PUBLIC_GRAPHQL_ROOTS.get('posts'), 'posts');
  assert.equal(PUBLIC_GRAPHQL_ROOTS.get('post'), 'posts');
  assert.equal(PUBLIC_GRAPHQL_ROOTS.get('articleCategories'), 'article-categories');
  assert.equal(PUBLIC_GRAPHQL_ROOTS.get('topPickArticle'), 'top-pick-article');
  assert.equal(PUBLIC_GRAPHQL_ROOTS.get('articles_connection'), 'articles');
  assert.equal(PUBLIC_GRAPHQL_ROOTS.get('articleCategories_connection'), 'article-categories');

  assert.equal(
    canonicalizePublicGraphqlCacheKey(
      'POST:/graphql:articleCategories_connection,articles_connection,articleTags_connection:request-hash',
      ['articles_connection', 'articleCategories_connection', 'articleTags_connection'],
    ),
    'POST:/graphql:article-categories,article-tags,articles:request-hash',
  );
});

test('cache keys select the shortest matching TTL class', () => {
  const ttlByClass = {
    static: 7_200_000,
    editorial: 1_800_000,
    timeSensitive: 300_000,
    dynamic: 30_000,
  } as const;

  assert.equal(cacheTtlClassForEntity('resources'), 'static');
  assert.equal(cacheTtlClassForEntity('articles'), 'editorial');
  assert.equal(cacheTtlClassForEntity('scholarships'), 'timeSensitive');
  assert.equal(cacheTtlClassForEntity('posts'), 'dynamic');
  assert.equal(resolveCacheTtl('POST:/graphql:articles:hash', 120_000, ttlByClass), 1_800_000);
  assert.equal(resolveCacheTtl('POST:/graphql:articles,posts:hash', 120_000, ttlByClass), 30_000);
  assert.equal(resolveCacheTtl('GET:/api/resources?pagination[page]=1', 120_000, ttlByClass), 7_200_000);
  assert.equal(resolveCacheTtl('POST:/unknown:key', 120_000, ttlByClass), 120_000);
});
