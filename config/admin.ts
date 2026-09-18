import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  url: env('ADMIN_URL', '/admin'),
  auth: {
    secret: env('ADMIN_JWT_SECRET')!,
    cookie: { path: '/' },
  },
  apiToken: { salt: env('API_TOKEN_SALT')! },
  transfer: { token: { salt: env('TRANSFER_TOKEN_SALT')! } },
  secrets: { encryptionKey: env('ENCRYPTION_KEY')! },
  flags: {
    nps: false,
    promoteEE: false,
    docLinks: true,
  },
});

export default config;
