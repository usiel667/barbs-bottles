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
    <div className="flex flex-col items-center justify-center min-h-100 gap-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Somithing went Wrong!</h2>
      <button onClick={reset} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Try again
      </button>
    </div>
  );
}
