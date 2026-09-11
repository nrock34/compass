import { errors } from '@strapi/utils';

const { ValidationError } = errors;

const LANGUAGE_TAG = /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/;
const SECRET_KEY = /(?:secret|password|passwd|token|api[_-]?key|private[_-]?key|credential)/i;

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

/** Django's `normalize_language_tag` behavior for Lang.code. */
export function normalizeLanguageTag(value: unknown): string {
  const raw = String(value ?? '').trim().replace(/_/g, '-');
  if (!LANGUAGE_TAG.test(raw)) {
    throw new ValidationError('Language codes must use a valid BCP 47-style tag.');
  }

  const parts = raw.split('-');
  const normalized = [parts[0].toLowerCase()];
  for (const part of parts.slice(1)) {
    if (part.length === 2 || (part.length === 3 && /^\d{3}$/.test(part))) {
      normalized.push(part.toUpperCase());
    } else {
      normalized.push(part.length === 4 ? `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}` : part.toLowerCase());
    }
  }
  return normalized.join('-');
}

export type SitePropertyRecord = {
  key: unknown;
  value: unknown;
  type: unknown;
  is_public: unknown;
  json_schema: unknown;
};

function containsSecretKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsSecretKey);
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).some(
      ([key, item]) => SECRET_KEY.test(key) || containsSecretKey(item),
    );
  }
  return false;
}

function assertJsonSchema(value: unknown, schema: Record<string, unknown>, path: string): void {
  const type = schema.type;
  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const matches = {
    object: isObject,
    array: Array.isArray(value),
    string: typeof value === 'string',
    number: typeof value === 'number' && !Number.isNaN(value),
    integer: Number.isInteger(value),
    boolean: typeof value === 'boolean',
    null: value === null,
  } as Record<string, boolean>;

  if (typeof type === 'string' && type in matches && !matches[type]) {
    throw new ValidationError(`${path} must be a ${type}.`);
  }

  if (isObject) {
    const objectValue = value as Record<string, unknown>;
    const required = Array.isArray(schema.required) ? schema.required.filter((key): key is string => typeof key === 'string') : [];
    const missing = required.filter((key) => !hasOwn(objectValue, key));
    if (missing.length > 0) {
      throw new ValidationError(`${path} is missing required keys: ${missing.join(', ')}.`);
    }
    const properties = schema.properties;
    if (schema.additionalProperties === false && properties && typeof properties === 'object' && !Array.isArray(properties)) {
      const declared = properties as Record<string, unknown>;
      const unknown = Object.keys(objectValue).filter((key) => !hasOwn(declared, key));
      if (unknown.length > 0) {
        throw new ValidationError(`${path} contains unknown keys: ${unknown.join(', ')}.`);
      }
    }
    if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
      for (const [key, child] of Object.entries(properties as Record<string, unknown>)) {
        if (hasOwn(objectValue, key) && child && typeof child === 'object' && !Array.isArray(child)) {
          assertJsonSchema(objectValue[key], child as Record<string, unknown>, `${path}.${key}`);
        }
      }
    }
  }

  if (Array.isArray(value) && schema.items && typeof schema.items === 'object' && !Array.isArray(schema.items)) {
    value.forEach((item, index) => assertJsonSchema(item, schema.items as Record<string, unknown>, `${path}[${index}]`));
  }
}

/** Validate the SiteProperty value and public-secret boundary from Django. */
export function validateSiteProperty(record: SitePropertyRecord): void {
  const type = record.type;
  if (!['string', 'bool', 'image', 'json'].includes(String(type))) {
    throw new ValidationError('Site property type is invalid.');
  }

  let decoded: unknown = record.value;
  if (type === 'bool') {
    const normalized = String(record.value ?? '').trim().toLowerCase();
    if (!['true', 'false', '1', '0', 'yes', 'no'].includes(normalized)) {
      throw new ValidationError('Boolean properties must be true or false.');
    }
    decoded = ['true', '1', 'yes'].includes(normalized);
  } else if (type === 'json') {
    try {
      decoded = JSON.parse(String(record.value ?? ''));
    } catch {
      throw new ValidationError('JSON properties must contain valid JSON.');
    }
    if (record.json_schema && typeof record.json_schema === 'object' && !Array.isArray(record.json_schema)) {
      assertJsonSchema(decoded, record.json_schema as Record<string, unknown>, 'value');
    } else if (record.json_schema !== undefined && record.json_schema !== null && typeof record.json_schema !== 'object') {
      throw new ValidationError('JSON schema must be an object.');
    }
  }

  if (record.is_public === true && (SECRET_KEY.test(String(record.key ?? '')) || containsSecretKey(decoded))) {
    throw new ValidationError('Public properties cannot contain secret-like keys.');
  }
}
