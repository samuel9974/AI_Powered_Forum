import crypto from "crypto";
import { safeExecute } from "../../../../db/db.config.js";
import { BadRequestError } from "../../../utils/errors/index.js";
import {
  generateQuestionEmbedding,
  normalizeQuestionText,
  storeQuestionVector,
} from "./vector.service.js";

function generateQuestionHash() {
  return crypto.randomBytes(8).toString("hex");
}

/**
 * Creates a new question and stores its vector embedding for semantic search.
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
