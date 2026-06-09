import { StatusCodes } from "http-status-codes";
import { createAnswerService } from "../service/answer.service.js";

/**
 * Handles posting a new answer to a question.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const createAnswerController = async (req, res, next) => {
  try {
    const { questionId, content } = req.body;

    const data = await createAnswerService({userId: req.user.id, questionId, content});

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Answer posted successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
