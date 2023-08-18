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
    const jobs = await resp.data;

    return { data: jobs };
  },
}));
