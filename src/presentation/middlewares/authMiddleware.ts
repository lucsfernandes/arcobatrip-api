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
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      unauthorized(res, "Token de autenticação não fornecido");
      return;
    }

    const [bearer, token] = authHeader.split(" ");

    if (bearer !== "Bearer" || !token) {
      unauthorized(res, "Formato de token inválido");
      return;
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
