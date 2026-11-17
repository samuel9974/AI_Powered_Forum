import {
  cosineSimilarity,
  embedText,
} from "./embedding.service.js";
import {
  fetchAllChunksWithEmbeddings,
  parseEmbedding,
} from "./chatbot.repository.js";

const CHATBOT_SEARCH_K = 5;
const VECTOR_WEIGHT = 0.75;
const LEXICAL_WEIGHT = 0.25;

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "how",
  "what",
  "when",
  "where",
  "who",
  "why",
  "does",
  "did",
  "can",
  "are",
  "was",
  "were",
  "you",
  "your",
  "that",
  "this",
  "from",
  "have",
  "has",
  "about",
  "into",
]);

/**
 * Words that can distinguish one fact from another.
 * Every stored line contains "Evangadi", so that token does not separate them.
 * @param {string} text
 * @returns {string[]}
 */
function significantTokens(text) {
  return [
    ...new Set(
      String(text)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
    ),
  ];
}

/**
 * Share of query tokens that appear in a chunk. Cosine scores on these short
 * lines sit in a narrow band, so a shared word such as "located" or "support"
 * has to break the tie.
 * @param {string[]} tokens
 * @param {string} content
 * @returns {number}
 */
function lexicalOverlap(tokens, content) {
  if (tokens.length === 0) return 0;
  const haystack = content.toLowerCase();
  const hits = tokens.filter((token) => haystack.includes(token)).length;
  return hits / tokens.length;
}

/**
 * Retrieves the top-k knowledge base chunks most similar to the query.
 * @param {string} query
 * @param {number} [k=CHATBOT_SEARCH_K]
 * @returns {Promise<Array<{chunkId: number, chunkIndex: number, content: string, score: number}>>}
 */
export async function searchKnowledgeBase(query, k = CHATBOT_SEARCH_K) {
  const queryEmbedding = await embedText(query, "RETRIEVAL_QUERY");
  const tokens = significantTokens(query);
  const stored = await fetchAllChunksWithEmbeddings();

  const ranked = stored
    .map((row) => {
      const vectorScore = cosineSimilarity(
        queryEmbedding,
        parseEmbedding(row.embedding),
      );
      const lexicalScore = lexicalOverlap(tokens, row.content);
      return {
        chunkId: row.chunk_id,
        chunkIndex: row.chunk_index,
        content: row.content,
        score: VECTOR_WEIGHT * vectorScore + LEXICAL_WEIGHT * lexicalScore,
      };
    })
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, k);
}
