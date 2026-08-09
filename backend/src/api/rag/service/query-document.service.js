import { GoogleGenAI } from "@google/genai";
import { ServiceUnavailableError } from "../../../utils/errors/index.js";
import { searchInDocumentService } from "./search-in-document.service.js";
import {
  buildRagAnswerPrompt,
  getRagAnswerMaxOutputTokens,
} from "./shared/build-rag-answer-prompt.js";
import { classifyRagQueryIntent } from "./shared/classify-rag-query-intent.js";
import { classifyRagFailureMode } from "./shared/rag-chunk-stats.js";
import { logRagDiagnostic } from "./shared/rag-diagnostics.js";
import {
  getRagRetrievalConfig,
  normalizeRagTopK,
} from "./shared/rag-retrieval-config.js";

const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash-lite";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Strip optional markdown fence and parse a JSON object from Gemini text output.
 * @param {string} raw
 * @returns {object|null}
 */
function parseJsonObjectFromGeminiText(raw) {
  if (!raw || typeof raw !== "string") return null;

  let text = raw.trim();

  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }

  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * Format page range for context / citation labels.
 * @param {{ pageStart?: number|null, pageEnd?: number|null }} chunk
 * @returns {string|null}
 */
function formatPageLabel(chunk) {
  const start = Number(chunk?.pageStart);
  const end = Number(chunk?.pageEnd);

  if (!Number.isInteger(start) || start < 1) {
    return null;
  }

  if (Number.isInteger(end) && end > start) {
    return `pages ${start}-${end}`;
  }

  return `page ${start}`;
}

/**
 * Build numbered context blocks for the RAG generation prompt.
 * @param {Array<{ chunkIndex: number, excerpt: string, pageStart?: number|null, pageEnd?: number|null }>} chunks
 * @returns {string}
 */
function buildRagContextBlock(chunks) {
  return chunks
    .map((chunk, index) => {
      const pageLabel = formatPageLabel(chunk);
      const meta = pageLabel
        ? `(chunkIndex: ${chunk.chunkIndex}, ${pageLabel})`
        : `(chunkIndex: ${chunk.chunkIndex})`;
      return `[${index + 1}] ${meta}\n${chunk.excerpt}`;
    })
    .join("\n\n");
}

/**
 * Map cited reference numbers from the model to citation objects.
 * @param {Array<number>} citedRefs
 * @param {Array<{ chunkIndex: number, pageStart?: number|null, pageEnd?: number|null }>} chunks
 * @returns {Array<{ ref: number, chunkIndex: number, pageStart: number|null, pageEnd: number|null }>}
 */
function mapCitedRefsToCitations(citedRefs, chunks) {
  if (!Array.isArray(citedRefs)) {
    return [];
  }

  const citations = [];

  for (const ref of citedRefs) {
    const refNumber = Number(ref);

    if (!Number.isInteger(refNumber) || refNumber < 1 || refNumber > chunks.length) {
      continue;
    }

    const chunk = chunks[refNumber - 1];
    citations.push({
      ref: refNumber,
      chunkIndex: chunk.chunkIndex,
      pageStart: chunk.pageStart ?? null,
      pageEnd: chunk.pageEnd ?? null,
    });
  }

  return citations;
}

/**
 * Generate a grounded answer from retrieved document chunks using Gemini.
 *
 * @param {Object} params
 * @param {string} params.userQuery - The user's natural-language question
 * @param {Array<{ chunkId: number, chunkIndex: number, excerpt: string, pageStart?: number|null, pageEnd?: number|null }>} params.chunks - Top-ranked chunks from semantic search
 * @param {'overview'|'factual'} [params.intent='factual']
 * @returns {Promise<{ answer: string, citations: Array<{ ref: number, chunkIndex: number, pageStart: number|null, pageEnd: number|null }> }>}
 */
async function answerFromRagChunks({ userQuery, chunks, intent = "factual" }) {
  if (!chunks.length) {
    return {
      answer:
        "I couldn't find relevant information in this document to answer your question.",
      citations: [],
    };
  }

  const contextBlock = buildRagContextBlock(chunks);
  const userPrompt = buildRagAnswerPrompt({
    userQuery,
    contextBlock,
    intent,
  });
  const maxOutputTokens = getRagAnswerMaxOutputTokens(intent);

  try {
    const response = await genAI.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: userPrompt,
      config: {
        maxOutputTokens,
      },
    });

    const raw = typeof response?.text === "string" ? response.text : "";
    const parsed = parseJsonObjectFromGeminiText(raw);

    const answer =
      typeof parsed?.answer === "string" && parsed.answer.trim()
        ? parsed.answer.trim()
        : raw.trim() ||
          "I couldn't generate an answer from the document excerpts.";

    let citations = mapCitedRefsToCitations(parsed?.citedRefs, chunks);

    if (citations.length === 0 && chunks.length > 0) {
      citations = chunks.map((chunk, index) => ({
        ref: index + 1,
        chunkIndex: chunk.chunkIndex,
        pageStart: chunk.pageStart ?? null,
        pageEnd: chunk.pageEnd ?? null,
      }));
    }

    return { answer, citations };
  } catch (error) {
    console.error("=== GEMINI API ERROR DURING RAG ANSWER GENERATION ===");
    console.error("Operation: queryDocumentService");
    console.error("User query:", userQuery);
    console.error("Intent:", intent);
    console.error("Chunk count:", chunks.length);
    console.error("Error:", error);
    console.error("=====================================================");
    throw new ServiceUnavailableError(
      "Failed to generate an answer from the document. Please try again later.",
    );
  }
}

/**
 * Answer a user question grounded in a single RAG document.
 * Classifies overview vs factual intent, retrieves accordingly, then generates an answer.
 *
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} params.documentId
 * @param {string} params.query
 * @param {number} [params.k] - optional top-k override
 * @returns {Promise<{ answer: string, citations: Array<{ ref: number, chunkIndex: number, pageStart: number|null, pageEnd: number|null }>, chunksUsed: number[], intent: string }>}
 */
export async function queryDocumentService({ userId, documentId, query, k }) {
  const config = getRagRetrievalConfig();
  const intent = classifyRagQueryIntent(query);
  const retrievalMode = intent === "overview" ? "overview" : "similarity";
  const defaultK =
    intent === "overview" ? config.overviewTopK : config.topK;
  const normalizedK = normalizeRagTopK(k, defaultK);

  const searchResult = await searchInDocumentService({
    userId,
    documentId,
    query,
    k: normalizedK,
    retrievalMode,
  });

  const { answer, citations } = await answerFromRagChunks({
    userQuery: query,
    chunks: searchResult.results,
    intent,
  });

  const chunksUsed = searchResult.results.map((result) => result.chunkId);

  logRagDiagnostic("query", {
    documentId,
    query,
    intent,
    retrievalMode,
    k: normalizedK,
    maxOutputTokens: getRagAnswerMaxOutputTokens(intent),
    hitsReturned: searchResult.results.length,
    failureMode: classifyRagFailureMode({
      hitsAboveThreshold: searchResult.results.length,
      answer,
    }),
    answerPreview:
      answer.length > 160 ? `${answer.slice(0, 157)}...` : answer,
  });

  return {
    answer,
    citations,
    chunksUsed,
    intent,
  };
}
