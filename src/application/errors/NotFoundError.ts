import { UseCaseError } from "./UseCaseError";

export class NotFoundError extends UseCaseError {
  constructor() {
    super("Not found", 404);
  }
}
