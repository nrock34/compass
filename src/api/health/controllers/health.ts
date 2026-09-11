type HealthContext = {
  body?: unknown;
  status?: number;
};

type HealthStrapi = {
  db: { connection: { raw(query: string): Promise<unknown> } };
  log: { error(message: string, error?: unknown): void };
};

const controller = ({ strapi }: { strapi: HealthStrapi }) => ({
  async live(ctx: HealthContext) {
    ctx.body = {
      service: 'rwm-strapi',
      status: 'ok',
    };
  },

  async ready(ctx: HealthContext) {
    try {
      await strapi.db.connection.raw('SELECT 1');
      ctx.body = {
        service: 'rwm-strapi',
        status: 'ready',
      };
    } catch (error) {
      strapi.log.error('Readiness check failed', error);
      ctx.status = 503;
      ctx.body = {
        service: 'rwm-strapi',
        status: 'unavailable',
      };
    }
  },
});

export default controller;
