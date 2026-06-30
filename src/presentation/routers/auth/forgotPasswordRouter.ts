import { Router } from "express";
import zodToJsonSchema from "zod-to-json-schema";
import { validateBody } from "../../utils/validator";
import { forgotPasswordValidation } from "../../validators/auth/forgotPasswordValidation";
import { forgotPasswordController } from "../../../main/factories/auth/authFactory";

const forgotPasswordRouter = Router();

const forgotPasswordSwaggerSchema = zodToJsonSchema(forgotPasswordValidation, {
  name: "ForgotPasswordSchema",
});

const forgotPasswordSwagger = {
  post: {
    summary: "Start password reset flow",
    tags: ["Auth"],
    responses: {
      200: { description: "Password reset instructions sent if email exists" },
      400: { description: "Field validation error" },
      500: { description: "Internal server error" },
    },
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: forgotPasswordSwaggerSchema,
        },
      },
    },
  },
};

forgotPasswordRouter.post("/", validateBody(forgotPasswordValidation), async (req, res) => {
  await forgotPasswordController.execute(req, res);
});

export { forgotPasswordRouter, forgotPasswordSwagger };