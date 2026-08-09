import fs from "fs/promises";
import { PDFParse } from "pdf-parse";
import { BadRequestError } from "../../../../utils/errors/index.js";
import { generateQuestionEmbedding } from "../../../question/service/vector.service.js";
import { chunkDocumentPages } from "./chunk-document-text.js";
import { mapWithConcurrency } from "./map-with-concurrency.js";
import {
  insertDocumentChunk,
  insertDocumentChunkVector,
} from "./document.repository.js";

const DEFAULT_EMBEDDING_CONCURRENCY = 3;

/**
 * @returns {number}
 */
export function getRagEmbeddingConcurrency() {
  const parsed = Number(process.env.RAG_EMBEDDING_CONCURRENCY);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_EMBEDDING_CONCURRENCY;
  }
  return Math.min(8, Math.trunc(parsed));
}

/**
 * Reads a PDF from disk and returns per-page plain text content.
 * @param {string} absolutePath
 * @returns {Promise<Array<{pageNumber: number, text: string}>>}
 */
export async function extractPagesFromPdf(absolutePath) {
  const buffer = await fs.readFile(absolutePath);
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const pages = (result.pages || [])
      .map((page) => ({
        pageNumber: page.num,
        text: (page.text || "").replace(/\r\n/g, "\n"),
      }))
      .filter((page) => page.text.trim());

    if (pages.length === 0) {
      throw new BadRequestError("No extractable text found in PDF.");
    }

    return pages;
  } finally {
    await parser.destroy();
  }
}

/**
 * Embed chunks with modest concurrency, then persist in chunkIndex order.
 * @param {number} documentId
 * @param {Array<{chunkIndex: number, content: string, pageStart: number, pageEnd: number}>} chunks
 * @returns {Promise<void>}
 */
export async function storeDocumentChunksWithEmbeddings(documentId, chunks) {
  const concurrency = getRagEmbeddingConcurrency();

  const embeddings = await mapWithConcurrency(
    chunks,
    concurrency,
    async (chunk) => {
      const { embedding } = await generateQuestionEmbedding(chunk.content, {
        taskType: "RETRIEVAL_DOCUMENT",
      });
      return embedding;
    },
  );

  await mapWithConcurrency(chunks, concurrency, async (chunk, index) => {
    const chunkId = await insertDocumentChunk({
      documentId,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      pageStart: chunk.pageStart,
      pageEnd: chunk.pageEnd,
    });

    await insertDocumentChunkVector({
      chunkId,
      sourceText: chunk.content,
      embedding: embeddings[index],
    });
  });
}

/**
 * Normalize provider errors into short messages safe to store on documents.status.
 * @param {unknown} error
 * @returns {Error}
 */
export function normalizeIngestError(error) {
  const raw = String(error?.message || error || "Unknown ingest error");

  if (/API[_ ]?key not valid/i.test(raw) || /API_KEY_INVALID/i.test(raw)) {
    return new Error(
      "Embedding provider rejected the API key. Check GEMINI_API_KEY in backend/.env.",
    );
  }

  if (/429|RESOURCE_EXHAUSTED|rate limit/i.test(raw)) {
    return new Error(
      "Embedding provider rate limit reached. Wait a moment and reprocess.",
    );
  }

  // Avoid persisting huge JSON provider payloads on the document row.
  if (raw.length > 280 || raw.trim().startsWith("{")) {
    return new Error(
      "Document ingest failed while generating embeddings. Please try reprocessing.",
    );
  }

  return error instanceof Error ? error : new Error(raw);
}

/**
 * Parses a PDF, chunks its text, and stores embeddings for RAG retrieval.
 * @param {number} documentId
 * @param {string} filePath - absolute path to the PDF on disk
 * @returns {Promise<{ chunkCount: number }>}
 */
export async function processDocumentContent(documentId, filePath) {
  try {
    const pages = await extractPagesFromPdf(filePath);
    const chunks = chunkDocumentPages(pages);

    if (chunks.length === 0) {
      throw new BadRequestError("No chunkable text found in PDF.");
    }

    await storeDocumentChunksWithEmbeddings(documentId, chunks);
    return { chunkCount: chunks.length };
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    throw normalizeIngestError(error);
  }
}
