import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import { createAnswerController } from "../controller/create-answer.controller.js";
import { getSingleAnswerController } from "../controller/get-single-answer.controller.js";
import { deleteAnswerController } from "../controller/delete-answer.controller.js";
import { updateAnswerController } from "../controller/update-answer.controller.js";
import { answerIdValidation } from "../validations/answer-id.validation.js";
import { createAnswerValidation } from "../validations/create-answer.validation.js";
import { updateAnswerValidation } from "../validations/update-answer.validation.js";

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
router.get('/:answerId', answerIdValidation, getSingleAnswerController);

/**
 * @route PATCH /api/answers/:answerId
 * @desc Update one answer
 * @access Protected
 */
router.patch( '/:answerId', authenticateUser, updateAnswerValidation, updateAnswerController);

/**
 * @route DELETE /api/answers/:answerId
 * @desc Delete one answer
 * @access Protected
 */
router.delete('/:answerId', authenticateUser, answerIdValidation, deleteAnswerController);

export default router;
