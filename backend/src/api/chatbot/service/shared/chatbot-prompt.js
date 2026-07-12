/**
 * Builds the RAG prompt for the Evangadi chatbot.
 * @param {Object} params
 * @param {string} params.question
 * @param {Array<{content: string}>} params.chunks
 * @param {Array<{role: string, content: string}>} [params.history]
 * @returns {string}
 */
export function buildChatbotPrompt({ question, chunks, history = [] }) {
  const context = chunks
    .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
    .join("\n\n");

  const historyBlock =
    history.length > 0
      ? history
          .slice(-6)
          .map(
            (turn) =>
              `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}`,
          )
          .join("\n")
      : "";

  return `
You are the Evangadi Forum assistant. Answer questions about Evangadi Networks using ONLY the knowledge base excerpts below.

Rules:
1. Answer based only on the provided knowledge base excerpts.
2. Be concise, warm, and professional.
3. If the answer is not in the excerpts, respond exactly with:
   "I do not have enough information in my knowledge base to answer that question."
4. Encourage users to visit the official Evangadi website for the latest information when appropriate.
5. Do not invent tuition fees, schedules, or admission requirements.
6. Cite relevant excerpts with bracket references like [1] when helpful.

${historyBlock ? `Recent conversation:\n${historyBlock}\n\n` : ""}Knowledge base excerpts:
${context}

User question:
${question}
`.trim();
}
