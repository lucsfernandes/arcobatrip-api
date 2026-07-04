import { z } from "zod";

const registerPayloadValidation = z.object({
  full_name: z.string()
    .min(3, "Nome completo deve ter pelo menos 3 caracteres")
    .max(100, "Nome completo deve ter no máximo 100 caracteres"),
  phone: z.string()
    .min(10, "Telefone deve ter pelo menos 10 caracteres")
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .regex(/^[\d\s\-\+\(\)]+$/, "Telefone deve conter apenas números e caracteres válidos"),
  email: z.string()
    .email("Email inválido"),
  password: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
  confirm_password: z.string()
    .min(8, "Confirmação de senha deve ter pelo menos 8 caracteres"),
  birth_date: z.coerce.date()
    .refine((date) => {
      const age = Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return age >= 13;
    }, "Usuário deve ter pelo menos 13 anos")
}).refine((data) => data.password === data.confirm_password, {
  message: "As senhas não coincidem",
  path: ["confirm_password"]
});

const loginPayloadValidation = z.object({
  email: z.string()
    .email("Email inválido"),
  password: z.string()
    .min(1, "Senha é obrigatória")
});

// Fluxo DUAL de refresh: o web renova via cookie HttpOnly `refresh_token` e envia
// o POST /auth/refresh SEM corpo; o mobile continua mandando `refreshToken` no
// corpo. Por isso o campo é opcional e o corpo inteiro tem `default({})` — uma
// requisição sem corpo (inclusive sem Content-Type, quando `req.body` é
// `undefined`) não pode falhar a validação. O controller resolve cookie-ou-corpo
// e delega ao use case a resposta 401 quando nenhum token está presente.
const refreshTokenPayloadValidation = z
  .object({
    refreshToken: z
      .string()
      .min(1, "Token de atualização é obrigatório")
      .optional(),
  })
  .default({});

export {
  registerPayloadValidation,
  loginPayloadValidation,
  refreshTokenPayloadValidation
};
