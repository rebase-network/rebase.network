import assert from 'node:assert/strict';

import { infoqWordCount, markdownToDoc } from './infoq.js';

const doc = markdownToDoc('# 标题\n\n正文 **加粗**。\n\n- 一\n- 二');
assert.equal(doc.content?.[0]?.type, 'heading');
assert.equal(doc.content?.[1]?.content?.[1]?.marks?.[0]?.type, 'strong');
assert.equal(doc.content?.[2]?.type, 'bulletedlist');
assert.equal(infoqWordCount('abc中文'), 4);
console.log('InfoQ markdown conversion self-check passed');
