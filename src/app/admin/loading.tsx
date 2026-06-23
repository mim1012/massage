export default function AdminLoading() {
  return (
    <div className="space-y-4 max-w-[1000px]" aria-busy="true" aria-live="polite">
      <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[72px] animate-pulse rounded border border-gray-200 bg-white" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="h-48 animate-pulse rounded border border-gray-200 bg-white" />
        <div className="h-48 animate-pulse rounded border border-gray-200 bg-white" />
      </div>
    </div>
  );
}
