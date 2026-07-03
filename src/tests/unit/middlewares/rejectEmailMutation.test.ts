import { Request, Response } from "express";
import { rejectEmailMutation } from "../../../presentation/middlewares/rejectEmailMutation";

/** Minimal Express Response double capturing status + json. */
function mockRes(): Response & { statusCode?: number; body?: unknown } {
  const res = {} as Response & { statusCode?: number; body?: unknown };
  res.status = ((code: number) => {
    res.statusCode = code;
    return res;
  }) as Response["status"];
  res.json = ((payload: unknown) => {
    res.body = payload;
    return res;
  }) as Response["json"];
  return res;
}

describe("rejectEmailMutation middleware", () => {
  it("blocks a body carrying `email` with 403 email_immutable", () => {
    const req = { body: { email: "new@email.com", fullName: "Ana" } } as Request;
    const res = mockRes();
    const next = jest.fn();

    rejectEmailMutation(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      error: {
        code: "email_immutable",
        message: expect.any(String),
      },
    });
  });

  it("passes through when the body has no `email` key", () => {
    const req = { body: { fullName: "Ana", city: "Floripa" } } as Request;
    const res = mockRes();
    const next = jest.fn();

    rejectEmailMutation(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeUndefined();
  });

  it("passes through when there is no body", () => {
    const req = {} as Request;
    const res = mockRes();
    const next = jest.fn();

    rejectEmailMutation(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
