import { createEvidenceHandlers, stagingEvidenceConfig } from '@/lib/evidence-server.mjs';

export const runtime = 'nodejs';
export async function POST(request) {
  return createEvidenceHandlers(stagingEvidenceConfig()).upload(request);
}
