import { AuthResponseContract } from "../../../contracts/contract";

/**
 * Resultado do caso de uso de signup.
 *
 * Superset do contrato de rede {@link AuthResponseContract} (`{ token, user }`):
 * carrega um `refreshToken` EXTRA que a camada HTTP usa apenas para setar o
 * cookie HttpOnly de refresh. Esse `refreshToken` NÃO faz parte do corpo JSON —
 * o `SignupController` o remove ao montar a resposta, preservando 1:1 o contrato
 * `{ token, user }` do qual o mobile depende. O contrato canônico permanece
 * intocado (não adicionamos campos a `AuthResponseContract`).
 */
export interface SignupResponseDTO extends AuthResponseContract {
  refreshToken: string;
}
