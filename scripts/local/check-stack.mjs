import { captureCommand } from './helpers.mjs';

const targets = [
  { label: 'api', url: 'http://127.0.0.1:8788' },
  { label: 'admin', url: 'http://127.0.0.1:5174' },
  { label: 'web', url: 'http://127.0.0.1:4321' },
];

const checkHttpTarget = async ({ label, url }) => {
  try {
    const response = await fetch(url, { redirect: 'manual' });
    return {
      label,
      ok: response.ok,
      status: response.status,
      detail: url,
    };
  } catch (error) {
    return {
      label,
      ok: false,
      status: null,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
};

const checkPostgresContainer = async () => {
  try {
    const { stdout } = await captureCommand('docker', [
      'inspect',
      '-f',
      '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}',
      'rebase-postgres',
    ]);
    const status = stdout.trim();

    return {
      label: 'postgres',
      ok: status === 'healthy' || status === 'running',
      status,
      detail: 'rebase-postgres',
    };
  } catch (error) {
    return {
      label: 'postgres',
      ok: false,
      status: null,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
};

const results = await Promise.all([
  ...targets.map((target) => checkHttpTarget(target)),
  checkPostgresContainer(),
]);

for (const result of results) {
  const status = result.status ?? 'unreachable';
  const mark = result.ok ? 'OK' : 'FAIL';
  console.log(`${mark}  ${result.label.padEnd(8)} ${status}  ${result.detail}`);
}

if (results.some((result) => !result.ok)) {
  process.exitCode = 1;
}
