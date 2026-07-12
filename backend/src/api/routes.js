import express from "express";
import authRoutes from "./auth/routes/auth.routes.js";
import questionRoutes from "./question/routes/question.routes.js";
import answerRoutes from "./answer/routes/answer.routes.js";
import ragRoutes from "./rag/routes/rag.routes.js";
import chatbotRoutes from "./chatbot/routes/chatbot.routes.js";

export const mainRouter = express.Router();

// api/auth
mainRouter.use("/auth", authRoutes);

// api/questions
mainRouter.use("/questions", questionRoutes);

// api/answers
mainRouter.use("/answers", answerRoutes);

// api/rag
mainRouter.use("/rag", ragRoutes);

// api/chatbot
mainRouter.use("/chatbot", chatbotRoutes);
