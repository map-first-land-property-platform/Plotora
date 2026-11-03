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

          <Button asChild variant="outline">
            <Link href="/">Return home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}