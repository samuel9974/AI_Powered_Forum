import express from "express";
import { authenticateUser } from "../../../middleware/authentication.js";
import { chatChatbotController } from "../controller/chat-chatbot.controller.js";
import { getChatbotStatusController } from "../controller/get-chatbot-status.controller.js";
import { ingestChatbotController } from "../controller/ingest-chatbot.controller.js";
import { chatChatbotValidation } from "../validations/chat-chatbot.validation.js";
import { ingestChatbotValidation } from "../validations/ingest-chatbot.validation.js";

const router = express.Router();

/**
 * @route POST /api/chatbot/ingest
 * @desc Ingest EVANGADI NETWORKS KNOWLEDGE BASE.txt into chatbot vectors
 * @access Protected
 */
router.post(
  "/ingest",
  authenticateUser,
  ingestChatbotValidation,
  ingestChatbotController,
);

/**
 * @route GET /api/chatbot/status
 * @desc Check whether chatbot knowledge base is ready
 * @access Protected
 */
router.get("/status", authenticateUser, getChatbotStatusController);

/**
 * @route POST /api/chatbot/chat
 * @desc Ask the Evangadi assistant a question
 * @access Protected
 */
router.post(
  "/chat",
  authenticateUser,
  chatChatbotValidation,
  chatChatbotController,
);

export default router;
