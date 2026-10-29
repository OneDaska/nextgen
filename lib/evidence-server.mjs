import { MAX_BYTES, validateEvidence } from './evidence-validation.mjs';

export function createEvidenceHandlers(config, fetcher = fetch) {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  const fail = (message, status) => Response.json({ error: message }, { status, headers });
  function enabled() {
    return config.enabled === 'true' && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url || '') && config.anon && config.service;
  }
  async function call(path, token, method = 'GET', body, service = false) {
    const response = await fetcher(config.url + path, { method, headers: { apikey: service ? config.service : config.anon, Authorization: `Bearer ${token}`, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store', redirect: 'error' });
    if (!response.ok) throw new Error('Evidence operation denied or unavailable.');
    const text = await response.text(); return text ? JSON.parse(text) : null;
  }
  async function identity(request) {
    const token = request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/)?.[1];
    if (!token) throw new Error('Sign in required.');
    const user = await call('/auth/v1/user', token);
    if (!user?.id) throw new Error('Sign in required.');
    return { token, user };
  }
  return {
    async upload(request) {
      if (!enabled()) return fail('Evidence file service is disabled until isolated staging configuration is approved.', 503);
      let intent; let token; let uploaded = false;
      try {
        const auth = await identity(request); token = auth.token;
        const kpi = request.headers.get('x-kpi-id'); const month = request.headers.get('x-reporting-month');
        const name = decodeURIComponent(request.headers.get('x-file-name') || '');
        if (!kpi || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month || '') || !name || name.length > 200) return fail('Invalid file metadata.', 400);
        // Read with a hard bound even when Content-Length is absent or dishonest.
        const reader = request.body?.getReader(); if (!reader) return fail('Missing file.', 400);
        const chunks = []; let size = 0;
        for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > MAX_BYTES) { await reader.cancel(); return fail('File exceeds 10 MiB.', 413); } chunks.push(Buffer.from(value)); }
        let file;
        try { file = validateEvidence(Buffer.concat(chunks), name, request.headers.get('content-type')); } catch (e) { return fail(e.message, 400); }
        intent = await call('/rest/v1/rpc/nextgen_begin_upload', token, 'POST', { p_kpi: kpi, p_month: month, p_label: name });
        const path = intent.object_name.split('/').map(encodeURIComponent).join('/');
        const stored = await fetcher(`${config.url}/storage/v1/object/nextgen-evidence/${path}`, { method: 'POST', headers: { apikey: config.service, Authorization: `Bearer ${config.service}`, 'Content-Type': file.mime, 'x-upsert': 'false' }, body: Buffer.concat(chunks), redirect: 'error' });
        if (!stored.ok) throw new Error('Upload could not be stored.'); uploaded = true;
        const id = await call('/rest/v1/rpc/nextgen_finish_upload', config.service, 'POST', { p_intent: intent.id, p_user: auth.user.id, p_mime: file.mime, p_size: file.size }, true);
        return Response.json({ id, status: 'unverified' }, { status: 201, headers });
      } catch {
        if (uploaded && intent) {
          // Retain finalized evidence on an ambiguous network response; cleanup only after checking metadata.
          try {
            const existing = await call(`/rest/v1/nextgen_evidence?id=eq.${encodeURIComponent(intent.id)}&select=id`, config.service, 'GET', undefined, true);
            if (!existing?.length) await call('/storage/v1/object/nextgen-evidence', config.service, 'DELETE', { prefixes: [intent.object_name] }, true);
          } catch { /* An inaccessible orphan remains private; staging operators reconcile expired intents. */ }
        }
        return fail('Upload denied or unavailable. Refresh your access before retrying.', 403);
      }
    },
    async download(request, id) {
      if (!enabled()) return fail('Evidence file service is disabled until isolated staging configuration is approved.', 503);
      if (!/^[0-9a-f-]{36}$/i.test(id)) return fail('Invalid evidence ID.', 400);
      try {
        const { token } = await identity(request);
        const rows = await call(`/rest/v1/nextgen_evidence?id=eq.${id}&withdrawn_at=is.null&kind=eq.file&select=object_name,mime`, token);
        if (!rows?.length) return fail('Evidence not available.', 404);
        const evidence = rows[0];
        const response = await fetcher(`${config.url}/storage/v1/object/authenticated/nextgen-evidence/${evidence.object_name.split('/').map(encodeURIComponent).join('/')}`, { headers: { apikey: config.anon, Authorization: `Bearer ${token}` }, cache: 'no-store', redirect: 'error' });
        if (!response.ok) return fail('Evidence not available.', 404);
        return new Response(response.body, { headers: { ...headers, 'Content-Type': evidence.mime, 'Content-Disposition': 'attachment; filename="nextgen-evidence"', 'Content-Security-Policy': "sandbox; default-src 'none'" } });
      } catch { return fail('Evidence not available.', 403); }
    },
  };
}

export function stagingEvidenceConfig() {
  return { enabled: process.env.NEXTGEN_STAGING_EVIDENCE_ENABLED, url: process.env.NEXTGEN_STAGING_SUPABASE_URL, anon: process.env.NEXTGEN_STAGING_SUPABASE_ANON_KEY, service: process.env.NEXTGEN_STAGING_SUPABASE_SERVICE_ROLE_KEY };
}
