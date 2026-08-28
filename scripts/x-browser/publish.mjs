#!/usr/bin/env node

import { readXCliOptions } from './cli-options.mjs';
import { publishTweetWithProfile } from './profile-client.mjs';

const options = readXCliOptions(process.argv.slice(2), { allowText: true });

publishTweetWithProfile(options)
  .then(({ tweetId, url }) => console.log(`X 发布成功：${tweetId} ${url}`))
  .catch((error) => {
    console.error(`[x:publish] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
