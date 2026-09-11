import { randomUUID } from 'node:crypto';
import type { Core } from '@strapi/strapi';
import {
  CACHE_POLICY,
  PUBLIC_GRAPHQL_ROOTS,
  canonicalizePublicGraphqlCacheKey,
  resolveCacheTtl,
} from '../src/cache/policy';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedTypes = [
  'image/svg+xml',
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];


const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  const r2Bucket = env('R2_BUCKET_NAME');
  const r2Account = env('R2_ACCOUNT_ID');
  // Empty S3 template values must not suppress the R2 fallbacks.
  const bucket = env('S3_BUCKET_NAME') || r2Bucket;
  const accessKeyId = env('S3_ACCESS_KEY_ID') || env('R2_ACCESS_KEY_ID');
  const secretAccessKey = env('S3_SECRET_ACCESS_KEY') || env('R2_SECRET_ACCESS_KEY');
  const endpoint = env('S3_ENDPOINT') || (r2Account ? `https://${r2Account}.r2.cloudflarestorage.com` : undefined);
  const hasObjectStorage = Boolean(bucket && endpoint && accessKeyId && secretAccessKey);
  const redisUrl = env('CACHE_REDIS_URL');
  const redisKeyPrefix = env('CACHE_REDIS_KEY_PREFIX', 'rwm:strapi-cache:');
  let cacheRedisConfig: Record<string, unknown>;
  if (redisUrl) {
    const parsed = new URL(redisUrl);
    cacheRedisConfig = {
      host: parsed.hostname,
      port: Number(parsed.port || (parsed.protocol === 'rediss:' ? 6380 : 6379)),
      ...(parsed.username ? { username: decodeURIComponent(parsed.username) } : {}),
      ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
      ...(parsed.pathname.length > 1 ? { db: Number(parsed.pathname.slice(1)) } : {}),
      ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
      keyPrefix: redisKeyPrefix,
    };
  } else {
    cacheRedisConfig = {
      host: env('CACHE_REDIS_HOST', '127.0.0.1'),
      port: env.int('CACHE_REDIS_PORT', 6380),
      db: env.int('CACHE_REDIS_DB', 0),
      ...(env('CACHE_REDIS_PASSWORD') ? { password: env('CACHE_REDIS_PASSWORD') } : {}),
      keyPrefix: redisKeyPrefix,
    };
  }
  const defaultCacheTtl = env.int('CACHE_TTL_MS', 120_000);
  const cacheTtlByClass = {
    static: env.int('CACHE_TTL_STATIC_MS', 7_200_000),
    editorial: env.int('CACHE_TTL_EDITORIAL_MS', 1_800_000),
    timeSensitive: env.int('CACHE_TTL_TIME_SENSITIVE_MS', 300_000),
    dynamic: env.int('CACHE_TTL_DYNAMIC_MS', 30_000),
  } as const;


  return {
    'api-permissions': {
      // Upstream is alpha; enable explicitly when evaluating the new role system.
      enabled: env.bool('API_PERMISSIONS_ENABLED', false),
      config: { user_uid: 'plugin::users-permissions.user' },
    },
    'strapi-cache': {
      enabled: true,
      config: {
        provider: 'redis',
        redisConfig: cacheRedisConfig,
        ttl: defaultCacheTtl,
        ttlResolver: (key: string, fallbackTtl: number) => resolveCacheTtl(key, fallbackTtl, cacheTtlByClass),
        cacheGetTimeoutInMs: env.int('CACHE_GET_TIMEOUT_MS', 250),
        // The plugin wraps configured middleware and only checks Authorization
        // before lookup. Give cookie requests and non-public GraphQL operations
        // one-use keys; cache-safety then prevents their response from storing.
        keyGenerator: (ctx: {
          request: { headers: Record<string, unknown>; url: string };
          rootFields?: string[];
          state: Record<string, unknown>;
        }, defaultKey: string) => {
          const graphqlRequest = ctx.request.url.startsWith('/graphql');
          const publicGraphqlQuery = !graphqlRequest || (
            Array.isArray(ctx.rootFields)
            && ctx.rootFields.length > 0
            && ctx.rootFields.every((field) => PUBLIC_GRAPHQL_ROOTS.has(field))
          );
          const bypass = Boolean(ctx.request.headers.cookie) || !publicGraphqlQuery;
          ctx.state.strapiCacheBypass = bypass;
          if (bypass) return `${defaultKey}:private:${randomUUID()}`;
          if (!graphqlRequest) return defaultKey;

          // Use Strapi entity names so lifecycle invalidation matches both
          // connection queries and multi-root directory queries.
          return canonicalizePublicGraphqlCacheKey(defaultKey, ctx.rootFields!);
        },
        cacheableEntities: [...CACHE_POLICY.cacheableEntities],
        cacheHeaders: true,
        cacheHeadersAllowList: ['content-type', 'content-language'],
        cacheHeadersDenyList: [],
        cacheAuthorizedRequests: false,
        autoPurgeCache: true,
        autoPurgeGraphQL: true,
        autoPurgeCacheOnStart: true,
        debug: env.bool('CACHE_DEBUG', false),
      },
    },
    i18n: {
      config: {
        locales: ['en'],
        defaultLocale: env('STRAPI_PLUGIN_I18N_INIT_LOCALE_CODE', 'en'),
      },
    },
    'catalog-asset-picker': {
      enabled: true,
      resolve: './src/plugins/catalog-asset-picker',
    },
    'catalog-editor': {
      enabled: true,
      resolve: './src/plugins/catalog-editor',
      config: {
        enabledPortal: env.bool('CATALOG_EDITOR_ENABLED', false),
        publicOrigin: env('CATALOG_EDITOR_PUBLIC_ORIGIN', ''),
      },
    },
    'postcard-editor': {
      enabled: true,
      resolve: './src/plugins/postcard-editor',
    },
    'users-permissions': {
      config: {
        jwtManagement: 'refresh',
        register: { allowedFields: ['first_name', 'last_name'] },
        sessions: {
          accessTokenLifespan: env.int('UP_ACCESS_TOKEN_LIFESPAN', 900),
          maxRefreshTokenLifespan: env.int('UP_MAX_REFRESH_TOKEN_LIFESPAN', 604800),
          idleRefreshTokenLifespan: env.int('UP_IDLE_REFRESH_TOKEN_LIFESPAN', 1209600),
          maxSessionLifespan: env.int('UP_MAX_SESSION_LIFESPAN', 604800),
          idleSessionLifespan: env.int('UP_IDLE_SESSION_LIFESPAN', 7200),
          httpOnly: true,
          cookie: {
            name: env('UP_COOKIE_NAME', 'rwm_refresh'),
            sameSite: env('UP_COOKIE_SAME_SITE', 'lax'),
            secure: env.bool('UP_COOKIE_SECURE', env('NODE_ENV', 'development') === 'production'),
            path: '/',
          },
        },
      },
    },
    upload: {
      config: {
        ...(hasObjectStorage
          ? {
              provider: 'aws-s3',
              providerOptions: {
                s3Options: {
                  credentials: {
                    accessKeyId: accessKeyId!,
                    secretAccessKey: secretAccessKey!,
                  },
                  region: env('S3_REGION') || (r2Account ? 'auto' : 'us-east-1'),
                  endpoint,
                  forcePathStyle: env.bool('S3_FORCE_PATH_STYLE', false),
                  params: { Bucket: bucket },
                },
                baseUrl: env('S3_PUBLIC_BASE') || env('R2_PUBLIC_BASE'),
              },
            }
          : {}),
        security: {
          allowedTypes: allowedMediaTypes,
          deniedTypes,
        },
      },
    },
  };
};

export default config;
