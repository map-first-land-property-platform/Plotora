import { Skeleton } from "@/components/ui/skeleton";

export default function PropertyDetailsLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div
        role="status"
        className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6"
      >
        <span className="sr-only">Loading property details...</span>

        <div aria-hidden="true" className="space-y-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="aspect-video w-full rounded-2xl sm:aspect-[16/7]" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-5 w-1/2" />

          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-xl lg:col-span-2" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}