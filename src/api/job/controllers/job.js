'use strict';

/**
 *  job controller
 */
const axios = require('axios');

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::job.job', ({ strapi }) => ({
  async find(ctx) {
    const url = 'https://api.github.com/repos/rebase-network/who-is-hiring/issues?per_page=10&page=1';

    const resp = await axios.get(url);
    console.log('resp.status' + resp.status);
    const jobs = await resp.data;

    // some custom logic here
    ctx.query = { ...ctx.query, local: 'en' };

    // Calling the default core action
    // const { data, meta } = await super.find(ctx);

    return { data: jobs };
  },
}));
