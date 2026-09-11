import { CatalogAssetInput } from './admin/src/components/CatalogAssetInput';

const CATALOG_ASSET_UID = 'api::catalog-asset.catalog-asset';
const CATALOG_RELATION_FIELD = 'catalog-asset-relation';

type EditLayoutField = {
  name: string;
  type?: string;
  attribute?: { target?: string; targetModel?: string };
  [key: string]: unknown;
};
type EditLayout = { layout: EditLayoutField[][][]; [key: string]: unknown };
type EditLayoutHookPayload = { layout: EditLayout; query: Record<string, unknown> };
type AdminApp = {
  addFields(field: { type: string; Component: typeof CatalogAssetInput }): void;
  registerHook(name: string, handler: (payload: EditLayoutHookPayload) => EditLayoutHookPayload): void;
};

function useCatalogAssetPicker({ layout, query }: EditLayoutHookPayload): EditLayoutHookPayload {
  return {
    layout: {
      ...layout,
      layout: layout.layout.map((panel) => panel.map((row) => row.map((field) => {
        const target = field.attribute?.target ?? field.attribute?.targetModel;
        if (field.type !== 'relation' || target !== CATALOG_ASSET_UID || !['image', 'gallery'].includes(field.name)) return field;
        return { ...field, type: CATALOG_RELATION_FIELD };
      }))),
    },
    query,
  };
}

export default {
  register(app: AdminApp) {
    app.addFields({ type: CATALOG_RELATION_FIELD, Component: CatalogAssetInput });
    app.registerHook('Admin/CM/pages/EditView/mutate-edit-view-layout', useCatalogAssetPicker);
  },
  bootstrap() {},
  registerTrads({ locales }: { locales: string[] }) {
    return Promise.resolve(locales.map((locale) => ({ locale, data: {} })));
  },
};
