import { Skeleton } from "@/components/ui/skeleton";

/**
 * Keep reduced-motion support consistent across this page's placeholders.
 */
function LoadingSkeleton({ className }: { className: string }) {
  return (
    <Skeleton
      className={`${className} motion-reduce:animate-none`}
    />
  );
}

export default function PropertyDetailsLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div
        role="status"
        className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6"
      >
        <span className="sr-only">Loading property details...</span>

        {/* Announce loading once; hide decorative placeholders from readers. */}
        <div aria-hidden="true" className="space-y-6">
          <LoadingSkeleton className="h-5 w-40" />

          {/* Reserve space for the gallery before property data arrives. */}
          <div className="space-y-3">
            <LoadingSkeleton className="aspect-video w-full rounded-2xl sm:aspect-[16/7]" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <LoadingSkeleton className="h-5 w-24" />

              <div className="flex gap-2">
                <LoadingSkeleton className="h-11 w-24" />
                <LoadingSkeleton className="h-11 w-24" />
              </div>
            </div>

            <div className="flex gap-3 overflow-hidden p-1">
              {[0, 1, 2].map((slot) => (
                <LoadingSkeleton
                  key={slot}
                  className="h-20 w-28 shrink-0 rounded-lg"
                />
              ))}
            </div>
          </div>

          <LoadingSkeleton className="h-9 w-3/4" />
          <LoadingSkeleton className="h-5 w-1/2" />

          <div className="grid gap-6 lg:grid-cols-3">
            <LoadingSkeleton className="h-64 rounded-xl lg:col-span-2" />
            <LoadingSkeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}