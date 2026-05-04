# Sentry Setup

## What Is Correctly Set Up

- All three runtimes initialized: client (`instrumentation-client.ts`), server (`sentry.server.config.ts`), edge (`sentry.edge.config.ts`)
- `instrumentation.ts` registers the correct config per runtime and exports `onRequestError` to capture server-side request errors
- `instrumentation-client.ts` exports `onRouterTransitionStart` for client-side route transition tracking
- `next.config.ts` is wrapped with `withSentryConfig` — source maps, tunnel route (`/monitoring`), and tree-shaking are all configured
- `app/global-error.tsx` catches and reports unhandled errors that bubble past all layouts

---

## Missing — Add a Route-Level Error Boundary

`global-error.tsx` only catches errors that bubble past every layout. Errors thrown inside the dashboard need their own boundary or the entire app resets. 

**Create `app/(dashboard)/error.tsx`:**

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function DashboardError({
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
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Something went wrong</h2>
      <button onClick={reset} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Try again
      </button>
    </div>
  );
}
```

---

## Before Going to Production

| What | Where | Change To |
|------|-------|-----------|
| `tracesSampleRate: 1` | `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts` | `0.1` — 100% sampling will get expensive in production |
| `sendDefaultPii: true` | All three config files | Review before deploying — this sends user emails and IPs to Sentry. Required for GDPR compliance if you have EU customers |
| Hardcoded DSN | All three config files | Move to an environment variable `NEXT_PUBLIC_SENTRY_DSN` before deploying |
