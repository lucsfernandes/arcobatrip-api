import dotenv from "dotenv-safe";
import { z } from "zod";

dotenv.config({
  allowEmptyValues: true
});

const envSchema = z.object({
  PORT: z.string().optional().default("3000"),
  TYPEORM_HOST: z.string().default('http://localhost'),
  TYPEORM_PORT: z.coerce.number().default(5432),
  TYPEORM_USERNAME: z.string(),
  TYPEORM_PASSWORD: z.string(),
  TYPEORM_DATABASE: z.string(),
  TYPEORM_SYNC: z.coerce.boolean().default(false)
})

export const env = envSchema.parse(process.env);