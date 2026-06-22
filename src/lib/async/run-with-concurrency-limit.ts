export async function runWithConcurrencyLimit<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
): Promise<T[]> {
  const safeConcurrency = Math.max(1, Math.floor(concurrency));
  const results = new Array<T>(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= tasks.length) {
        return;
      }

      results[currentIndex] = await tasks[currentIndex]!();
    }
  }

  await Promise.all(Array.from({ length: Math.min(safeConcurrency, tasks.length) }, () => worker()));
  return results;
}
