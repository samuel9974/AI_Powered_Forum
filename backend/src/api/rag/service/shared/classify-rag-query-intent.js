/**
 * Lightweight query-intent classification for RAG retrieval (Phase B / Step 4).
 * Overview asks need broader coverage; factual asks need precision.
 */

const OVERVIEW_PATTERNS = [
  /\bsummar(y|ise|ize|ising|izing)\b/i,
  /\boverview\b/i,
  /\boverall\b/i,
  /\bmain\s+idea[s]?\b/i,
  /\bmain\s+point[s]?\b/i,
  /\bkey\s+(takeaway|point|theme|topic)s?\b/i,
  /\bwhat\s+is\s+this\s+(document|pdf|file|paper|resume|cv)\b/i,
  /\bwhat\s+(is|does)\s+this\s+(document|pdf|file|paper)\s+(about|cover|contain)\b/i,
  /\bwhat\s+is\s+the\s+(document|pdf)\s+about\b/i,
  /\bexplain\s+(the\s+)?(overall|whole|entire|full)\b/i,
  /\bexplain\s+this\s+(document|pdf|file|paper|content)\b/i,
  /\blearn\s+from\s+(it|this|the\s+document)\b/i,
  /\bteach\s+me\b/i,
  /\bgive\s+me\s+(an?\s+)?(overview|summary|outline)\b/i,
  /\bhigh[-\s]?level\b/i,
  /\bin\s+plain\s+(english|language)\b/i,
  /\bcover\b.{0,30}\b(document|pdf)\b/i,
  /\btopics?\s+covered\b/i,
  /\bwhat\s+are\s+the\s+main\s+topics?\b/i,
];

/**
 * @param {string} query
 * @returns {'overview'|'factual'}
 */
export function classifyRagQueryIntent(query) {
  const text = String(query || "").trim();
  if (!text) {
    return "factual";
  }

  for (const pattern of OVERVIEW_PATTERNS) {
    if (pattern.test(text)) {
      return "overview";
    }
  }

  return "factual";
}
