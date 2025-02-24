import logger from "../../main/logger";
import { UseCaseError } from "../errors/UseCaseError";

export class Result<T> {
  public isSuccess: boolean;
  public isFailure: boolean;
  public error?: UseCaseError | string | null;
  private _value?: T;

  public constructor(isSuccess: boolean, error?: UseCaseError | string | null, value?: T) {
    if (isSuccess && error) {
      throw new Error("InvalidOperation: A result cannot be successful and contain an error");
    }
    if (!isSuccess && !error) {
      throw new Error("InvalidOperation: A failing result needs to contain an error message");
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;

    Object.freeze(this);
  }

  public getValue(): T {
    if (!this.isSuccess || this._value === undefined) {
      logger.error(this.error);
      throw new Error("Can't get the value of an error result. Use 'errorValue' instead.");
    }

    return this._value;
  }

  public errorValue(): UseCaseError {
    return this.error as UseCaseError;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, null, value);
  }

  public static fail<U>(error: UseCaseError): Result<U> {
    return new Result<U>(false, error);
  }

  public static combine(results: Result<unknown>[]): Result<unknown> {
    for (const result of results) {
      if (result.isFailure) return result;
    }
    return Result.ok();
  }
}
