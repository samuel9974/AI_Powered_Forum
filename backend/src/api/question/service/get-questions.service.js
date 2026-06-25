import { safeExecute } from "../../../../db/db.config.js";

/**
 * Builds SQL WHERE clause fragments and bound params from optional list filters.
 * Assumes that filters is not NULL or undefined.
 * @param filters - optional search string, mine flag, and userId for owner filtering
 * @returns {{whereClause: string, params: Array}} - SQL WHERE fragment (may be empty) and matching parameter values
 */
function buildQuestionFilters(filters) {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push("(q.title LIKE ? OR q.content LIKE ?)");
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (filters.mine && filters.userId) {
    conditions.push("q.user_id = ?");
    params.push(filters.userId);
  }

  if (conditions.length === 0) {
    return { whereClause: "", params };
  }

  return {
    whereClause: `WHERE ${conditions.join(" AND ")}`,
    params,
  };
}

/**
 * Retrieves up to 100 questions with optional keyword search and "mine" filtering.
 * Assumes that filters is not NULL or undefined.
 * @param filters - optional search, mine, and userId filter values
 * @returns {Promise<{data: Array, meta: {limit: number, total: number, sortBy: string, sortOrder: string}}>} - paginated question list with author and answer counts
 */
export async function getQuestionsService(filters) {
  const normalizedLimit = 100;
  const sortColumn = "q.created_at";
  const normalizedSortOrder = "DESC";

  const { whereClause, params } = buildQuestionFilters(filters);
 
  const listSql = `
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
    ${whereClause}
    GROUP BY q.question_id, u.user_id
    ORDER BY ${sortColumn} ${normalizedSortOrder}
    LIMIT ${normalizedLimit}
  `;
  const rows = await safeExecute(listSql, params);

  return {
    data: rows.map((question) => ({
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
    })),
    meta: {
      limit: normalizedLimit,
      total: rows.length,
      sortBy: "newest",
      sortOrder: normalizedSortOrder,
    },
  };
}
