import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
// controllers
import {
  createQuestionController,
  getQuestionsController,
  searchQuestionsSemanticController,
  getSingleQuestionController,
  assessAnswerAgainstQuestionController,
  generateQuestionDraftCoachController,
  getSimilarQuestionsController,
} from "../controller/question.controller.js";
// validations
import {
  createQuestionValidation,
  getQuestionsValidation,
  searchQuestionsSemanticValidation,
  getSingleQuestionValidation,
  assessAnswerAgainstQuestionValidation,
  generateQuestionDraftCoachValidation,
  getSimilarQuestionsValidation,
} from "../validations/question.validation.js";
// routes
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
router.get("/search", authenticateUser, searchQuestionsSemanticValidation, searchQuestionsSemanticController);

/**
 * @route GET /api/questions/:questionHash/similar
 * @desc Get similar questions to a question
 * @access Private
 */
router.get("/:questionHash/similar", authenticateUser, getSimilarQuestionsValidation, getSimilarQuestionsController);
/**
 * @route POST /api/questions/draft-coach
 * @desc AI suggestions for a question draft (title + body)
 * @access Private
 */
router.post("/draft-coach", authenticateUser, generateQuestionDraftCoachValidation, generateQuestionDraftCoachController);

/**
 * @route POST /api/questions/:questionHash/answer-fit
 * @desc AI relevance check for an answer draft vs the question
 * @access Private
 */
router.post("/:questionHash/answer-fit", authenticateUser, assessAnswerAgainstQuestionValidation, assessAnswerAgainstQuestionController);

/**
 * @route GET /api/questions/:questionHash
 * @desc Get one question with answers
 * @access Private
 */
router.get("/:questionHash", authenticateUser, getSingleQuestionValidation, getSingleQuestionController);

export default router;
