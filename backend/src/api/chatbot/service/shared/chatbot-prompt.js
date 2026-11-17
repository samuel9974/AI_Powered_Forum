/**
 * Builds the RAG prompt for the Evangadi chatbot.
 * @param {Object} params
 * @param {string} params.question
 * @param {Array<{content: string}>} params.chunks
 * @param {Array<{role: string, content: string}>} [params.history]
 * @returns {string}
 */
const LEADING_GREETING = /^(?:hello|hi|hey)(?:\s+there)?[!,.]*(?:\s+|$)/i;
const CITATION_MARKER = /\s*\[(?:\d+\s*(?:,\s*\d+)*)\]/g;

export function buildChatbotPrompt({ question, chunks, history = [] }) {
  const isFollowUp = history.length > 0;
  const context = chunks.map((chunk) => chunk.content).join("\n\n");

  const historyBlock = isFollowUp
    ? history
        .slice(-6)
        .map(
          (turn) =>
            `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}`,
        )
        .join("\n")
    : "";

  const greetingRule = isFollowUp
    ? "The conversation is already underway. Do not greet the user. Do not say Hello, Hi, or Hey. Start with the answer."
    : "This is the first message. One short greeting is optional, then answer.";

  return `
You are the Evangadi Forum assistant. Answer questions about Evangadi Networks using ONLY the knowledge base excerpts below.

Rules:
1. Answer based only on the provided knowledge base excerpts.
2. Be concise and professional. Write in plain sentences.
3. ${greetingRule}
4. If the answer is not in the excerpts, respond exactly with:
   "I do not have enough information in my knowledge base to answer that question."
5. Mention the official Evangadi website only when the user asks where to find more information.
6. Do not invent tuition fees, schedules, or admission requirements.
7. Do not mention excerpts, sources, chunk numbers, or bracket references. The reader should see only the answer.

${historyBlock ? `Recent conversation:\n${historyBlock}\n\n` : ""}Knowledge base excerpts:
${context}

User question:
${question}
`.trim();
}

/**
 * Removes retrieval markers from a model reply, and drops a repeated
 * greeting once the conversation has already started.
 * @param {string} answer
 * @param {{ hasHistory?: boolean }} [options]
 * @returns {string}
 */
export function presentChatbotAnswer(answer, { hasHistory = false } = {}) {
  let text = String(answer || "")
    .replace(CITATION_MARKER, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\s+([.,!?;:])/g, "$1");

  if (hasHistory) {
    text = text.replace(LEADING_GREETING, "");
  }

  return text.trim();
}
