import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { composeArgs, loadDirectusEnv } from './local-env.mjs';

const schemaScript = 'scripts/directus/render-schema-sql.mjs';
const seedScript = 'scripts/directus/render-seed-sql.mjs';
const schemaPath = 'infra/directus/sql/001_schema.sql';
const seedPath = 'infra/directus/sql/002_seed.sql';
const geekdailyPath = 'infra/directus/sql/003_geekdaily_archive.sql';

function run(command, args, options = {}) {
  console.log(`> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: options.input ? ['pipe', 'inherit', 'inherit'] : 'inherit',
    input: options.input,
    encoding: 'utf8',
    env: { ...process.env, ...(options.env ?? {}) },
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}`);
  }
}

function renderSqlFiles() {
  run('node', [schemaScript]);
  run('node', [seedScript]);

  if (!existsSync(geekdailyPath)) {
    console.warn(`! ${geekdailyPath} is missing. Run node scripts/directus/render-geekdaily-sql.mjs geekdaily.csv to regenerate it.`);
  }
}

function applySqlFile(sqlPath, envFile, values) {
  const sql = readFileSync(sqlPath, 'utf8').replaceAll('${DIRECTUS_WEBSITE_TOKEN}', values.DIRECTUS_WEBSITE_TOKEN ?? '');
  run('docker', [
    ...composeArgs(envFile),
    'exec',
    '-T',
    'postgres',
    'psql',
    '-v',
    'ON_ERROR_STOP=1',
    '-U',
    values.POSTGRES_USER,
    '-d',
    values.POSTGRES_DB,
  ], { input: sql });
}

async function waitForHttp(url, label) {
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`> ${label} is ready at ${url}`);
        return;
      }
    } catch {
      // retry until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`Timed out while waiting for ${label} at ${url}`);
}

async function validateWebsiteToken(baseUrl, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const siteResponse = await fetch(`${baseUrl}/items/site_settings/1`, { headers });
  if (!siteResponse.ok) {
    throw new Error(`Failed to read site_settings with website token: ${siteResponse.status}`);
  }

  const sitePayload = await siteResponse.json();
  if (sitePayload.data?.site_name !== 'Rebase') {
    throw new Error('Unexpected site_settings payload from Directus.');
  }

  const geekdailyResponse = await fetch(
    `${baseUrl}/items/geekdaily_episodes?fields=episode_number&sort=-episode_number&limit=1`,
    { headers },
  );
  if (!geekdailyResponse.ok) {
    throw new Error(`Failed to read geekdaily_episodes with website token: ${geekdailyResponse.status}`);
  }

  const geekdailyPayload = await geekdailyResponse.json();
  if (!Array.isArray(geekdailyPayload.data) || geekdailyPayload.data.length === 0) {
    throw new Error('GeekDaily archive validation failed: no episodes returned.');
  }

  console.log(`> validated website token against episode ${geekdailyPayload.data[0].episode_number}`);
}

async function main() {
  const { envFile, values } = loadDirectusEnv(process.argv[2]);
  const baseUrl = values.DIRECTUS_PUBLIC_URL ?? 'http://127.0.0.1:8055';

  renderSqlFiles();
  run('docker', [...composeArgs(envFile), 'up', '-d']);
  await waitForHttp(`${baseUrl}/server/ping`, 'Directus');

  applySqlFile(schemaPath, envFile, values);
  applySqlFile(seedPath, envFile, values);
  if (existsSync(geekdailyPath)) {
    applySqlFile(geekdailyPath, envFile, values);
  }

  run('docker', [...composeArgs(envFile), 'restart', 'directus']);
  await waitForHttp(`${baseUrl}/server/ping`, 'Directus');
  await validateWebsiteToken(baseUrl, values.DIRECTUS_WEBSITE_TOKEN);

  console.log('> local Directus bootstrap complete');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
