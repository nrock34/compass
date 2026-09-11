const BLOCK_TYPES = ['header', 'subtext', 'paragraph', 'smallText', 'image', 'quote', 'embed', 'slideshow', 'poll', 'layout'] as const;
const TEXT_SIZES = ['sm', 'md', 'lg'] as const;
const EMBED_KINDS = ['spotify', 'youtube', 'map'] as const;

function fail(message: string): never {
  throw new Error(message);
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function keys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(`${label} contains unsupported property "${key}".`);
  }
}

function stringValue(value: unknown, label: string, max: number, required = true): string | undefined {
  if (value == null && !required) return undefined;
  if (typeof value !== 'string' || !value.trim()) {
    if (!required && value == null) return undefined;
    fail(`${label} must be a non-empty string.`);
  }
  const result = value.trim();
  if (result.length > max) fail(`${label} must be ${max} characters or fewer.`);
  return result;
}

function optionalString(value: unknown, label: string, max: number): void {
  if (value == null) return;
  if (typeof value !== 'string') fail(`${label} must be a string.`);
  if (value.trim().length > max) fail(`${label} must be ${max} characters or fewer.`);
}

function enumValue<T extends string>(value: unknown, values: readonly T[], label: string, required = true): T | undefined {
  if (value == null && !required) return undefined;
  if (typeof value !== 'string' || !values.includes(value as T)) fail(`${label} must be one of: ${values.join(', ')}.`);
  return value as T;
}

function urlValue(value: unknown, label: string): void {
  const source = stringValue(value, label, 2048);
  try {
    const parsed = new URL(source!);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') fail(`${label} must use http or https.`);
  } catch {
    fail(`${label} must be a valid URL.`);
  }
}

function assertAsset(value: unknown, label: string): void {
  const asset = object(value, label);
  keys(asset, ['id', 'public_url', 'alt_text', 'caption'], label);
  if (
    asset.id != null
    && !((typeof asset.id === 'number' && Number.isSafeInteger(asset.id) && asset.id > 0)
      || (typeof asset.id === 'string' && asset.id.trim()))
  ) fail(`${label}.id must be a positive integer or non-empty string.`);
  if (asset.public_url != null && asset.public_url !== '') urlValue(asset.public_url, `${label}.public_url`);
  optionalString(asset.alt_text, `${label}.alt_text`, 255);
  optionalString(asset.caption, `${label}.caption`, 500);
}

function assertMediaData(data: Record<string, unknown>, label: string, slide = false): void {
  keys(data, ['src', 'alt', 'caption', 'withBorder', 'withBackground', 'stretched', 'assetId', 'asset'], label);
  urlValue(data.src, `${label}.src`);
  optionalString(data.alt, `${label}.alt`, 180);
  optionalString(data.caption, `${label}.caption`, slide ? 280 : 280);
  if (data.assetId !== undefined && !((typeof data.assetId === 'number' && Number.isSafeInteger(data.assetId) && data.assetId > 0) || (typeof data.assetId === 'string' && data.assetId.trim()))) fail(`${label}.assetId must be a positive integer or non-empty string.`);
  if (data.asset !== undefined) assertAsset(data.asset, `${label}.asset`);
  if (!slide) {
    for (const flag of ['withBorder', 'withBackground', 'stretched']) if (data[flag] !== undefined && typeof data[flag] !== 'boolean') fail(`${label}.${flag} must be a boolean.`);
  }
}

