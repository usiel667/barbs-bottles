# Security Review — barbs-bottles (2026-05-12)

## Summary

Two findings with high confidence. All other common attack vectors (SQL injection, XSS, command injection, auth bypass) were checked and cleared.

---

## Vuln 1 — Plaintext Credentials on Disk

**Files:** `.env.local`, `.env.sentry-build-plugin`
**Severity:** High | **Confidence:** 10/10

`.env.local` contains live, active credentials:
- `DATABASE_URL` — full Neon PostgreSQL connection string with the `neondb_owner` admin password
- `KINDE_CLIENT_ID` / `KINDE_CLIENT_SECRET` — OAuth2 app credentials
- `.env.sentry-build-plugin` — a live Sentry auth token for the `axis-marketing` org

These files are gitignored (not in git history), but anyone who can read the working directory — a cloned CI runner, a shared dev machine, IDE sync — gets full database admin access and can forge OAuth tokens or download source maps.

**Actions required:**
1. **Rotate all three immediately** — Neon DB password, Kinde client secret, Sentry auth token. Treat them as compromised.
2. For local dev, use a restricted DB role (not the owner role) with only the permissions the app needs.
3. Store production secrets in Vercel environment variables, not alongside source code.

---

## Vuln 2 — Missing Authorization on Update Actions (IDOR)

**Files:** `app/(dashboard)/orders/actions.ts:53`, `app/(dashboard)/customers/actions.ts:64`, `app/(dashboard)/products/actions.ts:64`
**Severity:** Medium | **Confidence:** 9/10

All three `update*` server actions check that *a* valid session exists but never verify that the authenticated user has permission to edit *that specific record*. The record `id` comes from the client as a plain integer:

```ts
export async function updateOrder(id: number, ...) {
  const user = await getUser(); // only checks: "is someone logged in?"
  if (!user) throw new Error("Unauthorized");
  await db.update(orders).set(parsed.data).where(eq(orders.id, id)); // no ownership check
}
```

Right now this is a single-tenant internal tool so all authenticated users are staff — low practical risk today. But if a read-only role, customer portal, or any non-admin user is ever added, this becomes a direct IDOR: any authenticated user can overwrite any record by supplying an arbitrary ID.

**Recommendation:** Decide the access model now. If all users are always admins, document it. If any restricted role will ever exist, add a role/permission check (e.g. a Kinde role claim) inside each `update*` action before the `db.update` call.

---

## Cleared

| Category | Result |
|---|---|
| SQL/NoSQL injection | Drizzle ORM with parameterized queries throughout — safe |
| XSS | No `dangerouslySetInnerHTML` anywhere |
| Auth bypass | Middleware + per-action `getUser()` double-checks |
| Command injection | No shell calls |
| JWT vulnerabilities | Fully delegated to Kinde SDK |
| Path traversal | No filesystem operations |
| API data leakage | No custom data-returning API routes |
