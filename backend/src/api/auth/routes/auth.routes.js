import express from "express";
import { loginController } from "../controller/login.controller.js";
import { registerController } from "../controller/register.controller.js";
import { loginValidation } from "../validations/login.validation.js";
import { registerValidation } from "../validations/register.validation.js";

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post("/register", registerValidation, registerController);

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token
 * @access Public
 */
router.post("/login", loginValidation, loginController);

export default router;
