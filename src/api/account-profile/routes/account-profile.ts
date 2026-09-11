export default {
  routes: [
    {
      method: 'PATCH',
      path: '/users/me/education',
      handler: 'account-profile.updateEducation',
      config: { auth: { scope: ['plugin::users-permissions.user.me'] } },
    },
    {
      method: 'GET',
      path: '/auth/info',
      handler: 'account-profile.accountInfo',
      config: { auth: { scope: ['plugin::users-permissions.user.me'] } },
    },
    {
      method: 'GET',
      path: '/users/me/settings/profile',
      handler: 'account-profile.profileInfo',
      config: { auth: { scope: ['plugin::users-permissions.user.me'] } },
    },
    {
      method: 'GET',
      path: '/users/me/settings/edu',
      handler: 'account-profile.educationInfo',
      config: { auth: { scope: ['plugin::users-permissions.user.me'] } },
    },
    {
      method: 'GET',
      path: '/users/me/activity',
      handler: 'account-profile.activity',
      config: { auth: { scope: ['plugin::users-permissions.user.me'] } },
    },
    {
      method: 'GET',
      path: '/users/me/applications',
      handler: 'account-profile.applications',
      config: { auth: { scope: ['plugin::users-permissions.user.me'] } },
    },
    {
      method: 'GET',
      path: '/users/me/saved-items',
      handler: 'account-profile.savedItems',
      config: { auth: { scope: ['plugin::users-permissions.user.me'] } },
    },
  ],
};
