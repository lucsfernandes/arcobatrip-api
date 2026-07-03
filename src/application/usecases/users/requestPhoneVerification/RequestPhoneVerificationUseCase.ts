import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { IUserRepo } from "../../auth/IUserRepo";
import { PhoneVerificationEmitter } from "../../../services/PhoneVerificationEmitter";
import { isE164, normalizePhone } from "../../../utils/phone";
import { RequestPhoneVerificationRequestDTO } from "./RequestPhoneVerificationRequestDTO";
import { RequestPhoneVerificationResponseDTO } from "./RequestPhoneVerificationResponseDTO";

/**
 * Set/update the phone number and start verification. Contract:
 * `POST /users/me/phone`. Validates E.164, then (respecting the resend cooldown)
 * issues a 6-digit code by email and persists the number as unverified.
 */
export class RequestPhoneVerificationUseCase
  implements
    IUseCase<RequestPhoneVerificationRequestDTO, RequestPhoneVerificationResponseDTO>
{
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly phoneVerificationEmitter: PhoneVerificationEmitter
  ) {}

  async execute(
    request: RequestPhoneVerificationRequestDTO
  ): Promise<Result<RequestPhoneVerificationResponseDTO>> {
    const { userId, phoneNumber } = request;

    const normalized = normalizePhone(phoneNumber);
    if (!isE164(normalized)) {
      return Result.fail(
        AppError.validation("Telefone inválido (formato E.164 esperado)", [
          { path: "phoneNumber", message: "Use o formato internacional, ex.: +5511999999999" },
        ])
      );
    }

    try {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        return Result.fail(AppError.notFound("Usuário não encontrado"));
      }

      // Cooldown check before persisting — avoids flipping state on a blocked resend.
      const result = await this.phoneVerificationEmitter.requestCode({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      });

      if (!result.sent) {
        return Result.fail(
          AppError.tooManyRequests(
            `Aguarde ${result.retryAfterSeconds ?? 60}s antes de solicitar um novo código`
          )
        );
      }

      await this.userRepo.update(userId, {
        phone: normalized,
        phoneVerified: false,
      });

      return Result.ok({
        message: "Enviamos um código de verificação para o seu email.",
      });
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}
