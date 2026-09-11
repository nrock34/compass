import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    adminPermissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::permission'
    >;
    adminUserOwner: Schema.Attribute.Relation<'manyToOne', 'admin::user'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    kind: Schema.Attribute.Enumeration<['content-api', 'admin']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'content-api'>;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    apiToken: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON & Schema.Attribute.Private;
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    apiTokens: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordTokenExpiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiAcademicResourceAcademicResource
  extends Struct.CollectionTypeSchema {
  collectionName: 'editorial_academicresource';
  info: {
    displayName: 'Academic Resource';
    pluralName: 'academic-resources';
    singularName: 'academic-resource';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    archived_at: Schema.Attribute.DateTime;
    author: Schema.Attribute.Relation<'manyToOne', 'api::author.author'>;
    content: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 455;
      }>;
    downloads: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    featured: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::academic-resource.academic-resource'
    > &
      Schema.Attribute.Private;
    page_content: Schema.Attribute.RichText & Schema.Attribute.DefaultTo<''>;
    publication_status: Schema.Attribute.Enumeration<
      ['draft', 'review', 'scheduled', 'published', 'archived']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    publishedAt: Schema.Attribute.DateTime;
    rating: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    reviewed_at: Schema.Attribute.DateTime;
    saved_by_users: Schema.Attribute.Relation<'morphMany'>;
    scheduled_at: Schema.Attribute.DateTime;
    tags: Schema.Attribute.Relation<
      'manyToMany',
      'api::resource-tag.resource-tag'
    >;
    thumbnail: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<''>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    views: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiAddressInfoAddressInfo extends Struct.CollectionTypeSchema {
  collectionName: 'members_addressinfo';
  info: {
    displayName: 'Address info';
    pluralName: 'address-infos';
    singularName: 'address-info';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    city: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 125;
      }> &
      Schema.Attribute.DefaultTo<''>;
    country: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 36;
      }> &
      Schema.Attribute.DefaultTo<''>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    line_one: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<''>;
    line_two: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<''>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::address-info.address-info'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    state: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 28;
      }> &
      Schema.Attribute.DefaultTo<''>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'api::user-sensitive-info.user-sensitive-info'
    >;
    zip_code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 10;
      }> &
      Schema.Attribute.DefaultTo<''>;
  };
}

export interface ApiArticleCategoryArticleCategory
  extends Struct.CollectionTypeSchema {
  collectionName: 'editorial_articlecategory';
  info: {
    displayName: 'Article Category';
    pluralName: 'article-categories';
    singularName: 'article-category';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    articles: Schema.Attribute.Relation<'oneToMany', 'api::article.article'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::article-category.article-category'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 48;
      }>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiArticleLocationArticleLocation
  extends Struct.CollectionTypeSchema {
  collectionName: 'editorial_articlelocation';
  info: {
    displayName: 'Article Location';
    pluralName: 'article-locations';
    singularName: 'article-location';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    article_set: Schema.Attribute.Relation<'oneToMany', 'api::article.article'>;
    city: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }> &
      Schema.Attribute.DefaultTo<'Split'>;
    country: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }> &
      Schema.Attribute.DefaultTo<'Croatia'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::article-location.article-location'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiArticleTagArticleTag extends Struct.CollectionTypeSchema {
  collectionName: 'editorial_articletag';
  info: {
    displayName: 'Article Tag';
    pluralName: 'article-tags';
    singularName: 'article-tag';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    articles: Schema.Attribute.Relation<'manyToMany', 'api::article.article'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::article-tag.article-tag'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 48;
      }>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiArticleArticle extends Struct.CollectionTypeSchema {
  collectionName: 'editorial_article';
  info: {
    displayName: 'Article';
    pluralName: 'articles';
    singularName: 'article';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    archived_at: Schema.Attribute.DateTime;
    author: Schema.Attribute.Relation<'manyToOne', 'api::author.author'>;
    banner_img: Schema.Attribute.Relation<
      'manyToOne',
      'api::editorial-asset.editorial-asset'
    >;
    category: Schema.Attribute.Relation<
      'manyToOne',
      'api::article-category.article-category'
    >;
    comment_count: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    comments: Schema.Attribute.Relation<'morphMany'>;
    content: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.CustomField<'plugin::postcard-editor.postcard-document'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date_published: Schema.Attribute.DateTime;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    excerpt: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 450;
      }>;
    featured: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    gallery: Schema.Attribute.Relation<
      'manyToMany',
      'api::editorial-asset.editorial-asset'
    >;
    like_count: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    likes: Schema.Attribute.Relation<'morphMany'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::article.article'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.Relation<
      'manyToOne',
      'api::article-location.article-location'
    > &
      Schema.Attribute.Required;
    publication_status: Schema.Attribute.Enumeration<
      ['draft', 'review', 'scheduled', 'published', 'archived']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    published: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    publishedAt: Schema.Attribute.DateTime;
    region: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 20;
      }> &
      Schema.Attribute.DefaultTo<'Europe'>;
    reviewed_at: Schema.Attribute.DateTime;
    saved_by_users: Schema.Attribute.Relation<
      'oneToMany',
      'api::saved-postcard.saved-postcard'
    >;
    scheduled_at: Schema.Attribute.DateTime;
    tags: Schema.Attribute.Relation<
      'manyToMany',
      'api::article-tag.article-tag'
    > &
      Schema.Attribute.Required;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    views: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiAuthorAuthor extends Struct.CollectionTypeSchema {
  collectionName: 'community_author';
  info: {
    displayName: 'Author';
    pluralName: 'authors';
    singularName: 'author';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    anonymized_at: Schema.Attribute.DateTime;
    article_set: Schema.Attribute.Relation<'oneToMany', 'api::article.article'>;
    associated_user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    avatar: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<''>;
    comment_set: Schema.Attribute.Relation<'oneToMany', 'api::comment.comment'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    identity_type: Schema.Attribute.Enumeration<
      ['member', 'contributor', 'anonymized']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'member'>;
    likes: Schema.Attribute.Relation<'oneToMany', 'api::like.like'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::author.author'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    post_set: Schema.Attribute.Relation<'oneToMany', 'api::post.post'>;
    public_id: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 36;
        minLength: 36;
      }>;
    publishedAt: Schema.Attribute.DateTime;
    resource_set: Schema.Attribute.Relation<
      'oneToMany',
      'api::resource.resource'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiBadgeBadge extends Struct.CollectionTypeSchema {
  collectionName: 'members_badge';
  info: {
    displayName: 'Badge';
    pluralName: 'badges';
    singularName: 'badge';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    color: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 40;
      }> &
      Schema.Attribute.DefaultTo<'#A776FC'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 300;
      }> &
      Schema.Attribute.DefaultTo<'A badge'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::badge.badge'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    points: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userbadge_set: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-badge.user-badge'
    >;
  };
}

