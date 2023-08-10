module.exports = ({ env }) => ({
  responses: {
    privateAttributes: ['_v', 'id', 'createdAt', 'updatedAt'],
  },
  rest: {
    prefix: '/api/v1',
    defaultLimit: 25,
    maxLimit: 100,
    withCount: true,
  },
});
