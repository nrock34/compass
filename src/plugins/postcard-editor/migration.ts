export type LegacyPostcardBlock = { id: string; type: 'paragraph'; data: { text: string } };
export type PostcardDocument = { format: 'editorjs'; version: 1; blocks: LegacyPostcardBlock[] };

function decodeHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/\s+/g, ' ').trim();
}

/** Convert the former richtext HTML value to the canonical Article.content document. */
export function richTextToPostcardDocument(value: unknown): PostcardDocument {
  const source = typeof value === 'string' ? value : '';
  const pieces = source.match(/<(?:p|h[1-6]|li|blockquote)[^>]*>[\s\S]*?<\/(?:p|h[1-6]|li|blockquote)>/gi) ?? [source];
  const blocks = pieces.map((piece, index) => ({ id: `migrated-${index + 1}`, type: 'paragraph' as const, data: { text: decodeHtml(piece) } })).filter((block) => block.data.text);
  return { format: 'editorjs', version: 1, blocks: blocks.length ? blocks : [{ id: 'migrated-1', type: 'paragraph', data: { text: 'Migrated article content.' } }] };
}
