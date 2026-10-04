import assert from 'node:assert/strict';

import { externalChannels, shouldAutoPublish } from './external-publishing.js';

const { infoq, learnblockchain, x } = externalChannels;

assert.equal(shouldAutoPublish(infoq, { status: 'published', infoqArticleUuid: null }), true);
assert.equal(shouldAutoPublish(infoq, { status: 'published', infoqArticleUuid: 'existing' }), false);
assert.equal(shouldAutoPublish(infoq, { status: 'draft', infoqArticleUuid: null }), false);
assert.equal(shouldAutoPublish(learnblockchain, { status: 'published', learnBlockchainArticleId: null }), true);
assert.equal(shouldAutoPublish(learnblockchain, { status: 'published', learnBlockchainArticleId: '123' }), false);
assert.equal(shouldAutoPublish(x, { status: 'published', xPostId: null }), true);
assert.equal(shouldAutoPublish(x, { status: 'published', xPostId: '2093' }), false);
assert.equal(shouldAutoPublish(x, { status: 'draft', xPostId: null }), false);
assert.equal(shouldAutoPublish(x, { status: 'published', infoqArticleUuid: 'other-channel', xPostId: null }), true);
console.log('External publishing self-check passed');
