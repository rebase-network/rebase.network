import assert from 'node:assert/strict';

import { buildLearnBlockchainArticle, learnBlockchainMinimumContentCharacters, shouldAutoPublishToLearnBlockchain } from './learnblockchain.js';

const content = '正文'.repeat(learnBlockchainMinimumContentCharacters / 2);
const article = buildLearnBlockchainArticle({
  title: '  测试文章  ',
  bodyMarkdown: `  ${content}  `,
  summary: '  测试摘要  ',
  tags: [' Web3 ', '', '日报'],
});
assert.deepEqual(article, {
  title: '测试文章',
  content,
  summary: '测试摘要',
  link: '',
  author_id: '322',
  category_id: '8',
  proofread: 'false',
  is_public: 'true',
  tags: 'Web3,日报',
  featured: '0',
  level: '1',
  type: '1',
});
assert.throws(
  () => buildLearnBlockchainArticle({ title: '测试文章', bodyMarkdown: '🚀'.repeat(learnBlockchainMinimumContentCharacters - 1) }),
  /正文至少需要 300 个字符，当前 299 个字符/,
);
assert.equal(shouldAutoPublishToLearnBlockchain({ status: 'published', learnBlockchainArticleId: null }), true);
assert.equal(shouldAutoPublishToLearnBlockchain({ status: 'published', learnBlockchainArticleId: '123' }), false);
console.log('LearnBlockchain adapter self-check passed');
