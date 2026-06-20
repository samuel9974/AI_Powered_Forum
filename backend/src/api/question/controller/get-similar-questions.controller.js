import { StatusCodes } from "http-status-codes";
import { getSimilarQuestionsService } from "../service/get-similar-questions.service.js";

/**
 * Handles GET /api/questions/:questionHash/similar — fetch similar questions.
 */
export const getSimilarQuestionsController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;

    const result = await getSimilarQuestionsService({
      questionHash,
      k: req.query.k ? Number(req.query.k) : 5,
      threshold:
        req.query.threshold !== undefined
          ? Number(req.query.threshold)
          : undefined,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Similar questions fetched successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
