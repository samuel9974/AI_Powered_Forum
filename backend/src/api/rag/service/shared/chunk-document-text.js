/**
 * Page-aware PDF text chunking for RAG ingest (Phase A / Step 2).
 *
 * Strategy:
 * 1. Prefer blank-line paragraphs; otherwise soft-join wrapped PDF lines per page.
 * 2. Concatenate segments into one text stream with per-character page map.
 * 3. Slice overlapping windows (~targetChunkSize, ~chunkOverlap).
 * 4. Prefer breaks near sentence/word boundaries.
 * 5. Drop emitted chunks below minChunkLength, unless that would drop all content.
 */

export const RAG_CHUNK_DEFAULTS = Object.freeze({
  targetChunkSize: 700,
  chunkOverlap: 100,
  minChunkLength: 40,
});

/**
 * @param {object} [options]
 * @returns {{ targetChunkSize: number, chunkOverlap: number, minChunkLength: number }}
 */
export function resolveChunkOptions(options = {}) {
  const targetChunkSize =
    Number(options.targetChunkSize) || RAG_CHUNK_DEFAULTS.targetChunkSize;
  const chunkOverlap =
    Number(options.chunkOverlap) || RAG_CHUNK_DEFAULTS.chunkOverlap;
  const minChunkLength =
    Number(options.minChunkLength) || RAG_CHUNK_DEFAULTS.minChunkLength;

  const safeTarget = Math.max(100, targetChunkSize);
  const safeOverlap = Math.max(
    0,
    Math.min(chunkOverlap, Math.floor(safeTarget / 2)),
  );
  const safeMin = Math.max(1, Math.min(minChunkLength, safeTarget));

  return {
    targetChunkSize: safeTarget,
    chunkOverlap: safeOverlap,
    minChunkLength: safeMin,
  };
}

/**
 * Normalize raw page text and build paragraph/segment units for one page.
 * @param {string} pageText
 * @param {number} pageNumber
 * @returns {Array<{ text: string, pageStart: number, pageEnd: number }>}
 */
export function buildPageSegments(pageText, pageNumber) {
  const normalized = String(pageText || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalized) {
    return [];
  }

  const hasBlankLineBreaks = /\n\s*\n/.test(normalized);
  const rawBlocks = hasBlankLineBreaks
    ? normalized.split(/\n\s*\n/)
    : [
        normalized
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .join(" "),
      ];

  const segments = [];

  for (const block of rawBlocks) {
    const text = block
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length > 0) {
      segments.push({
        text,
        pageStart: pageNumber,
        pageEnd: pageNumber,
      });
    }
  }

  return segments;
}

/**
 * Build a flat text stream and a parallel page-number map (one entry per character).
 * @param {Array<{ text: string, pageStart: number, pageEnd: number }>} segments
 * @returns {{ fullText: string, pageAt: number[] }}
 */
export function buildTextStreamWithPageMap(segments) {
  let fullText = "";
  const pageAt = [];

  for (const segment of segments) {
    const piece = segment.text;
    if (!piece) {
      continue;
    }

    if (fullText.length > 0) {
      fullText += " ";
      pageAt.push(segment.pageStart);
    }

    for (let i = 0; i < piece.length; i += 1) {
      fullText += piece[i];
      // Characters inside a segment belong to that segment's page span.
      // Use pageStart for early chars and pageEnd for later chars when span > 1.
      if (segment.pageStart === segment.pageEnd || i < piece.length / 2) {
        pageAt.push(segment.pageStart);
      } else {
        pageAt.push(segment.pageEnd);
      }
    }
  }

  return { fullText, pageAt };
}

/**
 * Choose a soft end index inside [start, hardEnd) preferring punctuation/whitespace.
 * @param {string} fullText
 * @param {number} start
 * @param {number} hardEnd
 * @param {number} targetChunkSize
 * @returns {number}
 */
function chooseSoftEnd(fullText, start, hardEnd, targetChunkSize) {
  if (hardEnd >= fullText.length) {
    return fullText.length;
  }

  const window = fullText.slice(start, hardEnd);
  const minBreak = Math.floor(targetChunkSize * 0.5);

  // Prefer the latest break in priority order: sentence end, then clause,
  // then any word boundary. A later tier is only used when no break from an
  // earlier tier clears minBreak, so sentence ends are not drowned out by a
  // trailing word-boundary space (every ". " match also contains a plain
  // " ", which would otherwise always win via Math.max).
  const breakTiers = [
    Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("? "),
      window.lastIndexOf("! "),
    ),
    Math.max(window.lastIndexOf("; "), window.lastIndexOf(", ")),
    window.lastIndexOf(" "),
  ];

  for (const breakAt of breakTiers) {
    if (breakAt >= minBreak) {
      return start + breakAt + 1;
    }
  }

  return hardEnd;
}

/**
 * Snap an approximate overlap start so the next window does not begin mid-word.
 * @param {string} fullText
 * @param {number} approxStart
 * @param {number} minStart - do not retreat before this index (previous end progress)
 * @returns {number}
 */
