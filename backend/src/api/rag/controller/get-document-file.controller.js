import { getDocumentFileService } from "../service/get-document-file.service.js";

/**
 * Handles GET /api/rag/documents/:documentId/file — streams the PDF from disk.
 */
export const getDocumentFileController = async (req, res, next) => {
  try {
    const { absolutePath, mimeType } = await getDocumentFileService({
      userId: req.user.id,
      documentId: req.params.documentId,
    });

    res.setHeader("Content-Type", mimeType);
    res.sendFile(absolutePath, (error) => {
      if (error) {
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
};
