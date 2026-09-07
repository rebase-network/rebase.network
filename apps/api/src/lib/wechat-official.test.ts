import assert from 'node:assert/strict';

import { isWechatAccessTokenError } from './wechat-official.js';

assert.equal(isWechatAccessTokenError(40001), true);
assert.equal(isWechatAccessTokenError(40014), true);
assert.equal(isWechatAccessTokenError(42001), true);
assert.equal(isWechatAccessTokenError(45009), false);
console.log('WeChat error handling self-check passed');
