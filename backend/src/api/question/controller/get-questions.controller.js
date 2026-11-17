import { StatusCodes } from "http-status-codes";
import { getQuestionsService } from "../service/get-questions.service.js";

/**
 * Handles GET /api/questions — list questions with optional filters.
 */
export const getQuestionsController = async (req, res, next) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const mineValue = req.query.mine;
    const filters = {
      search,
      mine: mineValue === true || mineValue === 'true' || mineValue === '1',
      userId: req.user.id,
    };

    const result = await getQuestionsService(filters);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Questions fetched successfully.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
