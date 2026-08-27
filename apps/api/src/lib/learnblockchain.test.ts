import assert from 'node:assert/strict';

import { buildLearnBlockchainArticle, shouldAutoPublishToLearnBlockchain } from './learnblockchain.js';

const article = buildLearnBlockchainArticle({ title: '  测试文章  ', bodyMarkdown: '  正文内容  ' });
assert.deepEqual(article, {
  title: '测试文章',
  content: '正文内容',
  type: '1',
  is_public: '1',
  category_id: '8',
});
assert.equal(shouldAutoPublishToLearnBlockchain({ status: 'published', learnBlockchainArticleId: null }), true);
assert.equal(shouldAutoPublishToLearnBlockchain({ status: 'published', learnBlockchainArticleId: '123' }), false);
console.log('LearnBlockchain adapter self-check passed');
