import { StatusCodes } from "http-status-codes";
import { searchInDocumentService } from "../service/search-in-document.service.js";

/**
 * Handles GET /api/rag/documents/:documentId/search — delegates to the service layer.
 */
export const searchInDocumentController = async (req, res, next) => {
  try {
    const data = await searchInDocumentService({
      userId: req.user.id,
      documentId: req.params.documentId,
      query: req.query.query,
      k: req.query.k ?? 5,
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
