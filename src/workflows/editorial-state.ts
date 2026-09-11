import { errors } from '@strapi/utils';

const { ValidationError } = errors;

export type EditorialWorkflowRecord = Record<string, unknown>;

export const EDITORIAL_WORKFLOW_UIDS = [
  'api::article.article',
  'api::post.post',
  'api::resource.resource',
  'api::update.update',
  'api::tip.tip',
  'api::guide.guide',
  'api::itinerary.itinerary',
  'api::academic-resource.academic-resource',
  'api::cultural-resource.cultural-resource',
  'api::editorial-asset.editorial-asset',
] as const;

export type EditorialWorkflowUid = (typeof EDITORIAL_WORKFLOW_UIDS)[number];

export const EDITORIAL_STATUSES = [
  'draft',
  'review',
  'scheduled',
  'published',
  'archived',
] as const;

export type EditorialStatus = (typeof EDITORIAL_STATUSES)[number];

const EDITORIAL_TRANSITIONS: Readonly<Record<EditorialStatus, readonly EditorialStatus[]>> = {
  draft: ['review', 'scheduled', 'published'],
  review: ['draft', 'scheduled', 'published'],
  scheduled: ['draft', 'published'],
  published: ['archived'],
  archived: ['draft', 'review', 'published'],
};

function workflowDate(value: unknown, field: string): Date {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.valueOf())) {
    throw new ValidationError(`${field} must be a valid date/time.`);
  }
  return date;
}

function workflowIsoDateTime(value: Date): string {
  return value.toISOString();
}

function isEditorialStatus(value: unknown): value is EditorialStatus {
  return typeof value === 'string' && (EDITORIAL_STATUSES as readonly string[]).includes(value);
}

function editorialStatus(value: unknown, label: string): EditorialStatus {
  if (!isEditorialStatus(value)) {
    throw new ValidationError(`Unknown editorial publication ${label}: ${String(value)}.`);
  }
  return value;
}

function existingDateTime(record: EditorialWorkflowRecord, field: string): string | undefined {
  const value = record[field];
  if (value === null || value === undefined || value === '') return undefined;
  return workflowIsoDateTime(workflowDate(value, field));
}

export function isEditorialWorkflowUid(uid: string): uid is EditorialWorkflowUid {
  return (EDITORIAL_WORKFLOW_UIDS as readonly string[]).includes(uid);
}

/** Reject a workflow move that Django would not allow. */
export function assertEditorialTransition(current: unknown, next: unknown): void {
  const currentStatus = editorialStatus(current, 'status');
  const nextStatus = editorialStatus(next, 'status');
  if (currentStatus !== nextStatus && !EDITORIAL_TRANSITIONS[currentStatus].includes(nextStatus)) {
    throw new ValidationError(`Cannot transition publication from "${currentStatus}" to "${nextStatus}".`);
  }
}

/**
 * Build Django's editorial workflow patch without I/O. The caller owns row
 * locking and persistence so this stays reusable by admin actions and cron.
 */
export function buildEditorialTransition(
  uid: EditorialWorkflowUid,
  current: EditorialWorkflowRecord,
  next: EditorialStatus,
  options: { at?: Date; scheduledFor?: Date | string | null } = {},
): EditorialWorkflowRecord {
  const currentStatus = editorialStatus(current.publication_status, 'status');
  assertEditorialTransition(currentStatus, next);

  const at = options.at ?? new Date();
  const atValue = workflowIsoDateTime(at);
  const patch: EditorialWorkflowRecord = { publication_status: next };
  if (currentStatus === 'archived' && next !== 'archived') {
    patch.archived_at = null;
  }

  if (next === 'scheduled') {
    const scheduledFor = options.scheduledFor ?? current.scheduled_at;
    if (scheduledFor === null || scheduledFor === undefined || scheduledFor === '') {
      throw new ValidationError('Scheduled publication requires scheduled_at.');
    }

    const scheduledAt = workflowDate(scheduledFor, 'scheduled_at');
    if (scheduledAt <= at) {
      throw new ValidationError('Scheduled publication requires a future scheduled_at.');
    }
    patch.scheduled_at = workflowIsoDateTime(scheduledAt);
  } else if (next === 'published') {
    patch.publishedAt = atValue;
  } else if (next === 'review') {
    patch.reviewed_at = existingDateTime(current, 'reviewed_at') ?? atValue;
  } else if (next === 'archived') {
    patch.archived_at = atValue;
  } else if (next === 'draft') {
    patch.scheduled_at = null;
  }

  if (uid === 'api::article.article' || uid === 'api::post.post') {
    patch.published = next === 'published';
  }
  if (uid === 'api::article.article') {
    patch.date_published = next === 'published' ? patch.publishedAt : null;
  }
  if (uid === 'api::update.update') {
    patch.is_active = next === 'published';
  }

  return patch;
}
