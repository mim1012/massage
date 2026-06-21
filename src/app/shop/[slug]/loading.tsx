export default function ShopDetailLoading() {
  return (
    <div className="mx-auto max-w-[1400px] animate-pulse px-3 py-3">
      <div className="mb-3 h-4 w-48 rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <div className="rounded-lg bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-3 h-6 w-40 rounded bg-gray-200" />
            <div className="mb-2 h-10 w-64 rounded bg-gray-200" />
            <div className="h-4 w-48 rounded bg-gray-100" />
          </div>
          <div className="aspect-square rounded-2xl border border-gray-200 bg-white" />
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 h-5 w-28 rounded bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-11/12 rounded bg-gray-100" />
              <div className="h-4 w-10/12 rounded bg-gray-100" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-12 rounded-lg bg-[var(--portal-brand-soft)]" />
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 h-5 w-24 rounded bg-gray-200" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-5/6 rounded bg-gray-100" />
              <div className="h-4 w-4/6 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
