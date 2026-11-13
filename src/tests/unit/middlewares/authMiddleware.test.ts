import { NextFunction, Response } from "express";
import {
  authMiddleware,
  AuthenticatedRequest,
  setAccountExistsCheck,
} from "../../../presentation/middlewares/authMiddleware";
import { tokenService } from "../../../infra/services/TokenService";

/**
 * Testes do `authMiddleware` no modo DUAL (cookie HttpOnly OU Bearer). Usamos o
 * `tokenService` real (os segredos JWT vêm do setup de testes) para exercitar o
 * caminho verdadeiro de verificação/blacklist.
 */

type MockRes = Response & { statusCode?: number; body?: unknown };

/** Requisição mínima com os campos que o middleware lê (`cookies`, `headers`). */
function makeReq(
  overrides: Partial<AuthenticatedRequest> = {}
): AuthenticatedRequest {
  return {
    headers: {},
    cookies: {},
    ...overrides,
  } as AuthenticatedRequest;
}

/** Response mínima que captura status/json para asserção. */
function makeRes(): MockRes {
  const res = {} as MockRes;
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  }) as unknown as MockRes["status"];
  res.json = jest.fn((body: unknown) => {
    res.body = body;
    return res;
  }) as unknown as MockRes["json"];
  return res;
}

/** Extrai a mensagem do envelope de erro `{ error: { message } }`. */
function errorMessage(res: MockRes): string {
  return (res.body as { error: { message: string } }).error.message;
}

describe("authMiddleware (dual cookie/bearer)", () => {
  const payload = { userId: "user-123", email: "dual@test.com" };

  // The account behind every token exists unless a test says otherwise.
  beforeEach(() => setAccountExistsCheck(async () => true));
  afterEach(() => setAccountExistsCheck(null));

  it("autentica via cookie access_token e popula req.userId/userEmail", async () => {
    const token = tokenService.generateToken(payload);
    const req = makeReq({ cookies: { access_token: token } });
    const res = makeRes();
    const next: NextFunction = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe(payload.userId);
    expect(req.userEmail).toBe(payload.email);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("autentica via header Authorization: Bearer (mobile continua funcionando)", async () => {
    const token = tokenService.generateToken(payload);
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next: NextFunction = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe(payload.userId);
    expect(req.userEmail).toBe(payload.email);
  });

  it("prioriza o cookie quando cookie e header estão ambos presentes", async () => {
    const cookieToken = tokenService.generateToken({
      userId: "cookie-user",
      email: "cookie@test.com",
    });
    const headerToken = tokenService.generateToken({
      userId: "header-user",
      email: "header@test.com",
    });
    const req = makeReq({
      cookies: { access_token: cookieToken },
      headers: { authorization: `Bearer ${headerToken}` },
    });
    const res = makeRes();
    const next: NextFunction = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe("cookie-user");
  });

  it("cai no header quando o cookie access_token está vazio", async () => {
    const token = tokenService.generateToken(payload);
    const req = makeReq({
      cookies: { access_token: "" },
      headers: { authorization: `Bearer ${token}` },
    });
    const res = makeRes();
    const next: NextFunction = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe(payload.userId);
  });

  it("retorna 401 quando não há cookie nem header", async () => {
    const req = makeReq();
    const res = makeRes();
    const next: NextFunction = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(errorMessage(res)).toBe("Token de autenticação não fornecido");
  });

  it("retorna 401 (formato inválido) quando o header não é Bearer e não há cookie", async () => {
    const req = makeReq({ headers: { authorization: "Basic abc123" } });
    const res = makeRes();
    const next: NextFunction = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(errorMessage(res)).toBe("Formato de token inválido");
  });

  it("retorna 401 para um token de cookie inválido (JWT malformado)", async () => {
    const req = makeReq({ cookies: { access_token: "not-a-jwt" } });
    const res = makeRes();
    const next: NextFunction = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(errorMessage(res)).toBe("Token inválido ou expirado");
  });

  it("retorna 401 para um token na blacklist enviado via cookie", async () => {
    const token = tokenService.generateToken({
      userId: "blacklisted-user",
      email: "bl@test.com",
    });
    await tokenService.invalidateToken(token);

    const req = makeReq({ cookies: { access_token: token } });
    const res = makeRes();
    const next: NextFunction = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(errorMessage(res)).toBe("Token inválido ou expirado");
  });

  describe("conta excluída", () => {
    it("retorna 401 quando a conta do token não existe mais, mesmo com o token ainda válido", async () => {
      const token = tokenService.generateToken(payload);
      setAccountExistsCheck(async (id) => id !== payload.userId);
      const req = makeReq({ cookies: { access_token: token } });
      const res = makeRes();
      const next: NextFunction = jest.fn();

      await authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(errorMessage(res)).toBe("Token inválido ou expirado");
      expect(req.userId).toBeUndefined();
    });

    it("consulta a conta do próprio token", async () => {
      const token = tokenService.generateToken(payload);
      const check = jest.fn(async () => true);
      setAccountExistsCheck(check);

      await authMiddleware(makeReq({ cookies: { access_token: token } }), makeRes(), jest.fn());

      expect(check).toHaveBeenCalledWith(payload.userId);
    });

    it("nega tudo quando a checagem não foi configurada (nunca pula a checagem em silêncio)", async () => {
      setAccountExistsCheck(null);
      const token = tokenService.generateToken(payload);
      const req = makeReq({ cookies: { access_token: token } });
      const res = makeRes();
      const next: NextFunction = jest.fn();

      await authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });

    it("nega quando a consulta ao banco falha", async () => {
      setAccountExistsCheck(async () => {
        throw new Error("database is down");
      });
      const token = tokenService.generateToken(payload);
      const res = makeRes();
      const next: NextFunction = jest.fn();

      await authMiddleware(makeReq({ cookies: { access_token: token } }), res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });
  });
});
