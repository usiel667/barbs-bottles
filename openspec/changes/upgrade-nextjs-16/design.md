## Context

- **Current state:** `next` 15.5.19, `eslint-config-next` 16.2.1 (mismatched), `@sentry/nextjs` 10.45.0, `@kinde-oss/kinde-auth-nextjs` 2.11.0, React 19.2.4, Node 26.10 locally.
- **Security:** 15.5.19 has 2 critical + 4 high Next.js advisories (fixed in 15.5.24 / 16.3.3). 16.2.1, the version in `eslint-config-next`, is *also* vulnerable. Next 15 leaves Maintenance LTS on 2026-10-21.
- **Auth today:** `proxy.ts` wraps a no-op handler in Kinde's `withAuth`, but Next 15 only recognizes `middleware.ts`, so it never runs. Protection currently comes from `app/(dashboard)/layout.tsx` (`getUser()` → `redirect("/login")`) and a `getUser()` check at the top of every server action.
- **Already Next-16-ready:** all six pages using `params` / `searchParams` already type them as `Promise<…>` and `await` them. There are no `cookies()` / `headers()` / `draftMode()` calls, no `next/image`, no `revalidateTag`, no `unstable_*` APIs, no AMP, no runtime config, no parallel routes. `eslint.config.mjs` is already flat config and `npm run lint` already calls `eslint` directly (no `next lint`).
- **GitNexus:** `nextConfig` impact is LOW (0 dependents). `proxy.ts` has no static callers, but its runtime blast radius is every matched route.
- **Stakeholders:** Barb and staff (end users). The deploy target is Vercel, ahead of the production launch.

## Goals / Non-Goals

**Goals:**
- Run on Next.js 16.3.8 (Active LTS, patched) with a passing Turbopack production build.
- Make `proxy.ts` actually execute so request-level auth gating exists, without breaking login, the Kinde callback, static assets, or Sentry's tunnel.
- Keep Sentry error capture and source-map upload working.
- Zero behavior change in pages and server actions.

**Non-Goals:**
- React 19.3 upgrade, enabling the React Compiler, or adopting Cache Components / `updateTag`.
- Sentry sample-rate / PII tuning and removing the Sentry example routes (launch guide Phase 0.5 / 0.4).
- Kinde self-sign-up lockdown or role-based authorization (launch guide Phase 5).
- Fixing unrelated dev-dependency `npm audit` findings.

## Decisions

### D1 — Target 16.3.8, not 15.5.27 or 16.2.1
- **16.2.1** still carries the critical AVIF RCE (fixed only in ≥16.3.3), so it's rejected.
- **15.5.27** is patched today, but it's unsupported after 2026-10-21, and `proxy.ts` would have to be renamed to `middleware.ts` and then renamed back on the eventual upgrade. That's a stopgap only.
- **16.3.8** is the current `latest` dist-tag, Active LTS, and patched, and it makes the existing `proxy.ts` valid as-is.

### D2 — Install packages manually; don't run the `upgrade` codemod
The codemod's work (turbopack config move, `next lint` → ESLint CLI, middleware → proxy rename, `unstable_` removals) is already done or doesn't apply here. Pinning exact versions with `npm install next@16.3.8 eslint-config-next@16.3.8` keeps the diff limited to what we intend. As a check, run `npx @next/codemod@16.3.8 next-async-request-api . --dry` to confirm it finds nothing to change.

