import { getGeekDailySearchDocuments } from '@/lib/content';

export async function GET() {
  const documents = await getGeekDailySearchDocuments();

  return new Response(JSON.stringify(documents), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
