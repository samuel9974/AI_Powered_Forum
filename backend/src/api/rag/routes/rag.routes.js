import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import {
  createDocumentMulterErrorHandler,
  handlePdfUpload,
} from "../../../middleware/rag.upload.js";
import { createDocumentController } from "../controller/create-document.controller.js";
import { deleteDocumentController } from "../controller/delete-document.controller.js";
import { getDocumentFileController } from "../controller/get-document-file.controller.js";
import { getDocumentMetaController } from "../controller/get-document-meta.controller.js";
import { listDocumentsController } from "../controller/list-documents.controller.js";
import { queryDocumentController } from "../controller/query-document.controller.js";
import { searchInDocumentController } from "../controller/search-in-document.controller.js";
import { documentIdParamValidation } from "../validations/document-id.validation.js";
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
 * @route GET /api/rag/documents
 * @desc List all uploaded documents for the authenticated user
 * @access Protected
 */
router.get("/documents", authenticateUser, listDocumentsController);

/**
 * @route GET /api/rag/documents/:documentId
 * @desc Fetch metadata for a single uploaded document
 * @access Protected
 */
router.get(
  "/documents/:documentId",
  authenticateUser,
  documentIdParamValidation,
  getDocumentMetaController,
);

/**
 * @route DELETE /api/rag/documents/:documentId
 * @desc Delete an uploaded document and its stored PDF
 * @access Protected
 */
router.delete(
  "/documents/:documentId",
  authenticateUser,
  documentIdParamValidation,
  deleteDocumentController,
);

/**
 * @route GET /api/rag/documents/:documentId/file
 * @desc Stream the uploaded PDF file for a single document
 * @access Protected
 */
router.get(
  "/documents/:documentId/file",
  authenticateUser,
  documentIdParamValidation,
  getDocumentFileController,
);

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
