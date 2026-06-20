import { StatusCodes } from "http-status-codes";
import { createQuestionWithVectorService } from "../service/create-question.service.js";

/**
 * Handles POST /api/questions — post a new question.
 */
export const createQuestionController = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    const result = await createQuestionWithVectorService({
      userId: req.user.id,
      title,
      content,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Question posted successfully.",
      data: result.question,
    });
  } catch (error) {
    next(error);
  }
};
