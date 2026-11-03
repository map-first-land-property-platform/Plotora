import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function PropertyNotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">
          Property unavailable
        </h1>

        <p className="text-muted-foreground">
          This property could not be found or is no longer publicly available.
        </p>

        <Button asChild>
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </main>
  );
}