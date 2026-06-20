import { param } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

/**
 * Shared :questionHash path param rule for question routes.
 */
export const questionHashParamRules = [
  param("questionHash")
    .isString()
    .withMessage("Question hash is required")
    .matches(/^[a-f0-9]{16}$/)
    .withMessage("Question hash must be a 16-character lowercase hex string"),
];

/**
 * Validation middleware for routes that only need :questionHash.
 */
export const questionHashParamValidation = [
  ...questionHashParamRules,
  validationErrorHandler,
];
