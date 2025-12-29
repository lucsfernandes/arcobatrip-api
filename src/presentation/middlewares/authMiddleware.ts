import { Request, Response, NextFunction } from "express";
import { tokenService } from "../../infra/services/TokenService";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: "Token de autenticação não fornecido"
      });
      return;
    }

    const [bearer, token] = authHeader.split(" ");

    if (bearer !== "Bearer" || !token) {
      res.status(401).json({
        success: false,
        message: "Formato de token inválido."
      });
      return;
    }

    // Verificar se o token está na blacklist
    const isBlacklisted = await tokenService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: "Token inválido ou expirado"
      });
      return;
    }

    // Verificar e decodificar o token
    const decoded = tokenService.verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: "Token inválido ou expirado"
      });
      return;
    }

    // Adicionar informações do usuário à requisição
    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Erro ao verificar token de autenticação"
    });
  }
};
