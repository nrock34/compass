'use strict';

module.exports = (config) => {
  const env = JSON.parse(config.define['process.env']);
  // Strapi appends /auth/login to this base when a session expires.
  env.ADMIN_PATH = env.ADMIN_PATH?.replace(/\/+$/, '');
  return {
    ...config,
    define: { ...config.define, 'process.env': JSON.stringify(env) },
  };
};
