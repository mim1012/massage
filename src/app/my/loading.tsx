export default function MyLoading() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-6" aria-busy="true" aria-live="polite">
      <div className="h-7 w-32 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg border border-gray-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
