export default function BoardLoading() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6" aria-busy="true" aria-live="polite">
      <div className="h-7 w-40 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 grid gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-lg border border-gray-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
