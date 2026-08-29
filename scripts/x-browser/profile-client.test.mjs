import assert from 'node:assert/strict';

import { countTweetCharacters, maxTweetCharacters, normalizeXHandle, validateTweetText } from './profile-client.mjs';

assert.equal(normalizeXHandle(' @RebaseCommunity '), 'rebasecommunity');
assert.equal(countTweetCharacters('中文ab'), 4);
assert.equal(validateTweetText('  hello  '), 'hello');
assert.throws(() => validateTweetText(''), /不能为空/);
assert.throws(() => validateTweetText('x'.repeat(maxTweetCharacters + 1)), /超过/);
console.log('X Profile client self-check passed');
