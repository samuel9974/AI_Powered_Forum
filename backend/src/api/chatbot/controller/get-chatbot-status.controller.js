import { StatusCodes } from "http-status-codes";
import { getChatbotStatusService } from "../service/get-chatbot-status.service.js";

/**
 * Handles GET /api/chatbot/status — returns chatbot knowledge base readiness.
 */
export const getChatbotStatusController = async (req, res, next) => {
  try {
    const data = await getChatbotStatusService();

    res.status(StatusCodes.OK).json({
      success: true,
      message: data.ready
        ? "Chatbot knowledge base is ready."
        : "Chatbot knowledge base is not ingested yet.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
