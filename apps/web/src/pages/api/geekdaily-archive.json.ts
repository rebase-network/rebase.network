import { proxyPublicApi } from '@/lib/api';

export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const search = url.searchParams.toString();
  const suffix = search ? `?${search}` : '';

  return proxyPublicApi(`/api/public/v1/geekdaily/archive${suffix}`);
}
