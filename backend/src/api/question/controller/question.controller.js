import { StatusCodes } from "http-status-codes";
import {
  createQuestionWithVectorService,
  getQuestionsService,
  searchQuestionsSemanticService,
  getSingleQuestionService,
  assessAnswerAgainstQuestionService,
} from "../service/question.service.js";

/**
 * Handles posting a new question.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const createQuestionController = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    const result = await createQuestionWithVectorService({
      userId: req.user.id, // author id (authenticated user)
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

/**
 * Handles listing questions with optional search filtering. Max 100 records.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const getQuestionsController = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      mine: req.query.mine,
      userId: req.user.id, // Pass the authenticated user's ID
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

/**
 * Handles semantic search for questions.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
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

/**
 * Handles fetching a single question with answers. Max 100 answers.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const getSingleQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;

    const result = await getSingleQuestionService({
      questionHash,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Question fetched successfully.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Handles assessing an answer against a question.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const assessAnswerAgainstQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const { answerText } = req.body;

    const { question } = await getSingleQuestionService({ questionHash, includeAnswers: false });

    const data = await assessAnswerAgainstQuestionService({
      questionTitle: question.title,
      questionContent: question.content,
      answerText,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Answer fit assessed.",
      data,
    });
  } catch (error) {
    next(error);
  }
};