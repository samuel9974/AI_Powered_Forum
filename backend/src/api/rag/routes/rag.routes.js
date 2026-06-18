import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import {
  createDocumentMulterErrorHandler,
  handlePdfUpload,
} from "../../../middleware/rag.upload.js";
import { createDocumentController } from "../controller/create-document.controller.js";
import { queryDocumentController } from "../controller/query-document.controller.js";
import { searchInDocumentController } from "../controller/search-in-document.controller.js";
import { queryDocumentValidation } from "../validations/query-document.validation.js";
import { searchInDocumentValidation } from "../validations/search-in-document.validation.js";

const router = express.Router();

/**
 * @route POST /api/rag/documents
 * @desc Upload and process a PDF document for RAG
 * @access Protected
 */
router.post("/documents", authenticateUser, handlePdfUpload, createDocumentController);

/**
 * @route GET /api/rag/documents/:documentId/search
 * @desc Semantic search within a single uploaded document
 * @access Protected
 */
router.get(
  "/documents/:documentId/search",
  authenticateUser,
  searchInDocumentValidation,
  searchInDocumentController,
);

/**
 * @route POST /api/rag/documents/:documentId/query
 * @desc Ask a question grounded in a single uploaded document
 * @access Protected
 */
router.post(
  "/documents/:documentId/query",
  authenticateUser,
  queryDocumentValidation,
  queryDocumentController,
);

router.use(createDocumentMulterErrorHandler);

export default router;
