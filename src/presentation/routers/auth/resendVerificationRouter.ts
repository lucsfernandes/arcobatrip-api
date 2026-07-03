import { Router } from "express";
import zodToJsonSchema from "zod-to-json-schema";
import { validateBody } from "../../utils/validator";
import { emailLimiter } from "../../middlewares/rateLimiters";
import { resendVerificationValidation } from "../../validators/auth/resendVerificationValidation";
import { resendVerificationController } from "../../../main/factories/auth/authFactory";

const resendVerificationRouter = Router();

const resendVerificationSwaggerSchema = zodToJsonSchema(resendVerificationValidation, {
  name: "ResendVerificationSchema",
});

const resendVerificationSwagger = {
  post: {
    summary: "Resend email verification link",
    tags: ["Auth"],
    responses: {
      200: { description: "Verification link sent if needed" },
      400: { description: "Field validation error" },
      500: { description: "Internal server error" },
    },
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: resendVerificationSwaggerSchema,
        },
      },
    },
  },
};

resendVerificationRouter.post("/", emailLimiter, validateBody(resendVerificationValidation), async (req, res) => {
  await resendVerificationController.execute(req, res);
});

export { resendVerificationRouter, resendVerificationSwagger };