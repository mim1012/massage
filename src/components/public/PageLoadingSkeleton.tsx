const LINE_WIDTHS = ['w-11/12', 'w-10/12', 'w-9/12', 'w-11/12', 'w-8/12', 'w-10/12', 'w-9/12', 'w-7/12'];

export default function PageLoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-8" aria-busy="true" aria-live="polite">
      <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
      <div className="mt-6 space-y-3">
        {LINE_WIDTHS.map((width, index) => (
          <div key={index} className={`h-4 animate-pulse rounded bg-gray-100 ${width}`} />
        ))}
      </div>
    </div>
  );
}
