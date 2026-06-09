import { body } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";


/**
 * Validation for creating a new answer
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 * @returns {void}
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
