import { param } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

/**
 * Express-validator rules for the :answerId path parameter on answer routes.
 * @returns {Array} - array of express-validator middleware rules for answerId
 */
export const answerIdParamRules = [
  param("answerId")
    .notEmpty()
    .withMessage("Answer ID is required")
    .isInt({ min: 1 })
    .withMessage("Answer ID must be a positive integer")
    .toInt(),
];

/**
 * Validation middleware chain for answer routes that only require a valid :answerId param.
 * @returns {Array} - answerId rules plus validationErrorHandler; responds 400 with joined error messages on failure
 */
export const answerIdValidation = [
  ...answerIdParamRules,
  validationErrorHandler,
];
