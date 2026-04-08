import { proxyPublicApi } from '@/lib/api';

export async function GET() {
  return proxyPublicApi('/api/public/v1/geekdaily/search');
}
