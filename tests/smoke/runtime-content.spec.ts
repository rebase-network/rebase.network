import { expect, test } from '@playwright/test';
import { Client } from 'pg';

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://rebase:rebase@127.0.0.1:55433/rebase';

test('published article pages reflect newly inserted and updated content without a rebuild', async ({ request }) => {
  const client = new Client({ connectionString: databaseUrl });
  const slug = `runtime-smoke-${Date.now()}`;
  const initialTitle = 'runtime smoke article alpha';
  const updatedTitle = 'runtime smoke article beta';

  await client.connect();

  try {
    await client.query(
      `
        insert into articles (
          slug,
          title,
          summary,
          body_markdown,
          reading_time,
          cover_accent,
          authors_json,
          tags_json,
          status,
          published_at
        ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, 'published', $9)
      `,
      [
        slug,
        initialTitle,
        'runtime smoke summary alpha',
        'runtime smoke body alpha',
        '4 min read',
        '#0f6d64',
        JSON.stringify([{ name: 'runtime smoke bot' }]),
        JSON.stringify(['runtime-smoke']),
        new Date('2026-04-07T12:00:00.000Z'),
      ],
    );

    const firstResponse = await request.get(`/articles/${slug}?v=1`);
    expect(firstResponse.ok()).toBeTruthy();
    const firstBody = await firstResponse.text();
    expect(firstBody).toContain(initialTitle);
    expect(firstBody).toContain('runtime smoke body alpha');

    await client.query(
      `
        update articles
        set title = $1,
            summary = $2,
            body_markdown = $3,
            updated_at = now()
        where slug = $4
      `,
      [updatedTitle, 'runtime smoke summary beta', 'runtime smoke body beta', slug],
    );

    const secondResponse = await request.get(`/articles/${slug}?v=2`);
    expect(secondResponse.ok()).toBeTruthy();
    const secondBody = await secondResponse.text();
    expect(secondBody).toContain(updatedTitle);
    expect(secondBody).toContain('runtime smoke body beta');
    expect(secondBody).not.toContain(initialTitle);
  } finally {
    await client.query('delete from articles where slug = $1', [slug]);
    await client.end();
  }
});
