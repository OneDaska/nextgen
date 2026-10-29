# NextGen Dashboard

Leadership performance dashboard deployed to nextgen.laineworkflow.online.

## Hostinger deployment

Import this repository as a Node.js / Next.js application using the main branch and repository root.
Use Node.js 24 where available. Install with `pnpm install --frozen-lockfile`, build with `pnpm build`, and start with `pnpm start`.

Database migrations are managed separately and must not run during deployment.
Evidence uploads remain disabled. Supabase authentication redirect URLs must allow the production domain before invitation and reset links are used.
