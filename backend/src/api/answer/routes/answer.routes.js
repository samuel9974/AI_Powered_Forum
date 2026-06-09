import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import { createAnswerController } from "../controller/answer.controller.js";
import { createAnswerValidation } from "../validations/answer.validation.js";

const router = express.Router();

/**
 * @route POST /api/answers
 * @desc Post a new answer to a question
 * @access Protected
 */
router.post("/", authenticateUser, createAnswerValidation, createAnswerController);

/**
 * @route GET /api/answers/:answerId
 * @desc Get one answer
 * @access Public
 */
// router.get('/:answerId', answerIdValidation, getSingleAnswerController);

/**
 * @route PATCH /api/answers/:answerId
 * @desc Update one answer
 * @access Protected
 */
// router.patch( '/:answerId', authenticateUser, updateAnswerValidation, updateAnswerController);

/**
 * @route DELETE /api/answers/:answerId
 * @desc Delete one answer
 * @access Protected
 */
// router.delete('/:answerId', authenticateUser, answerIdValidation, deleteAnswerController);

export default router;
