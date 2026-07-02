export class ServiceError extends Error {}

export class NotFoundError extends ServiceError {
  constructor(message = "No encontrado") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
