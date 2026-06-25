import { body } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

/**
 * Validation middleware chain for POST /api/answers.
 * Assumes that req.body.questionId and req.body.content will be present when validation passes.
 * @returns {Array} - questionId and content rules plus validationErrorHandler; responds 400 with messages such as "Question ID is required" or "Answer content must be at least 20 characters" on failure
 */
export const createAnswerValidation = [
  body("questionId")
    .notEmpty()
    .withMessage("Question ID is required")
    .isInt({ min: 1 })
    .withMessage("Question ID must be a positive integer")
    .toInt(),
  body("content")
    .notEmpty()
    .withMessage("Answer content is required")
    .isString()
    .withMessage("Answer content must be a string")
    .isLength({ min: 20 })
    .withMessage("Answer content must be at least 20 characters")
    .trim(),

  validationErrorHandler,
];
