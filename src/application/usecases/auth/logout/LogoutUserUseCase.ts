import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { UseCaseError } from "../../../errors/UseCaseError";
import { LogoutUserRequestDTO } from "./LogoutUserRequestDTO";
import { LogoutUserResponseDTO } from "./LogoutUserResponseDTO";
import { ITokenService } from "../ITokenService";

export class LogoutUserUseCase implements IUseCase<LogoutUserRequestDTO, LogoutUserResponseDTO> {
  constructor(
    private tokenService: ITokenService
  ) {}

  async execute(request: LogoutUserRequestDTO): Promise<Result<LogoutUserResponseDTO>> {
    const { token } = request;

    try {
      // Invalidar o token (adicionar à blacklist)
      await this.tokenService.invalidateToken(token);

      return Result.ok({
        message: "Logout realizado com sucesso"
      });
    } catch (error: any) {
      return Result.fail(new UseCaseError(error.message || "Erro ao realizar logout", 500));
    }
  }
}
