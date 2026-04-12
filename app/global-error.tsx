"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";
import { TrafficCone } from "lucide-react"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-grey-50">
          <div className="max-w-md w-full p-8 bg-white rounded-lg shadow border">
            <TrafficCone className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl text-center font-bold text-gray-900 mb-4">
              Something went wrong!
            </h1>
            <p className="text-center text-gray-600 mb-6">
              We have been notified about this error and will fix it soon.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
