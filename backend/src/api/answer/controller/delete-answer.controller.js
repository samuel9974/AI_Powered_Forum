import { StatusCodes } from "http-status-codes";
import { deleteAnswerService } from "../service/delete-answer.service.js";

/**
 * Handles DELETE /api/answers/:answerId — removes an answer owned by the authenticated user.
 * Assumes that req.params.answerId and req.user.id are not NULL or undefined.
 * @param req - Express request with answerId in params and user from auth middleware
 * @param res - Express response used to confirm deletion
 * @param next - Express next function; receives NotFoundError if the answer is missing or not owned by the user
 * @returns {Promise<void>}
 */
export const deleteAnswerController = async (req, res, next) => {
  try {
    const { answerId } = req.params;

    const data = await deleteAnswerService({
      userId: req.user.id,
      answerId,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Answer deleted successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
