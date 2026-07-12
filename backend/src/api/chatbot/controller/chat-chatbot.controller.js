import { StatusCodes } from "http-status-codes";
import { queryChatbotService } from "../service/query-chatbot.service.js";

/**
 * Handles POST /api/chatbot/chat — answers a question using the knowledge base.
 */
export const chatChatbotController = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    const data = await queryChatbotService({ message, history });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Chatbot response generated.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
