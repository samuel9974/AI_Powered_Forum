import { body } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";
import { questionHashParamRules } from "./question-hash.validation.js";

/**
 * Validation for assessing an answer against a question.
 */
export const assessAnswerAgainstQuestionValidation = [
  ...questionHashParamRules,

  body("answerText")
    .notEmpty()
    .withMessage("Answer text is required")
    .isString()
    .withMessage("Answer text must be a string")
    .isLength({ min: 20 })
    .withMessage(
      "Answer text must be at least 20 characters for a meaningful fit check",
    )
    .trim(),

  validationErrorHandler,
];
