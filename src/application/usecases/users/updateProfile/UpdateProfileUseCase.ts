import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { IUserRepo, UpdateUserPayload } from "../../auth/IUserRepo";
import { UserMap } from "../../../../infra/db/mappers/UserMap";
import { PhoneVerificationEmitter } from "../../../services/PhoneVerificationEmitter";
import { isE164, normalizePhone } from "../../../utils/phone";
import logger from "../../../../main/logger";
import { UpdateProfileRequestDTO } from "./UpdateProfileRequestDTO";
import { UpdateProfileResponseDTO } from "./UpdateProfileResponseDTO";

/**
 * Update the authenticated user's profile. Contract: `PATCH /users/me`. Applies
 * ONLY the whitelisted fields (fullName, phone, birthDate, bio, city, country).
 * Changing `phone` normalizes/validates it as E.164, flips `phoneVerified` to
 * false and (best-effort) fires a fresh phone-verification code by email.
 */
export class UpdateProfileUseCase
  implements IUseCase<UpdateProfileRequestDTO, UpdateProfileResponseDTO>
{
  constructor(
    private readonly userRepo: IUserRepo,
    private readonly phoneVerificationEmitter: PhoneVerificationEmitter
  ) {}

  async execute(
    request: UpdateProfileRequestDTO
  ): Promise<Result<UpdateProfileResponseDTO>> {
    const { userId, fullName, phone, birthDate, bio, city, country } = request;

    try {
      const current = await this.userRepo.findById(userId);
      if (!current) {
        return Result.fail(AppError.notFound("Usuário não encontrado"));
      }

      const payload: UpdateUserPayload = {};
      if (fullName !== undefined) payload.fullName = fullName;
      if (birthDate !== undefined) payload.birthDate = birthDate;
      if (bio !== undefined) payload.bio = bio;
      if (city !== undefined) payload.city = city;
      if (country !== undefined) payload.country = country;

      let phoneChanged = false;
      if (phone !== undefined) {
        const normalized = normalizePhone(phone);
        if (!isE164(normalized)) {
          return Result.fail(
            AppError.validation("Telefone inválido (formato E.164 esperado)", [
              { path: "phone", message: "Use o formato internacional, ex.: +5511999999999" },
            ])
          );
        }
        if (normalized !== current.phone) {
          payload.phone = normalized;
          payload.phoneVerified = false;
          phoneChanged = true;
        }
      }

      const updated = await this.userRepo.update(userId, payload);
      if (!updated) {
        return Result.fail(AppError.internal("Não foi possível atualizar o perfil"));
      }

      // Phone change → issue a verification code (best-effort: cooldown or a
      // transport hiccup must never fail the profile update).
      if (phoneChanged) {
        try {
          await this.phoneVerificationEmitter.requestCode({
            id: updated.id,
            email: updated.email,
            fullName: updated.fullName,
          });
        } catch (error) {
          logger.error("[UpdateProfileUseCase] falha ao enviar código de celular", error);
        }
      }

      return Result.ok(UserMap.toProfile(updated));
    } catch (error) {
      return Result.fail(AppError.internal((error as Error).message));
    }
  }
}
