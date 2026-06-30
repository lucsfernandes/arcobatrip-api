import { Router } from "express";
import zodToJsonSchema from "zod-to-json-schema";
import { validateBody } from "../../utils/validator";
import { resetPasswordValidation } from "../../validators/auth/resetPasswordValidation";
import { resetPasswordController } from "../../../main/factories/auth/authFactory";

const resetPasswordRouter = Router();

const resetPasswordSwaggerSchema = zodToJsonSchema(resetPasswordValidation, {
  name: "ResetPasswordSchema",
});

const resetPasswordSwagger = {
  post: {
    summary: "Set a new password from reset token",
    tags: ["Auth"],
    responses: {
      200: { description: "Password reset successfully" },
      400: { description: "Field validation error" },
      500: { description: "Internal server error" },
    },
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: resetPasswordSwaggerSchema,
        },
      },
    },
  },
};

resetPasswordRouter.post("/", validateBody(resetPasswordValidation), async (req, res) => {
  await resetPasswordController.execute(req, res);
});

export { resetPasswordRouter, resetPasswordSwagger };