import { body } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

/**
 * Validation for user registration.
 */
export const registerValidation = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isString()
    .withMessage("First name must be a string")
    .isLength({ min: 3 })
    .withMessage("First name must be at least 3 characters long")
    .isLength({ max: 50 })
    .withMessage("First name must be at most 50 characters long"),
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isString()
    .withMessage("Last name must be a string")
    .isLength({ min: 3 })
    .withMessage("Last name must be at least 3 characters long")
    .isLength({ max: 50 })
    .withMessage("Last name must be at most 50 characters long"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("A valid email address is required")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  validationErrorHandler,
];
