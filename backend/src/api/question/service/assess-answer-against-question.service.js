import { ServiceUnavailableError } from "../../../utils/errors/index.js";
import {
  fetchGeminiJsonTextResponse,
  parseJsonObjectFromGeminiText,
} from "./shared/gemini-text.js";

/**
 * Whether a draft answer seems to address the question (relevance, not correctness).
 */
export async function assessAnswerAgainstQuestionService({
  questionTitle,
  questionContent,
  answerText,
}) {
  const userPrompt = `You review whether a forum ANSWER draft addresses 
the QUESTION (relevance and completeness of engagement - not whether the answer is factually correct).

QUESTION TITLE:
${questionTitle}

QUESTION BODY:
${questionContent}

ANSWER DRAFT:
${answerText}

    Reply with ONLY valid JSON (no markdown fences), exactly this shape:
    {
        "level":"strong"|"partial"|"weak",
        "note":"one short sentence"
    }

    Rules:
    - level: "strong" if the draft clearly engages with the question; "partial" if somewhat related but missing key parts of the ask; "weak" if mostly off-topic or too vague.
    - note: one sentence, plain language, no markdown, under 200 characters. Frame as fit/relevance, not grading.`;

  try {
    const raw = await fetchGeminiJsonTextResponse(userPrompt);

    const parsed = parseJsonObjectFromGeminiText(raw);

    const levelRaw = parsed?.level;
    const noteRaw = parsed?.note;

    const level =
      levelRaw === "strong" || levelRaw === "partial" || levelRaw === "weak"
        ? levelRaw
        : "partial";

    const note =
      typeof noteRaw === "string" && noteRaw.trim()
        ? noteRaw.trim().slice(0, 280)
        : "Could not summarize fit; treat this as a partial match.";

    return { level, note };
  } catch (error) {
    console.error("assessAnswerAgainstQuestionService:", error);

    throw new ServiceUnavailableError(
      "AI fit check is temporarily unavailable. Please try again later.",
    );
  }
}