export interface ApiCatalogAssetCatalogAsset
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_catalogasset';
  info: {
    displayName: 'Catalog Asset';
    pluralName: 'catalog-assets';
    singularName: 'catalog-asset';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    alt_text: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    caption: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    file: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::catalog-asset.catalog-asset'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    program_galleries: Schema.Attribute.Relation<
      'manyToMany',
      'api::program.program'
    >;
    program_images: Schema.Attribute.Relation<
      'oneToMany',
      'api::program.program'
    >;
    publishedAt: Schema.Attribute.DateTime;
    rights: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    scholarship_galleries: Schema.Attribute.Relation<
      'manyToMany',
      'api::scholarship.scholarship'
    >;
    scholarship_images: Schema.Attribute.Relation<
      'oneToMany',
      'api::scholarship.scholarship'
    >;
    source_url: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 2048;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCommentComment extends Struct.CollectionTypeSchema {
  collectionName: 'community_comment';
  info: {
    displayName: 'Comment';
    pluralName: 'comments';
    singularName: 'comment';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
  };
  attributes: {
    author: Schema.Attribute.Relation<'manyToOne', 'api::author.author'>;
    content: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 500;
      }> &
      Schema.Attribute.DefaultTo<''>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::comment.comment'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    subject: Schema.Attribute.Relation<'morphToOne'> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCulturalResourceCulturalResource
  extends Struct.CollectionTypeSchema {
  collectionName: 'editorial_culturalresource';
  info: {
    displayName: 'Cultural Resource';
    pluralName: 'cultural-resources';
    singularName: 'cultural-resource';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    archived_at: Schema.Attribute.DateTime;
    author: Schema.Attribute.Relation<'manyToOne', 'api::author.author'>;
    content: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 455;
      }>;
    downloads: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    featured: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::cultural-resource.cultural-resource'
    > &
      Schema.Attribute.Private;
    page_content: Schema.Attribute.RichText & Schema.Attribute.DefaultTo<''>;
    publication_status: Schema.Attribute.Enumeration<
      ['draft', 'review', 'scheduled', 'published', 'archived']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    publishedAt: Schema.Attribute.DateTime;
    rating: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    reviewed_at: Schema.Attribute.DateTime;
    saved_by_users: Schema.Attribute.Relation<'morphMany'>;
    scheduled_at: Schema.Attribute.DateTime;
    tags: Schema.Attribute.Relation<
      'manyToMany',
      'api::resource-tag.resource-tag'
    >;
    thumbnail: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<''>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    views: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiEditorialAssetPlacementEditorialAssetPlacement
  extends Struct.CollectionTypeSchema {
  collectionName: 'editorial_editorialassetplacement';
  info: {
    displayName: 'Editorial Asset Placement';
    pluralName: 'editorial-asset-placements';
    singularName: 'editorial-asset-placement';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
  };
  attributes: {
    asset: Schema.Attribute.Relation<
      'manyToOne',
      'api::editorial-asset.editorial-asset'
    > &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::editorial-asset-placement.editorial-asset-placement'
    > &
      Schema.Attribute.Private;
    owner: Schema.Attribute.Relation<'morphToOne'> & Schema.Attribute.Required;
    position: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Enumeration<
      ['hero', 'gallery', 'body', 'thumbnail']
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEditorialAssetEditorialAsset
  extends Struct.CollectionTypeSchema {
  collectionName: 'editorial_editorialasset';
  info: {
    displayName: 'Editorial Asset';
    pluralName: 'editorial-assets';
    singularName: 'editorial-asset';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    alt_text: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    archived_at: Schema.Attribute.DateTime;
    articles: Schema.Attribute.Relation<'manyToMany', 'api::article.article'>;
    banner_articles: Schema.Attribute.Relation<
      'oneToMany',
      'api::article.article'
    >;
    byte_size: Schema.Attribute.BigInteger &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    caption: Schema.Attribute.Text;
    checksum: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 128;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    failed_at: Schema.Attribute.DateTime;
    focal_point: Schema.Attribute.JSON;
    height: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::editorial-asset.editorial-asset'
    > &
      Schema.Attribute.Private;
    mime_type: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 127;
      }>;
    object_key: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 512;
      }>;
    original_filename: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    placements: Schema.Attribute.Relation<
      'oneToMany',
      'api::editorial-asset-placement.editorial-asset-placement'
    >;
    public_url: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 2048;
      }>;
    publication_status: Schema.Attribute.Enumeration<
      ['draft', 'review', 'scheduled', 'published', 'archived']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    publishedAt: Schema.Attribute.DateTime;
    ready_at: Schema.Attribute.DateTime;
    reviewed_at: Schema.Attribute.DateTime;
    rights: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    scheduled_at: Schema.Attribute.DateTime;
    source: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 32;
      }> &
      Schema.Attribute.DefaultTo<'django'>;
    status: Schema.Attribute.Enumeration<['pending', 'ready', 'failed']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'pending'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    updates: Schema.Attribute.Relation<'oneToMany', 'api::update.update'>;
    uploaded_by: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    width: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
  };
}

export interface ApiExternalTrackedApplicationExternalTrackedApplication
  extends Struct.CollectionTypeSchema {
  collectionName: 'journeys_externaltrackedapplication';
  info: {
    displayName: 'External tracked application';
    pluralName: 'external-tracked-applications';
    singularName: 'external-tracked-application';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deadline: Schema.Attribute.Date & Schema.Attribute.Required;
    link: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::external-tracked-application.external-tracked-application'
    > &
      Schema.Attribute.Private;
    provider: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user_apps: Schema.Attribute.Relation<
      'oneToMany',
      'api::tracked-application.tracked-application'
    >;
  };
}

export interface ApiGlobalBackgroundGlobalBackground
  extends Struct.CollectionTypeSchema {
  collectionName: 'members_globalbackground';
  info: {
    displayName: 'Global background';
    pluralName: 'global-backgrounds';
    singularName: 'global-background';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    completed_steps: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    has_traveled_edu: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    interested_regions: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::global-background.global-background'
    > &
      Schema.Attribute.Private;
    other_language_spoken: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<''>;
    publishedAt: Schema.Attribute.DateTime;
    travel_experience: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 32;
      }> &
      Schema.Attribute.DefaultTo<''>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiGuideGuide extends Struct.CollectionTypeSchema {
  collectionName: 'editorial_guide';
  info: {
    displayName: 'Guide';
    pluralName: 'guides';
    singularName: 'guide';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    archived_at: Schema.Attribute.DateTime;
    author: Schema.Attribute.Relation<'manyToOne', 'api::author.author'>;
    content: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<''>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 455;
      }>;
    downloads: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    featured: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::guide.guide'> &
      Schema.Attribute.Private;
    page_content: Schema.Attribute.RichText & Schema.Attribute.DefaultTo<''>;
    publication_status: Schema.Attribute.Enumeration<
      ['draft', 'review', 'scheduled', 'published', 'archived']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    publishedAt: Schema.Attribute.DateTime;
    rating: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    reviewed_at: Schema.Attribute.DateTime;
    saved_by_users: Schema.Attribute.Relation<'morphMany'>;
    scheduled_at: Schema.Attribute.DateTime;
    tags: Schema.Attribute.Relation<
      'manyToMany',
      'api::resource-tag.resource-tag'
    >;
    thumbnail: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<''>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    views: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiItineraryItinerary extends Struct.CollectionTypeSchema {
  collectionName: 'editorial_itinerary';
  info: {
    displayName: 'Itinerary';
    pluralName: 'itineraries';
    singularName: 'itinerary';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    archived_at: Schema.Attribute.DateTime;
    author: Schema.Attribute.Relation<'manyToOne', 'api::author.author'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 455;
      }>;
    downloads: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    featured: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::itinerary.itinerary'
    > &
      Schema.Attribute.Private;
    page_content: Schema.Attribute.RichText & Schema.Attribute.DefaultTo<''>;
    publication_status: Schema.Attribute.Enumeration<
      ['draft', 'review', 'scheduled', 'published', 'archived']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    publishedAt: Schema.Attribute.DateTime;
    rating: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    reviewed_at: Schema.Attribute.DateTime;
    saved_by_users: Schema.Attribute.Relation<'morphMany'>;
    scheduled_at: Schema.Attribute.DateTime;
    tags: Schema.Attribute.Relation<
      'manyToMany',
      'api::resource-tag.resource-tag'
    >;
    thumbnail: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<''>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    views: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiLangLang extends Struct.CollectionTypeSchema {
  collectionName: 'siteconfig_lang';
  info: {
    displayName: 'Lang';
    pluralName: 'langs';
    singularName: 'lang';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 35;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::lang.lang'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    publishedAt: Schema.Attribute.DateTime;
    uistringtranslation_set: Schema.Attribute.Relation<
      'oneToMany',
      'api::ui-string-translation.ui-string-translation'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLikeLike extends Struct.CollectionTypeSchema {
  collectionName: 'community_like';
  info: {
    displayName: 'Like';
    pluralName: 'likes';
    singularName: 'like';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
  };
  attributes: {
    author: Schema.Attribute.Relation<'manyToOne', 'api::author.author'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::like.like'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    subject: Schema.Attribute.Relation<'morphToOne'> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPostCategoryPostCategory
  extends Struct.CollectionTypeSchema {
  collectionName: 'community_postcategory';
  info: {
    displayName: 'Post category';
    pluralName: 'post-categories';
    singularName: 'post-category';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::post-category.post-category'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.Enumeration<
      ['opp', 'social', 'academic', 'housing', 'events']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.DefaultTo<'social'>;
    posts: Schema.Attribute.Relation<'oneToMany', 'api::post.post'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPostTagPostTag extends Struct.CollectionTypeSchema {
  collectionName: 'community_posttag';
  info: {
    displayName: 'Post tag';
    pluralName: 'post-tags';
    singularName: 'post-tag';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::post-tag.post-tag'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 48;
      }>;
    posts: Schema.Attribute.Relation<'manyToMany', 'api::post.post'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPostPost extends Struct.CollectionTypeSchema {
  collectionName: 'community_post';
  info: {
    displayName: 'Post';
    pluralName: 'posts';
    singularName: 'post';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    archived_at: Schema.Attribute.DateTime;
    author: Schema.Attribute.Relation<'manyToOne', 'api::author.author'>;
    category: Schema.Attribute.Relation<
      'manyToOne',
      'api::post-category.post-category'
    >;
    comment_count: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    comments: Schema.Attribute.Relation<'morphMany'>;
    content: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 600;
      }> &
      Schema.Attribute.DefaultTo<''>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    is_media_video: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    like_count: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    likes: Schema.Attribute.Relation<'morphMany'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::post.post'> &
      Schema.Attribute.Private;
    media: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    media_caption: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    publication_status: Schema.Attribute.Enumeration<
      ['draft', 'review', 'scheduled', 'published', 'archived']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    published: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    publishedAt: Schema.Attribute.DateTime;
    reviewed_at: Schema.Attribute.DateTime;
    scheduled_at: Schema.Attribute.DateTime;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::post-tag.post-tag'> &
      Schema.Attribute.Required;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    type: Schema.Attribute.Enumeration<
      ['discussion', 'announcement', 'photo', 'question']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'discussion'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    views: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiProgramAcademicProgramAcademic
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_programacademics';
  info: {
    displayName: 'Program academics';
    pluralName: 'program-academics';
    singularName: 'program-academic';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    class_size: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
    courses: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-academic.program-academic'
    > &
      Schema.Attribute.Private;
    program: Schema.Attribute.Relation<'oneToOne', 'api::program.program'> &
      Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    trips: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProgramAccomodationProgramAccomodation
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_programaccomodations';
  info: {
    displayName: 'Program accomodations';
    pluralName: 'program-accomodations';
    singularName: 'program-accomodation';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amenities: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 300;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-accomodation.program-accomodation'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    program: Schema.Attribute.Relation<'oneToOne', 'api::program.program'> &
      Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProgramApplicationStepProgramApplicationStep
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_programapplicationstep';
  info: {
    displayName: 'Program application step';
    pluralName: 'program-application-steps';
    singularName: 'program-application-step';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deadline: Schema.Attribute.Date & Schema.Attribute.Required;
    description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 300;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-application-step.program-application-step'
    > &
      Schema.Attribute.Private;
    program: Schema.Attribute.Relation<'manyToOne', 'api::program.program'> &
      Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    step: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 32767;
          min: 0;
        },
        number
      >;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 30;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProgramCampusProgramCampus
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_programcampus';
  info: {
    displayName: 'Program campus';
    pluralName: 'program-campuses';
    singularName: 'program-campus';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    accreditation: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 64;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    has_accommodation: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-campus.program-campus'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 64;
      }>;
    program: Schema.Attribute.Relation<'manyToOne', 'api::program.program'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProgramCostProgramCost extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_programcost';
  info: {
    displayName: 'Program cost';
    pluralName: 'program-costs';
    singularName: 'program-cost';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    accommodation_fee: Schema.Attribute.Integer & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    extra_fee: Schema.Attribute.Integer & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-cost.program-cost'
    > &
      Schema.Attribute.Private;
    program: Schema.Attribute.Relation<'oneToOne', 'api::program.program'>;
    program_fee: Schema.Attribute.Integer & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    total_fee: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProgramFieldProgramField
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_programfield';
  info: {
    displayName: 'Program field';
    pluralName: 'program-fields';
    singularName: 'program-field';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-field.program-field'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 40;
      }>;
    programs: Schema.Attribute.Relation<'manyToMany', 'api::program.program'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProgramLocationProgramLocation
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_programlocation';
  info: {
    displayName: 'Program location';
    pluralName: 'program-locations';
    singularName: 'program-location';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    city: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 48;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-location.program-location'
    > &
      Schema.Attribute.Private;
    program: Schema.Attribute.Relation<'manyToOne', 'api::program.program'>;
    publishedAt: Schema.Attribute.DateTime;
    state: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 48;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProgramProviderProgramProvider
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_programprovider';
  info: {
    displayName: 'Program provider';
    pluralName: 'program-providers';
    singularName: 'program-provider';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    is_main: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-provider.program-provider'
    > &
      Schema.Attribute.Private;
    program: Schema.Attribute.Relation<'manyToOne', 'api::program.program'> &
      Schema.Attribute.Required;
    provider: Schema.Attribute.Relation<'manyToOne', 'api::provider.provider'> &
      Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    relationship_type: Schema.Attribute.Enumeration<
      ['owner', 'partner', 'external']
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProgramRequirementProgramRequirement
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_programrequirements';
  info: {
    displayName: 'Program requirements';
    pluralName: 'program-requirements';
    singularName: 'program-requirement';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    active_credits_needed: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 32767;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<12>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    gpa: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 6;
      }>;
    language: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 20;
      }>;
    level: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 30;
      }> &
      Schema.Attribute.DefaultTo<'Undergraduate'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-requirement.program-requirement'
    > &
      Schema.Attribute.Private;
    prerequisites: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    program: Schema.Attribute.Relation<'oneToOne', 'api::program.program'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProgramTermProgramTerm extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_programterm';
  info: {
    displayName: 'Program term';
    pluralName: 'program-terms';
    singularName: 'program-term';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    application_deadline: Schema.Attribute.DateTime;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    duration: Schema.Attribute.Enumeration<
      ['sem', 'yr', 'sum', 'brk', 'twowks', 'sxwks']
    > &
      Schema.Attribute.Required;
    end_date_time: Schema.Attribute.DateTime & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-term.program-term'
    > &
      Schema.Attribute.Private;
    program: Schema.Attribute.Relation<'manyToOne', 'api::program.program'> &
      Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    start_date_time: Schema.Attribute.DateTime & Schema.Attribute.Required;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProgramTestimonialProgramTestimonial
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_programtestimonial';
  info: {
    displayName: 'Program testimonial';
    pluralName: 'program-testimonials';
    singularName: 'program-testimonial';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-testimonial.program-testimonial'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 40;
      }>;
    program: Schema.Attribute.Relation<'manyToOne', 'api::program.program'> &
      Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    rating: Schema.Attribute.Integer & Schema.Attribute.Required;
    text: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 250;
      }>;
    time_period: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 20;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProgramProgram extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_program';
  info: {
    displayName: 'Program';
    pluralName: 'programs';
    singularName: 'program';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    academics: Schema.Attribute.Relation<
      'oneToOne',
      'api::program-academic.program-academic'
    >;
    accomodations: Schema.Attribute.Relation<
      'oneToOne',
      'api::program-accomodation.program-accomodation'
    >;
    application_deadline: Schema.Attribute.DateTime;
    application_link: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<'https://romewithme.com'>;
    application_steps: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-application-step.program-application-step'
    >;
    campuses: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-campus.program-campus'
    >;
    cost: Schema.Attribute.Relation<
      'oneToOne',
      'api::program-cost.program-cost'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 1600;
      }> &
      Schema.Attribute.DefaultTo<''>;
    duration: Schema.Attribute.Enumeration<
      ['sem', 'yr', 'sum', 'brk', 'twowks', 'sxwks']
    > &
      Schema.Attribute.Required;
    featured: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    fields: Schema.Attribute.Relation<
      'manyToMany',
      'api::program-field.program-field'
    > &
      Schema.Attribute.Required;
    gallery: Schema.Attribute.Relation<
      'manyToMany',
      'api::catalog-asset.catalog-asset'
    >;
    highlights: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    image: Schema.Attribute.Relation<
      'manyToOne',
      'api::catalog-asset.catalog-asset'
    > &
      Schema.Attribute.Required;
    info_link: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    language: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 30;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::program.program'
    > &
      Schema.Attribute.Private;
    locations: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-location.program-location'
    >;
    participants: Schema.Attribute.Integer;
    provider: Schema.Attribute.Relation<'manyToOne', 'api::provider.provider'> &
      Schema.Attribute.Required;
    provider_links: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-provider.program-provider'
    >;
    publication_status: Schema.Attribute.Enumeration<
      ['draft', 'in_review', 'published']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    publishedAt: Schema.Attribute.DateTime;
    rating: Schema.Attribute.Decimal & Schema.Attribute.Required;
    requirements: Schema.Attribute.Relation<
      'oneToOne',
      'api::program-requirement.program-requirement'
    >;
    saved_by_users: Schema.Attribute.Relation<
      'oneToMany',
      'api::saved-program.saved-program'
    >;
    shortDescription: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 120;
      }> &
      Schema.Attribute.DefaultTo<''>;
    terms: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-term.program-term'
    >;
    testimonials: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-testimonial.program-testimonial'
    >;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user_apps: Schema.Attribute.Relation<
      'oneToMany',
      'api::tracked-application.tracked-application'
    >;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-global-education-info.user-global-education-info'
    >;
  };
}

export interface ApiProviderAddressProviderAddress
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_provideraddress';
  info: {
    displayName: 'Provider address';
    pluralName: 'provider-addresses';
    singularName: 'provider-address';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    city: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 40;
      }>;
    country: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 30;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    line_one: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 124;
      }>;
    line_two: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 124;
      }> &
      Schema.Attribute.DefaultTo<''>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::provider-address.provider-address'
    > &
      Schema.Attribute.Private;
    provider_contact: Schema.Attribute.Relation<
      'oneToOne',
      'api::provider-contact-info.provider-contact-info'
    >;
    publishedAt: Schema.Attribute.DateTime;
    state: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 30;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    zip_code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 10;
      }>;
  };
}

export interface ApiProviderContactInfoProviderContactInfo
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_providercontactinfo';
  info: {
    displayName: 'Provider contact info';
    pluralName: 'provider-contact-infos';
    singularName: 'provider-contact-info';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    address: Schema.Attribute.Relation<
      'oneToOne',
      'api::provider-address.provider-address'
    > &
      Schema.Attribute.Required;
    country_code: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 4;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 254;
      }> &
      Schema.Attribute.DefaultTo<'example@email.com'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::provider-contact-info.provider-contact-info'
    > &
      Schema.Attribute.Private;
    phone: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 17;
      }>;
    provider: Schema.Attribute.Relation<'oneToOne', 'api::provider.provider'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    website: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
  };
}

export interface ApiProviderProvider extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_provider';
  info: {
    displayName: 'Provider';
    pluralName: 'providers';
    singularName: 'provider';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    contact: Schema.Attribute.Relation<
      'oneToOne',
      'api::provider-contact-info.provider-contact-info'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::provider.provider'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 284;
      }>;
    program_links: Schema.Attribute.Relation<
      'oneToMany',
      'api::program-provider.program-provider'
    >;
    programs: Schema.Attribute.Relation<'oneToMany', 'api::program.program'>;
    publishedAt: Schema.Attribute.DateTime;
    scholarships: Schema.Attribute.Relation<
      'oneToMany',
      'api::scholarship.scholarship'
    >;
    university: Schema.Attribute.Relation<
      'manyToOne',
      'api::university.university'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiResourceTagResourceTag extends Struct.CollectionTypeSchema {
  collectionName: 'editorial_resourcetag';
  info: {
    displayName: 'Resource Tag';
    pluralName: 'resource-tags';
    singularName: 'resource-tag';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::resource-tag.resource-tag'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 32;
      }>;
    publishedAt: Schema.Attribute.DateTime;
    resource: Schema.Attribute.Relation<'manyToMany', 'api::resource.resource'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiResourceResource extends Struct.CollectionTypeSchema {
  collectionName: 'editorial_resource';
  info: {
    displayName: 'Resource';
    pluralName: 'resources';
    singularName: 'resource';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    archived_at: Schema.Attribute.DateTime;
    author: Schema.Attribute.Relation<'manyToOne', 'api::author.author'>;
    body: Schema.Attribute.Text & Schema.Attribute.DefaultTo<''>;
    category: Schema.Attribute.Enumeration<
      ['guides', 'tips', 'itineraries', 'academic', 'cultural', 'general']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'general'>;
    content_format: Schema.Attribute.Enumeration<
      ['pdf', 'video', 'link', 'interactive', 'page']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'page'>;
    content_url: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<''>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 455;
      }>;
    downloads: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    featured: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    kind: Schema.Attribute.Enumeration<
      ['guides', 'tips', 'itineraries', 'academic', 'cultural', 'general']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'general'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::resource.resource'
    > &
      Schema.Attribute.Private;
    publication_status: Schema.Attribute.Enumeration<
      ['draft', 'review', 'scheduled', 'published', 'archived']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    publishedAt: Schema.Attribute.DateTime;
    rating: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    reviewed_at: Schema.Attribute.DateTime;
    saved_by_users: Schema.Attribute.Relation<'morphMany'>;
    scheduled_at: Schema.Attribute.DateTime;
    tags: Schema.Attribute.Relation<
      'manyToMany',
      'api::resource-tag.resource-tag'
    >;
    thumbnail: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<''>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    type: Schema.Attribute.Enumeration<
      ['pdf', 'video', 'link', 'interactive', 'page']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'page'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    views: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiSavedPostcardSavedPostcard
  extends Struct.CollectionTypeSchema {
  collectionName: 'members_savedpostcard';
  info: {
    displayName: 'Saved postcard';
    pluralName: 'saved-postcards';
    singularName: 'saved-postcard';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    article: Schema.Attribute.Relation<'manyToOne', 'api::article.article'> &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::saved-postcard.saved-postcard'
    > &
      Schema.Attribute.Private;
    position: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    saved_at: Schema.Attribute.DateTime & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
  };
}

export interface ApiSavedProgramSavedProgram
  extends Struct.CollectionTypeSchema {
  collectionName: 'members_savedprogram';
  info: {
    displayName: 'Saved program';
    pluralName: 'saved-programs';
    singularName: 'saved-program';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::saved-program.saved-program'
    > &
      Schema.Attribute.Private;
    position: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    program: Schema.Attribute.Relation<'manyToOne', 'api::program.program'> &
      Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    saved_at: Schema.Attribute.DateTime & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
  };
}

export interface ApiSavedResourceSavedResource
  extends Struct.CollectionTypeSchema {
  collectionName: 'members_savedresource';
  info: {
    displayName: 'Saved resource';
    pluralName: 'saved-resources';
    singularName: 'saved-resource';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::saved-resource.saved-resource'
    > &
      Schema.Attribute.Private;
    position: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    resource: Schema.Attribute.Relation<'morphToOne'> &
      Schema.Attribute.Required;
    saved_at: Schema.Attribute.DateTime & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
  };
}

export interface ApiSavedScholarshipSavedScholarship
  extends Struct.CollectionTypeSchema {
  collectionName: 'members_savedscholarship';
  info: {
    displayName: 'Saved scholarship';
    pluralName: 'saved-scholarships';
    singularName: 'saved-scholarship';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::saved-scholarship.saved-scholarship'
    > &
      Schema.Attribute.Private;
    position: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    saved_at: Schema.Attribute.DateTime & Schema.Attribute.Required;
    scholarship: Schema.Attribute.Relation<
      'manyToOne',
      'api::scholarship.scholarship'
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
  };
}

export interface ApiScholarshipApplicationProcessStepScholarshipApplicationProcessStep
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_scholarshipapplicationprocessstep';
  info: {
    displayName: 'Scholarship application process step';
    pluralName: 'scholarship-application-process-steps';
    singularName: 'scholarship-application-process-step';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    complete_by: Schema.Attribute.Date & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::scholarship-application-process-step.scholarship-application-process-step'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    scholarship: Schema.Attribute.Relation<
      'manyToOne',
      'api::scholarship.scholarship'
    > &
      Schema.Attribute.Required;
    step: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 32767;
          min: -32768;
        },
        number
      >;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 30;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiScholarshipEventScholarshipEvent
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_scholarshipevent';
  info: {
    displayName: 'Scholarship event';
    pluralName: 'scholarship-events';
    singularName: 'scholarship-event';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::scholarship-event.scholarship-event'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
    publishedAt: Schema.Attribute.DateTime;
    scholarship: Schema.Attribute.Relation<
      'manyToOne',
      'api::scholarship.scholarship'
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiScholarshipRequirementScholarshipRequirement
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_scholarshiprequirements';
  info: {
    displayName: 'Scholarship requirements';
    pluralName: 'scholarship-requirements';
    singularName: 'scholarship-requirement';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    eligibility: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 300;
      }>;
    field: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 64;
      }>;
    grad_year: Schema.Attribute.Enumeration<
      ['fr', 'sp', 'jn', 'sn', 'gr', 'al', 'n/a']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'n/a'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::scholarship-requirement.scholarship-requirement'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    scholarship: Schema.Attribute.Relation<
      'oneToOne',
      'api::scholarship.scholarship'
    >;
    study_country: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 125;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiScholarshipScholarship extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_scholarship';
  info: {
    displayName: 'Scholarship';
    pluralName: 'scholarships';
    singularName: 'scholarship';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    application_steps: Schema.Attribute.Relation<
      'oneToMany',
      'api::scholarship-application-process-step.scholarship-application-process-step'
    >;
    benefits: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    categories: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deadline: Schema.Attribute.Date & Schema.Attribute.Required;
    description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 1024;
      }> &
      Schema.Attribute.DefaultTo<''>;
    events: Schema.Attribute.Relation<
      'oneToMany',
      'api::scholarship-event.scholarship-event'
    >;
    featured: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    gallery: Schema.Attribute.Relation<
      'manyToMany',
      'api::catalog-asset.catalog-asset'
    >;
    image: Schema.Attribute.Relation<
      'manyToOne',
      'api::catalog-asset.catalog-asset'
    >;
    link: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::scholarship.scholarship'
    > &
      Schema.Attribute.Private;
    lower_bound: Schema.Attribute.Decimal & Schema.Attribute.Required;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    provider: Schema.Attribute.Relation<'manyToOne', 'api::provider.provider'> &
      Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    rating: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<5>;
    requirements: Schema.Attribute.Relation<
      'oneToOne',
      'api::scholarship-requirement.scholarship-requirement'
    >;
    saved_by_users: Schema.Attribute.Relation<
      'oneToMany',
      'api::saved-scholarship.saved-scholarship'
    >;
    status: Schema.Attribute.Enumeration<['open', 'closed', 'upcoming']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'upcoming'>;
    summary: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<''>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    upper_bound: Schema.Attribute.Decimal;
    user_apps: Schema.Attribute.Relation<
      'oneToMany',
      'api::tracked-application.tracked-application'
    >;
  };
}

export interface ApiSitePropertySiteProperty extends Struct.SingleTypeSchema {
  collectionName: 'siteconfig_siteproperty';
  info: {
    displayName: 'Site Property';
    pluralName: 'site-properties';
    singularName: 'site-property';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text & Schema.Attribute.DefaultTo<''>;
    is_public: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    json_schema: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<{}>;
    key: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 120;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::site-property.site-property'
    > &
      Schema.Attribute.Private;
    namespace: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }> &
      Schema.Attribute.DefaultTo<'general'>;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['string', 'bool', 'image', 'json']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'string'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    value: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface ApiTipTip extends Struct.CollectionTypeSchema {
  collectionName: 'editorial_tip';
  info: {
    displayName: 'Tip';
    pluralName: 'tips';
    singularName: 'tip';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    archived_at: Schema.Attribute.DateTime;
    author: Schema.Attribute.Relation<'manyToOne', 'api::author.author'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 455;
      }>;
    downloads: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    featured: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::tip.tip'> &
      Schema.Attribute.Private;
    page_content: Schema.Attribute.RichText & Schema.Attribute.DefaultTo<''>;
    publication_status: Schema.Attribute.Enumeration<
      ['draft', 'review', 'scheduled', 'published', 'archived']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    publishedAt: Schema.Attribute.DateTime;
    rating: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    reviewed_at: Schema.Attribute.DateTime;
    saved_by_users: Schema.Attribute.Relation<'morphMany'>;
    scheduled_at: Schema.Attribute.DateTime;
    tags: Schema.Attribute.Relation<
      'manyToMany',
      'api::resource-tag.resource-tag'
    >;
    thumbnail: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<''>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    views: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiTopPickArticleTopPickArticle
  extends Struct.SingleTypeSchema {
  collectionName: 'editorial_toppickarticle';
  info: {
    displayName: 'Recommended Article';
    pluralName: 'top-pick-articles';
    singularName: 'top-pick-article';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    article: Schema.Attribute.Relation<'oneToOne', 'api::article.article'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ends_at: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::top-pick-article.top-pick-article'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    slot_key: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 64;
      }> &
      Schema.Attribute.DefaultTo<'postcards.top_pick'>;
    starts_at: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTrackedApplicationTrackedApplication
  extends Struct.CollectionTypeSchema {
  collectionName: 'journeys_trackedapplication';
  info: {
    displayName: 'Tracked application';
    pluralName: 'tracked-applications';
    singularName: 'tracked-application';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    for_external: Schema.Attribute.Relation<
      'manyToOne',
      'api::external-tracked-application.external-tracked-application'
    >;
    for_program: Schema.Attribute.Relation<'manyToOne', 'api::program.program'>;
    for_scholarship: Schema.Attribute.Relation<
      'manyToOne',
      'api::scholarship.scholarship'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::tracked-application.tracked-application'
    > &
      Schema.Attribute.Private;
    progress: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      [
        'not-started',
        'writing-statements',
        'in-progress',
        'reviewing',
        'completed',
        'submitted',
      ]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'not-started'>;
    submission_on: Schema.Attribute.Date;
    submitted: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    tracked_since: Schema.Attribute.Date & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<['scholarship', 'program', 'ext']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Required;
  };
}

export interface ApiUiStringTranslationUiStringTranslation
  extends Struct.CollectionTypeSchema {
  collectionName: 'siteconfig_uistringtranslation';
  info: {
    displayName: 'UIString Translation';
    pluralName: 'ui-string-translations';
    singularName: 'ui-string-translation';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    language: Schema.Attribute.Relation<'manyToOne', 'api::lang.lang'> &
      Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::ui-string-translation.ui-string-translation'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    ui_string: Schema.Attribute.Relation<
      'manyToOne',
      'api::ui-string.ui-string'
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    value: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 1000;
      }>;
  };
}

export interface ApiUiStringUiString extends Struct.CollectionTypeSchema {
  collectionName: 'siteconfig_uistring';
  info: {
    displayName: 'UIString';
    pluralName: 'ui-strings';
    singularName: 'ui-string';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<''>;
    key: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::ui-string.ui-string'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    translations: Schema.Attribute.Relation<
      'oneToMany',
      'api::ui-string-translation.ui-string-translation'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiUniversityAcademicStatUniversityAcademicStat
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_universityacademicstats';
  info: {
    displayName: 'University academic stats';
    pluralName: 'university-academic-stats';
    singularName: 'university-academic-stat';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    grad_rate: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 32767;
          min: 0;
        },
        number
      >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::university-academic-stat.university-academic-stat'
    > &
      Schema.Attribute.Private;
    num_of_majors: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 32767;
          min: 0;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    ratio: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 32767;
          min: 0;
        },
        number
      >;
    retention: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 32767;
          min: 0;
        },
        number
      >;
    university: Schema.Attribute.Relation<
      'oneToOne',
      'api::university.university'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiUniversityCampusLifeUniversityCampusLife
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_universitycampuslife';
  info: {
    displayName: 'University campus life';
    pluralName: 'university-campus-lives';
    singularName: 'university-campus-life';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::university-campus-life.university-campus-life'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    school_size: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 32;
      }> &
      Schema.Attribute.DefaultTo<''>;
    school_type_designation: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 40;
      }> &
      Schema.Attribute.DefaultTo<''>;
    school_type_years: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 32767;
          min: 0;
        },
        number
      >;
    university: Schema.Attribute.Relation<
      'oneToOne',
      'api::university.university'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiUniversityContactInfoUniversityContactInfo
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_universitycontactinfo';
  info: {
    displayName: 'University contact info';
    pluralName: 'university-contact-infos';
    singularName: 'university-contact-info';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    city: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 120;
      }> &
      Schema.Attribute.DefaultTo<''>;
    country_code: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 8;
      }> &
      Schema.Attribute.DefaultTo<''>;
    country_name: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<''>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::university-contact-info.university-contact-info'
    > &
      Schema.Attribute.Private;
    phone: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 32;
      }> &
      Schema.Attribute.DefaultTo<''>;
    publishedAt: Schema.Attribute.DateTime;
    state_code: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 16;
      }> &
      Schema.Attribute.DefaultTo<''>;
    street: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<''>;
    university: Schema.Attribute.Relation<
      'oneToOne',
      'api::university.university'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    zip_code: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 20;
      }> &
      Schema.Attribute.DefaultTo<''>;
  };
}

