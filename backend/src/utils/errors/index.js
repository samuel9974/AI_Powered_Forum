import { StatusCodes } from "http-status-codes";

/**
 * Base application error that carries a human-readable message.
 * Assumes that message is not NULL or undefined.
 * @param message - error description surfaced to clients
 */
class CustomAPIError extends Error {
  constructor(message) {
    super(message);
  }
}

/**
 * 400 Bad Request error for invalid input or business-rule violations.
 * Assumes that message is not NULL or undefined.
 * @param message - error description surfaced to clients
 */
export class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.BAD_REQUEST; // 400
  }
}

/**
 * 404 Not Found error for missing resources.
 * Assumes that message is not NULL or undefined.
 * @param message - error description surfaced to clients
 */
export class NotFoundError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.NOT_FOUND; // 404
  }
}

/**
 * 401 Unauthorized error for missing or invalid authentication.
 * Assumes that message is not NULL or undefined.
 * @param message - error description surfaced to clients
 */
export class UnauthenticatedError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED; // 401
  }
}

/**
 * 503 Service Unavailable error for upstream dependency failures.
 * Assumes that message is not NULL or undefined.
 * @param message - error description surfaced to clients
 */
export class ServiceUnavailableError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.SERVICE_UNAVAILABLE; // 503
  }
}

export default CustomAPIError;
