export default {
  routes: [{
    method: 'POST',
    path: '/auth/username/check',
    handler: 'username-check.check',
    config: { auth: false },
  }],
};
