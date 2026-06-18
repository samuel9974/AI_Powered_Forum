import { StatusCodes } from "http-status-codes";
import { queryDocumentService } from "../service/query-document.service.js";

/**
 * Handles POST /api/rag/documents/:documentId/query — delegates to the service layer.
 */
export const queryDocumentController = async (req, res, next) => {
  try {
    const data = await queryDocumentService({
      userId: req.user.id,
      documentId: req.params.documentId,
      query: req.body.query,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Answer and citations",
      data,
    });
  } catch (error) {
    next(error);
  }
};
