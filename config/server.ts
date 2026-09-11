import type { Core } from '@strapi/strapi';
import { releaseScheduledEditorialPublications } from '../src/workflows/editorial-publications';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', 'http://localhost:1337'),
  app: {
    keys: env.array('APP_KEYS')!,
  },
  // Enable only when traffic reaches Strapi through the known reverse proxy.
  proxy: {
    koa: env.bool('IS_PROXIED', false),
    ipHeader: env('PROXY_IP_HEADER', 'X-Forwarded-For'),
    maxIpsCount: env.int('PROXY_MAX_IPS_COUNT', 1),
  },
  // Database-to-database transfers are intentionally disabled.
  transfer: { remote: { enabled: false } },
  cron: {
    enabled: env.bool('CRON_ENABLED', true),
    tasks: {
      'rwm-release-scheduled-editorial': {
        // node-schedule uses six fields; this runs at second 0 every minute.
        options: '0 * * * * *',
        task: async ({ strapi }) => {
          const released = await releaseScheduledEditorialPublications(strapi);
          const count = Object.values(released).reduce((total, value) => total + value, 0);
          if (count > 0) strapi.log.info(`Released ${count} scheduled RWM editorial entries.`);
        },
      },
    },
  },
  webhooks: { populateRelations: false },
});

export default config;
