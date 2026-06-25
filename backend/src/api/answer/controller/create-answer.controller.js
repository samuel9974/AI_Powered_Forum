import { StatusCodes } from "http-status-codes";
import { createAnswerService } from "../service/create-answer.service.js";

/**
 * Handles POST /api/answers — creates a new answer on an existing question.
 * Assumes that req.body.questionId, req.body.content, and req.user.id are not NULL or undefined.
 * @param req - Express request with questionId and content in body, and user from auth middleware
 * @param res - Express response used to send the created answer JSON with 201 status
 * @param next - Express next function; receives NotFoundError or BadRequestError from the service layer
 * @returns {Promise<void>}
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
