# Bug Fixes

---

## Fix 1 — Two different login screens (generic vs custom)

**Problem:** Visiting `/home` shows Kinde's generic hosted login instead of the custom `/login` page. This is caused by a stale compiled middleware in `.next/server/middleware.js` from an earlier version of the project that had Kinde's `withAuth` middleware. It intercepts requests before the dashboard layout can redirect to `/login`.

**Fix 1a — Clear the stale build**

Stop the dev server, then delete the `.next` folder and restart:

```bash
rm -rf .next
npm run dev
```

**Fix 1b — Fix the root `/` route**

`app/page.tsx` is still the default Next.js template. Replace the entire file contents with:

```tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/login");
}
```

After both fixes, visiting `/` or `/home` unauthenticated will correctly land on the custom login page.

---

Nots: Had issues with the redirect after login in.  that is now fixed.