function snapStartToWordBoundary(fullText, approxStart, minStart) {
  if (approxStart <= 0) {
    return 0;
  }

  if (approxStart >= fullText.length) {
    return fullText.length;
  }

  if (fullText[approxStart - 1] === " ") {
    return approxStart;
  }

  const prevSpace = fullText.lastIndexOf(" ", approxStart);
  if (prevSpace >= minStart) {
    return prevSpace + 1;
  }

  const nextSpace = fullText.indexOf(" ", approxStart);
  if (nextSpace !== -1 && nextSpace - approxStart < 48) {
    return nextSpace + 1;
  }

  return approxStart;
}

/**
 * Slice an already-built text stream into overlapping chunks with page metadata.
 * @param {string} fullText
 * @param {number[]} pageAt
 * @param {{ targetChunkSize: number, chunkOverlap: number, minChunkLength: number }} options
 * @returns {Array<{ chunkIndex: number, content: string, pageStart: number, pageEnd: number }>}
 */
export function sliceOverlappingChunks(fullText, pageAt, options) {
  const { targetChunkSize, chunkOverlap, minChunkLength } = options;

  if (!fullText || fullText.length === 0) {
    return [];
  }

  const rawChunks = [];
  let start = 0;

  while (start < fullText.length) {
    const hardEnd = Math.min(start + targetChunkSize, fullText.length);
    const end = chooseSoftEnd(fullText, start, hardEnd, targetChunkSize);
    const rawSlice = fullText.slice(start, end);
    const leadingTrim = rawSlice.length - rawSlice.trimStart().length;
    const content = rawSlice.trim();

    if (content.length > 0) {
      const contentStart = start + leadingTrim;
      const contentEnd = contentStart + content.length - 1;
      const pageStart = pageAt[Math.max(0, contentStart)] ?? pageAt[start];
      const pageEnd =
        pageAt[Math.min(pageAt.length - 1, contentEnd)] ?? pageStart;

      rawChunks.push({
        text: content,
        pageStart,
        pageEnd,
      });
    }

    if (end >= fullText.length) {
      break;
    }

    const overlapStart = end - chunkOverlap;
    const snapped = snapStartToWordBoundary(
      fullText,
      Math.max(0, overlapStart),
      start + 1,
    );
    start = snapped <= start ? end : snapped;
  }

  const filtered =
    rawChunks.length <= 1
      ? rawChunks
      : rawChunks.filter((item) => item.text.length >= minChunkLength);

  const deduped = [];
  for (const item of filtered) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.text === item.text) {
      continue;
    }
    deduped.push(item);
  }

  return deduped.map((item, index) => ({
    chunkIndex: index,
    content: item.text,
    pageStart: item.pageStart,
    pageEnd: item.pageEnd,
  }));
}

/**
 * Split one oversized segment into overlapping character windows.
 * Kept for direct unit tests / reuse; production path uses sliceOverlappingChunks.
 * @param {{ text: string, pageStart: number, pageEnd: number }} segment
 * @param {{ targetChunkSize: number, chunkOverlap: number, minChunkLength?: number }} options
 * @returns {Array<{ text: string, pageStart: number, pageEnd: number }>}
 */
export function splitOversizedSegment(segment, options) {
  const resolved = resolveChunkOptions(options);
  const pageAt = Array.from(
    { length: segment.text.length },
    (_, index) =>
      index < segment.text.length / 2 ? segment.pageStart : segment.pageEnd,
  );

  return sliceOverlappingChunks(segment.text, pageAt, resolved).map((chunk) => ({
    text: chunk.content,
    pageStart: chunk.pageStart,
    pageEnd: chunk.pageEnd,
  }));
}

/**
 * Pack ordered segments into overlapping chunks of roughly targetChunkSize.
 * @param {Array<{ text: string, pageStart: number, pageEnd: number }>} segments
 * @param {{ targetChunkSize: number, chunkOverlap: number, minChunkLength: number }} options
 * @returns {Array<{ chunkIndex: number, content: string, pageStart: number, pageEnd: number }>}
 */
export function packSegmentsIntoChunks(segments, options) {
  const { fullText, pageAt } = buildTextStreamWithPageMap(segments);
  return sliceOverlappingChunks(fullText, pageAt, options);
}

/**
 * Chunk PDF page texts into embedding-ready RAG units.
 * @param {Array<{ pageNumber: number, text: string }>} pages
 * @param {object} [options]
 * @returns {Array<{ chunkIndex: number, content: string, pageStart: number, pageEnd: number }>}
 */
export function chunkDocumentPages(pages, options = {}) {
  const resolved = resolveChunkOptions(options);
  const segments = [];

  for (const page of pages || []) {
    const pageNumber = Number(page.pageNumber);
    if (!Number.isFinite(pageNumber)) {
      continue;
    }

    segments.push(...buildPageSegments(page.text, pageNumber));
  }

  return packSegmentsIntoChunks(segments, resolved);
}
