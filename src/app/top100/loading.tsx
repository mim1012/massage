export default function Top100Loading() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6" aria-busy="true" aria-live="polite">
      <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="aspect-square animate-pulse rounded-lg border border-gray-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