export interface ApiUniversityLocationUniversityLocation
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_universitylocation';
  info: {
    displayName: 'University location';
    pluralName: 'university-locations';
    singularName: 'university-location';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    city: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 120;
      }> &
      Schema.Attribute.DefaultTo<''>;
    country_code: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 8;
      }> &
      Schema.Attribute.DefaultTo<''>;
    country_name: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<''>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::university-location.university-location'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    school_setting: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }> &
      Schema.Attribute.DefaultTo<''>;
    state_code: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 16;
      }> &
      Schema.Attribute.DefaultTo<''>;
    state_name: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 125;
      }> &
      Schema.Attribute.DefaultTo<''>;
    university: Schema.Attribute.Relation<
      'oneToOne',
      'api::university.university'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    zip_code: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 20;
      }> &
      Schema.Attribute.DefaultTo<''>;
  };
}

export interface ApiUniversitySchoolUrlUniversitySchoolUrl
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_universityschoolurls';
  info: {
    displayName: 'University school URLs';
    pluralName: 'university-school-urls';
    singularName: 'university-school-url';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    application_site_url: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<''>;
    common_application_url: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<''>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::university-school-url.university-school-url'
    > &
      Schema.Attribute.Private;
    net_price_calculator_url: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<''>;
    publishedAt: Schema.Attribute.DateTime;
    university: Schema.Attribute.Relation<
      'oneToOne',
      'api::university.university'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    virtual_tour_video_url: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<''>;
    website_url: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<''>;
  };
}

