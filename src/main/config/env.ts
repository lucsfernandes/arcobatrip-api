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
  TYPEORM_SSLMODE: z.string().optional().default("prefer")
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