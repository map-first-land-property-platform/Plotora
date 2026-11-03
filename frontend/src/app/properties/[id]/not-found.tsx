import Link from "next/link";

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

        <Link href="/buyer/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-teal-700 px-4 font-medium text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2">
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
