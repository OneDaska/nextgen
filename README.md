# NextGen Dashboard

Production: https://nextgen.laineworkflow.online/nextgen.html

Hostinger deploys OneDaska/nextgen main. Use Node 24, pnpm install --frozen-lockfile, pnpm build and pnpm start. Next.js builds with Webpack for Hostinger compatibility. SQL and database migrations are managed separately and must not run during deployment.

All nine functions have five official KPIs. Assigned contributors read all active team results and reports, and edit only their own function. Agreed technology milestones and prospect targets still require administrator scoring setup.

## Security

- Sign-in and refresh tokens use host-only, Secure, HttpOnly, SameSite=Strict session cookies. Page JavaScript receives user details only. Existing browser tokens are discarded at upgrade; users sign in again.
- The backend proxy permits only the dashboard's fixed operations and checks request origin. Supabase independently enforces database roles and row-level security.
- Administrators must enroll a TOTP authenticator and verify it before accessing data. AAL2 and an active session are enforced by database access rules. Contributors retain their own function write scope.
- Existing shared temporary passwords are retired for accounts that had not completed setup. Use Set or reset my password from the sign-in page. Recovery email delivery and Auth redirect configuration require an operational email provider and production allowlist.
- Dashboard CSP blocks inline scripts, third-party connections, frames and plugins. Security headers prohibit framing and browser MIME sniffing.
- Files: PNG, PDF, DOC, DOCX and XLSX, maximum 1,000,000 bytes. Validated by the trusted nextgen-evidence Edge Function, with database-level quotas. Direct client file insertion and raw file-content selection are denied. Document links remain owner/admin scoped.
- Uploaded files are quarantined until a scanner returns a clean verdict for their SHA-256 digest. Pending and rejected files cannot be downloaded, even by administrators. This is separate from verification of the claimed KPI achievement.
- Limits: 20 attachments per KPI/month; 50 attachments per uploader/hour; 100 MB per uploader and 500 MB per workspace. Limits are serialized and include pending files. Plan retention/capacity before these limits are reached.

## Malware scanner configuration

The Supabase Edge Function needs EVIDENCE_SCANNER_URL and EVIDENCE_SCANNER_TOKEN, configured as server secrets. The scanner must accept an authenticated HTTPS POST of raw bytes with X-Content-SHA256, scan using an up-to-date malware engine, and return JSON with matching sha256 and status clean or infected. Never configure an endpoint that merely echoes a clean result. A missing, failing or mismatched scanner keeps the file quarantined. Pending files can be rescanned through their authenticated download endpoint once the scanner is configured. No third-party scanning subscription is assumed or purchased by this application.

Run pnpm test and pnpm build before publishing. Edge source is under supabase/functions/nextgen-evidence; deploy it separately with its internal user authentication enabled. No service-role key belongs in the repository or browser.
