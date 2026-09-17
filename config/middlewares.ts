import type { Core } from '@strapi/strapi';

const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      // Cookie-based refresh sessions require an explicit, audited allowlist.
      // Reflecting an arbitrary Origin here would defeat that boundary.
      origin: corsOrigins,
      credentials: true,
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'global::provider-boundary',
  'global::admin-root',
  'global::cache-safety',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
