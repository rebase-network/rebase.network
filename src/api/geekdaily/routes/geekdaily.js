'use strict';

/**
 * geekdaily router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('api::geekdaily.geekdaily');

const customRouter = (innerRouter, extraRoutes = []) => {
  // https://forum.strapi.io/t/how-to-add-custom-routes-to-core-routes-in-strapi-4/14070/7

  let routes;

  return {
    get prefix() {
      return innerRouter.prefix;
    },
    get routes() {
      if (!routes) routes = innerRouter.routes.concat(extraRoutes);
      return routes;
    },
  };
};

const extraRoutes = [
  {
    method: 'POST',
    path: '/geekdailies/batchInsert',
    handler: 'api::geekdaily.geekdaily.batchInsert',
  },
  {
    method: 'GET',
    path: '/geekdailies/all/list',
    handler: 'api::geekdaily.geekdaily.list',
  },
];

module.exports = customRouter(defaultRouter, extraRoutes);
