import fs from "fs/promises";
import { PDFParse } from "pdf-parse";
import { BadRequestError } from "../../../utils/errors/index.js";
import { generateQuestionEmbedding } from "../../question/service/vector.service.js";
import {
  deleteDocumentChunksByDocumentId,
  fetchDocumentById,
  insertDocumentChunk,
  insertDocumentChunkVector,
  insertDocumentRecord,
  mapDocumentToResponse,
  updateDocumentStatus,
} from "./shared/document.repository.js";

/**
 * Reads a PDF from disk and returns per-page plain text content.
 * Assumes that absolutePath is not NULL or undefined.
 * @param absolutePath - full filesystem path to the PDF file
 * @returns {Promise<Array<{pageNumber: number, text: string}>>} - non-empty pages with text; throws BadRequestError with message "No extractable text found in PDF." when parsing yields no text
 */
async function extractPagesFromPdf(absolutePath) {
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
 * Split plain text pages into one chunk per non-empty line.
 * Assumes that pages is not NULL or undefined.
 * @param pages - array of page objects with pageNumber and text
 * @returns {Array<{chunkIndex: number, content: string, pageStart: number, pageEnd: number}>} - ordered text chunks ready for embedding
 */
function chunkText(pages) {
  const chunks = [];

  for (const page of pages) {
    const lines = page.text.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.length > 0) {
        chunks.push({
          chunkIndex: chunks.length,
          content: trimmedLine,
          pageStart: page.pageNumber,
          pageEnd: page.pageNumber,
        });
      }
    }
  }

  return chunks;
}

/**
 * Persists each text chunk and its Gemini embedding for a document.
 * Assumes that documentId and chunks are not NULL or undefined.
 * @param documentId - numeric ID of the parent document
 * @param chunks - array of chunk objects with content and page metadata
 * @returns {Promise<void>}
 */
async function storeDocumentChunksWithEmbeddings(documentId, chunks) {
  for (const chunk of chunks) {
    const { embedding } = await generateQuestionEmbedding(chunk.content, {
      taskType: "RETRIEVAL_DOCUMENT",
    });

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
      embedding,
    });
  }
}

/**
 * Parses a PDF, chunks its text, and stores embeddings for RAG retrieval.
 * Assumes that documentId and filePath are not NULL or undefined.
 * @param documentId - numeric ID of the document being processed
 * @param filePath - absolute path to the uploaded PDF on disk
 * @returns {Promise<void>} - throws BadRequestError with message "No chunkable text found in PDF." when chunking produces no content
 */
async function processDocumentContent(documentId, filePath) {
  const pages = await extractPagesFromPdf(filePath);
  const chunks = chunkText(pages);

  if (chunks.length === 0) {
    throw new BadRequestError("No chunkable text found in PDF.");
  }

  await storeDocumentChunksWithEmbeddings(documentId, chunks);
}

/**
 * Marks a document as failed, removes partial chunks, and records the error message.
 * Assumes that documentId and error are not NULL or undefined.
 * @param documentId - numeric ID of the document to mark failed
 * @param error - error whose message is stored on the document row
 * @returns {Promise<void>}
 */
async function markDocumentFailed(documentId, error) {
  try {
    await deleteDocumentChunksByDocumentId(documentId);
  } catch (cleanupError) {
    console.error(
      `Failed to remove partial chunks for document ${documentId}:`,
      cleanupError,
    );
  }

  await updateDocumentStatus({
    documentId,
    status: "failed",
    errorMessage: error.message,
  });
}

/**
 * Uploads, parses, chunks, embeds, and persists a PDF document for RAG.
 * Assumes that userId, file, and storagePath are not NULL or undefined.
 * @param userId - ID of the authenticated user uploading the document
 * @param file - multer file object with originalname, mimetype, size, and path
 * @param storagePath - relative path where the file was persisted on disk
 * @returns {Promise<Object>} - document response object; throws BadRequestError with "PDF file is required." or "Uploaded file storage path is missing." when inputs are invalid, or Error with "Failed to load document after processing." when the ready row cannot be fetched
 */
export async function createDocumentFromUploadService({
  userId,
  file,
  storagePath,
}) {
  if (!file) {
    throw new BadRequestError("PDF file is required.");
  }

  if (!storagePath) {
    throw new BadRequestError("Uploaded file storage path is missing.");
  }

  const insertResult = await insertDocumentRecord({
    userId,
    title: file.originalname,
    mimeType: file.mimetype || "application/pdf",
    storagePath,
    byteSize: file.size,
  });

  const documentId = insertResult.insertId;

  try {
    await processDocumentContent(documentId, file.path);
    await updateDocumentStatus({
      documentId,
      status: "ready",
      errorMessage: null,
    });
  } catch (error) {
    await markDocumentFailed(documentId, error);

    const failedDocument = await fetchDocumentById(documentId);
    if (!failedDocument) {
      throw error;
    }

    return mapDocumentToResponse(failedDocument);
  }

  const readyDocument = await fetchDocumentById(documentId);

  if (!readyDocument) {
    throw new Error("Failed to load document after processing.");
  }

  return mapDocumentToResponse(readyDocument);
}
