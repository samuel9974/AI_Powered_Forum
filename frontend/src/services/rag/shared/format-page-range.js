/**
 * Format a page span for RAG UI labels.
 * @param {{ pageStart?: number|null, pageEnd?: number|null }} source
 * @returns {string|null}
 */
export function formatPageRange(source) {
  const start = Number(source?.pageStart);
  const end = Number(source?.pageEnd);

  if (!Number.isInteger(start) || start < 1) {
    return null;
  }

  if (Number.isInteger(end) && end > start) {
    return `pp. ${start}–${end}`;
  }

  return `p. ${start}`;
}

/**
 * Unique sorted page numbers referenced by citations/results.
 * @param {Array<{ pageStart?: number|null, pageEnd?: number|null }>} items
 * @returns {number[]}
 */
export function collectReferencedPages(items) {
  const pages = new Set();

  for (const item of items || []) {
    const start = Number(item?.pageStart);
    const end = Number(item?.pageEnd);

    if (!Number.isInteger(start) || start < 1) {
      continue;
    }

    const last = Number.isInteger(end) && end >= start ? end : start;
    for (let page = start; page <= last; page += 1) {
      pages.add(page);
    }
  }

  return [...pages].sort((a, b) => a - b);
}

/**
 * Human-readable page list, e.g. "pages 1, 2, 4".
 * @param {number[]} pages
 * @returns {string|null}
 */
export function formatPageList(pages) {
  if (!Array.isArray(pages) || pages.length === 0) {
    return null;
  }

  if (pages.length === 1) {
    return `page ${pages[0]}`;
  }

  return `pages ${pages.join(', ')}`;
}
