import assert from 'node:assert/strict';

import { buildXPostText, maxXPostCharacters, shouldAutoPublishToX } from './x.js';

const text = buildXPostText({
  title: '标题',
  summary: '简介内容',
  url: 'https://rebase.network/articles/1',
});
assert.match(text, /^标题\n\n简介内容\n\nhttps:\/\/rebase\.network/);
assert.ok(Array.from(text).length <= maxXPostCharacters);
assert.equal(shouldAutoPublishToX({ status: 'published', xPostId: null }), true);
assert.equal(shouldAutoPublishToX({ status: 'published', xPostId: '2093' }), false);
assert.equal(shouldAutoPublishToX({ status: 'draft', xPostId: null }), false);
assert.throws(() => buildXPostText({ title: 'x'.repeat(280), summary: '', url: 'https://rebase.network' }), /280/);
console.log('X adapter self-check passed');
