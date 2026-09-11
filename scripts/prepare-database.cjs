'use strict';
// Use Strapi's migration ledger, schema sync, and application bootstrap together.
// This runs in Render's pre-deploy container; it never opens an HTTP listener.
const path = require('node:path');
process.env.CRON_ENABLED = 'false';
process.env.STRAPI_TELEMETRY_DISABLED = 'true';
const { createStrapi } = require('@strapi/strapi');
const root = path.resolve(__dirname, '..');
const app = createStrapi({ appDir: root, distDir: path.join(root, 'dist') });
(async () => {
  let code = 0;
  try {
    await app.load();
    await app.db.connection.raw('SELECT 1');
    console.log('Database migrations, schema synchronization, and bootstrap completed.');
  } catch (error) {
    console.error('Database preparation failed:', error);
    code = 1;
  } finally {
    try { await app.destroy(); } catch (error) { console.error('Database cleanup failed:', error); code = 1; }
  }
  // Some plugins retain background handles after destroy. This is a one-shot job.
  process.exit(code);
})();
