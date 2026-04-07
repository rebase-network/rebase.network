import { spawnSync } from 'node:child_process';
import { composeArgs, loadDirectusEnv } from './local-env.mjs';

const { envFile } = loadDirectusEnv();
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/directus/compose-local.mjs <compose-args...>');
  process.exit(1);
}

console.log(`> docker ${[...composeArgs(envFile), ...args].join(' ')}`);
const result = spawnSync('docker', [...composeArgs(envFile), ...args], {
  stdio: 'inherit',
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
