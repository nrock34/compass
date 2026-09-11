export default {
  routes: [
    {
      method: 'POST',
      path: '/posts/create',
      handler: 'community-mutation.createPost',
      config: { auth: { scope: ['plugin::users-permissions.user.me'] } },
    },
    {
      method: 'POST',
      path: '/posts/:id/like',
      handler: 'community-mutation.togglePostLike',
      config: { auth: { scope: ['plugin::users-permissions.user.me'] } },
    },
    {
      method: 'POST',
      path: '/posts/:id/comments',
      handler: 'community-mutation.createPostComment',
      config: { auth: { scope: ['plugin::users-permissions.user.me'] } },
    },
  ],
};
