import { Client } from 'pg';

const args = new Map(
  process.argv.slice(2).map((entry) => {
    const [key, ...rest] = entry.split('=');
    return [key, rest.join('=')];
  }),
);

const normalizeBaseUrl = (value) => value.trim().replace(/\/$/, '');

const sourceBaseUrl = normalizeBaseUrl(args.get('--from') || process.env.MEDIA_HOST_FROM || '');
const targetBaseUrl = normalizeBaseUrl(args.get('--to') || process.env.MEDIA_HOST_TO || '');
const dryRun = ['1', 'true', 'yes'].includes((args.get('--dry-run') || '').trim().toLowerCase());
const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

if (!sourceBaseUrl || !targetBaseUrl) {
  console.error('Usage: node packages/db/scripts/replace-media-host.mjs --from=https://old-host --to=https://new-host [--dry-run=true]');
  process.exit(1);
}

const client = new Client({ connectionString: databaseUrl });

const listMatchingRows = async () =>
  client.query(
    `select id, object_key, public_url
       from assets
      where public_url like $1
      order by updated_at desc, created_at desc`,
    [`${sourceBaseUrl}/%`],
  );

const main = async () => {
  await client.connect();

  const before = await listMatchingRows();

  console.log(
    JSON.stringify(
      {
        dryRun,
        sourceBaseUrl,
        targetBaseUrl,
        matches: before.rowCount,
        sample: before.rows.slice(0, 10),
      },
      null,
      2,
    ),
  );

  if (dryRun || before.rowCount === 0) {
    return;
  }

  const updated = await client.query(
    `update assets
        set public_url = replace(public_url, $1, $2),
            updated_at = now()
      where public_url like $3
      returning id, object_key, public_url`,
    [sourceBaseUrl, targetBaseUrl, `${sourceBaseUrl}/%`],
  );

  console.log(
    JSON.stringify(
      {
        updated: updated.rowCount,
        sample: updated.rows.slice(0, 10),
      },
      null,
      2,
    ),
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => undefined);
  });
