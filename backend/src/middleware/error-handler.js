import { StatusCodes } from 'http-status-codes';

/**
 * Global Express error handler that maps thrown errors to JSON responses.
 * Assumes that err is not NULL or undefined.
 * @param err - error object, optionally with statusCode and message
 * @param req - Express request (unused)
 * @param res - Express response used to send { msg } JSON
 * @param next - Express next function (unused)
 * @returns {import('express').Response} - JSON body with msg set to err.message, "Duplicate value entered for a unique field" for ER_DUP_ENTRY, or "Something went wrong try again later" as fallback
 */
export const errorHandler = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || 'Something went wrong try again later',
  };

  if (err?.code === 'ER_DUP_ENTRY') {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.msg = 'Duplicate value entered for a unique field';
  }

  return res.status(customError.statusCode).json({ msg: customError.msg });
};
