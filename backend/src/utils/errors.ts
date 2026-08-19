export class HttpException extends Error {
  public statusCode: number;
  public errors?: string[];

  constructor(statusCode: number, message: string, errors?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized access') {
    super(401, message);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = 'Access denied: insufficient permissions') {
    super(403, message);
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string, errors?: string[]) {
    super(400, message, errors);
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string = 'Resource not found') {
    super(404, message);
  }
}
