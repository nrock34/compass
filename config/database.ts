import path from 'path';
import type { Core } from '@strapi/strapi';
import { isDatabaseClientKind } from '@strapi/database';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  const client = env('DATABASE_CLIENT', 'postgres');
  const databaseUrl = env('DATABASE_URL')?.trim();
  if (env('RENDER') === 'true' && client === 'postgres' && !databaseUrl) {
    throw new Error('DATABASE_URL is missing on Render. Sync the Blueprint database connection before starting Strapi.');
  }

  if (!isDatabaseClientKind(client)) {
    throw new Error(`Unsupported DATABASE_CLIENT: ${client}.`);
  }

  const connections: Record<Core.Config.Database.ClientKind, Core.Config.Database['connection']> = {
    mysql: {
      client: 'mysql',
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'rwm_strapi'),
        user: env('DATABASE_USERNAME', 'rwm_strapi'),
        // The database driver accepts an empty password for local development;
        // production deployments still supply this through the secret-backed env.
        password: env('DATABASE_PASSWORD', ''),
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    postgres: {
      client: 'postgres',
      connection: {
        connectionString: databaseUrl,
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'rwm_strapi'),
        user: env('DATABASE_USERNAME', 'rwm_strapi'),
        password: env('DATABASE_PASSWORD', ''),
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
        },
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    sqlite: {
      client: 'sqlite',
      connection: {
        filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
    settings: {
      // Schema drops must never occur merely because a deployment starts.
      forceMigration: env.bool('DATABASE_FORCE_MIGRATION', false),
      runMigrations: true,
      useTypescriptMigrations: true,
    },
  };
};

export default config;
