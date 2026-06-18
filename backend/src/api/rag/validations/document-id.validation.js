import { param } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

/**
 * Shared validation for RAG routes that take :documentId as a path param.
 */
export const documentIdParamValidation = [
  param("documentId")
    .notEmpty()
    .withMessage("documentId is required")
    .isInt({ min: 1 })
    .withMessage("documentId must be a positive integer")
    .toInt(),

  validationErrorHandler,
];
