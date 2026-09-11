import { Book } from '@strapi/icons';

export default {
  register(app: any) {
    app.addMenuLink({ to: 'plugins/catalog-editor', icon: Book, intlLabel: { id: 'catalog-editor.name', defaultMessage: 'Catalog editor' }, Component: () => import('./admin/Page'), permissions: [{ action: 'plugin::catalog-editor.edit', subject: null }] });
    app.registerPlugin({ id: 'catalog-editor', name: 'Catalog editor' });
  },
  bootstrap() {},
  registerTrads({ locales }: { locales: string[] }) { return Promise.resolve(locales.map(locale => ({ locale, data: {} }))); },
};
