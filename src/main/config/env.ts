import dotenv from "dotenv";
import { z } from "zod";

// Carregar variáveis de ambiente
dotenv.config();

const envSchema = z.object({
  PORT: z.string().optional().default("3000"),
  TYPEORM_HOST: z.string().default('http://localhost'),
  TYPEORM_PORT: z.coerce.number().default(5432),
  TYPEORM_USERNAME: z.string().min(1, "TYPEORM_USERNAME é obrigatório"),
  TYPEORM_PASSWORD: z.string().min(1, "TYPEORM_PASSWORD é obrigatório"),
  TYPEORM_DATABASE: z.string().min(1, "TYPEORM_DATABASE é obrigatório"),
  TYPEORM_SYNC: z.coerce.boolean().default(false),
  TYPEORM_SSLMODE: z.string().optional().default("prefer"),
  JWT_SECRET: z.string().min(26, "JWT_SECRET deve ter pelo menos 26 caracteres").default("zarpa-secret-key-change-in-production-2024"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(26, "JWT_REFRESH_SECRET deve ter pelo menos 26 caracteres").default("zarpa-refresh-secret-key-change-in-production-2024"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("Zarpa <no-reply@zarpa.com>"),
  APP_URL: z.string().default("http://localhost:5173"),
  EMAIL_VERIFICATION_TOKEN_TTL_MIN: z.coerce.number().default(1440),
  PASSWORD_RESET_TOKEN_TTL_MIN: z.coerce.number().default(60),
  // Verificação de celular por email (código numérico de 6 dígitos)
  PHONE_VERIFICATION_CODE_TTL_MIN: z.coerce.number().default(15),
  PHONE_VERIFICATION_RESEND_COOLDOWN_SEC: z.coerce.number().default(60),
  PHONE_VERIFICATION_MAX_ATTEMPTS: z.coerce.number().default(5),
  // Cloudinary (upload de avatar). Deixe vazio para desabilitar o upload em dev.
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
});

// Validar variáveis de ambiente
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error("❌ Erro na configuração das variáveis de ambiente:");
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  }
  process.exit(1);
}

export { env };