import { StatusCodes } from "http-status-codes";
import { listDocumentsForUserService } from "../service/list-documents.service.js";

/**
 * Handles GET /api/rag/documents — delegates to the service layer.
 */
export const listDocumentsController = async (req, res, next) => {
  try {
    const data = await listDocumentsForUserService({
      userId: req.user.id,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Documents fetched successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
