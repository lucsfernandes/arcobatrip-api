/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export class UseCaseError {
  public readonly statusCode: number;
  public readonly errors: any;
  constructor(errors: any, statusCode?: number) {
    this.errors = errors;
    this.statusCode = statusCode || 500;
  }
}