export interface ApiUniversitySocialMediaLinkUniversitySocialMediaLink
  extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_universitysocialmedialinks';
  info: {
    displayName: 'University social media links';
    pluralName: 'university-social-media-links';
    singularName: 'university-social-media-link';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    facebook: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    instagram: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    linkedin: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::university-social-media-link.university-social-media-link'
    > &
      Schema.Attribute.Private;
    other: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    publishedAt: Schema.Attribute.DateTime;
    twitter: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    university: Schema.Attribute.Relation<
      'oneToOne',
      'api::university.university'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    youtube: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
  };
}

export interface ApiUniversityUniversity extends Struct.CollectionTypeSchema {
  collectionName: 'catalog_university';
  info: {
    displayName: 'University';
    pluralName: 'universities';
    singularName: 'university';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    academic_stats: Schema.Attribute.Relation<
      'oneToOne',
      'api::university-academic-stat.university-academic-stat'
    >;
    accreditation: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 70;
      }>;
    campus_life: Schema.Attribute.Relation<
      'oneToOne',
      'api::university-campus-life.university-campus-life'
    >;
    contact_info: Schema.Attribute.Relation<
      'oneToOne',
      'api::university-contact-info.university-contact-info'
    >;
    country: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date_created: Schema.Attribute.DateTime & Schema.Attribute.Required;
    description: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 800;
      }>;
    founded: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 32767;
          min: 0;
        },
        number
      >;
    has_study_abroad: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::university.university'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.Relation<
      'oneToOne',
      'api::university-location.university-location'
    >;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    provider_set: Schema.Attribute.Relation<
      'oneToMany',
      'api::provider.provider'
    >;
    publishedAt: Schema.Attribute.DateTime;
    school_urls: Schema.Attribute.Relation<
      'oneToOne',
      'api::university-school-url.university-school-url'
    >;
    size: Schema.Attribute.Integer & Schema.Attribute.Required;
    social_media_links: Schema.Attribute.Relation<
      'oneToOne',
      'api::university-social-media-link.university-social-media-link'
    >;
    state: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 125;
      }>;
    students: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-education-info.user-education-info'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiUpdateCategoryUpdateCategory
  extends Struct.CollectionTypeSchema {
  collectionName: 'editorial_updatecategory';
  info: {
    displayName: 'Update Category';
    pluralName: 'update-categories';
    singularName: 'update-category';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::update-category.update-category'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    updates: Schema.Attribute.Relation<'oneToMany', 'api::update.update'>;
  };
}

