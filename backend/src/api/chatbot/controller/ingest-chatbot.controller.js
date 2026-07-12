import { StatusCodes } from "http-status-codes";
import { ingestKnowledgeBaseService } from "../service/ingest-knowledge-base.service.js";

/**
 * Handles POST /api/chatbot/ingest — ingests the Evangadi knowledge base.
 */
export const ingestChatbotController = async (req, res, next) => {
  try {
    const force = req.body?.force === true;
    const data = await ingestKnowledgeBaseService({ force });

    res.status(StatusCodes.OK).json({
      success: true,
      message: data.message,
      data,
    });
  } catch (error) {
    next(error);
  }
};
