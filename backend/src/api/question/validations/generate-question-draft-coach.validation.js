import { body } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

/**
 * Validation for generating a question draft coach.
 */
export const generateQuestionDraftCoachValidation = [
  body("title")
    .optional()
    .isString()
    .withMessage("Question title must be a string")
    .trim(),
  body("content")
    .notEmpty()
    .withMessage("Question content is required")
    .isString()
    .withMessage("Question content must be a string")
    .trim(),

  validationErrorHandler,
];