### D3 — Keep `proxy.ts` on the Node.js runtime
In Next 16, `proxy` always runs on Node.js (edge isn't supported for `proxy`). Kinde's `withAuth` only reads cookies and issues redirects, so it works on Node, and Kinde 2.11.0 declares `next ^16.0.0` as a supported peer. Keeping the filename `proxy.ts` and the function name `proxy` matches the Next 16 convention. Alternative: rename back to `middleware.ts` to keep edge. Rejected, because `middleware` is deprecated in 16 and edge gives no benefit for this app.

### D4 — Add `monitoring` to the proxy matcher exclusions
`next.config.ts` sets Sentry's `tunnelRoute: "/monitoring"`, and Sentry's own comment warns it must not match the middleware. The current matcher (`/((?!api|_next/static|_next/image|favicon.ico|robots.txt|images|login|$).*)`) **does** match `/monitoring`. That's harmless today only because the proxy never runs. Once it's active, browser error reports sent from the logged-out login page would be redirected to Kinde and lost. Fix: add `monitoring` to the negative lookahead. Everything else in the matcher stays as-is.

### D5 — Remove the `console.log` from the proxy
It logs every request path. On Vercel that floods logs and costs money. The handler body becomes empty (Kinde's `withAuth` does the work); keep the function so `withAuth` options still apply.

### D6 — Sentry: bump within major 10, drop the `webpack` options block
- `@sentry/nextjs` 10.45.0 → 10.76.0 clears the moderate audit chain (`@sentry/node` → OpenTelemetry) and has mature Turbopack build support. Major 11 is out of scope.
- The `webpack: { automaticVercelMonitors, treeshake.removeDebugLogging }` options only apply to webpack builds. `automaticVercelMonitors` instruments Vercel Cron Jobs, which this app doesn't have. `removeDebugLogging` is a small bundle-size optimization. Remove the block. If the build still reports a webpack config, Sentry's plugin is adding one, and the fallback is D7.

### D7 — Fallback if Turbopack build fails
If `next build` fails because of a plugin-injected webpack config or a Turbopack incompatibility that isn't quickly fixable, set `"build": "next build --webpack"` in `package.json` as a documented, temporary escape hatch, and note it in the launch guide. Dev stays on Turbopack.

### D8 — Accept the managed `AGENTS.md` block
`next dev` on 16.2+ writes a `<!-- BEGIN:nextjs-agent-rules -->` block pointing at the bundled docs in `node_modules/next/dist/docs/`. The current hand-written heading in `AGENTS.md` duplicates it. Replace that heading with the managed block and commit it, so later agent work reads version-matched docs.

## Risks / Trade-offs

- **[Proxy activation causes redirect loops or blocks a public path]** → The matcher exclusions are spelled out in the `request-auth-proxy` spec. Test logged-out access to `/`, `/login`, `/images/bee_bottle.webp`, `/api/auth/login`, the Kinde callback, and `/monitoring` before merging.
- **[Kinde `withAuth` misbehaves on the Node proxy runtime]** → Verify the full login → return-to-page → logout cycle locally. If it fails, upgrade `@kinde-oss/kinde-auth-nextjs` to 2.13.1 (latest 2.x). If it still fails, temporarily drop the proxy back to a pass-through, since the layout and action checks still protect everything, and file it as a follow-up.
- **[Sentry stops capturing or source maps stop uploading under Turbopack]** → Trigger a test client and server error after building with `SENTRY_AUTH_TOKEN` set, and confirm readable stack traces. Fall back to D7 if needed.
- **[Running dev server breaks mid-upgrade]** → Stop `next dev` before `npm install`, delete `.next/`, and restart afterward. Next 16 writes dev output to `.next/dev`.
- **[Turbopack dev/build behaves subtly differently (CSS ordering, Tailwind v4)]** → Visual pass over light and dark mode on every dashboard page and the login page.
- **[Trade-off: per-request proxy cost]** → One extra cookie/JWT check per page request, which is negligible for a small internal tool and buys defense-in-depth.

## Migration Plan

1. Work on branch `upgrade-nextjs-16` (already created from `main`).
2. Stop the dev server, install pinned versions, apply the config/proxy edits, `rm -rf .next`.
3. Verify: `npm run lint`, `npm run build`, `npm run start`, then the auth and smoke checks in `tasks.md`.
4. Run `gitnexus_detect_changes()`, commit, and open a PR to `main`. Once Vercel is connected (launch guide Phase 3), merging deploys it.
5. **Rollback:** before merge, abandon the branch. After merge, `git revert` the merge commit, or use Vercel → Deployments → Promote the previous deployment. There are no DB or data changes, so rollback is code-only.

## Open Questions

- None blocking. If the Kinde proxy check or Turbopack build fails, D7 and the Kinde fallback above decide the path, and I'll report back before choosing between them.
