import type { Core } from '@strapi/strapi';
import { installDjangoParityConstraints } from './database/constraints';
import { installDjangoParityDeletePolicy } from './database/delete-policy';
import { registerDjangoDocumentParity } from './document/middleware';

export function registerDjangoParity(strapi: Core.Strapi): void {
    registerDjangoDocumentParity(strapi);
}
export async function bootstrapDjangoParity(strapi: Core.Strapi): Promise<void> {
    await installDjangoParityConstraints(strapi); await installDjangoParityDeletePolicy(strapi);
}
