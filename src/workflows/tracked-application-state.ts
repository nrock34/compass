import { errors } from '@strapi/utils';

const { ValidationError } = errors;

export type TrackedApplicationWorkflowRecord = Record<string, unknown>;

export const TRACKED_APPLICATION_STATUSES = [
  'not-started',
  'writing-statements',
  'in-progress',
  'reviewing',
  'completed',
  'submitted',
] as const;

export type TrackedApplicationStatus = (typeof TRACKED_APPLICATION_STATUSES)[number];

const TRACKED_APPLICATION_TRANSITIONS: Readonly<
  Record<TrackedApplicationStatus, readonly TrackedApplicationStatus[]>
> = {
  'not-started': ['writing-statements', 'in-progress', 'reviewing', 'completed', 'submitted'],
  'writing-statements': ['not-started', 'in-progress', 'reviewing', 'completed', 'submitted'],
  'in-progress': ['writing-statements', 'reviewing', 'completed', 'submitted'],
  reviewing: ['in-progress', 'completed', 'submitted'],
  completed: ['reviewing', 'submitted'],
  submitted: [],
};

function workflowDate(value: unknown, field: string): Date {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.valueOf())) {
    throw new ValidationError(`${field} must be a valid date/time.`);
  }
  return date;
}

function workflowIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function isTrackedApplicationStatus(value: unknown): value is TrackedApplicationStatus {
  return typeof value === 'string' && (TRACKED_APPLICATION_STATUSES as readonly string[]).includes(value);
}

function trackedApplicationStatus(value: unknown, label: string): TrackedApplicationStatus {
  if (!isTrackedApplicationStatus(value)) {
    throw new ValidationError(`Unknown tracked-application ${label}: ${String(value)}.`);
  }
  return value;
}

/** Reject a status move that Django's application workflow would not allow. */
export function assertTrackedApplicationTransition(current: unknown, next: unknown): void {
  const currentStatus = trackedApplicationStatus(current, 'status');
  const nextStatus = trackedApplicationStatus(next, 'status');
  if (currentStatus !== nextStatus && !TRACKED_APPLICATION_TRANSITIONS[currentStatus].includes(nextStatus)) {
    throw new ValidationError(`Cannot move an application from "${currentStatus}" to "${nextStatus}".`);
  }
}

/** Apply Django's submitted/progress invariants for one application move. */
export function buildTrackedApplicationTransition(
  current: TrackedApplicationWorkflowRecord,
  next: TrackedApplicationStatus,
  options: { submittedOn?: Date | string | null; progress?: number | null; at?: Date } = {},
): TrackedApplicationWorkflowRecord {
  const currentStatus = trackedApplicationStatus(current.status, 'status');
  assertTrackedApplicationTransition(currentStatus, next);

  let progress: number | undefined;
  if (options.progress !== undefined && options.progress !== null) {
    if (!Number.isInteger(options.progress) || options.progress < 0 || options.progress > 100) {
      throw new ValidationError('Application progress must be an integer from 0 to 100.');
    }
    progress = options.progress;
  }

  const patch: TrackedApplicationWorkflowRecord = { status: next };
  if (progress !== undefined) patch.progress = progress;

  if (next === 'submitted') {
    const submittedOn = options.submittedOn ?? current.submission_on ?? (options.at ?? new Date());
    patch.submitted = true;
    patch.submission_on = workflowIsoDate(workflowDate(submittedOn, 'submission_on'));
    patch.progress = progress ?? 100;
  } else {
    patch.submitted = false;
    patch.submission_on = null;
  }

  return patch;
}
