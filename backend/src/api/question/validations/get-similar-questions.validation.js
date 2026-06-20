import { query } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";
import { questionHashParamRules } from "./question-hash.validation.js";

/**
 * Validation for fetching similar questions.
 */
export const getSimilarQuestionsValidation = [
  ...questionHashParamRules,

  query("k")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("k must be between 1 and 20")
    .toInt(),

  query("threshold")
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage("threshold must be between 0 and 1")
    .toFloat(),

  validationErrorHandler,
];
