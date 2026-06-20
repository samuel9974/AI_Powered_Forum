import { StatusCodes } from "http-status-codes";
import { loginService } from "../service/login.service.js";

/**
 * Handles POST /api/auth/login — authenticate user and return a token.
 */
export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const authResult = await loginService({ email, password });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Login successful.",
      user: authResult.user,
      token: authResult.token,
    });
  } catch (error) {
    next(error);
  }
};
