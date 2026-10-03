## 1. Pre-flight (already done during planning)

- [x] 1.1 Create branch `upgrade-nextjs-16` from `main`
- [x] 1.2 Run `gitnexus_impact` (upstream) on `nextConfig` (LOW, 0 dependents) and `gitnexus_context` on `proxy.ts` (no static callers; runtime-global), and report the blast radius
- [x] 1.3 Confirm all `params` / `searchParams` usage is already async and no `cookies()` / `headers()` / `next/image` / `revalidateTag` / `unstable_*` usage exists
- [x] 1.4 Confirm peer compatibility: Kinde 2.11.0 (`next ^16.0.0`), Sentry 10.x (`next ^16.0.0-0`), Node ≥ 20.9

## 2. Dependency upgrade

- [x] 2.1 Stop the running `next dev` server (ask the user to stop it if it's in their terminal)
- [x] 2.2 Record a baseline: `npm audit --omit=dev` summary and `npm run lint` error count on Next 15
- [x] 2.3 `npm install next@16.3.8 eslint-config-next@16.3.8 @sentry/nextjs@^10.76.0`
- [x] 2.4 `rm -rf .next` to clear Next 15 build/dev output
- [x] 2.5 Run `npx @next/codemod@16.3.8 next-async-request-api . --dry` and confirm it reports no changes

## 3. Config and proxy edits

- [x] 3.1 `next.config.ts`: remove the webpack-only `webpack: { automaticVercelMonitors, treeshake }` block from the `withSentryConfig` options (design D6)
- [x] 3.2 `proxy.ts`: remove the per-request `console.log` (design D5); keep the `proxy` function and `withAuth` options
- [x] 3.3 `proxy.ts`: add `monitoring` to the matcher's negative lookahead so the Sentry tunnel is public (design D4)
- [x] 3.4 `AGENTS.md`: replace the hand-written "This is NOT the Next.js you know" heading with the managed `nextjs-agent-rules` block that `next dev` generates (design D8)

## 4. Build and lint

- [x] 4.1 `npm run lint`: no new errors vs the 2.2 baseline
- [x] 4.2 `npm run build`: exits 0 on Turbopack; output lists the proxy as registered. If it fails on a webpack config, apply fallback D7 (`next build --webpack`) and report it
- [x] 4.3 `npm audit --omit=dev`: no high/critical findings for `next`, `postcss`, or `sharp`
- [x] 4.4 `npm run start`: production server boots on :3000

## 5. Auth proxy verification (logged out, private window)

- [x] 5.1 `/` redirects to `/login` and `/login` renders (no redirect loop)
- [x] 5.2 `/images/bee_bottle.webp` loads on the login page
- [x] 5.3 `/customers`, `/products`, `/orders/form?id=<id>` redirect into the Kinde login flow, with no data rendered
- [x] 5.4 After login from 5.3, the user lands back on the originally requested URL
- [x] 5.5 A POST to `/monitoring` is not redirected to login (Sentry tunnel public)
- [x] 5.6 Log out → protected pages redirect again
- [x] 5.7 If Kinde `withAuth` fails on the Node proxy runtime: upgrade `@kinde-oss/kinde-auth-nextjs` to 2.13.1 and retest. If it still fails, stop and report before choosing the fallback *(not needed: withAuth works on the Node proxy runtime)*

## 6. App smoke test (logged in, dev and prod build)

- [ ] 6.1 Customers: create (with and without email/phone), edit, detail page with address map + expand overlay *(create + edit + deactivate verified with test customer `ZZTest Next16Upgrade` (id 12, since deleted); detail page map + overlay verified)*
- [x] 6.2 Products: list, single design-variant edit, bulk design editor save *(single-variant edit (price + qty) and bulk editor save verified on Aura Farming Ultra; values restored from a pre-test snapshot)*
- [x] 6.3 Orders: create a multi-item order with discount + shipping address; stock decrements; edit order *(order #11: 2 items, 10% discount, shipping address auto-filled; total $132.77 correct; stock 9→7 / 3→2; edit qty 2→1 returned 1 unit, total $91.38; shows on customer Orders card. Order #11 then deleted and all 410 design rows restored to the snapshot (verified 0 diffs))*
- [x] 6.4 Global search returns grouped results with keyboard nav
- [ ] 6.5 Light and dark mode visual pass on login + all dashboard pages (Turbopack CSS/Tailwind check) *(dark mode: every page visited looked right; light mode: only checked on /customers)*
- [x] 6.6 Sentry: trigger a client and a server test error; both appear in Sentry with readable stack traces (needs `SENTRY_AUTH_TOKEN` at build) *(client + server sample errors sent; 47 source maps with debug IDs uploaded on Turbopack build. Confirm in the Sentry dashboard)*

## 7. Docs and wrap-up

- [x] 7.1 Update `markdown files/setup/Production_Launch_Guide.md` Phase 0.1 / task list to mark the upgrade done and note any D7 fallback used
- [x] 7.2 Update `markdown files/Home.md` (tick the middleware item) and `markdown files/APP_REFERENCE.md` Middleware / Auth Config section (Next 16 proxy, `/monitoring` exclusion)
- [x] 7.3 Run `gitnexus_detect_changes()` and confirm only expected files/symbols changed *(LOW: 3 symbols touched (`proxy.ts` config + 2 AGENTS.md sections), 0 execution flows affected)*
- [x] 7.4 Commit on `upgrade-nextjs-16` and open a PR to `main` (only when the user asks)
