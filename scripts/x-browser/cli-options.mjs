import { resolve } from 'node:path';

export const readXCliOptions = (argv, { allowText = false } = {}) => {
  const options = {
    profilePath: resolve(process.env.X_PROFILE_DIR || '.local/x-rebase-profile'),
    expectedHandle: process.env.X_HANDLE || 'RebaseCommunity',
    chromePath: process.env.CHROME_PATH || undefined,
    headless: true,
    text: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--headed') {
      options.headless = false;
      continue;
    }
    if (['--profile', '--handle', '--text'].includes(arg)) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      if (arg === '--profile') options.profilePath = resolve(value);
      if (arg === '--handle') options.expectedHandle = value;
      if (arg === '--text' && allowText) options.text = value;
      if (arg === '--text' && !allowText) throw new Error('unknown option: --text');
      index += 1;
      continue;
    }
    throw new Error(`unknown option: ${arg}`);
  }

  return options;
};
