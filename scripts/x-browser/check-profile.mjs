#!/usr/bin/env node

import { readXCliOptions } from './cli-options.mjs';
import { checkXProfile } from './profile-client.mjs';

const options = readXCliOptions(process.argv.slice(2));

checkXProfile(options)
  .then(({ handle }) => console.log(`X Profile 正常，当前账号：@${handle}`))
  .catch((error) => {
    console.error(`[x:profile-check] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
