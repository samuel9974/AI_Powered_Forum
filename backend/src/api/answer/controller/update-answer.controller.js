import { StatusCodes } from "http-status-codes";
import { updateAnswerService } from "../service/update-answer.service.js";

/**
 * Handles PATCH /api/answers/:answerId — updates answer content for the authenticated owner.
 * Assumes that req.params.answerId, req.body.content, and req.user.id are not NULL or undefined.
 * @param req - Express request with answerId in params, content in body, and user from auth middleware
 * @param res - Express response used to send the updated answer JSON
 * @param next - Express next function; receives NotFoundError if the answer is missing or not owned by the user
 * @returns {Promise<void>}
 */
export const updateAnswerController = async (req, res, next) => {
  try {
    const { answerId } = req.params;
    const { content } = req.body;

    const data = await updateAnswerService({
      userId: req.user.id,
      answerId,
      content,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Answer updated successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
