"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

interface PropertyDetailsErrorProps {
  error: unknown;
  retry: () => void;
}

export default function PropertyDetailsError({
  retry,
}: PropertyDetailsErrorProps) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">
          Unable to load this property
        </h1>

        <p className="text-muted-foreground">
          Please try again in a moment.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={() => retry()}>
            Try again
          </Button>

          <Link href="/buyer/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 font-medium text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2">
            Return to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
