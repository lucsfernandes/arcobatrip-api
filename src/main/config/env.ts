import dotenv from "dotenv";
import { z } from "zod";

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Coerção booleana robusta para variáveis de ambiente (string -> boolean).
 *
 * NÃO usamos `z.coerce.boolean()` de propósito: ele aplica `Boolean(str)`, então
 * a string `"false"` viraria `true` (toda string não-vazia é truthy) — um footgun
 * clássico que quebraria justamente o fluxo de desenvolvimento `COOKIE_SECURE=false`.
 * Aqui as strings usuais de negação (`"false"`/`"0"`/`"no"`/`"off"`) viram `false`;
 * qualquer outra string não-vazia vira `true`; ausência usa o default informado.
 */
const envBoolean = (defaultValue: boolean) =>
  z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined || value.trim() === "") return defaultValue;
      return !["false", "0", "no", "off"].includes(value.trim().toLowerCase());
    });

const envSchema = z.object({
  PORT: z.string().optional().default("3000"),
  TYPEORM_HOST: z.string().default('http://localhost'),
  TYPEORM_PORT: z.coerce.number().default(5432),
  TYPEORM_USERNAME: z.string().min(1, "TYPEORM_USERNAME é obrigatório"),
  TYPEORM_PASSWORD: z.string().min(1, "TYPEORM_PASSWORD é obrigatório"),
  TYPEORM_DATABASE: z.string().min(1, "TYPEORM_DATABASE é obrigatório"),
  TYPEORM_SYNC: z.coerce.boolean().default(false),
  TYPEORM_SSLMODE: z.string().optional().default("prefer"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET é obrigatório e deve ter pelo menos 32 caracteres"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET é obrigatório e deve ter pelo menos 32 caracteres"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  // URL pública do frontend. Sua origem entra automaticamente na allowlist de CORS.
  WEB_BASE_URL: z.string().optional().default(""),
  API_BASE_URL: z.string().optional().default(""),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("Zarpa <no-reply@zarpa.com>"),
  APP_URL: z.string().default("http://localhost:5173"),
  // Google Sign-In: OAuth client ids separated by commas (web, android, ios).
  // Every id is an accepted token audience. Empty => POST /auth/social/google
  // answers 503 `google_not_configured` instead of failing at boot.
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  // CORS: lista de origens permitidas separadas por vírgula
  // (ex.: "http://localhost:3001,http://localhost:8081").
  // Vazio => modo dev: reflete uma allowlist de localhosts conhecidos (ver app.ts).
  CORS_ORIGINS: z.string().optional().default(""),
  EMAIL_VERIFICATION_TOKEN_TTL_MIN: z.coerce.number().default(1440),
  PASSWORD_RESET_TOKEN_TTL_MIN: z.coerce.number().default(60),
  // Verificação de celular por email (código numérico de 6 dígitos)
  PHONE_VERIFICATION_CODE_TTL_MIN: z.coerce.number().default(15),
  PHONE_VERIFICATION_RESEND_COOLDOWN_SEC: z.coerce.number().default(60),
  PHONE_VERIFICATION_MAX_ATTEMPTS: z.coerce.number().default(5),
  // Segredo HMAC para o hash do código de celular (6 dígitos, força-brutável em
  // SHA-256 puro). OPCIONAL: quando ausente, deriva-se um fallback determinístico
  // a partir de JWT_SECRET (ver hashPhoneCode) para não adicionar uma env
  // obrigatória que quebre o boot. Defina em produção para desacoplar do JWT.
  PHONE_CODE_SECRET: z.string().min(16).optional(),
  // Cloudinary (upload de avatar). Deixe vazio para desabilitar o upload em dev.
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
  // ── Cookies de autenticação (web HttpOnly) ────────────────────────────────
  // O web passa a usar cookies HttpOnly (access_token / refresh_token); o mobile
  // continua no header Authorization: Bearer. O backend aceita e emite AMBOS.
  //
  // COOKIE_SECURE: envia os cookies apenas por HTTPS. Default true (produção).
  //   Em DEV http, defina COOKIE_SECURE=false — senão o browser DESCARTA o cookie.
  COOKIE_SECURE: envBoolean(true),
  // COOKIE_SAMESITE: proteção CSRF PRINCIPAL desta fase (sem token CSRF explícito).
  //   "lax" (default) cobre o fluxo normal; "none" EXIGE Secure=true (regra do browser).
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  // COOKIE_DOMAIN: vazio => host-only (dev). Em produção com subdomínios, ex.:
  //   ".arcobatrox.com.br". Só é aplicado ao cookie quando NÃO-vazio.
  COOKIE_DOMAIN: z.string().optional().default(""),
});

// Validar variáveis de ambiente
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error("❌ Erro na configuração das variáveis de ambiente:");
  if (error instanceof z.ZodError) {
    error.issues.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  }
  process.exit(1);
}

export { env };