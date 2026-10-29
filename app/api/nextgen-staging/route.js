import { stagingEvidenceConfig } from '@/lib/evidence-server.mjs';

export async function GET() {
  const config = stagingEvidenceConfig();
  const enabled = config.enabled === 'true' && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url || '') && !!config.anon && !!config.service;
  return Response.json(enabled ? { enabled: true, url: config.url, anon: config.anon } : { enabled: false }, { headers: { 'Cache-Control': 'no-store' } });
}
