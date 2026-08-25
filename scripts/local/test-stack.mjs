import { runCommand } from './helpers.mjs';

const cwd = new URL('../../', import.meta.url);
const command = process.argv[2] ?? 'help';
const extraArgs = process.argv.slice(3);

const runNodeScript = (scriptPath, args = []) =>
  runCommand(process.execPath, [scriptPath, ...args], { cwd });

const runPnpm = (args = []) =>
  runCommand('corepack', ['pnpm', ...args], { cwd });

const tasks = {
  help: async () => {
    console.log(`Usage:
  node scripts/local/test-stack.mjs bootstrap
  node scripts/local/test-stack.mjs content
  node scripts/local/test-stack.mjs ready
  node scripts/local/test-stack.mjs start [--services=api,admin,web]
  node scripts/local/test-stack.mjs status
  node scripts/local/test-stack.mjs smoke

Commands:
  bootstrap  Initialize postgres, migrations, seed data, and local admin account
  content    Reset imported WeChat drafts and re-import content items
  ready      Run bootstrap, then content
  start      Start local api/admin/web services
  status     Check postgres, api, admin, and web availability
  smoke      Run smoke tests
`);
  },
  bootstrap: async () => {
    await runNodeScript('scripts/local/bootstrap-stack.mjs');
  },
  content: async () => {
    await runPnpm(['--filter', '@rebase/api', 'reset-wechat-import-drafts', '--write']);
    await runPnpm(['--filter', '@rebase/api', 'import-content-items', '--write']);
  },
  ready: async () => {
    await tasks.bootstrap();
    await tasks.content();
  },
  start: async () => {
    await runNodeScript('scripts/local/dev-stack.mjs', extraArgs);
  },
  status: async () => {
    await runNodeScript('scripts/local/check-stack.mjs');
  },
  smoke: async () => {
    await runPnpm(['test:smoke']);
  },
};

if (!(command in tasks)) {
  console.error(`Unknown command: ${command}`);
  await tasks.help();
  process.exit(1);
}

await tasks[command]();
