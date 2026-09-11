import type { Schema, Struct } from '@strapi/strapi';

// The alpha package does not augment Strapi's content-type registry.
interface ApiPermissionRole extends Struct.CollectionTypeSchema {
  collectionName: 'api_permissions_roles';
  info: { singularName: 'role'; pluralName: 'roles'; displayName: 'Role' };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
    description: Schema.Attribute.String;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    permissions: Schema.Attribute.Relation<'oneToMany', 'plugin::api-permissions.permission'>;
  };
}

interface ApiPermission extends Struct.CollectionTypeSchema {
  collectionName: 'api_permissions_permissions';
  info: { singularName: 'permission'; pluralName: 'permissions'; displayName: 'Permission' };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    role: Schema.Attribute.Relation<'manyToOne', 'plugin::api-permissions.role'>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ContentTypeSchemas {
      'plugin::api-permissions.role': ApiPermissionRole;
      'plugin::api-permissions.permission': ApiPermission;
    }
  }
}
