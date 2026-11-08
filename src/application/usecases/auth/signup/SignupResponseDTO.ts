import { AuthResponseContract } from "../../../contracts/contract";

/**
 * Resultado do caso de uso de signup.
 *
 * Alinhado 1:1 ao contrato de rede {@link AuthResponseContract}
 * (`{ token, refreshToken, user }`). O `refreshToken` vai TANTO no corpo JSON
 * (consumido pelo mobile, que não acessa cookies) quanto no cookie HttpOnly de
 * refresh emitido pelo `SignupController` (consumido pelo web).
 */
export type SignupResponseDTO = AuthResponseContract;
