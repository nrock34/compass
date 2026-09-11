import { build } from 'esbuild';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('..', import.meta.url));
const output = path.join(root, 'public/provider');
await mkdir(output, { recursive: true });
const result = await build({
  absWorkingDir: root, entryPoints: ['src/plugins/catalog-editor/portal/main.tsx'], bundle: true, minify: true,
  outdir: 'public/provider/assets', entryNames: '[name]-[hash]', assetNames: '[name]-[hash]',
  loader: { '.svg': 'file', '.webp': 'file', '.ttf': 'file' },
  metafile: true, format: 'esm', target: ['es2020'], define: { 'process.env.NODE_ENV': '"production"' },
});
await copyFile(path.join(root, 'src/plugins/catalog-editor/portal/brand/globe.svg'), path.join(output, 'assets/favicon.svg'));
const js = Object.keys(result.metafile.outputs).find(name => name.endsWith('.js'));
const css = Object.keys(result.metafile.outputs).find(name => name.endsWith('.css'));
if (!js || !css) throw new Error('Provider portal build did not emit its assets.');
await writeFile(path.join(output, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>RWM Provider Portal</title><link rel="icon" href="/provider/assets/favicon.svg"><link rel="stylesheet" href="/provider/assets/${path.basename(css)}"></head><body><div id="root"></div><script type="module" src="/provider/assets/${path.basename(js)}"></script></body></html>`);
console.log('Built RWM provider portal.');
