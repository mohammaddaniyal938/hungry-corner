class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
  static badRequest(m, e) { return new ApiError(400, m, e); }
  static unauthorized(m = 'Authentication required') { return new ApiError(401, m); }
  static forbidden(m = 'You do not have permission to perform this action') { return new ApiError(403, m); }
  static notFound(m = 'Resource not found') { return new ApiError(404, m); }
  static conflict(m, e) { return new ApiError(409, m, e); }
  static unprocessable(m, e) { return new ApiError(422, m, e); }
}
module.exports = ApiError;
