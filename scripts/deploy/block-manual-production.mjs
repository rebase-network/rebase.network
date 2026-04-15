const target = process.argv[2] ?? 'worker';

const message = [
  `manual production deploy is blocked for ${target}.`,
  '',
  'production releases must follow this path:',
  '1. push commits to github',
  '2. merge the release candidate into main',
  '3. let cloudflare deploy the frontend Workers from the connected repository',
  '',
  'local verification is still allowed with:',
  '- pnpm deploy:web:dry-run',
  '- pnpm deploy:admin:dry-run',
].join('\n');

console.error(message);
process.exit(1);
