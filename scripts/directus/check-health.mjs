import { loadDirectusEnv } from './local-env.mjs';

async function main() {
  const { values } = loadDirectusEnv(process.argv[2]);
  const baseUrl = values.DIRECTUS_PUBLIC_URL ?? 'http://127.0.0.1:8055';
  const directusHealthUrl = `${baseUrl}/server/health`;
  const websiteToken = values.DIRECTUS_WEBSITE_TOKEN ?? '';

  const directusResponse = await fetch(directusHealthUrl);
  if (!directusResponse.ok) {
    throw new Error(`Directus health endpoint failed: ${directusResponse.status}`);
  }

  const directusPayload = await directusResponse.json();
  if (directusPayload.status !== 'ok') {
    throw new Error(`Unexpected Directus health payload: ${JSON.stringify(directusPayload)}`);
  }

  const contentResponse = await fetch(`${baseUrl}/items/site_settings/1?fields=site_name`, {
    headers: {
      Authorization: `Bearer ${websiteToken}`,
    },
  });

  if (!contentResponse.ok) {
    throw new Error(`Public content check failed: ${contentResponse.status}`);
  }

  const contentPayload = await contentResponse.json();
  if (contentPayload.data?.site_name !== 'Rebase') {
    throw new Error('Unexpected public content payload while checking health.');
  }

  console.log(`> directus health ok: ${directusHealthUrl}`);
  console.log('> public content health ok: site_settings');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
