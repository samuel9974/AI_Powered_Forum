import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { ServiceUnavailableError } from "../../../../utils/errors/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const KNOWLEDGE_BASE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "evangadi-info.txt",
);

/**
 * Returns the primary knowledge base filename for API responses.
 * @returns {string}
 */
export function getKnowledgeBaseFilename() {
  return path.basename(KNOWLEDGE_BASE_PATH);
}

/**
 * Split knowledge-base text into retrieval chunks.
 * Blank-line paragraphs stay intact. A file that is one fact per line
 * is split into one chunk per line.
 * @param {string} rawText
 * @returns {string[]}
 */
export function chunkKnowledgeBaseText(rawText) {
  const normalized = String(rawText || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length >= 20);

  if (paragraphs.length === 1 && paragraphs[0].includes("\n")) {
    return paragraphs[0]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length >= 20);
  }

  if (paragraphs.length > 0) return paragraphs;

  return normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 20);
}

/**
 * Reads the Evangadi knowledge base text file from disk.
 * @returns {Promise<string>}
 * @throws {ServiceUnavailableError}
 */
export async function readKnowledgeBaseText() {
  try {
    return await fs.readFile(KNOWLEDGE_BASE_PATH, "utf8");
  } catch (err) {
    throw new ServiceUnavailableError(
      `Evangadi knowledge base file is missing on the server (${path.basename(KNOWLEDGE_BASE_PATH)}). (${err?.code ?? "ENOENT"})`,
    );
  }
}
