## Why

The app runs Next.js 15.5.19, which `npm audit` flags with two **critical** advisories (GHSA-2xp9-vwfh-vxw4 unauthenticated RCE via AVIF image optimization; GHSA-p293-qw3h-jr36 RCE on Windows-hosted servers) and several **high** ones (GHSA-m99w-x7hq-7vfj Server Action DoS, GHSA-89xv-2m56-2m9x and GHSA-p9j2-gv94-2wf4 SSRF). Next.js 15 also leaves Maintenance LTS on **2026-10-21**, right as the app goes to production, after which it gets no further security fixes. Separately, `proxy.ts` is a Next 16 file convention, so on 15.5 the Kinde auth middleware never runs (`.next/server/middleware-manifest.json` is empty). Upgrading to the current Active LTS release (16.3.8) fixes both problems at once.

## What Changes

- Upgrade `next` 15.5.19 → **16.3.8** and `eslint-config-next` 16.2.1 → **16.3.8**. `react` / `react-dom` stay at 19.2.4, which satisfies Next 16's `^19.0.0` peer. The App Router uses Next's bundled React, so the 19.3 minor bump is left out of this change.
- Bump `@sentry/nextjs` 10.45.0 → latest **10.x** (10.76.0, staying on major 10), which clears its moderate audit findings and supports Turbopack production builds.
- **BREAKING (build):** `next build` now uses Turbopack by default. The `webpack: {…}` block in `next.config.ts`'s `withSentryConfig` options (`automaticVercelMonitors`, `treeshake.removeDebugLogging`) is webpack-only; it gets migrated or removed so the build doesn't fail or silently ignore it.
- **Behavior change:** `proxy.ts` becomes active. Every request matching its matcher goes through Kinde's `withAuth` *before* rendering. Unauthenticated requests to protected paths are redirected to login at the edge of the request instead of only inside `app/(dashboard)/layout.tsx`. The leftover `console.log` in the proxy is removed so it doesn't log on every request in production.
- Dev and build output split (`.next/dev` vs `.next`), so `next dev` and `next build` can run at the same time.
- No changes to pages, server actions, or the database. All `params` / `searchParams` usage is already async (`await params`), so Next 16's removal of synchronous Request APIs needs no code edits.
- Update `markdown files/setup/Production_Launch_Guide.md` Phase 0.1 and the Launch Task List to reflect the upgrade path.

## Capabilities

### New Capabilities
- `request-auth-proxy`: Request-level authentication gating via `proxy.ts`: which paths are protected, which are public (`/`, `/login`, `/api/*`, static assets, `/images/*`), and how unauthenticated requests are redirected. It defense-in-depths the existing layout and server-action checks.
- `framework-baseline`: The supported, patched framework baseline the app must run on: Next.js Active LTS with no known critical/high Next.js advisories, a passing production build, and Sentry still capturing errors.

### Modified Capabilities
(none, since `openspec/specs/` has no tracked specs yet)

## Impact

- **Dependencies:** `next`, `eslint-config-next`, `@sentry/nextjs`; `package-lock.json` regenerated.
- **Config:** `next.config.ts` (Sentry `webpack` options → Turbopack-compatible / removed); possibly `package.json` scripts if the codemod touches them.
- **Code:** `proxy.ts` (remove `console.log`; function already named `proxy`). GitNexus impact on `nextConfig`: LOW, 0 dependents. `proxy.ts` has no static callers in the graph. Its runtime effect is global, though: it runs on every matched request, so all dashboard routes are affected at runtime.
- **Auth flow:** `/api/auth/[kindeAuth]` (Kinde `handleAuth`) is excluded from the matcher and unchanged. `@kinde-oss/kinde-auth-nextjs` 2.11.0 already declares `next ^16.0.0` as a supported peer.
- **Runtime:** Proxy runs on the Node.js runtime in Next 16 (edge isn't supported for `proxy`). Node 26.10 locally, and Vercel's default Node, both satisfy the `>=20.9.0` requirement.
- **Agent docs:** `next dev` on 16.2+ manages an `AGENTS.md` block pointing at `node_modules/next/dist/docs/`, which becomes available after the upgrade.
- **Out of scope:** Sentry sample-rate/PII tuning, removing the Sentry example routes, Kinde sign-up lockdown, `npm audit` fixes for unrelated dev-only packages (tracked separately in the launch guide's Phase 0).
