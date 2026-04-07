import { runCommand, waitForContainerHealthy } from './helpers.mjs';

const cwd = new URL('../../', import.meta.url);

const steps = [
  {
    label: 'start postgres',
    run: () => runCommand('docker', ['compose', '-f', 'infra/postgres/docker-compose.yml', 'up', '-d'], { cwd }),
  },
  {
    label: 'wait for postgres',
    run: () => waitForContainerHealthy('rebase-postgres', { cwd }),
  },
  {
    label: 'apply migrations',
    run: () => runCommand('pnpm', ['db:migrate'], { cwd }),
  },
  {
    label: 'seed baseline content',
    run: () => runCommand('pnpm', ['db:seed'], { cwd }),
  },
  {
    label: 'bootstrap admin account',
    run: () => runCommand('pnpm', ['admin:bootstrap'], { cwd }),
  },
];

for (const step of steps) {
  console.log(`\n> ${step.label}`);
  await step.run();
}

console.log('\nlocal stack bootstrap complete');
