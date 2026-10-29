# NextGen Dashboard

Production domain: nextgen.laineworkflow.online

## Hostinger deployment settings

- Repository: OneDaska/nextgen
- Branch: main
- Application root: repository root
- Framework: Next.js
- Node.js: 24 where available (22 is also supported by Next.js)
- Install: pnpm install --frozen-lockfile
- Build: pnpm build
- Start: pnpm start

Database changes are managed separately. Do not rerun migrations during deployment.
Keep evidence upload staging variables unset; evidence uploads are disabled for this release.

Configure Supabase authentication to allow https://nextgen.laineworkflow.online/nextgen.html for invitation and recovery redirects, and set the production site URL once the deployment is verified.

Real-account sign-in and invitation/reset delivery still require verification. KPI definitions require owner validation. Temporary-password generation and enforced first-login password changes are not implemented in this release.
