import { StatusCodes } from "http-status-codes";
import { deleteDocumentService } from "../service/delete-document.service.js";

/**
 * Handles DELETE /api/rag/documents/:documentId — delegates to the service layer.
 */
export const deleteDocumentController = async (req, res, next) => {
  try {
    const data = await deleteDocumentService({
      userId: req.user.id,
      documentId: req.params.documentId,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Document deleted successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
