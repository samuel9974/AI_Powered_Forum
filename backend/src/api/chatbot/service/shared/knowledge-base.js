import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { ServiceUnavailableError } from "../../../../utils/errors/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const KNOWLEDGE_BASE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "EVANGADI NETWORKS KNOWLEDGE BASE.txt",
);

const KNOWLEDGE_BASE_PATH_FALLBACK = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "EVANGADI NETWORKS KNOWLEDGE BASE.txt",
);

/**
 * Returns the primary knowledge base filename for API responses.
 * @returns {string}
 */
export function getKnowledgeBaseFilename() {
  return path.basename(KNOWLEDGE_BASE_PATH);
}

/**
 * Split knowledge-base text into meaningful chunks (paragraphs / non-empty lines).
 * @param {string} rawText
 * @returns {string[]}
 */
export function chunkKnowledgeBaseText(rawText) {
  const chunks = [];
  const blocks = rawText.split(/\n\s*\n/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (trimmed.length >= 20) {
      chunks.push(trimmed);
    }
  }

  if (chunks.length === 0) {
    rawText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length >= 20)
      .forEach((line) => chunks.push(line));
  }

  return chunks;
}

/**
 * Reads the Evangadi knowledge base text file from disk.
 * @returns {Promise<string>}
 * @throws {ServiceUnavailableError}
 */
export async function readKnowledgeBaseText() {
  let rawText;
  const pathsToTry = [KNOWLEDGE_BASE_PATH, KNOWLEDGE_BASE_PATH_FALLBACK];
  let lastErr;

  for (const filePath of pathsToTry) {
    try {
      rawText = await fs.readFile(filePath, "utf8");
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
    }
  }

  if (!rawText) {
    throw new ServiceUnavailableError(
      `Evangadi knowledge base file is missing on the server. (${lastErr?.code ?? "ENOENT"})`,
    );
  }

  return rawText;
}
