#!/usr/bin/env node
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createStrapi } = require('@strapi/strapi');

function decodeHtml(value) {
  return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/\s+/g, ' ').trim();
}
function convert(value) {
  const source = typeof value === 'string' ? value : '';
  const pieces = source.match(/<(?:p|h[1-6]|li|blockquote)[^>]*>[\s\S]*?<\/(?:p|h[1-6]|li|blockquote)>/gi) ?? [source];
  const blocks = pieces.map((piece, index) => ({ id: `migrated-${index + 1}`, type: 'paragraph', data: { text: decodeHtml(piece) } })).filter((block) => block.data.text);
  return { format: 'editorjs', version: 1, blocks: blocks.length ? blocks : [{ id: 'migrated-1', type: 'paragraph', data: { text: 'Migrated article content.' } }] };
}

const app = await createStrapi({ distDir: './dist' }).load();
try {
  const query = app.db.query('api::article.article');
  const articles = await query.findMany({ select: ['id', 'content'] });
  let migrated = 0;
  for (const article of articles) {
    if (typeof article.content !== 'string') continue;
    await query.update({ where: { id: article.id }, data: { content: convert(article.content) } });
    migrated += 1;
  }
  app.log.info(`Migrated ${migrated} Article richtext records to editorjs documents.`);
} finally {
  await app.destroy();
}