function assertBlock(value: unknown, label: string, allowLayout: boolean): void {
  const block = object(value, label);
  keys(block, ['id', 'type', 'data', 'mb'], label);
  stringValue(block.id, `${label}.id`, 120);
  const type = enumValue(block.type, allowLayout ? BLOCK_TYPES : BLOCK_TYPES.filter((entry) => entry !== 'layout'), `${label}.type`);
  optionalString(block.mb, `${label}.mb`, 120);
  const data = object(block.data, `${label}.data`);
  switch (type) {
    case 'header':
      keys(data, ['text', 'fontSize'], `${label}.data`); stringValue(data.text, `${label}.data.text`, 180); enumValue(data.fontSize, TEXT_SIZES, `${label}.data.fontSize`, false); break;
    case 'subtext':
      keys(data, ['text', 'fontSize'], `${label}.data`); stringValue(data.text, `${label}.data.text`, 360); enumValue(data.fontSize, TEXT_SIZES, `${label}.data.fontSize`, false); break;
    case 'paragraph':
      keys(data, ['text'], `${label}.data`); stringValue(data.text, `${label}.data.text`, 4000); break;
    case 'smallText':
      keys(data, ['text'], `${label}.data`); stringValue(data.text, `${label}.data.text`, 1200); break;
    case 'image': assertMediaData(data, `${label}.data`); break;
    case 'quote':
      keys(data, ['text', 'attribution'], `${label}.data`); stringValue(data.text, `${label}.data.text`, 1500); optionalString(data.attribution, `${label}.data.attribution`, 180); break;
    case 'embed':
      keys(data, ['kind', 'url', 'caption'], `${label}.data`); enumValue(data.kind, EMBED_KINDS, `${label}.data.kind`); urlValue(data.url, `${label}.data.url`); optionalString(data.caption, `${label}.data.caption`, 280); break;
    case 'slideshow': {
      keys(data, ['slides'], `${label}.data`);
      if (!Array.isArray(data.slides) || data.slides.length < 1) fail(`${label}.data.slides must contain at least one slide.`);
      data.slides.forEach((slide, index) => { const entry = object(slide, `${label}.data.slides[${index}]`); keys(entry, ['src', 'alt', 'caption', 'assetId', 'asset'], `${label}.data.slides[${index}]`); assertMediaData(entry, `${label}.data.slides[${index}]`, true); });
      break;
    }
    case 'poll': {
      keys(data, ['question', 'options'], `${label}.data`); stringValue(data.question, `${label}.data.question`, 220);
      if (!Array.isArray(data.options) || data.options.length < 2) fail(`${label}.data.options must contain at least two options.`);
      data.options.forEach((option, index) => { const entry = object(option, `${label}.data.options[${index}]`); keys(entry, ['id', 'label'], `${label}.data.options[${index}]`); stringValue(entry.id, `${label}.data.options[${index}].id`, 120); stringValue(entry.label, `${label}.data.options[${index}].label`, 120); });
      break;
    }
    case 'layout': {
      keys(data, ['style', 'columns'], `${label}.data`);
      optionalString(data.style, `${label}.data.style`, 600);
      if (!Array.isArray(data.columns) || data.columns.length < 2) fail(`${label}.data.columns must contain at least two columns.`);
      data.columns.forEach((column, index) => {
        const entry = object(column, `${label}.data.columns[${index}]`);
        keys(entry, ['width', 'style', 'blocks'], `${label}.data.columns[${index}]`);
        optionalString(entry.width, `${label}.data.columns[${index}].width`, 20);
        optionalString(entry.style, `${label}.data.columns[${index}].style`, 600);
        if (!Array.isArray(entry.blocks) || entry.blocks.length < 1) fail(`${label}.data.columns[${index}].blocks must contain at least one block.`);
        entry.blocks.forEach((child, childIndex) => assertBlock(child, `${label}.data.columns[${index}].blocks[${childIndex}]`, false));
      });
      break;
    }
    default: fail(`${label} has an unsupported block type.`);
  }
}

/** Validate and return the original canonical document without mutating it. */
export function assertPostcardDocument(value: unknown): void {
  const document = object(value, 'Article content');
  keys(document, ['format', 'version', 'blocks'], 'Article content');
  if (document.format !== 'editorjs' || document.version !== 1) fail('Article content must be an Editor.js version 1 document.');
  if (!Array.isArray(document.blocks) || document.blocks.length < 1) fail('Article content must contain at least one block.');
  document.blocks.forEach((block, index) => assertBlock(block, `Article content.blocks[${index}]`, true));
}
