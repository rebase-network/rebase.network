'use strict';

/**
 * event controller
 */

const axios = require('axios');

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::event.event', ({ strapi }) => ({
  async find(ctx) {
    const url = 'https://api.github.com/repos/rebase-network/event-pool/issues?per_page=15&page=1';

    const resp = await axios.get(url);
    const events = await resp.data;

    return { data: events };
  },
}));
