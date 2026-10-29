import { createEvidenceHandlers, stagingEvidenceConfig } from '@/lib/evidence-server.mjs';

export const runtime = 'nodejs';
export async function GET(request, { params }) {
  const { id } = await params;
  return createEvidenceHandlers(stagingEvidenceConfig()).download(request, id);
}
