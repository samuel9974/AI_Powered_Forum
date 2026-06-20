import { StatusCodes } from "http-status-codes";
import { assessAnswerAgainstQuestionService } from "../service/assess-answer-against-question.service.js";
import { getSingleQuestionService } from "../service/get-single-question.service.js";

/**
 * Handles POST /api/questions/:questionHash/answer-fit — assess answer relevance.
 */
export const assessAnswerAgainstQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const { answerText } = req.body;

    const { question } = await getSingleQuestionService({
      questionHash,
      includeAnswers: false,
    });

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
