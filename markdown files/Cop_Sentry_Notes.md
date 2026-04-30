# Sentry implementation notes for `app/(dashboard)/home/page.tsx`

Your app already has Sentry configured, so on `app/(dashboard)/home/page.tsx` the most common approach is to let real server errors throw normally and allow Sentry to capture them through the existing setup.

## Sentry is already wired in this repo

These files show that Sentry is already enabled:

- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation.ts`
- `instrumentation-client.ts`
- `app/global-error.tsx`

That means you usually do **not** need a large amount of extra setup on a page before Sentry can start reporting problems.

## Most common way to use Sentry on this page

For a **server page** like `app/(dashboard)/home/page.tsx`, the standard pattern is:

1. Load data normally.
2. Let real errors throw.
3. Allow Sentry to capture the error automatically.
4. Add manual Sentry code only when you want better debugging context or performance tracing.

### Basic version

```tsx
export default async function HomePage() {
  const [[{ totalOrders }], [{ totalCustomers }], [{ totalProducts }], [{ totalRevenue }]] =
    await Promise.all([
      db.select({ totalOrders: count() }).from(orders),
      db.select({ totalCustomers: count() }).from(customers),
      db.select({ totalProducts: count() }).from(products),
      db.select({ totalRevenue: sum(orders.totalPrice) }).from(orders),
    ]);

  return <div>...</div>;
}
```

If a database query fails, that is often enough. Since the app already has Sentry configured, this is the cleanest and most common pattern.

---

## Different ways to implement Sentry on this page or any page

## 1. Let errors throw naturally

This is the most common approach for a server-rendered page.

### Why use it

- simplest setup
- works with your current Sentry config
- avoids swallowing real failures

### Example

```tsx
export default async function HomePage() {
  const data = await loadDashboardData();
  return <div>...</div>;
}
```

---

## 2. Capture the error manually, then rethrow it

Use this when you want extra tags or context in Sentry for this page.

### Example

```tsx
import * as Sentry from "@sentry/nextjs";

export default async function HomePage() {
  try {
    const [[{ totalOrders }], [{ totalCustomers }], [{ totalProducts }], [{ totalRevenue }]] =
      await Promise.all([
        db.select({ totalOrders: count() }).from(orders),
        db.select({ totalCustomers: count() }).from(customers),
        db.select({ totalProducts: count() }).from(products),
        db.select({ totalRevenue: sum(orders.totalPrice) }).from(orders),
      ]);

    return <div>...</div>;
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("page", "dashboard-home");
      scope.setContext("dashboard_metrics", {
        section: "home",
        queries: ["orders count", "customers count", "products count", "revenue sum"],
      });
      Sentry.captureException(error);
    });

    throw error;
  }
}
```

### Why use it

- adds page-specific context
- makes Sentry issues easier to filter
- still preserves normal error behavior

---

## 3. Add performance tracing with `startSpan`

Use this when the page is slow and you want timing data in Sentry.

### Example

```tsx
import * as Sentry from "@sentry/nextjs";

export default async function HomePage() {
  const [[{ totalOrders }], [{ totalCustomers }], [{ totalProducts }], [{ totalRevenue }]] =
    await Sentry.startSpan(
      {
        name: "Load dashboard home metrics",
        op: "function.dashboard",
      },
      async () =>
        Promise.all([
          db.select({ totalOrders: count() }).from(orders),
          db.select({ totalCustomers: count() }).from(customers),
          db.select({ totalProducts: count() }).from(products),
          db.select({ totalRevenue: sum(orders.totalPrice) }).from(orders),
        ]),
    );

  return <div>...</div>;
}
```

### Why use it

- helps diagnose slow pages
- shows timing around the dashboard queries
- useful for performance monitoring

---

## 4. Add a route-level `error.tsx`

You already have `app/global-error.tsx`, but you can also add an error boundary specifically for the home page route.

### File

```tsx
app/(dashboard)/home/error.tsx
```

### Example

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>Dashboard failed to load.</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### Why use it

- gives a better user experience for this route
- keeps the fallback local to `/home`
- works well with App Router pages

---

## 5. Capture client-side errors in page components

If a page includes a client component with buttons, forms, filters, or client-side fetches, you can capture browser-side errors directly.

### Example

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";

export function RefreshButton() {
  async function handleClick() {
    try {
      // client action
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  return <button onClick={handleClick}>Refresh</button>;
}
```

### Why use it

- useful for client-only failures
- helps with forms, charts, modals, and fetches
- complements server error reporting

---

## 6. Capture non-fatal warnings with `captureMessage`

Use this when something looks wrong but is not an actual crash.

### Example

```tsx
import * as Sentry from "@sentry/nextjs";

Sentry.captureMessage("Dashboard revenue returned null", "warning");
```

### Good use cases

- unexpected empty data
- suspicious states
- non-breaking data problems

---

## 7. Add user, tags, and context

This is useful on any page when you want better filtering and debugging inside Sentry.

### Example

```tsx
Sentry.withScope((scope) => {
  scope.setUser({ id: user.id, email: user.email });
  scope.setTag("page", "dashboard-home");
  scope.setTag("area", "dashboard");
  scope.setContext("metrics", {
    totalOrders,
    totalCustomers,
    totalProducts,
  });

  Sentry.captureException(error);
});
```

### Why use it

- helps identify which page failed
- improves issue grouping and filtering
- adds business context for debugging

---

## Best option for `app/(dashboard)/home/page.tsx`

For this page, the best order is usually:

1. Let query errors throw naturally.
2. If you want more useful Sentry issues, wrap the data load in `try/catch`, call `Sentry.captureException`, then rethrow.
3. If you want better UX, add `app/(dashboard)/home/error.tsx`.
4. If you want performance monitoring, wrap the data loading in `Sentry.startSpan(...)`.

## Recommended example for this page

```tsx
import * as Sentry from "@sentry/nextjs";

export default async function HomePage() {
  try {
    const [[{ totalOrders }], [{ totalCustomers }], [{ totalProducts }], [{ totalRevenue }]] =
      await Sentry.startSpan(
        {
          name: "Load dashboard home metrics",
          op: "function.dashboard",
        },
        async () =>
          Promise.all([
            db.select({ totalOrders: count() }).from(orders),
            db.select({ totalCustomers: count() }).from(customers),
            db.select({ totalProducts: count() }).from(products),
            db.select({ totalRevenue: sum(orders.totalPrice) }).from(orders),
          ]),
      );

    return <div>...</div>;
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag("page", "dashboard-home");
      scope.setContext("dashboard_metrics", {
        section: "home",
      });
      Sentry.captureException(error);
    });

    throw error;
  }
}
```

This version gives you:

- automatic reporting
- page-specific context
- performance tracing
- correct error behavior
