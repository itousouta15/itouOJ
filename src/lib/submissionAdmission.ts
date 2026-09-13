// The application is intentionally deployed as one Node process. Serialize
// count-and-create admission so parallel HTTP requests cannot overbook the
// in-memory judging queue between their checks and inserts.
const globalForAdmission = globalThis as unknown as {
  __ojSubmissionAdmission?: Promise<void>;
};

let tail = globalForAdmission.__ojSubmissionAdmission ?? Promise.resolve();

export async function acquireSubmissionAdmission(): Promise<() => void> {
  let release!: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previous = tail;
  tail = previous.then(() => next);
  globalForAdmission.__ojSubmissionAdmission = tail;
  await previous;
  return release;
}
