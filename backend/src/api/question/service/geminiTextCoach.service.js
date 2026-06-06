
import { GoogleGenAI } from "@google/genai";

const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash-lite";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;  

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });


/**
 * Whether a draft answer seems to address the question (relevance, not correctness).
 * @param {{ questionTitle: string; questionContent: string; answerText: string }} param
 * @returns {Promise<{ level: string; note: string }>}
 */
export const assessAnswerAgainstQuestionService = async ({
  questionTitle,
  questionContent,
  answerText,
}) => {
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
        "level":"strong"|"partial"|"weak","note":
        "one short sentence"
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
};


/**
 * Fetch a JSON text response from the Gemini API.
 * @param {string} userPrompt - The user prompt to send to the Gemini API.
 * @returns {Promise<string>} The JSON text response from the Gemini API.
 */
async function fetchGeminiJsonTextResponse(userPrompt) {
  const response = await genAI.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: userPrompt,
    config: {
      maxOutputTokens: 300,
    },
  });

  console.log(response);

  const text = response?.text;

  return typeof text === "string" ? text : "";
}


/**
 * Strip optional markdown fence and parse JSON object from model text.
 * @param {string} raw
 * @returns {object|null}
 */
function parseJsonObjectFromGeminiText(raw) {
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

