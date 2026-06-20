import { StatusCodes } from "http-status-codes";
import { searchQuestionsSemanticService } from "../service/search-questions-semantic.service.js";

/**
 * Handles GET /api/questions/search — semantic search for questions.
 */
export const searchQuestionsSemanticController = async (req, res, next) => {
  try {
    const result = await searchQuestionsSemanticService({
      query: req.query.query,
      k: req.query.k ? Number(req.query.k) : 5,
      threshold:
        req.query.threshold !== undefined
          ? Number(req.query.threshold)
          : undefined,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Semantic search completed successfully.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
