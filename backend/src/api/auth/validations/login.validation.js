import { body } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

/**
 * Validation for user login.
 */
export const loginValidation = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("A valid email address is required")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),

  validationErrorHandler,
];
