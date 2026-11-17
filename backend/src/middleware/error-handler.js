import { StatusCodes } from 'http-status-codes';

/**
 * Global Express error handler that maps thrown errors to JSON responses.
 * Assumes that err is not NULL or undefined.
 * @param err - error object, optionally with statusCode and message
 * @param req - Express request (unused)
 * @param res - Express response used to send { msg } JSON
 * @param next - Express next function (unused)
 * @returns {import('express').Response} - JSON body with msg set to err.message for 4xx errors, "Duplicate value entered for a unique field" for ER_DUP_ENTRY, or "Something went wrong try again later" for 500 errors
 */
export const errorHandler = (err, req, res, next) => {
  const fallbackMessage = 'Something went wrong try again later';
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || fallbackMessage,
  };

  if (err?.code === 'ER_DUP_ENTRY') {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.msg = 'Duplicate value entered for a unique field';
  }

  if (customError.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    console.error(err);
    customError.msg = fallbackMessage;
  }

  return res.status(customError.statusCode).json({ msg: customError.msg });
};
