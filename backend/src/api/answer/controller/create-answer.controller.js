import { StatusCodes } from "http-status-codes";
import { createAnswerService } from "../service/create-answer.service.js";

/**
 * Handles POST /api/answers — post a new answer to a question.
 */
export const createAnswerController = async (req, res, next) => {
  try {
    const { questionId, content } = req.body;

    const data = await createAnswerService({
      userId: req.user.id,
      questionId,
      content,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Answer posted successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
