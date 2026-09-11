import React from 'react';
import { Input } from './admin/src/components/Input';
import { EditorialAssetInput } from './admin/src/components/EditorialAssetInput';
import { PublicationWorkflowPanel } from './admin/src/components/PublicationWorkflowPanel';

const pluginId = 'postcard-editor';
const EDITORIAL_ASSET_UID = 'api::editorial-asset.editorial-asset';
const EDITORIAL_ASSET_RELATION_FIELD = 'editorial-asset-relation';

type EditLayoutField = {
  name: string;
  type?: string;
  attribute?: { target?: string; targetModel?: string };
  [key: string]: unknown;
};
type EditLayout = { layout: EditLayoutField[][][]; [key: string]: unknown };
type EditLayoutHookPayload = { layout: EditLayout; query: Record<string, unknown> };
type AdminApp = {
  addFields(field: { type: string; Component: typeof EditorialAssetInput }): void;
  customFields: { register(field: unknown): void };
  getPlugin(id: string): { apis: { addEditViewSidePanel(panels: unknown[]): void } };
  registerHook(name: string, handler: (payload: EditLayoutHookPayload) => EditLayoutHookPayload): void;
};
function useEditorialAssetPicker({ layout, query }: EditLayoutHookPayload): EditLayoutHookPayload {
  return {
    layout: {
      ...layout,
      layout: layout.layout.map((panel) => panel.map((row) => row.map((field) => {
        const target = field.attribute?.target ?? field.attribute?.targetModel;
        if (field.name !== 'banner_img' || field.type !== 'relation' || target !== EDITORIAL_ASSET_UID) return field;
        return { ...field, type: EDITORIAL_ASSET_RELATION_FIELD };
      }))),
    },
    query,
  };
}


export default {
  register(app: AdminApp) {
    app.addFields({ type: EDITORIAL_ASSET_RELATION_FIELD, Component: EditorialAssetInput });
    app.registerHook(
      'Admin/CM/pages/EditView/mutate-edit-view-layout',
      useEditorialAssetPicker,
    );
    app.customFields.register({
      name: 'postcard-document',
      pluginId,
      type: 'json',
      intlLabel: { id: `${pluginId}.postcard-document.label`, defaultMessage: 'Postcard content' },
      intlDescription: { id: `${pluginId}.postcard-document.description`, defaultMessage: 'Compose an accessible postcard from structured blocks with EditorialAsset media.' },
      icon: () => React.createElement('span', { 'aria-hidden': true }, '▦'),
      components: { Input: async () => ({ default: Input }) },
    });
    app.getPlugin('content-manager').apis.addEditViewSidePanel([PublicationWorkflowPanel]);
  },
  bootstrap() {},
  registerTrads({ locales }: { locales: string[] }) {
    return Promise.resolve(locales.map((locale) => ({ locale, data: {} })));
  },
};
