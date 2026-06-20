import { StatusCodes } from "http-status-codes";
import { generateQuestionDraftCoachService } from "../service/generate-question-draft-coach.service.js";

/**
 * Handles POST /api/questions/draft-coach — AI suggestions for a question draft.
 */
export const generateQuestionDraftCoachController = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    const data = await generateQuestionDraftCoachService({ title, content });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Draft suggestions generated.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
