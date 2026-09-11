import type { Core } from '@strapi/strapi';

type Configuration = {
  settings: Record<string, unknown>;
  metadatas: Record<string, { edit: Record<string, unknown>; list: Record<string, unknown> }>;
  layouts: { edit: { name: string; size: number }[][]; list: string[] };
};

/** Repair persisted layouts as well as the defaults used by new installations. */
export async function configureContentManager(strapi: Core.Strapi): Promise<void> {
  const service = strapi.plugin('content-manager').service('content-types') as {
    findConfiguration(model: { uid: string }): Promise<Configuration>;
    updateConfiguration(model: { uid: string }, config: Configuration): Promise<unknown>;
  };
  const models = Object.values(strapi.contentTypes).filter((model) =>
    model.uid.startsWith('api::') || model.uid === 'plugin::users-permissions.user');
  const mainFields = new Map<string, string>();
  for (const model of models) {
    const attributes = model.attributes;
    const name = ['name', 'title', 'key', 'code', 'original_filename', 'value'].find((field) => {
      const attribute = attributes[field];
      return attribute && ['string', 'text', 'enumeration', 'email'].includes(attribute.type);
    }) ?? Object.keys(attributes).find((field) => {
      const attribute = attributes[field];
      return ['string', 'email'].includes(attribute.type) && 'required' in attribute && attribute.required
        && !('default' in attribute && attribute.default === '')
        && attribute.visible !== false;
    }) ?? 'documentId';
    mainFields.set(model.uid, name);
  }

  for (const model of models) {
    const configuration = await service.findConfiguration(model);
    const before = JSON.stringify(configuration);
    configuration.settings.mainField = mainFields.get(model.uid)!;
    const hidden = new Set(Object.keys(model.attributes)
      .filter((field) => model.attributes[field].visible === false));
    configuration.layouts.edit = configuration.layouts.edit
      .map((row) => row.filter((field) => !hidden.has(field.name)))
      .filter((row) => row.length > 0);
    configuration.layouts.list = configuration.layouts.list.filter((field) => !hidden.has(field));

    for (const [field, metadata] of Object.entries(configuration.metadatas)) {
      const attribute = model.attributes[field];
      if (!attribute) continue;
      if (hidden.has(field)) {
        metadata.edit.visible = false;
        metadata.edit.editable = false;
      }
      if (attribute.type === 'relation' && 'target' in attribute && mainFields.has(attribute.target)) {
        metadata.edit.mainField = mainFields.get(attribute.target)!;
      }
      const label = field.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
      for (const view of [metadata.edit, metadata.list]) {
        if (view.label === field) view.label = label.charAt(0).toUpperCase() + label.slice(1);
      }
    }
    if (JSON.stringify(configuration) !== before) await service.updateConfiguration(model, configuration);
  }
}
