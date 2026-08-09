/**
 * Run an async mapper over items with a fixed worker pool size.
 * Results stay aligned with input order.
 *
 * @template T, R
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T, index: number) => Promise<R>} mapper
 * @returns {Promise<R[]>}
 */
export async function mapWithConcurrency(items, concurrency, mapper) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) {
    return [];
  }

  const workerCount = Math.max(
    1,
    Math.min(Number(concurrency) || 1, list.length),
  );
  const results = new Array(list.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;

      if (index >= list.length) {
        return;
      }

      results[index] = await mapper(list[index], index);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
