import { safeExecute } from "../../../../db/db.config.js";
import { NotFoundError } from "../../../utils/errors/index.js";

/**
 * Retrieves a single question with answers. Max 100 answers.
 */
export async function getSingleQuestionService({
  questionHash,
  includeAnswers = true,
}) {
  const normalizedAnswerLimit = 100;

  const questionSql = `
    SELECT
      q.question_id AS id,
      q.question_hash AS questionHash,
      q.title,
      q.content,
      q.created_at AS createdAt,
      q.updated_at AS updatedAt,
      u.user_id AS userId,
      u.first_name AS firstName,
      u.last_name AS lastName,
      COUNT(DISTINCT a.answer_id) AS answerCount
    FROM questions q
    JOIN users u ON u.user_id = q.user_id
    LEFT JOIN answers a ON a.question_id = q.question_id
    WHERE q.question_hash = ?
    GROUP BY q.question_id, u.user_id
  `;

  const questionRows = await safeExecute(questionSql, [questionHash]);

  if (questionRows.length === 0) {
    throw new NotFoundError("Question not found");
  }

  if (!includeAnswers) {
    return {
      question: questionRows[0],
    };
  }

  const question = questionRows[0];
  const questionId = question.id;

  const answersSql = `
  SELECT
    a.answer_id AS id,
    a.content,
    a.created_at AS createdAt,
    a.updated_at AS updatedAt,
    au.user_id AS userId,
    au.first_name AS firstName,
    au.last_name AS lastName
  FROM answers a
  JOIN users au ON au.user_id = a.user_id
  WHERE a.question_id = ?
  ORDER BY a.created_at DESC
  LIMIT ${normalizedAnswerLimit}
`;

  const answers = await safeExecute(answersSql, [questionId]);

  return {
    question: {
      id: question.id,
      questionHash: question.questionHash,
      title: question.title,
      content: question.content,
      answerCount: question.answerCount,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      author: {
        id: question.userId,
        firstName: question.firstName,
        lastName: question.lastName,
      },
    },

    answers: answers.map((answer) => ({
      id: answer.id,
      content: answer.content,
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
      author: {
        id: answer.userId,
        firstName: answer.firstName,
        lastName: answer.lastName,
      },
    })),

    answersMeta: {
      limit: normalizedAnswerLimit,
      total: answers.length,
    },
  };
}
