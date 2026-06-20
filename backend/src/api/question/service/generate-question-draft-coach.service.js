import { ServiceUnavailableError } from "../../../utils/errors/index.js";
import {
  fetchGeminiJsonTextResponse,
  parseJsonObjectFromGeminiText,
} from "./shared/gemini-text.js";

/**
 * Short coaching tips for a question draft (forum / coursework context).
 */
export async function generateQuestionDraftCoachService({ title, content }) {
  const userPrompt = `You help learners write clearer technical forum posts.

Question TITLE:
${title}

Question BODY (markdown allowed):
${content}

Reply with ONLY valid JSON (no markdown fences), exactly this shape:
{"tips":["...", "..."]}

Rules:
- tips: array of 3 to 5 short strings (each under 120 characters).
- Focus on: missing context (error message, expected vs actual), reproducibility, a sharper title idea if needed, tone for peers.
- Do not claim the question is "correct" or grade homework; give constructive checklist-style tips only.`;

  try {
    const raw = await fetchGeminiJsonTextResponse(userPrompt);
    const parsed = parseJsonObjectFromGeminiText(raw);

    let tips = Array.isArray(parsed?.tips)
      ? parsed.tips
          .filter((t) => typeof t === "string" && t.trim())
          .map((t) => t.trim())
      : [];

    tips = tips.slice(0, 5);

    if (tips.length === 0) {
      tips = [
        "Add any error messages or exact behavior you see.",
        "Say what you already tried and what you expected instead.",
      ];
    }

    return { tips };
  } catch (error) {
    console.error("generateQuestionDraftCoachService:", error);
    throw new ServiceUnavailableError(
      "AI draft coach is temporarily unavailable. Please try again later.",
    );
  }
}
