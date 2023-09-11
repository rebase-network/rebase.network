'use strict';

/**
 * geekdaily controller
 */
const {
  getPaginationInfo,
  convertPagedToStartLimit,
  shouldCount,
  transformPaginationResponse,
} = require('@strapi/strapi/lib/core-api/service/pagination');

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::geekdaily.geekdaily', ({ strapi }) => ({
  async batchInsert(ctx) {
    const batchData = ctx.request.body;

    try {
      const result = await strapi.db.query('api::geekdaily.geekdaily').createMany({
        data: batchData.data,
      });

      // return {"count":3,"ids":[6,7,8]}

      for (const _id of result.ids) {
        const model = await strapi.db.query('api::geekdaily.geekdaily').findOne({
          where: { id: _id },
        });

        // webhooks
        const msg = {
          model: 'geekdaily',
          uid: 'api::geekdaily.geekdaily',
          entry: model,
        }

        await strapi.eventHub.emit('entry.create', msg);
      }

      ctx.send(result);
    } catch (error) {
      console.error(error);
      ctx.throw(500, 'Internal Server Error');
    }
  },

  async list(ctx) {
    const fetchParams = ctx.query;

    const queryParams = {
      fields: ['title', 'episode', 'author', 'url', 'time', 'introduce'],
      sort: { time: 'desc' },
      populate: {
        cover: {
          fields: ['url'],
        },
        editor: {
          fields: ['username'],
          populate: {
            avatar: { fields: ['url'] },
          },
        },
        category: {
          fields: ['title'],
        },
      },
    };

    const paginationInfo = getPaginationInfo(fetchParams);

    const entities = await strapi.entityService.findMany('api::geekdaily.geekdaily', {
      ...queryParams,
      ...fetchParams,
      ...convertPagedToStartLimit(paginationInfo),
    });

    let result = {};
    result['data'] = entities;
    result['meta'] = paginationInfo;

    if (shouldCount(fetchParams)) {
      const count = await strapi.entityService.count('api::geekdaily.geekdaily', { ...fetchParams, ...paginationInfo });
      result['meta'] = transformPaginationResponse(paginationInfo, count);
    }

    ctx.send(result);
  },
}));
