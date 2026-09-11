import { assertPostcardDocument } from './validator';

const ARTICLE_UID = 'api::article.article';

type StrapiLike = {
  customFields: { register(field: unknown): void };
  db?: { lifecycles?: { subscribe(subscriber: unknown): void } };
};

export default {
  register({ strapi }: { strapi: StrapiLike }) {
    strapi.customFields.register({
      name: 'postcard-document',
      plugin: 'postcard-editor',
      type: 'json',
      inputSize: { default: 12, isResizable: true },
      validator: assertPostcardDocument,
    });

    // Custom-field validators are also used by the admin. Lifecycle validation is
    // the server-side enforcement point for REST, GraphQL, and programmatic writes.
    strapi.db?.lifecycles?.subscribe({
      models: [ARTICLE_UID],
      beforeCreate(event: { params?: { data?: Record<string, unknown> } }) {
        const content = event.params?.data?.content;
        if (content !== undefined) assertPostcardDocument(content);
      },
      beforeUpdate(event: { params?: { data?: Record<string, unknown> } }) {
        const content = event.params?.data?.content;
        if (content !== undefined) assertPostcardDocument(content);
      },
    });
  },
};
