import { DJANGO_DOCUMENT_OPTIONS, type DocumentWriteRule } from '../options/document';

export type DocumentData = Record<string, unknown>;

export type ApplyDjangoDocumentOptionsInput = {
  uid: string;
  action: string;
  data: DocumentData;
  now: Date;
  uuid: () => string;
};

export function djangoDateValue(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function isMissing(data: DocumentData, field: string): boolean {
  return data[field] === undefined || data[field] === null || data[field] === '';
}

function valueFor(rule: DocumentWriteRule, input: ApplyDjangoDocumentOptionsInput): unknown {
  if (rule.source === 'iso-now') return input.now.toISOString();
  if (rule.source === 'local-date') return djangoDateValue(input.now);
  if (rule.source === 'uuid') return input.uuid();
  return { id: rule.source.relationId };
}

export function applyDjangoDocumentOptions(input: ApplyDjangoDocumentOptionsInput): DocumentData {
  if (input.action !== 'create' && input.action !== 'update') return input.data;
  for (const rule of DJANGO_DOCUMENT_OPTIONS[input.uid] ?? []) {
    if (rule.event === 'create' && input.action !== 'create') continue;
    if (rule.assignment === 'if-missing' && !isMissing(input.data, rule.field)) continue;
    input.data[rule.field] = valueFor(rule, input);
  }
  return input.data;
}
