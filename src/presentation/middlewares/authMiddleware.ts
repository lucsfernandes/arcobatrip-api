import { Request, Response, NextFunction } from "express";
import { tokenService } from "../../infra/services/TokenService";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/** Emit the contract error envelope for a 401. */
function unauthorized(res: Response, message: string): void {
  res.status(401).json({ error: { code: "unauthorized", message } });
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Autenticação DUAL: o web envia o access token no cookie HttpOnly
    // `access_token`; o mobile continua enviando `Authorization: Bearer`. O
    // cookie tem precedência quando presente; senão caímos no header. As
    // mensagens/códigos 401 permanecem idênticos para não mudar o contrato.
    const cookieToken =
      typeof req.cookies?.access_token === "string" ? req.cookies.access_token : "";

    let token = cookieToken;

    if (!token) {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        unauthorized(res, "Token de autenticação não fornecido");
        return;
      }

      const [bearer, headerToken] = authHeader.split(" ");

      if (bearer !== "Bearer" || !headerToken) {
        unauthorized(res, "Formato de token inválido");
        return;
      }

      token = headerToken;
    }

    const isBlacklisted = await tokenService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      unauthorized(res, "Token inválido ou expirado");
      return;
    }

    const decoded = tokenService.verifyToken(token);

    if (!decoded) {
      unauthorized(res, "Token inválido ou expirado");
      return;
    }

    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    next();
  } catch {
    unauthorized(res, "Erro ao verificar token de autenticação");
  }
};
