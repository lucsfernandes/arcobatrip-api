import { z } from "zod";

/**
 * Converts a Zod schema into an inline OpenAPI 3.0 schema object for Swagger
 * docs, using Zod 4's native `z.toJSONSchema` (replaces `zod-to-json-schema`,
 * which does not support Zod 4).
 *
 * - `io: "input"`: documents what the client must SEND (before transforms/defaults).
 * - `unrepresentable: "any"`: types with no JSON Schema equivalent (e.g.
 *   `z.coerce.date()`) become `{}` instead of throwing at boot.
 */
export function zodToSwagger(
  schema: z.ZodType,
  options: { name?: string } = {}
): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema, {
    target: "openapi-3.0",
    io: "input",
    unrepresentable: "any",
  }) as Record<string, unknown>;

  delete jsonSchema.$schema;
  return options.name ? { title: options.name, ...jsonSchema } : jsonSchema;
}
