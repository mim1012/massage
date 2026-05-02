export type SubmissionLock = {
  tryAcquire: () => boolean;
  release: () => void;
};

export function createSubmissionLock(): SubmissionLock {
  let locked = false;

  return {
    tryAcquire() {
      if (locked) {
        return false;
      }

      locked = true;
      return true;
    },
    release() {
      locked = false;
    },
  };
}
