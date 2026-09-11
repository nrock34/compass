import { errors } from '@strapi/utils';
import { EDITORIAL_WORKFLOW_UIDS, isEditorialWorkflowUid } from './editorial-state';
import { hasOwn, type Data } from './validation-types';

const { ValidationError } = errors;

const TRACKED_APPLICATION_UID = 'api::tracked-application.tracked-application';
const EDITORIAL_ASSET_UID = 'api::editorial-asset.editorial-asset';

const EDITORIAL_STATE_FIELDS = new Set([
  'publication_status',
  'reviewed_at',
  'scheduled_at',
  'publishedAt',
  'archived_at',
  'published',
  'is_active',
  'date_published',
]);


const TRACKED_APPLICATION_STATE_FIELDS = new Set([
  'status',
  'submitted',
  'submission_on',
  'progress',
]);

export const WORKFLOW_GUARD_UIDS = [
  ...EDITORIAL_WORKFLOW_UIDS,
  TRACKED_APPLICATION_UID,
  EDITORIAL_ASSET_UID,
];

function assertNoDirectStateFields(data: Data, fields: Set<string>, label: string): void {
  const supplied = [...fields].filter((field) => hasOwn(data, field));
  if (supplied.length > 0) {
    throw new ValidationError(
      `${label} state is workflow-managed. Use the dedicated transition service instead of direct updates.`,
      { fields: supplied },
    );
  }
}

function normalizeEditorialCreate(data: Data): void {
  data.publication_status = 'draft';
  data.views = 0;
  if (hasOwn(data, 'published')) data.published = false;
  if (hasOwn(data, 'is_active')) data.is_active = true;
  for (const field of ['reviewed_at', 'scheduled_at', 'publishedAt', 'archived_at', 'date_published']) {
    if (hasOwn(data, field)) data[field] = null;
  }
}

function stripEditorialState(data: Data): void {
  for (const field of EDITORIAL_STATE_FIELDS) delete data[field];
  delete data.views;
}

function validateTrackedApplicationCreate(data: Data): void {
  const status = data.status ?? 'not-started';
  if (status !== 'not-started') {
    throw new ValidationError('Tracked applications must be created as not-started; use the transition service afterward.');
  }
  const supplied = ['submitted', 'submission_on', 'progress'].filter((field) => hasOwn(data, field));
  if (data.submitted === true || data.submission_on !== undefined || (data.progress !== undefined && data.progress !== 0)) {
    throw new ValidationError('Tracked-application state is workflow-managed.', { fields: supplied });
  }
}

function validateEditorialAssetCreate(data: Data): void {
  if ((data.status ?? 'pending') !== 'pending') {
    throw new ValidationError('Editorial assets must be created as pending; use the asset finalization workflow afterward.');
  }
}

/** Guard generic CRUD so all state changes pass through named services. */
export function validateWorkflowWrite(uid: string, data: Data, creating: boolean): void {
  if (isEditorialWorkflowUid(uid)) {
    if (creating) normalizeEditorialCreate(data);
    else stripEditorialState(data);
  }

  if (uid === TRACKED_APPLICATION_UID) {
    if (creating) validateTrackedApplicationCreate(data);
    else assertNoDirectStateFields(data, TRACKED_APPLICATION_STATE_FIELDS, 'Tracked-application');
  }

  if (uid === EDITORIAL_ASSET_UID) {
    if (creating) validateEditorialAssetCreate(data);
    else assertNoDirectStateFields(data, new Set(['status', 'ready_at', 'failed_at']), 'Editorial asset');
  }
}
