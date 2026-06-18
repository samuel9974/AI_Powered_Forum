import { StatusCodes } from "http-status-codes";
import { getDocumentMetaService } from "../service/get-document-meta.service.js";

/**
 * Handles GET /api/rag/documents/:documentId — delegates to the service layer.
 */
export const getDocumentMetaController = async (req, res, next) => {
  try {
    const data = await getDocumentMetaService({
      userId: req.user.id,
      documentId: req.params.documentId,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Document fetched successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
