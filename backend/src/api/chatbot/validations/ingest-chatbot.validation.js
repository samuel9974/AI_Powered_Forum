import { body } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

export const ingestChatbotValidation = [
  body("force").optional().isBoolean().withMessage("force must be a boolean"),
  validationErrorHandler,
];
