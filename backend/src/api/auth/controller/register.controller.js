import { StatusCodes } from "http-status-codes";
import { registerService } from "../service/register.service.js";

/**
 * Handles POST /api/auth/register — register a new user.
 */
export const registerController = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const newUser = await registerService({
      firstName,
      lastName,
      email,
      password,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User registered successfully.",
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};
