import { GoogleGenAI } from "@google/genai";

export const GEMINI_GENERATION_MODEL =
  process.env.GEMINI_GENERATION_MODEL ||
  process.env.GEMINI_TEXT_MODEL ||
  "gemini-2.0-flash-lite";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Extracts plain text from a Gemini generateContent response.
 * @param {Object} response
 * @returns {string}
 */
export function getGeneratedText(response) {
  try {
    const txt = response.text;
    if (typeof txt === "string" && txt.trim()) {
      return txt.trim();
    }
  } catch {
    return "";
  }

  const parts = response.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part.text || "")
    .join("")
    .trim();
}


/**
 * Generates content from a prompt using the configured Gemini model.
 * @param {string} prompt
 * @returns {Promise<Object>}
 */
export async function generateChatbotContent(prompt) {
  return ai.models.generateContent({
    model: GEMINI_GENERATION_MODEL,
    contents: prompt,
  });
}
