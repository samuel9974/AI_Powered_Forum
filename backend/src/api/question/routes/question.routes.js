import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import { assessAnswerAgainstQuestionController } from "../controller/assess-answer-against-question.controller.js";
import { createQuestionController } from "../controller/create-question.controller.js";
import { generateQuestionDraftCoachController } from "../controller/generate-question-draft-coach.controller.js";
import { getQuestionsController } from "../controller/get-questions.controller.js";
import { getSimilarQuestionsController } from "../controller/get-similar-questions.controller.js";
import { getSingleQuestionController } from "../controller/get-single-question.controller.js";
import { searchQuestionsSemanticController } from "../controller/search-questions-semantic.controller.js";
import { assessAnswerAgainstQuestionValidation } from "../validations/assess-answer-against-question.validation.js";
import { createQuestionValidation } from "../validations/create-question.validation.js";
import { generateQuestionDraftCoachValidation } from "../validations/generate-question-draft-coach.validation.js";
import { getQuestionsValidation } from "../validations/get-questions.validation.js";
import { getSimilarQuestionsValidation } from "../validations/get-similar-questions.validation.js";
import { questionHashParamValidation } from "../validations/question-hash.validation.js";
import { searchQuestionsSemanticValidation } from "../validations/search-questions-semantic.validation.js";

const router = express.Router();

/**
 * @route POST /api/questions
 * @desc Post a new question
 * @access Protected
 */
router.post("/", authenticateUser, createQuestionValidation, createQuestionController);

/**
 * @route GET /api/questions
 * @desc Get questions with optional search filtering
 * @access Private
 */
router.get("/", authenticateUser, getQuestionsValidation, getQuestionsController);

/**
 * @route GET /api/questions/search
 * @desc Semantic search for questions using vector embeddings based on a text query
 * @access Private
 */
router.get(
  "/search",
  authenticateUser,
  searchQuestionsSemanticValidation,
  searchQuestionsSemanticController,
);

/**
 * @route GET /api/questions/:questionHash/similar
 * @desc Get similar questions to a question
 * @access Private
 */
router.get(
  "/:questionHash/similar",
  authenticateUser,
  getSimilarQuestionsValidation,
  getSimilarQuestionsController,
);

/**
 * @route POST /api/questions/draft-coach
 * @desc AI suggestions for a question draft (title + body)
 * @access Private
 */
router.post(
  "/draft-coach",
  authenticateUser,
  generateQuestionDraftCoachValidation,
  generateQuestionDraftCoachController,
);

/**
 * @route POST /api/questions/:questionHash/answer-fit
 * @desc AI relevance check for an answer draft vs the question
 * @access Private
 */
router.post(
  "/:questionHash/answer-fit",
  authenticateUser,
  assessAnswerAgainstQuestionValidation,
  assessAnswerAgainstQuestionController,
);

/**
 * @route GET /api/questions/:questionHash
 * @desc Get one question with answers
 * @access Private
 */
router.get(
  "/:questionHash",
  authenticateUser,
  questionHashParamValidation,
  getSingleQuestionController,
);

export default router;
