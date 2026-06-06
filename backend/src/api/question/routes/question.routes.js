import express from 'express';
import { authenticateUser } from '../../../middleware/authentication.js';
// controllers
import {
  createQuestionController,
  getQuestionsController,
  getSingleQuestionController,
  assessAnswerAgainstQuestionController,
} from '../controller/question.controller.js';
// validations
import {
  createQuestionValidation,
  getQuestionsValidation,
  getSingleQuestionValidation,
  assessAnswerAgainstQuestionValidation,
} from '../validations/question.validation.js';
// routes
const router = express.Router();


/**
 * @route POST /api/questions
 * @desc Post a new question
 * @access Protected
 */
router.post('/',authenticateUser, createQuestionValidation, createQuestionController);

/**
 * @route GET /api/questions
 * @desc Get questions with optional search filtering
 * @access Private
 */
router.get('/', authenticateUser, getQuestionsValidation, getQuestionsController);


/**
 * @route GET /api/questions/search
 * @desc Semantic search for questions using vector embeddings based on a text query
 * @access Private
 */
router.get('/search', authenticateUser, searchQuestionsSemanticValidation, searchQuestionsSemanticController);

/**
 * @route POST /api/questions/:questionHash/answer-fit
 * @desc AI relevance check for an answer draft vs the question
 * @access Private
 */
router.post('/:questionHash/answer-fit', authenticateUser, assessAnswerAgainstQuestionValidation, assessAnswerAgainstQuestionController);

/**
 * @route GET /api/questions/:questionHash
 * @desc Get one question with answers
 * @access Private
 */
router.get('/:questionHash', authenticateUser, getSingleQuestionValidation, getSingleQuestionController);

export default router;
