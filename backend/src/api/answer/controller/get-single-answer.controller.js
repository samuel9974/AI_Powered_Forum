import { StatusCodes } from "http-status-codes";
import { getSingleAnswerService } from "../service/get-single-answer.service.js";

/**
 * Handles GET /api/answers/:answerId — returns one answer as JSON.
 * Assumes that req.params.answerId is not NULL or undefined.
 * @param req - Express request with answerId in params
 * @param res - Express response used to send the JSON payload
 * @param next - Express next function; receives NotFoundError if the answer does not exist
 * @returns {Promise<void>}
 */
export const getSingleAnswerController = async (req, res, next) => {
  try {
    const { answerId } = req.params;

    const data = await getSingleAnswerService({ answerId });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Answer fetched successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
