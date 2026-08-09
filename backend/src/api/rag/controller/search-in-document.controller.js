import { StatusCodes } from "http-status-codes";
import { searchInDocumentService } from "../service/search-in-document.service.js";
import { getRagRetrievalConfig } from "../service/shared/rag-retrieval-config.js";

/**
 * Handles GET /api/rag/documents/:documentId/search — delegates to the service layer.
 */
export const searchInDocumentController = async (req, res, next) => {
  try {
    const { topK } = getRagRetrievalConfig();

    const data = await searchInDocumentService({
      userId: req.user.id,
      documentId: req.params.documentId,
      query: req.query.query,
      k: req.query.k ?? topK,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Ranked chunk excerpts",
      data,
    });
  } catch (error) {
    next(error);
  }
};
