import { safeExecute } from "../../../../db/db.config.js";
import { BadRequestError, NotFoundError } from "../../../utils/errors/index.js";

/**
 * Creates an answer for an existing question.
 *
 * @param {Object} payload - The answer data
 * @param {number} payload.userId - ID of the authenticated user
 * @param {number} payload.questionId - ID of the question being answered
 * @param {string} payload.content - Answer content
 * @returns {Promise<Object>} The created answer with author details
 */
export const createAnswerService = async ({ questionId, userId, content }) => {
  // fetch the question to verify it exists and check its owner.
  const question = await getQuestionOwner(questionId);

  // if the question is owned by the user, throw an error.
  if (question.user_id === userId) {
    throw new BadRequestError("You cannot answer your own question");
  }

  const insertSql = "INSERT INTO answers (question_id, user_id, content) VALUES (?, ?, ?)";

  // insert the answer into the database.
  const result = await safeExecute(insertSql, [questionId, userId, content]);

  // fetch the answer from the database.
  const answer = await getSingleAnswerService(result.insertId);

  return answer;
};


/**
 * Retrieves the owner of a specific question.
 *
 * Throws a NotFoundError if the question does not exist.
 *
 * @param {number|string} questionId - The ID of the question.
 * @returns {Promise<object>} An object containing question_id and user_id.
 * @throws {NotFoundError} If the question is not found.
 */
const getQuestionOwner = async questionId => {

  const rows = await safeExecute(`SELECT question_id, user_id FROM questions WHERE question_id = ? LIMIT 1`, [questionId]);

  if (rows.length === 0) {
    throw new NotFoundError("Question not found");
  }

  return rows[0];
};

/**
 * Retrieves a single answer by its ID.
 *
 * @param {number|string} answerId - The ID of the answer.
 * @returns {Promise<Object>} The formatted answer object.
 * @throws {NotFoundError} If the answer is not found.
 */
export const getSingleAnswerService = async answerId => {
  const sql = `
    SELECT
      a.answer_id AS id,
      a.question_id AS questionId,
      a.content,
      a.created_at AS createdAt,
      a.updated_at AS updatedAt,
      u.user_id AS userId,
      u.first_name AS firstName,
      u.last_name AS lastName
    FROM answers a
    JOIN users u ON u.user_id = a.user_id
    WHERE a.answer_id = ?
    LIMIT 1
  `;

  // fetch the answer from the database.
  const rows = await safeExecute(sql, [answerId]);

  if (rows.length === 0) {
    throw new NotFoundError('Answer not found');
  }

  // map the answer to a formatted answer object.
  return mapAnswer(rows[0]);
};


/**
 * Maps a raw database row to a structured answer object.
 *
 * @param {Object} row - The database row containing answer and user data.
 * @returns {Object} The formatted answer object.
 */
const mapAnswer = (row) => ({
    id: row.id,
    questionId: row.questionId,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      id: row.userId,
      firstName: row.firstName,
      lastName: row.lastName,
    },
  }); 