export interface ApiUpdateUpdate extends Struct.CollectionTypeSchema {
  collectionName: 'editorial_update';
  info: {
    displayName: 'Update';
    pluralName: 'updates';
    singularName: 'update';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    archived_at: Schema.Attribute.DateTime;
    category: Schema.Attribute.Relation<
      'manyToOne',
      'api::update-category.update-category'
    >;
    color: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 10;
      }>;
    comment_count: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    comments: Schema.Attribute.Relation<'morphMany'>;
    content: Schema.Attribute.RichText;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    expires_at: Schema.Attribute.DateTime;
    image: Schema.Attribute.Relation<
      'manyToOne',
      'api::editorial-asset.editorial-asset'
    > &
      Schema.Attribute.Required;
    is_active: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<true>;
    like_count: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    likes: Schema.Attribute.Relation<'morphMany'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::update.update'
    > &
      Schema.Attribute.Private;
    publication_status: Schema.Attribute.Enumeration<
      ['draft', 'review', 'scheduled', 'published', 'archived']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    publishedAt: Schema.Attribute.DateTime;
    reviewed_at: Schema.Attribute.DateTime;
    scheduled_at: Schema.Attribute.DateTime;
    shares: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    summary: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 300;
      }>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    urgency: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 10;
      }>;
    urgent: Schema.Attribute.Boolean & Schema.Attribute.Required;
    views: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiUserBadgeUserBadge extends Struct.CollectionTypeSchema {
  collectionName: 'members_userbadge';
  info: {
    displayName: 'User badge';
    pluralName: 'user-badges';
    singularName: 'user-badge';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    awarded_at: Schema.Attribute.DateTime & Schema.Attribute.Required;
    badge: Schema.Attribute.Relation<'manyToOne', 'api::badge.badge'> &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-badge.user-badge'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    reason: Schema.Attribute.Enumeration<['assigned', 'earned']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user_profile: Schema.Attribute.Relation<
      'manyToOne',
      'api::user-profile-info.user-profile-info'
    > &
      Schema.Attribute.Required;
  };
}

