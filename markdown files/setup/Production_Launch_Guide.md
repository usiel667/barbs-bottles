# Production Launch Guide — Barb's Bottles

Everything you need to take Barb's Bottles from `localhost` / Cloudflare quick tunnels to a real, always-on website at your own URL.

Work through the phases in order and check tasks off in the [Launch Task List](#launch-task-list) as you go. The phase sections below explain *how* to do each task. Prices and free-tier limits were current when this was written (2026-10), but they change, so ch[[Home]]eck each provider's pricing page before you pay for anything.

---

## Table of Contents

- [Launch Task List](#launch-task-list)
- [The Big Picture](#the-big-picture)
- [Decisions to Make First](#decisions-to-make-first)
- [Phase 0 — Code Fixes Before Launch](#phase-0--code-fixes-before-launch)
- [Phase 1 — Domain (✅ Purchased)](#phase-1--domain--purchased)
- [Phase 2 — Production Database (Neon)](#phase-2--production-database-neon)
- [Phase 3 — Hosting (Vercel)](#phase-3--hosting-vercel)
- [Phase 4 — Connect Your Domain to Vercel](#phase-4--connect-your-domain-to-vercel)
- [Phase 5 — Authentication (Kinde)](#phase-5--authentication-kinde)
- [Phase 6 — Sentry and Google Maps](#phase-6--sentry-and-google-maps)
- [Phase 7 — Launch Day Smoke Test](#phase-7--launch-day-smoke-test)
- [After Launch — Day-to-Day Operations](#after-launch--day-to-day-operations)
- [Monthly Cost Summary](#monthly-cost-summary)
- [Environment Variable Reference](#environment-variable-reference)
- [Troubleshooting](#troubleshooting)

---

## Launch Task List

The single checklist for going live. Tick boxes here as you go (Obsidian's Tasks plugin picks them up). Each heading links to the phase that explains the steps.

**Progress key:** 🔴 blocker · 🟠 should do · 🟡 nice to have

### Decisions
- [x] Domain name chosen and bought → `barbsbottles.com` (Vercel Domains)
- [ ] App URL chosen (recommended: `app.barbsbottles.com`)
- [ ] Production data: start fresh or promote current DB
- [ ] Vercel plan: Hobby for testing → Pro before real business use

### [Phase 0 — Code fixes](#phase-0--code-fixes-before-launch)
- [x] 🔴 Decide upgrade path → Next.js **16.3.8** (OpenSpec plan `upgrade-nextjs-16` written)
- [x] 🔴 Review & approve the `upgrade-nextjs-16` OpenSpec plan
- [x] 🔴 Upgrade to Next.js 16.3.8 on branch `upgrade-nextjs-16` (`next`, `eslint-config-next`, `@sentry/nextjs` 10.76)
- [x] 🔴 Proxy registered in build output; `console.log` removed; `/monitoring` excluded from matcher
- [x] 🔴 Logged-out / login / return-to-page / logout flows verified with the proxy active
- [x] 🔴 `npm audit --omit=dev` shows no high/critical for `next` (17 → 7 findings, 0 critical; the 7 left are dev tooling)
- [x] 🔴 Order create/edit and product save tested on the upgrade branch (stock restored)
- [ ] 🔴 Upgrade branch merged to `main`
- [ ] 🔴 `npm run build` passes locally (dev server stopped first)
- [ ] 🔴 `npm run start` works and the app clicks through cleanly
- [ ] 🟠 Delete `app/sentry-example-page/` and `app/api/sentry-example-api/`
- [ ] 🟠 `tracesSampleRate` → `0.1` in all three Sentry config files
- [ ] 🟠 `sendDefaultPii` reviewed (→ `false` recommended)
- [ ] 🟠 Session Replay masking confirmed (or replays turned off)
- [ ] 🟠 Migrations verified against an empty Neon branch (`db:generate` any missing ones)
- [ ] 🟡 Fix `db:studio` typo (`drizzle_kit` → `drizzle-kit`)
- [ ] 🟡 Replace the template `README.md`
- [ ] 🟡 `git ls-files | grep env` prints nothing
- [ ] All Phase 0 changes committed and pushed to `main`

### [Phase 1 — Domain](#phase-1--domain--purchased)
- [x] `barbsbottles.com` purchased through Vercel
- [x] Auto-renew confirmed ON (Vercel → Account Settings → Domains) ✅ 2026-10-02
- [x] Card on file in Vercel is valid (renewals bill to it) ✅ 2026-10-03
- [ ] 2FA enabled on the Vercel account

### [Phase 2 — Production database](#phase-2--production-database-neon)
- [ ] `production` branch created in Neon
- [ ] Neon region noted (to match Vercel)
- [ ] Production connection string copied (kept secret)
- [ ] `db:migrate` run against production
- [ ] Products seeded **or** current data copied
- [ ] Row counts spot-checked in Neon SQL editor
- [ ] `.env.local` still points at the **dev** branch
- [ ] First `pg_dump` backup taken and stored outside the repo

### [Phase 3 — Hosting](#phase-3--hosting-vercel)
- [ ] `usiel667/barbs-bottles` imported into the Vercel project
- [ ] `DATABASE_URL` (production) added
- [ ] `KINDE_CLIENT_ID` / `KINDE_CLIENT_SECRET` / `KINDE_ISSUER_URL` added
- [ ] `KINDE_SITE_URL` / `KINDE_POST_LOGIN_REDIRECT_URL` / `KINDE_POST_LOGOUT_REDIRECT_URL` added (real domain)
- [ ] `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` added
- [ ] `GOOGLE_MAPS_EMBED_KEY` added
- [ ] Function region set to match Neon
- [ ] First deploy succeeds (green build log)
- [ ] Know where **Promote to Production** (rollback) lives

### [Phase 4 — Connect domain](#phase-4--connect-your-domain-to-vercel)
- [ ] `app.barbsbottles.com` added to the project in Vercel → Settings → Domains
- [ ] Domain shows "Valid Configuration"
- [ ] `https://app.barbsbottles.com` loads the login page with a padlock
- [ ] 🟡 `barbsbottles.com` (root) redirects to `app.barbsbottles.com`

### [Phase 5 — Kinde](#phase-5--authentication-kinde)
- [ ] Production callback URL added
- [ ] Production logout redirect URL added
- [ ] Homepage / login URIs updated
- [ ] Old `*.trycloudflare.com` URLs removed
- [ ] 🔴 Self-sign-up disabled
- [ ] Barb + staff invited as users
- [ ] Unknown email confirmed unable to register
- [ ] 🟡 Login page branding (logo, colors)
- [ ] 🟡 MFA required for users
- [ ] 🟡 Custom auth domain (`auth.barbsbottles.com`)

### [Phase 6 — Sentry & Google Maps](#phase-6--sentry-and-google-maps)
- [ ] Test error shows in Sentry with readable stack trace
- [ ] Sentry email alert on new issues
- [ ] Sentry data scrubbing confirmed on
- [ ] Maps key restricted to `https://app.barbsbottles.com/*` (+ `localhost`)
- [ ] Maps key restricted to Maps Embed API only
- [ ] Google Cloud budget alert set

### [Phase 7 — Launch day smoke test](#phase-7--launch-day-smoke-test)
**Auth**
- [ ] `/` redirects to `/login`
- [ ] `/customers` while logged out redirects to login
- [ ] Log in → lands on `/home`
- [ ] Log out → `/home` requires login again

**Customers**
- [ ] Create a customer (with and without email/phone)
- [ ] Edit it; detail page `/customers/[id]` map renders and expands
- [ ] Global search finds it

**Products**
- [ ] Products list shows all series/designs
- [ ] Edit a design variant's price/stock; bulk design editor saves

**Orders**
- [ ] Multi-item order with discount + shipping address created
- [ ] Stock decrements on the product design
- [ ] Order editable and shows on the customer's Orders card

**Ops**
- [ ] Tested on computer **and** iPad
- [ ] No errors in Vercel → Logs
- [ ] No unexpected Sentry issues
- [ ] Dark mode toggle works
- [ ] Test customers/orders deleted or deactivated

### [After launch](#after-launch--day-to-day-operations)
- [ ] 🟡 Uptime monitor set up (UptimeRobot / Better Stack)
- [ ] 🟡 Vercel Analytics / Speed Insights turned on
- [ ] Weekly backup + Sentry check added to your routine
- [ ] 🎉 Barb is using it for real

---

## The Big Picture

Today the app runs on your machine and talks to cloud services. Going live means moving the app itself into the cloud and pointing a domain name at it.

```mermaid
flowchart LR
    USER["Barb / staff\n(browser, iPad)"] -->|https://app.barbsbottles.com| DNS["Vercel DNS\n(barbsbottles.com)"]
    DNS --> VERCEL["Vercel\n(hosts the Next.js app)"]
    VERCEL -->|DATABASE_URL| NEON["Neon\n(Postgres database)"]
    VERCEL -->|login / logout| KINDE["Kinde\n(authentication)"]
    VERCEL -->|errors, traces| SENTRY["Sentry\n(error monitoring)"]
    USER -->|map iframe| GMAPS["Google Maps\nEmbed API"]
```

| Piece | Service | Status today | What changes for production |
|-------|---------|--------------|------------------------------|
| App hosting | **Vercel** (recommended) | Runs locally (`npm run dev`) | Deployed from GitHub on every push to `main` |
| URL | **Vercel Domains** | ✅ `barbsbottles.com` purchased | App served at `app.barbsbottles.com` |
| Database | **Neon** Postgres | Already in the cloud | Separate production branch, backups, migrations run on purpose |
| Login | **Kinde** (`barbsbottles.kinde.com`) | Callback URLs point to localhost/tunnel | Add production URLs, lock down sign-ups |
| Errors | **Sentry** (`axis-marketing/barbs-bottles`) | Captures 100% of traces, sends PII | Lower sampling, review PII |
| Maps | **Google Maps Embed API** | Unrestricted key | Key locked to your production domain |

**Why Vercel?** The project is already set up for it: the Sentry config has Vercel-specific options (`automaticVercelMonitors`), `Home.md` already plans to add `GOOGLE_MAPS_EMBED_KEY` to Vercel, and Vercel makes Next.js (the company behind it). Deploys happen automatically when you `git push`. Netlify, Railway, or Cloudflare (via OpenNext) would also work, but they need more setup.

---

## Decisions to Make First

Settle these before you start. They affect several of the phases below.

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | **Domain name** | — | ✅ **Done:** `barbsbottles.com`, bought through Vercel Domains |
| 2 | **Which URL the app lives at** | Root (`barbsbottles.com`) or subdomain (`app.barbsbottles.com`) | **Subdomain.** This is an internal inventory/order tool. Keeping the root domain free leaves room for a public website or store later |
| 3 | **Vercel plan** | Hobby (free) or Pro (~$20/user/mo) | Vercel's Hobby plan is for **non-commercial use only**. A tool that runs a business counts as commercial, so plan on **Pro**. Start on Hobby while you test if you like, then upgrade before real use |
| 4 | **Production data** | Start fresh (empty DB + seeded products) or promote the current dev database | Start fresh **unless** the current customers and orders are real. Either way, keep dev and prod in separate Neon branches |
| 5 | **Who can log in** | Only invited staff, or anyone who signs up | **Invited staff only.** See the Kinde section. Today, *any* logged-in Kinde user gets full access to everything |

---

## Phase 0 — Code Fixes Before Launch

Fix these in the codebase first. Items marked 🔴 are blockers.

### 🔴 0.1 — Upgrade to Next.js 16.3.8 (security + `proxy.ts` not running)

**Two problems, one fix:**
1. **Security.** The installed **Next.js 15.5.19** has 2 **critical** advisories (remote code execution via AVIF image optimization, GHSA-2xp9-vwfh-vxw4, plus a Windows-only RCE) and several **high** ones (Server Action denial-of-service, SSRF). **16.2.1** (the version in `eslint-config-next`) has the same critical hole. Next 15 also stops getting security fixes on **2026-10-21**.
2. **Auth middleware is inactive.** `proxy.ts` is a Next 16 file name, so Next 15 ignores it (`.next/server/middleware-manifest.json` is empty). The dashboard layout and server-action checks still protect you, but the request-level layer is missing.

**Decision: upgrade to Next.js 16.3.8** (Active LTS, patched). That makes `proxy.ts` valid as-is. The full plan, specs, and task list live in the OpenSpec change `openspec/changes/upgrade-nextjs-16/` on branch `upgrade-nextjs-16`. Highlights:
- Pinned installs: `next@16.3.8`, `eslint-config-next@16.3.8`, `@sentry/nextjs@^10.76.0`.
- No page or server-action code changes. `params` / `searchParams` are already awaited everywhere.
- Remove the webpack-only Sentry options from `next.config.ts` (Next 16 builds with Turbopack).
- Remove the per-request `console.log` from `proxy.ts`.
- **New finding:** add `monitoring` to the proxy matcher. Sentry's `/monitoring` tunnel would otherwise get auth-redirected once the proxy turns on, and error reports from the login page would be lost.

Stopgap only, if you can't upgrade yet: `npm i next@15.5.27` and rename `proxy.ts` → `middleware.ts`. That's patched today but unsupported after Oct 21.

**Status (2026-10-03):** upgraded and verified on branch `upgrade-nextjs-16`. The Turbopack build passes (no `--webpack` fallback needed), shows `ƒ Proxy (Middleware)`, and uploads Sentry source maps. Login, logout, and return-to-page work through the proxy. Known noise: running `next start` locally prints `MaxListenersExceededWarning` when Sentry's `/monitoring` route forwards events to sentry.io. It comes from Next's built-in rewrite forwarding, not app code, and events still arrive.

### 🔴 0.2 — Lock down who can log in

All the auth checks only ask "is someone logged in?", never "is this person allowed?". If Kinde self-sign-up is on, a stranger could register and see every customer's name, address, and phone number. The fix happens in Kinde ([Phase 5](#phase-5--authentication-kinde)): turn off self-sign-up and invite users by hand. Optionally, add an allowlist of emails in code as a second layer.

### 🔴 0.3 — Make sure `npm run build` passes

Vercel runs `npm run build`, so any TypeScript or lint error that `next dev` lets through will fail the deploy. Stop the dev server first, because `build` and `dev` both write to `.next/`:

```bash
npm run build
npm run start   # serves the production build at http://localhost:3000. Click around
```

### 🟠 0.4 — Remove the Sentry example routes

Delete `app/sentry-example-page/` and `app/api/sentry-example-api/`. They exist only to test Sentry, and `/api/*` is excluded from the auth middleware matcher, so the example API route is public.

### 🟠 0.5 — Sentry production settings

These are already on the **Before Production** list in [[Home]]. See [[Sentry_Setup]].

- `tracesSampleRate: 1` → `0.1` in `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts`. At `1`, every request sends a trace, and you'll burn through the free quota fast.
- `sendDefaultPii: true` → change to `false` unless you have a reason to keep it. This app handles customer names, addresses, emails, and phone numbers.
- Session Replay (`replayIntegration()`) records the screen. Make sure text and inputs are masked (`maskAllText` and `blockAllMedia` default to `true`, so keep them that way), or turn replays off.
- Optional: move the DSN to `NEXT_PUBLIC_SENTRY_DSN`. A DSN isn't a secret, so this is about tidiness, not security.

### 🟠 0.6 — Database migration strategy

Some schema changes were applied with `npm run db:push` (multi-item orders), and others with migration files (`db/migrations/0000`–`0006`). For production, use **migration files only** (`db:generate` → `db:migrate`). They give you a reviewable, repeatable history. `db:push` changes the schema directly and can drop columns without asking.

**Test it:** in [Phase 2](#phase-2--production-database-neon), run `npm run db:migrate` against a brand-new empty Neon branch. If the resulting schema matches `db/schema.ts`, the migrations are complete. If it doesn't, run `npm run db:generate` to create the missing migration and commit it.

### 🟡 0.7 — Small cleanups

- `package.json` → `"db:studio": "drizzle_kit studio"` has a typo. It should be `drizzle-kit studio`.
- `next.config.ts` → `allowedDevOrigins` only applies in dev, so it's harmless in production. You can leave it.
- `README.md` is still the create-next-app template. Replace it with a short "how to run / how to deploy" pointer to this guide.
- `.gitignore` already ignores `.env*` and `.env.sentry-build-plugin`. Run `git ls-files | grep env` and confirm it prints nothing before you connect the repo to Vercel.

➡️ Check these steps off in the [Launch Task List](#launch-task-list).

---

## Phase 1 — Domain (✅ Purchased)

**`barbsbottles.com` was bought through Vercel Domains.** Vercel is both the registrar and the DNS provider, so you won't need to copy DNS records between sites in Phase 4.

Remaining housekeeping:
1. **Auto-renew:** Vercel → Account (team) Settings → **Domains** → `barbsbottles.com` → confirm auto-renew is on. An expired domain takes the site down, and someone else can grab the name.
2. **Payment method:** renewals bill the card on your Vercel account, so keep it current.
3. **2-factor authentication** on your Vercel account (Account Settings → Authentication). That account now controls the domain *and* the hosting.
4. **Contact privacy:** Vercel redacts registrant details in public WHOIS lookups by default, so there's nothing to do. Check the domain's settings page if you want to confirm.
5. Don't create DNS records by hand. Adding the domain to the project in Phase 4 handles them.

> **Business email (optional, later):** if you want `barb@barbsbottles.com`, add MX records in Vercel → Domains → `barbsbottles.com` → DNS Records for Google Workspace (~$7/user/mo), Zoho Mail (free tier), or ImprovMX (free forwarding to an existing Gmail). Email records don't interfere with the website.

➡️ Check these steps off in the [Launch Task List](#launch-task-list).

---

## Phase 2 — Production Database (Neon)

Your database already lives on Neon, which is good. The goal is to **separate production data from your development data**, so testing a migration or running `db:seed` / `db/clear.ts` locally can never touch real orders.

### Steps

1. **Log in to the Neon console** and open the project.
2. **Create a production branch** (Neon branches are full copies of the database):
   - **Starting fresh:** create a new branch from an empty state (or create a new project), named `production`.
   - **Promoting current data:** create a branch from your current branch, named `production`. It starts as a copy of everything you have now.
3. **Pick the region carefully.** The Neon region and the Vercel function region should match (e.g. Neon `AWS us-east-1` ↔ Vercel `iad1` Washington D.C.). If they're in different regions, every database query crosses the country and pages get slow.
4. **Copy the production connection string** (Connection Details → select the `production` branch). It looks like `postgresql://user:password@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require`. This is a **secret**: never commit it, paste it in chat, or put it in a `NEXT_PUBLIC_` variable.
5. **Run migrations against production** from your machine, *temporarily* pointing at prod:
   ```bash
   # one-off: override DATABASE_URL just for this command
   DATABASE_URL="postgresql://...production..." npm run db:migrate
   ```
   (In fish: `env DATABASE_URL="postgresql://..." npm run db:migrate`.) `db/index.ts` loads `.env.local` with `dotenv`, but dotenv does **not** override a variable that's already set, so the command-line value wins.
6. **Seed products (fresh start only):** run `db:seed` the same way, *once*. Read `db/seed.ts` first and make sure it only inserts products, series, and sizes, with no test customers or orders.
7. **Open Neon's SQL editor** on the production branch and spot-check: `select count(*) from products;`, `select count(*) from product_designs;`.

### Backups
- Neon keeps a **point-in-time restore** history. The window depends on your plan, and on the free tier it's short. Check it under project settings.
- Free plan limits (storage, compute hours) are fine for a small business tool, but if you outgrow them, Neon's paid plans start low (usage-based). Check https://neon.com/pricing.
- Belt-and-suspenders: once a week (or before big migrations), take a manual dump:
  ```bash
  pg_dump "postgresql://...production..." > backups/barbs-$(date +%F).sql
  ```
  Store it somewhere that isn't the repo (`backups/` should be gitignored).

### Your local `.env.local` after this phase
Keep `DATABASE_URL` in `.env.local` pointed at your **dev** branch. Only Vercel gets the production URL.

➡️ Check these steps off in the [Launch Task List](#launch-task-list).

---

## Phase 3 — Hosting (Vercel)

### Steps

1. **Sign up at https://vercel.com** with **your GitHub account** (`usiel667`). That gives Vercel access to the `barbs-bottles` repo.
2. **Add New → Project → Import** `usiel667/barbs-bottles`.
3. **Framework preset:** Next.js (auto-detected). Leave build command (`next build`), output, and install command at their defaults.
4. **Environment variables.** Add these **before** the first deploy, scoped to **Production**. See the [reference table](#environment-variable-reference) for what each one is.

   | Variable | Production value |
   |----------|------------------|
   | `DATABASE_URL` | Neon **production** branch connection string |
   | `KINDE_CLIENT_ID` | From Kinde app settings |
   | `KINDE_CLIENT_SECRET` | From Kinde app settings |
   | `KINDE_ISSUER_URL` | `https://barbsbottles.kinde.com` |
   | `KINDE_SITE_URL` | `https://app.barbsbottles.com` *(your real URL)* |
   | `KINDE_POST_LOGIN_REDIRECT_URL` | `https://app.barbsbottles.com/home` |
   | `KINDE_POST_LOGOUT_REDIRECT_URL` | `https://app.barbsbottles.com` |
   | `SENTRY_DSN` | Same DSN as now |
   | `SENTRY_AUTH_TOKEN` | From `.env.sentry-build-plugin`. Needed so the build can upload source maps |
   | `GOOGLE_MAPS_EMBED_KEY` | Your Maps key (restricted, see Phase 6) |

   > Tip: Vercel can bulk-import variables. Paste the contents of a `.env` file into the first "Key" box. Do this with a **production** version of the file, not `.env.local`.

5. **Set the function region** (Project → Settings → Functions → Region) to match Neon (e.g. `iad1` for `us-east-1`).
6. **Deploy.** The first build takes a few minutes. You'll get a URL like `barbs-bottles-xxxx.vercel.app`. Login won't work there yet (Kinde doesn't know that URL), which is expected.
7. **Upgrade to Pro** when you start using it for the real business (see Decision #3).

### How deploys work from now on
- **Push to `main`** → automatic **production** deploy.
- **Push any other branch / open a PR** → a **preview** deploy at its own URL, for testing before merging.
- **Instant rollback:** Vercel → Deployments → pick a previous good deploy → **Promote to Production**. Learn where this button is *before* you need it.

> **Preview deploys and Kinde:** preview URLs change every deploy, so Kinde login won't work on them unless you set up a fixed preview domain. For a small team, test on `localhost`/tunnel and treat production as the only deployed environment. If you set Kinde variables for **Preview**, point `DATABASE_URL` for Preview at your **dev** branch, never at production.

➡️ Check these steps off in the [Launch Task List](#launch-task-list).

---

## Phase 4 — Connect Your Domain to Vercel

Because the domain was bought through Vercel, this is mostly automatic.

1. Vercel → Project → **Settings → Domains → Add** → enter `app.barbsbottles.com`.
2. Vercel sees that it owns `barbsbottles.com` and **creates the DNS record for you**. There are no CNAMEs or A records to copy anywhere.
3. Wait a minute or two for the green **Valid Configuration** check. Vercel **issues the HTTPS certificate automatically** (free, auto-renewing).
4. Optional: also add `barbsbottles.com` and set it to **redirect** to `app.barbsbottles.com`, so people who type the bare name still land somewhere. Replace the redirect later if you build a public storefront.
5. If DNS records ever need checking: Vercel → Account Settings → **Domains** → `barbsbottles.com` → DNS Records.

> If you ever move DNS to another provider (e.g. Cloudflare), you'd then add a CNAME for `app` pointing at the value Vercel shows, set to **DNS only (grey cloud)**. You don't need this now.

➡️ Check these steps off in the [Launch Task List](#launch-task-list).

---

## Phase 5 — Authentication (Kinde)

1. **Kinde dashboard → your Business (`barbsbottles`) → Settings → Applications → your app → Details.**
2. Add the production URLs (keep the localhost ones so local dev still works):
   - **Allowed callback URLs:** `https://app.barbsbottles.com/api/auth/kinde_callback`
   - **Allowed logout redirect URLs:** `https://app.barbsbottles.com`
   - **Application homepage URI / login URI:** `https://app.barbsbottles.com` and `https://app.barbsbottles.com/api/auth/login`
3. **Remove old tunnel URLs** (`*.trycloudflare.com`) from the allowed lists once you're done testing with them. Stale entries are unnecessary attack surface.
4. **Lock down sign-ups** (blocker 0.2):
   - Settings → Authentication (or Environment → Policies): turn **off** "Allow self sign-up" / registrations.
   - **Users → Add user** for Barb and every staff member who needs access.
   - Try registering with an unknown email in a private window and confirm it's refused.
5. **Branding (optional):** Settings → Brand: upload the logo and set colors so the Kinde login screen looks like Barb's.
6. **Custom auth domain (optional):** Kinde can serve login from `auth.barbsbottles.com` instead of `barbsbottles.kinde.com` (Settings → Domains). It's nice polish but not required. If you do it, update `KINDE_ISSUER_URL` in Vercel to match.
7. **Multi-factor auth:** consider requiring MFA for users (Settings → Authentication → MFA), since the app holds customer PII.
8. Free plan covers far more users than you'll need (thousands of monthly active users).

➡️ Check these steps off in the [Launch Task List](#launch-task-list).

---

## Phase 6 — Sentry and Google Maps

### Sentry
1. Confirm `SENTRY_AUTH_TOKEN` is in Vercel. Without it the build still works, but stack traces show minified code.
2. After deploying, trigger a test error (temporarily, or use Sentry's "Verify" flow) and check that it shows up in **sentry.io → axis-marketing → barbs-bottles** with readable file names.
3. **Alerts → Create Alert:** email yourself on any new issue. Otherwise errors pile up silently.
4. Sentry → Settings → Security & Privacy: turn on **Data Scrubbing** (on by default) as a safety net for PII.
5. Free (Developer) plan: one user and a monthly event quota. With `tracesSampleRate: 0.1` a small team stays well under it.

### Google Maps Embed key
The key is visible in the iframe URL (`lib/maps.ts`), so anyone can copy it. **Restrict it** so it only works on your site:

1. https://console.cloud.google.com → APIs & Services → **Credentials** → your key.
2. **Application restrictions → Websites (HTTP referrers):**
   - `https://app.barbsbottles.com/*`
   - `http://localhost:3000/*` (for dev; add your LAN IP or tunnel URL temporarily when testing on the iPad)
3. **API restrictions → Restrict key → Maps Embed API** only.
4. Billing: the Maps Embed API is free (no per-load charge), but Google requires a billing account on the project. Set a **budget alert** (Billing → Budgets, e.g. $1) so you'd hear about it if the key got misused for a paid API.
5. Privacy note (already in [[Home]]): rendering a map sends the customer's address to Google. That's fine for an internal tool, but it's worth knowing.

➡️ Check these steps off in the [Launch Task List](#launch-task-list).

---

## Phase 7 — Launch Day Smoke Test

Do this on the **real domain**, on both a computer and the iPad, using the **Phase 7** section of the [Launch Task List](#launch-task-list). Delete or deactivate any test customers/orders you create so production data stays clean.

---

## After Launch — Day-to-Day Operations

### Shipping a change
```
feature branch → test locally (dev DB) → merge to main → Vercel auto-deploys → quick smoke test
```

### Changing the database schema (the risky part)
1. Edit `db/schema.ts` → `npm run db:generate` → review the new SQL file in `db/migrations/`.
2. Test `npm run db:migrate` on the **dev** branch.
3. Before production: take a backup (`pg_dump`) or create a Neon branch snapshot.
4. Run `db:migrate` against production **before** merging code that depends on the new columns. Additive changes (new columns/tables) are safe to run first. For destructive ones (dropping/renaming), deploy code that no longer uses the column first, then drop it.
5. **Never** run `db:push`, `db:seed`, or `db/clear.ts` against production.

### Regular maintenance
| How often | Task |
|-----------|------|
| Weekly | Glance at Sentry issues; `pg_dump` backup |
| Monthly | `npm outdated` / `npm audit`; apply patch updates; check Vercel + Neon usage |
| Before the domain expires | Confirm auto-renew and that the card on file is valid |
| Each new staff member | Add them in Kinde. Remove people who leave **the same day** |

### Nice-to-haves later
- **Uptime monitoring:** UptimeRobot or Better Stack (free) pings the site every few minutes and emails you if it's down.
- **Vercel Analytics / Speed Insights:** one-click in the Vercel dashboard.
- **Roles:** Kinde roles/permissions (e.g. "staff can view, only Barb can delete") if the team grows.
- **Public storefront** on the root domain.

---

## Monthly Cost Summary

| Item | Minimum | Realistic for a small business |
|------|---------|-------------------------------|
| Domain (`barbsbottles.com`, Vercel) | ✅ paid; ~$1–2/mo equivalent at renewal | same |
| Vercel | $0 (Hobby, non-commercial) | **$20/mo** (Pro, 1 seat) |
| Neon | $0 (Free) | $0–20/mo depending on usage/backup retention |
| Kinde | $0 | $0 |
| Sentry | $0 (Developer) | $0 |
| Google Maps Embed | $0 | $0 |
| Business email (optional) | $0 (forwarding) | ~$7/user/mo (Workspace) |
| **Total** | **~$1/mo** | **~$21–50/mo** |

---

## Environment Variable Reference

| Variable | Used by | Secret? | Local (`.env.local`) | Production (Vercel) |
|----------|---------|---------|----------------------|---------------------|
| `DATABASE_URL` | `db/index.ts`, `drizzle.config.ts` | 🔒 Yes | Neon **dev** branch | Neon **production** branch |
| `KINDE_CLIENT_ID` | Kinde SDK | No | same | same |
| `KINDE_CLIENT_SECRET` | Kinde SDK | 🔒 Yes | same | same |
| `KINDE_ISSUER_URL` | Kinde SDK | No | `https://barbsbottles.kinde.com` | same (or custom auth domain) |
| `KINDE_SITE_URL` | Kinde SDK | No | `http://localhost:3000` | `https://app.barbsbottles.com` |
| `KINDE_POST_LOGIN_REDIRECT_URL` | Kinde SDK | No | `http://localhost:3000/home` | `https://app.barbsbottles.com/home` |
| `KINDE_POST_LOGOUT_REDIRECT_URL` | Kinde SDK | No | `http://localhost:3000` | `https://app.barbsbottles.com` |
| `SENTRY_DSN` | Sentry | No | same | same |
| `SENTRY_AUTH_TOKEN` | Sentry build plugin (source maps) | 🔒 Yes | `.env.sentry-build-plugin` | Vercel env var |
| `GOOGLE_MAPS_EMBED_KEY` | `lib/maps.ts` | Exposed in iframe, so restrict it | same key | same key (referrer-restricted) |

If a 🔒 secret ever leaks (committed, pasted, screenshotted), **rotate it**: generate a new one in that service's dashboard, update Vercel and `.env.local`, and redeploy.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Build fails on Vercel but `npm run dev` worked | Type or lint error that dev ignores | Run `npm run build` locally and fix what it reports |
| Login redirects to an error page / "invalid redirect" | Callback URL not in Kinde's allowed list, or `KINDE_SITE_URL` wrong | Compare the URL in the browser to Kinde's allowed callbacks exactly (https, no trailing slash) |
| Logged in but bounced back to `/login` in a loop | `KINDE_SITE_URL` doesn't match the domain you're on (e.g. visiting the `.vercel.app` URL) | Use the real domain; redeploy after changing env vars |
| Changed an env var but nothing changed | Vercel env vars apply only to **new** deploys | Deployments → latest → **Redeploy** |
| Pages are slow (1–2s) | Vercel region ≠ Neon region, or Neon compute waking from idle | Match regions; the first request after idle on Neon free tier is slower, which is normal |
| "relation does not exist" errors | Migrations not run on the production branch | Run `db:migrate` against the production `DATABASE_URL` |
| Map shows "This page can't load Google Maps correctly" | Key referrer restriction doesn't include the current domain | Add `https://app.barbsbottles.com/*` to the key's referrers |
| Domain shows "Invalid Configuration" in Vercel | Still propagating, or a stray DNS record conflicts | Wait a few minutes; check Vercel → Domains → `barbsbottles.com` → DNS Records for duplicates |
| Sentry stack traces are minified | `SENTRY_AUTH_TOKEN` missing in Vercel | Add it and redeploy |

---

**Related notes:** [[Home]] · [[Sentry_Setup]] · [[Cloudflare_Dev_Tunnel]] · [[APP_REFERENCE]] · [[In_Progress_Features]]
