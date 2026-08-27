import assert from 'node:assert/strict';

import { infoqWordCount, markdownToDoc, shouldAutoPublishToInfoq } from './infoq.js';

const doc = markdownToDoc('# 标题\n\n正文 **加粗** 和 [链接](https://rebase.network)。\n\n- 一\n- 二');
assert.equal(doc.content?.[0]?.type, 'heading');
assert.equal(doc.content?.[1]?.content?.[1]?.marks?.[0]?.type, 'strong');
assert.equal(doc.content?.[1]?.content?.[3]?.type, 'link');
assert.equal(doc.content?.[2]?.type, 'bulletedlist');
assert.equal(infoqWordCount('abc中文'), 4);
assert.equal(shouldAutoPublishToInfoq({ status: 'published', infoqArticleUuid: null }), true);
assert.equal(shouldAutoPublishToInfoq({ status: 'published', infoqArticleUuid: 'existing' }), false);
assert.equal(shouldAutoPublishToInfoq({ status: 'draft', infoqArticleUuid: null }), false);
assert.doesNotMatch(JSON.stringify(markdownToDoc('before <script>alert(1)</script> after')), /[<>]/);
assert.doesNotMatch(JSON.stringify(markdownToDoc('<script>alert(1)</script>')), /[<>]/);
console.log('InfoQ markdown conversion self-check passed');
