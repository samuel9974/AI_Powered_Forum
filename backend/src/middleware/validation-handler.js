import { validationResult } from 'express-validator';
import { BadRequestError } from '../utils/errors/index.js';

/**
 * Runs express-validator checks and forwards validation failures to the error handler.
 * Assumes that req has already passed through validator middleware.
 * @param req - Express request to inspect with validationResult
 * @param res - Express response (unused on success)
 * @param next - Express next function; receives BadRequestError with joined validator messages on failure
 * @returns {void}
 */
export const validationErrorHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    throw new BadRequestError(errorMessages.join('. '));
  }
  next();
};
