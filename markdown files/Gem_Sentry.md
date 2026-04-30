# Gem: Sentry Integration for Dashboard

To integrate Sentry into your `app/(dashboard)/home/page.tsx` for performance tracking and manual error reporting, follow these steps.

## 1. Import Sentry
Add the Sentry import at the top of your file:

```tsx
import * as Sentry from "@sentry/nextjs";
```

## 2. Implement Performance Spans and Error Handling
Since this is a Server Component, you can wrap your data-fetching logic in a `startSpan` to monitor database performance and use `captureException` for explicit error reporting.

```tsx
export default async function HomePage() {
  try {
    // 1. Start a performance span for the database queries
    const stats = await Sentry.startSpan(
      { 
        name: "Fetch Dashboard Stats", 
        op: "db.query" 
      },
      async () => {
        const [
          [{ totalOrders }], 
          [{ totalCustomers }], 
          [{ totalProducts }], 
          [{ totalRevenue }]
        ] = await Promise.all([
          db.select({ totalOrders: count() }).from(orders),
          db.select({ totalCustomers: count() }).from(customers),
          db.select({ totalProducts: count() }).from(products),
          db.select({ totalRevenue: sum(orders.totalPrice) }).from(orders),
        ]);
        
        return { totalOrders, totalCustomers, totalProducts, totalRevenue };
      }
    );

    const { totalOrders, totalCustomers, totalProducts, totalRevenue } = stats;

    const formattedRevenue = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(totalRevenue ?? 0));

    // ... your return JSX ...

  } catch (error) {
    // 2. Manually capture the exception in Sentry
    Sentry.captureException(error);
    
    // 3. Re-throw to allow Next.js error boundaries/global-error.tsx to catch it
    throw error;
  }
}
```

## Why add these lines?
- **`Sentry.startSpan`**: This allows you to see how long your database queries take in the Sentry "Performance" dashboard. If the page is slow, this tells you if it's the database or the rendering.
- **`Sentry.captureException`**: While Sentry catches most errors automatically via `instrumentation.ts`, using a try/catch block allows you to add custom context or handle the error gracefully before it hits the global error handler.
