import crypto from "crypto";
import { safeExecute } from "../../../../db/db.config.js";
import { BadRequestError } from "../../../utils/errors/index.js";
import {
  generateQuestionEmbedding,
  normalizeQuestionText,
  storeQuestionVector,
} from "./vector.service.js";

/**
 * Generates a random 16-character hex hash for a new question URL slug.
 * @returns {string} - unique question hash string
 */
function generateQuestionHash() {
  return crypto.randomBytes(8).toString("hex");
}

/**
 * Creates a new question, stores its vector embedding, and returns the created record.
 * Assumes that payload.userId, payload.title, and payload.content are not NULL or undefined.
 * @param payload - userId, title, and content for the new question
 * @returns {Promise<{question: {id: number, questionHash: string, title: string, content: string, userId: number}}>} - the created question; throws BadRequestError with message "User does not exist." when userId is invalid
 */
export async function createQuestionWithVectorService(payload) {
  const { userId, title, content } = payload;

  const insertQuestionSql =
    "INSERT INTO questions (question_hash, user_id, title, content) VALUES (?, ?, ?, ?)";

  const questionHash = generateQuestionHash();
  let questionResult;

  try {
    questionResult = await safeExecute(insertQuestionSql, [
      questionHash,
      userId,
      title,
      content,
    ]);
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      throw new BadRequestError("User does not exist.");
    }

    throw error;
  }

  const questionId = questionResult.insertId;

  const creationResult = {
    id: questionId,
    questionHash,
    title,
    content,
    userId,
  };

  const sourceText = normalizeQuestionText({
    title: payload.title,
  });

  try {
    const embeddingResult = await generateQuestionEmbedding(sourceText, {
      questionId: creationResult.id,
    });

    if (
      !embeddingResult ||
      !embeddingResult.embedding ||
      embeddingResult.embedding.length === 0
    ) {
      throw new Error("Gemini API returned an empty or invalid embedding");
    }

    await storeQuestionVector({
      questionId: creationResult.id,
      sourceText,
      embedding: embeddingResult.embedding,
      status: "ready",
    });
  } catch (error) {
    console.error("== FAILED TO STORE VECTOR FOR QUESTION ==");
    console.error("Question ID:", creationResult.id);
    console.error("Operation: question creation");
    console.error("Error:", error);
    console.error("========================================");

    await storeQuestionVector({
      questionId: creationResult.id,
      sourceText,
      embedding: [],
      status: "failed",
    }).catch((e) => console.error("Failed to save failed status", e));
  }

  return {
    question: creationResult,
  };
}
