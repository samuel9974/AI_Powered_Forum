import { query } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

/**
 * Validation for listing questions.
 */
export const getQuestionsValidation = [
  query("search")
    .optional()
    .isString()
    .withMessage("Search must be a string")
    .trim(),
  query("mine")
    .optional()
    .isBoolean()
    .withMessage("Mine must be a boolean")
    .toBoolean(),

  validationErrorHandler,
];
