import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { UseCaseError } from "../../../errors/UseCaseError";
import { ITokenService } from "../ITokenService";
import { RefreshTokenRequestDTO } from "./RefreshTokenRequestDTO";
import { RefreshTokenResponseDTO } from "./RefreshTokenResponseDTO";
import { env } from "../../../../main/config/env";

export class RefreshTokenUseCase implements IUseCase<RefreshTokenRequestDTO, RefreshTokenResponseDTO> {
  constructor(private tokenService: ITokenService) {}

  async execute(request: RefreshTokenRequestDTO): Promise<Result<RefreshTokenResponseDTO>> {
    const { refreshToken } = request;

    // Verificar se o refresh token está na blacklist
    const isBlacklisted = await this.tokenService.isRefreshTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      return Result.fail(new UseCaseError("Token de atualização inválido ou expirado", 401));
    }

    // Verificar e decodificar o refresh token
    const decoded = this.tokenService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return Result.fail(new UseCaseError("Token de atualização inválido ou expirado", 401));
    }

    // Invalidar o refresh token antigo (Rotation Strategy)
    await this.tokenService.invalidateRefreshToken(refreshToken);

    // Gerar novo par de tokens
    const payload = {
      userId: decoded.userId,
      email: decoded.email
    };

    const tokenPair = this.tokenService.generateTokenPair(payload);

    return Result.ok({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: env.JWT_EXPIRES_IN
    });
  }
}
