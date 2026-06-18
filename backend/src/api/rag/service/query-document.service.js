import { GoogleGenAI } from "@google/genai";
import { ServiceUnavailableError } from "../../../utils/errors/index.js";
import { searchInDocumentService } from "./search-in-document.service.js";

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
 * Build numbered context blocks for the RAG generation prompt.
 * @param {Array<{ chunkIndex: number, excerpt: string }>} chunks
 * @returns {string}
 */
function buildRagContextBlock(chunks) {
  return chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] (chunkIndex: ${chunk.chunkIndex})\n${chunk.excerpt}`,
    )
    .join("\n\n");
}

/**
 * Map cited reference numbers from the model to citation objects.
 * @param {Array<number>} citedRefs
 * @param {Array<{ chunkIndex: number }>} chunks
 * @returns {Array<{ ref: number, chunkIndex: number }>}
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

    citations.push({
      ref: refNumber,
      chunkIndex: chunks[refNumber - 1].chunkIndex,
    });
  }

  return citations;
}

/**
 * Generate a grounded answer from retrieved document chunks using Gemini.
 *
 * @param {Object} params
 * @param {string} params.userQuery - The user's natural-language question
 * @param {Array<{ chunkId: number, chunkIndex: number, excerpt: string }>} params.chunks - Top-ranked chunks from semantic search
 * @returns {Promise<{ answer: string, citations: Array<{ ref: number, chunkIndex: number }> }>}
 */
async function answerFromRagChunks({ userQuery, chunks }) {
  if (!chunks.length) {
    return {
      answer:
        "I couldn't find relevant information in this document to answer your question.",
      citations: [],
    };
  }

  const contextBlock = buildRagContextBlock(chunks);

  const userPrompt = `You answer questions using ONLY the context excerpts below from a single document.
If the excerpts do not contain enough information, say you cannot answer from the document.

CONTEXT:
${contextBlock}

QUESTION:
${userQuery}

Reply with ONLY valid JSON (no markdown fences), exactly this shape:
{
  "answer": "your answer in plain language",
  "citedRefs": [1]
}

Rules:
- answer: concise, grounded only in the CONTEXT above; do not invent facts.
- citedRefs: array of reference numbers (e.g. 1, 2) for excerpts you used; use [] if none apply.`;

  try {
    const response = await genAI.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: userPrompt,
      config: {
        maxOutputTokens: 1024,
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
      }));
    }

    return { answer, citations };
  } catch (error) {
    console.error("=== GEMINI API ERROR DURING RAG ANSWER GENERATION ===");
    console.error("Operation: queryDocumentService");
    console.error("User query:", userQuery);
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
 * Reuses semantic search for retrieval, then generates an answer from the top chunks.
 *
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} params.documentId
 * @param {string} params.query
 * @returns {Promise<{ answer: string, citations: Array<{ ref: number, chunkIndex: number }>, chunksUsed: number[] }>}
 */
export async function queryDocumentService({ userId, documentId, query }) {
  const searchResult = await searchInDocumentService({
    userId,
    documentId,
    query,
  });

  const { answer, citations } = await answerFromRagChunks({
    userQuery: query,
    chunks: searchResult.results,
  });

  const chunksUsed = searchResult.results.map((result) => result.chunkId);

  return {
    answer,
    citations,
    chunksUsed,
  };
}
