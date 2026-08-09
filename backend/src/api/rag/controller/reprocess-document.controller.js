import { StatusCodes } from "http-status-codes";
import { reprocessDocumentService } from "../service/reprocess-document.service.js";

/**
 * Handles POST /api/rag/documents/:documentId/reprocess
 */
export const reprocessDocumentController = async (req, res, next) => {
  try {
    const data = await reprocessDocumentService({
      userId: req.user.id,
      documentId: req.params.documentId,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message:
        data.status === "ready"
          ? "Document reprocessed successfully"
          : "Document reprocessing failed",
      data,
    });
  } catch (error) {
    next(error);
  }
};
