export default function AdLoading() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-6" aria-busy="true" aria-live="polite">
      <div className="h-7 w-40 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg border border-gray-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
