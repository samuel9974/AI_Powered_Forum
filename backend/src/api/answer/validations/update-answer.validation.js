import { body } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";
import { answerIdParamRules } from "./answer-id.validation.js";

/**
 * Validation middleware chain for PATCH /api/answers/:answerId.
 * Assumes that req.body.content will be present when validation passes.
 * @returns {Array} - answerId and content rules plus validationErrorHandler; responds 400 with messages such as "Answer content is required" or "Answer content must be at least 20 characters" on failure
 */
export const updateAnswerValidation = [
  ...answerIdParamRules,

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
