export function resetMockStore() {
  const globalForStore = globalThis as typeof globalThis & {
    __massageStore?: unknown;
  };

  delete globalForStore.__massageStore;
}

export async function sleep(milliseconds: number) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}
