export default function OwnerLoading() {
  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-6" aria-busy="true" aria-live="polite">
      <div className="h-7 w-44 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-lg border border-gray-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