export interface ApiUserEducationInfoUserEducationInfo
  extends Struct.CollectionTypeSchema {
  collectionName: 'members_usereducationinfo';
  info: {
    displayName: 'User education info';
    pluralName: 'user-education-infos';
    singularName: 'user-education-info';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-education-info.user-education-info'
    > &
      Schema.Attribute.Private;
    major: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'N/A'>;
    publishedAt: Schema.Attribute.DateTime;
    student_level: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 32;
      }> &
      Schema.Attribute.DefaultTo<''>;
    university: Schema.Attribute.Relation<
      'manyToOne',
      'api::university.university'
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    year: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<2025>;
  };
}

export interface ApiUserGlobalEducationInfoUserGlobalEducationInfo
  extends Struct.CollectionTypeSchema {
  collectionName: 'members_userglobaleducationinfo';
  info: {
    displayName: 'User global education info';
    pluralName: 'user-global-education-infos';
    singularName: 'user-global-education-info';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    current_program: Schema.Attribute.Relation<
      'manyToOne',
      'api::program.program'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-global-education-info.user-global-education-info'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    went_abroad: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
  };
}

export interface ApiUserProfileActivityUserProfileActivity
  extends Struct.CollectionTypeSchema {
  collectionName: 'members_userprofileactivity';
  info: {
    displayName: 'User profile activity';
    pluralName: 'user-profile-activities';
    singularName: 'user-profile-activity';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.Enumeration<
      [
        'posted',
        'commented-on',
        'updated',
        'submitted',
        'liked',
        'switched-program-to',
      ]
    > &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-profile-activity.user-profile-activity'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    subject: Schema.Attribute.Relation<'morphToOne'> &
      Schema.Attribute.Required;
    timestamp: Schema.Attribute.DateTime & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiUserProfileInfoUserProfileInfo
  extends Struct.CollectionTypeSchema {
  collectionName: 'members_userprofileinfo';
  info: {
    displayName: 'User profile info';
    pluralName: 'user-profile-infos';
    singularName: 'user-profile-info';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    avatar: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<''>;
    bio: Schema.Attribute.Text & Schema.Attribute.DefaultTo<''>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    is_contributer: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    is_founder: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    is_staff: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-profile-info.user-profile-info'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    userbadge_set: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-badge.user-badge'
    >;
    verified_at: Schema.Attribute.DateTime;
    visibility: Schema.Attribute.Enumeration<['private', 'members', 'public']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'private'>;
  };
}

export interface ApiUserSavedItemUserSavedItem
  extends Struct.CollectionTypeSchema {
  collectionName: 'members_usersaveditems';
  info: {
    displayName: 'User saved items';
    pluralName: 'user-saved-items';
    singularName: 'user-saved-item';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-saved-item.user-saved-item'
    > &
      Schema.Attribute.Private;
    postcards: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    programs: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    publishedAt: Schema.Attribute.DateTime;
    resources: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    scholarships: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiUserSensitiveInfoUserSensitiveInfo
  extends Struct.CollectionTypeSchema {
  collectionName: 'members_usersensitiveinfo';
  info: {
    displayName: 'User sensitive info';
    pluralName: 'user-sensitive-infos';
    singularName: 'user-sensitive-info';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    country_code: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 4;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dob: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-sensitive-info.user-sensitive-info'
    > &
      Schema.Attribute.Private;
    location_info: Schema.Attribute.Relation<
      'oneToOne',
      'api::address-info.address-info'
    >;
    marketing_consent_at: Schema.Attribute.DateTime;
    phone_e164: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 16;
      }> &
      Schema.Attribute.DefaultTo<''>;
    phone_number: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 15;
      }> &
      Schema.Attribute.DefaultTo<''>;
    phone_verified_at: Schema.Attribute.DateTime;
    privacy_policy_accepted_at: Schema.Attribute.DateTime;
    publishedAt: Schema.Attribute.DateTime;
    terms_accepted_at: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.Text;
    caption: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    focalPoint: Schema.Attribute.JSON;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.Text;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.Text & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    activities: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-profile-activity.user-profile-activity'
    >;
    anonymized_at: Schema.Attribute.DateTime & Schema.Attribute.Private;
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deletion_requested_at: Schema.Attribute.DateTime & Schema.Attribute.Private;
    editorial_assets: Schema.Attribute.Relation<
      'oneToMany',
      'api::editorial-asset.editorial-asset'
    >;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    first_name: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 150;
      }> &
      Schema.Attribute.DefaultTo<''>;
    last_name: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 150;
      }> &
      Schema.Attribute.DefaultTo<''>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    owned_education: Schema.Attribute.Relation<
      'oneToOne',
      'api::user-education-info.user-education-info'
    >;
    owned_global_background: Schema.Attribute.Relation<
      'oneToOne',
      'api::global-background.global-background'
    >;
    owned_int_education: Schema.Attribute.Relation<
      'oneToOne',
      'api::user-global-education-info.user-global-education-info'
    >;
    owned_profile: Schema.Attribute.Relation<
      'oneToOne',
      'api::user-profile-info.user-profile-info'
    >;
    owned_sensitive_info: Schema.Attribute.Relation<
      'oneToOne',
      'api::user-sensitive-info.user-sensitive-info'
    >;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Schema.Attribute.String;
    public_author: Schema.Attribute.Relation<'oneToOne', 'api::author.author'>;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    saved_items: Schema.Attribute.Relation<
      'oneToOne',
      'api::user-saved-item.user-saved-item'
    >;
    saved_postcards: Schema.Attribute.Relation<
      'oneToMany',
      'api::saved-postcard.saved-postcard'
    >;
    saved_programs: Schema.Attribute.Relation<
      'oneToMany',
      'api::saved-program.saved-program'
    >;
    saved_resources: Schema.Attribute.Relation<
      'oneToMany',
      'api::saved-resource.saved-resource'
    >;
    saved_scholarships: Schema.Attribute.Relation<
      'oneToMany',
      'api::saved-scholarship.saved-scholarship'
    >;
    timezone: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 63;
      }> &
      Schema.Attribute.DefaultTo<'UTC'>;
    tracked_applications: Schema.Attribute.Relation<
      'oneToMany',
      'api::tracked-application.tracked-application'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::academic-resource.academic-resource': ApiAcademicResourceAcademicResource;
      'api::address-info.address-info': ApiAddressInfoAddressInfo;
      'api::article-category.article-category': ApiArticleCategoryArticleCategory;
      'api::article-location.article-location': ApiArticleLocationArticleLocation;
      'api::article-tag.article-tag': ApiArticleTagArticleTag;
      'api::article.article': ApiArticleArticle;
      'api::author.author': ApiAuthorAuthor;
      'api::badge.badge': ApiBadgeBadge;
      'api::catalog-asset.catalog-asset': ApiCatalogAssetCatalogAsset;
      'api::comment.comment': ApiCommentComment;
      'api::cultural-resource.cultural-resource': ApiCulturalResourceCulturalResource;
      'api::editorial-asset-placement.editorial-asset-placement': ApiEditorialAssetPlacementEditorialAssetPlacement;
      'api::editorial-asset.editorial-asset': ApiEditorialAssetEditorialAsset;
      'api::external-tracked-application.external-tracked-application': ApiExternalTrackedApplicationExternalTrackedApplication;
      'api::global-background.global-background': ApiGlobalBackgroundGlobalBackground;
      'api::guide.guide': ApiGuideGuide;
      'api::itinerary.itinerary': ApiItineraryItinerary;
      'api::lang.lang': ApiLangLang;
      'api::like.like': ApiLikeLike;
      'api::post-category.post-category': ApiPostCategoryPostCategory;
      'api::post-tag.post-tag': ApiPostTagPostTag;
      'api::post.post': ApiPostPost;
      'api::program-academic.program-academic': ApiProgramAcademicProgramAcademic;
      'api::program-accomodation.program-accomodation': ApiProgramAccomodationProgramAccomodation;
      'api::program-application-step.program-application-step': ApiProgramApplicationStepProgramApplicationStep;
      'api::program-campus.program-campus': ApiProgramCampusProgramCampus;
      'api::program-cost.program-cost': ApiProgramCostProgramCost;
      'api::program-field.program-field': ApiProgramFieldProgramField;
      'api::program-location.program-location': ApiProgramLocationProgramLocation;
      'api::program-provider.program-provider': ApiProgramProviderProgramProvider;
      'api::program-requirement.program-requirement': ApiProgramRequirementProgramRequirement;
      'api::program-term.program-term': ApiProgramTermProgramTerm;
      'api::program-testimonial.program-testimonial': ApiProgramTestimonialProgramTestimonial;
      'api::program.program': ApiProgramProgram;
      'api::provider-address.provider-address': ApiProviderAddressProviderAddress;
      'api::provider-contact-info.provider-contact-info': ApiProviderContactInfoProviderContactInfo;
      'api::provider.provider': ApiProviderProvider;
      'api::resource-tag.resource-tag': ApiResourceTagResourceTag;
      'api::resource.resource': ApiResourceResource;
      'api::saved-postcard.saved-postcard': ApiSavedPostcardSavedPostcard;
      'api::saved-program.saved-program': ApiSavedProgramSavedProgram;
      'api::saved-resource.saved-resource': ApiSavedResourceSavedResource;
      'api::saved-scholarship.saved-scholarship': ApiSavedScholarshipSavedScholarship;
      'api::scholarship-application-process-step.scholarship-application-process-step': ApiScholarshipApplicationProcessStepScholarshipApplicationProcessStep;
      'api::scholarship-event.scholarship-event': ApiScholarshipEventScholarshipEvent;
      'api::scholarship-requirement.scholarship-requirement': ApiScholarshipRequirementScholarshipRequirement;
      'api::scholarship.scholarship': ApiScholarshipScholarship;
      'api::site-property.site-property': ApiSitePropertySiteProperty;
      'api::tip.tip': ApiTipTip;
      'api::top-pick-article.top-pick-article': ApiTopPickArticleTopPickArticle;
      'api::tracked-application.tracked-application': ApiTrackedApplicationTrackedApplication;
      'api::ui-string-translation.ui-string-translation': ApiUiStringTranslationUiStringTranslation;
      'api::ui-string.ui-string': ApiUiStringUiString;
      'api::university-academic-stat.university-academic-stat': ApiUniversityAcademicStatUniversityAcademicStat;
      'api::university-campus-life.university-campus-life': ApiUniversityCampusLifeUniversityCampusLife;
      'api::university-contact-info.university-contact-info': ApiUniversityContactInfoUniversityContactInfo;
      'api::university-location.university-location': ApiUniversityLocationUniversityLocation;
      'api::university-school-url.university-school-url': ApiUniversitySchoolUrlUniversitySchoolUrl;
      'api::university-social-media-link.university-social-media-link': ApiUniversitySocialMediaLinkUniversitySocialMediaLink;
      'api::university.university': ApiUniversityUniversity;
      'api::update-category.update-category': ApiUpdateCategoryUpdateCategory;
      'api::update.update': ApiUpdateUpdate;
      'api::user-badge.user-badge': ApiUserBadgeUserBadge;
      'api::user-education-info.user-education-info': ApiUserEducationInfoUserEducationInfo;
      'api::user-global-education-info.user-global-education-info': ApiUserGlobalEducationInfoUserGlobalEducationInfo;
      'api::user-profile-activity.user-profile-activity': ApiUserProfileActivityUserProfileActivity;
      'api::user-profile-info.user-profile-info': ApiUserProfileInfoUserProfileInfo;
      'api::user-saved-item.user-saved-item': ApiUserSavedItemUserSavedItem;
      'api::user-sensitive-info.user-sensitive-info': ApiUserSensitiveInfoUserSensitiveInfo;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
