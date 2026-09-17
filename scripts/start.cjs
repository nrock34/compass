'use strict';
const path = require('node:path');
const { createStrapi } = require('@strapi/strapi');
const root = path.resolve(__dirname, '..');

(async () => {
  let app;
  try {
    app = createStrapi({ appDir: root, distDir: path.join(root, 'dist') });
    await app.load();
    await app.listen();
  } catch (error) {
    console.error('Strapi startup failed:', error.message || error.name);
    const report = (failure) => {
      if (!failure || typeof failure !== 'object') return;
      if (failure.code || failure.address) {
        console.error('Connection failure:', JSON.stringify({
          code: failure.code, syscall: failure.syscall,
          address: failure.address, port: failure.port,
        }));
      }
      for (const nested of failure.errors || []) report(nested);
      if (failure.cause) report(failure.cause);
    };
    report(error);
    try { if (app) await app.destroy(); } catch { /* Preserve the startup failure. */ }
    process.exit(1);
  }
})();
