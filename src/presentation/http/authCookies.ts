import { CookieOptions, Response } from "express";
import { env } from "../../main/config/env";

/**
 * Cookies HttpOnly de autenticação do web.
 *
 * O web (browser) passa a autenticar por cookies HttpOnly — imunes a leitura por
 * JavaScript, logo mais resistentes a roubo de token via XSS. O mobile (React
 * Native) continua usando `Authorization: Bearer`. O backend aceita e emite
 * AMBOS os mecanismos simultaneamente, então nenhuma plataforma quebra.
 */

/** Nome do cookie HttpOnly que carrega o access token JWT (curto: ~15min). */
export const ACCESS_COOKIE = "access_token";

/** Nome do cookie HttpOnly que carrega o refresh token JWT (longo: ~7 dias). */
export const REFRESH_COOKIE = "refresh_token";

/**
 * Janela (em ms) em que o browser ARMAZENA cada cookie (`Max-Age`).
 *
 * Derivadas dos TTLs dos JWTs (`JWT_EXPIRES_IN` ~ "15m" e `JWT_REFRESH_EXPIRES_IN`
 * ~ "7d"). Como esses valores são strings configuráveis e o parsing de "15m"/"7d"
 * é frágil, fixamos constantes que casam com os defaults do projeto e documentamos
 * a intenção — se você alterar os TTLs dos JWTs, ajuste aqui também.
 *
 * IMPORTANTE: `Max-Age` do cookie é só a validade de ARMAZENAMENTO no browser; a
 * autoridade real de expiração continua sendo a assinatura/`exp` do JWT verificada
 * no servidor. Um cookie ainda "vivo" com JWT expirado resulta em 401 na mesma.
 */
const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutos
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

/** Par de tokens emitidos por login/signup/refresh. */
export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
}

/**
 * Opções base compartilhadas por todos os cookies de auth (emissão e limpeza).
 *
 * - `httpOnly`: o JS do browser NUNCA lê o cookie — principal defesa anti-XSS.
 * - `sameSite`: proteção CSRF PRINCIPAL desta fase (não há token CSRF explícito).
 *   Default `"lax"`: o cookie não acompanha requisições cross-site "perigosas"
 *   (ex.: POST disparado por um form de outro site), mas segue a navegação
 *   top-level normal. Configurável via `COOKIE_SAMESITE`.
 * - `secure`: só trafega por HTTPS (configurável — `false` em dev http).
 * - `path` `"/"`: vale para toda a API.
 * - `domain`: só é enviado quando `COOKIE_DOMAIN` é NÃO-vazio (host-only em dev).
 *
 * Regra do browser: `SameSite=None` EXIGE `Secure=true`. A configuração coerente
 * é responsabilidade do operador (documentada no `.env.example`).
 */
function baseCookieOptions(): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: "/",
  };
  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }
  return options;
}

/**
 * Emite os cookies HttpOnly de acesso e refresh na resposta. Deve ser chamado
 * após um login/signup/refresh bem-sucedido, ANTES de enviar o corpo.
 *
 * NÃO substitui nem altera o corpo `{ token, user }` (o mobile depende dele) —
 * apenas ADICIONA os cabeçalhos `Set-Cookie` consumidos pelo web (que faz as
 * requisições com `credentials: 'include'`).
 */
export function setAuthCookies(res: Response, tokens: AuthTokens): void {
  const base = baseCookieOptions();
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

/**
 * Limpa ambos os cookies de auth (logout). O browser só remove um cookie quando
 * os atributos `path`/`domain`/`secure`/`sameSite` casam com os da emissão — por
 * isso reutilizamos exatamente as mesmas opções base.
 */
export function clearAuthCookies(res: Response): void {
  const base = baseCookieOptions();
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}
