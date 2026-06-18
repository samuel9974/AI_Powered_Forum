import { body, param } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

/**
 * Validation for AI query grounded in a single RAG document.
 */
export const queryDocumentValidation = [
  param("documentId")
    .notEmpty()
    .withMessage("documentId is required")
    .isInt({ min: 1 })
    .withMessage("documentId must be a positive integer")
    .toInt(),

  body("query")
    .notEmpty()
    .withMessage("query is required")
    .isString()
    .withMessage("query must be a string")
    .trim(),

  validationErrorHandler,
];
