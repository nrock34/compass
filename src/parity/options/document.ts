import { ARTICLE_LOCATION_DEFAULT_ID } from './constants';

export type DocumentWriteRule = Readonly<{
  field: string;
  event: 'create' | 'save';
  assignment: 'always' | 'if-missing';
  source: 'iso-now' | 'local-date' | 'uuid' | { relationId: number };
}>;

export const DJANGO_DOCUMENT_OPTIONS: Readonly<Record<string, readonly DocumentWriteRule[]>> = {
  'api::saved-postcard.saved-postcard': [{ field: 'saved_at', event: 'create', assignment: 'always', source: 'iso-now' }],
  'api::saved-program.saved-program': [{ field: 'saved_at', event: 'create', assignment: 'always', source: 'iso-now' }],
  'api::saved-resource.saved-resource': [{ field: 'saved_at', event: 'create', assignment: 'always', source: 'iso-now' }],
  'api::saved-scholarship.saved-scholarship': [{ field: 'saved_at', event: 'create', assignment: 'always', source: 'iso-now' }],
  'api::university.university': [{ field: 'date_created', event: 'create', assignment: 'always', source: 'iso-now' }],
  'api::user-badge.user-badge': [{ field: 'awarded_at', event: 'create', assignment: 'always', source: 'iso-now' }],
  'api::user-profile-activity.user-profile-activity': [{ field: 'timestamp', event: 'create', assignment: 'always', source: 'iso-now' }],
  'api::author.author': [{ field: 'public_id', event: 'create', assignment: 'if-missing', source: 'uuid' }],
  'api::top-pick-article.top-pick-article': [
    { field: 'starts_at', event: 'create', assignment: 'if-missing', source: 'iso-now' },
    { field: 'createdAt', event: 'create', assignment: 'if-missing', source: 'iso-now' },
    { field: 'updatedAt', event: 'save', assignment: 'always', source: 'iso-now' },
  ],
  'api::tracked-application.tracked-application': [{ field: 'tracked_since', event: 'create', assignment: 'if-missing', source: 'local-date' }],
  'api::article.article': [{ field: 'location', event: 'create', assignment: 'if-missing', source: { relationId: ARTICLE_LOCATION_DEFAULT_ID } }],
};
