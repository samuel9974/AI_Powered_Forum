import { GoogleGenAI } from "@google/genai";

const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash-lite";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Fetch a JSON text response from the Gemini API.
 * @param {string} userPrompt
 * @returns {Promise<string>}
 */
export async function fetchGeminiJsonTextResponse(userPrompt) {
  const response = await genAI.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: userPrompt,
    config: {
      maxOutputTokens: 300,
    },
  });

  const text = response?.text;

  return typeof text === "string" ? text : "";
}

/**
 * Strip optional markdown fence and parse JSON object from model text.
 * @param {string} raw
 * @returns {object|null}
 */
export function parseJsonObjectFromGeminiText(raw) {
  if (!raw || typeof raw !== "string") return null;

  let t = raw.trim();

  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }

  try {
    const v = JSON.parse(t);

    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}
