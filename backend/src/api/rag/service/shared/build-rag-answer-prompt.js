/**
 * Prompt + generation knobs for grounded RAG answers (Phase C / Step 5).
 */

const DEFAULT_FACTUAL_MAX_TOKENS = 1024;
const DEFAULT_OVERVIEW_MAX_TOKENS = 2048;

/**
 * @param {unknown} value
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clampInt(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

/**
 * Max output tokens for the answer model by intent.
 * @param {'overview'|'factual'} [intent='factual']
 * @returns {number}
 */
export function getRagAnswerMaxOutputTokens(intent = "factual") {
  if (intent === "overview") {
    return clampInt(
      process.env.RAG_OVERVIEW_ANSWER_MAX_TOKENS,
      DEFAULT_OVERVIEW_MAX_TOKENS,
      256,
      8192,
    );
  }

  return clampInt(
    process.env.RAG_ANSWER_MAX_TOKENS,
    DEFAULT_FACTUAL_MAX_TOKENS,
    256,
    8192,
  );
}

/**
 * Build the user prompt for grounded RAG generation.
 * Overview: allow synthesis / teaching from multiple excerpts.
 * Factual: stay concise and refuse when CONTEXT lacks the answer.
 *
 * @param {Object} params
 * @param {string} params.userQuery
 * @param {string} params.contextBlock
 * @param {'overview'|'factual'} [params.intent='factual']
 * @returns {string}
 */
export function buildRagAnswerPrompt({
  userQuery,
  contextBlock,
  intent = "factual",
}) {
  const sharedFooter = `CONTEXT:
${contextBlock}

QUESTION:
${userQuery}

Reply with ONLY valid JSON (no markdown fences), exactly this shape:
{
  "answer": "your answer in plain language",
  "citedRefs": [1]
}`;

  if (intent === "overview") {
    return `You help a learner understand a single document using ONLY the CONTEXT excerpts below.

Goal: teach from what is present. Synthesize themes across excerpts into a clear overview the reader can learn from.
It is OK that CONTEXT is only part of the full document — still produce a useful overview from the excerpts you have.
Do NOT invent facts, numbers, names, or claims that are not supported by CONTEXT.
Refuse only if CONTEXT is empty or clearly unrelated to the question.

Style:
- Plain language, teaching-oriented.
- Prefer a short structured answer (brief intro + a few bullet or section points) when that helps learning.
- Keep it grounded; every substantive claim should come from CONTEXT.

${sharedFooter}

Rules:
- answer: helpful overview grounded only in CONTEXT; do not invent facts.
- citedRefs: reference numbers for excerpts you used (e.g. 1, 2); use [] only if you could not use any.`;
  }

  return `You answer questions using ONLY the CONTEXT excerpts below from a single document.
Be precise and concise. If CONTEXT does not contain enough information to answer the specific question, say you cannot answer from the document.
Do not invent facts.

${sharedFooter}

Rules:
- answer: concise, grounded only in the CONTEXT above; do not invent facts.
- citedRefs: array of reference numbers (e.g. 1, 2) for excerpts you used; use [] if none apply.`;
}
