/**
 * Pure chunk-corpus metrics for RAG baseline diagnostics (Phase A / Step 1).
 * No DB or network I/O — safe to unit test.
 */

/**
 * @param {Array<{ content?: string }>} chunks
 * @returns {{
 *   chunkCount: number,
 *   avgLength: number,
 *   minLength: number,
 *   maxLength: number,
 *   medianLength: number,
 *   pctUnder50Chars: number,
 *   pctUnder100Chars: number,
 *   sampleExcerpts: string[],
 * }}
 */
export function computeChunkCorpusStats(chunks) {
  const lengths = (chunks || [])
    .map((chunk) => String(chunk?.content ?? "").length)
    .filter((length) => Number.isFinite(length));

  if (lengths.length === 0) {
    return {
      chunkCount: 0,
      avgLength: 0,
      minLength: 0,
      maxLength: 0,
      medianLength: 0,
      pctUnder50Chars: 0,
      pctUnder100Chars: 0,
      sampleExcerpts: [],
    };
  }

  const sorted = [...lengths].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, value) => acc + value, 0);
  const mid = Math.floor(sorted.length / 2);
  const medianLength =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  const under50 = sorted.filter((length) => length < 50).length;
  const under100 = sorted.filter((length) => length < 100).length;

  const sampleExcerpts = (chunks || [])
    .slice(0, 5)
    .map((chunk) => {
      const text = String(chunk?.content ?? "").trim();
      return text.length > 120 ? `${text.slice(0, 117)}...` : text;
    });

  return {
    chunkCount: sorted.length,
    avgLength: Number((sum / sorted.length).toFixed(1)),
    minLength: sorted[0],
    maxLength: sorted[sorted.length - 1],
    medianLength: Number(medianLength.toFixed(1)),
    pctUnder50Chars: Number(((under50 / sorted.length) * 100).toFixed(1)),
    pctUnder100Chars: Number(((under100 / sorted.length) * 100).toFixed(1)),
    sampleExcerpts,
  };
}

/**
 * Classify why an overview-style ask failed (or succeeded).
 * @param {{ hitsAboveThreshold: number, answer: string }} params
 * @returns {'empty_retrieval'|'llm_refusal'|'answered'|'unknown'}
 */
export function classifyRagFailureMode({ hitsAboveThreshold, answer }) {
  if (!hitsAboveThreshold || hitsAboveThreshold <= 0) {
    return "empty_retrieval";
  }

  const normalized = String(answer || "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return "unknown";
  }

  const refusalSignals = [
    "couldn't find relevant information",
    "could not find relevant information",
    "cannot answer from the document",
    "can't answer from the document",
    "not enough information",
    "do not contain enough information",
    "doesn't contain enough",
    "does not contain enough",
    "i don't have enough",
    "i do not have enough",
  ];

  if (refusalSignals.some((signal) => normalized.includes(signal))) {
    return "llm_refusal";
  }

  return "answered";
}
