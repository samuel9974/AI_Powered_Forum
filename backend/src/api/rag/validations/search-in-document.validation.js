import { param, query } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

/**
 * Validation for semantic search within a single RAG document.
 */
export const searchInDocumentValidation = [
  param("documentId")
    .notEmpty()
    .withMessage("documentId is required")
    .isInt({ min: 1 })
    .withMessage("documentId must be a positive integer")
    .toInt(),

  query("query")
    .notEmpty()
    .withMessage("query is required")
    .isString()
    .withMessage("query must be a string")
    .trim(),

  query("k")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("k must be between 1 and 20")
    .toInt(),

  validationErrorHandler,
];
