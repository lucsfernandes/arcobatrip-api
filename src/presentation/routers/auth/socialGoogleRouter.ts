import { Router } from "express";
import zodToJsonSchema from "zod-to-json-schema";
import { validateBody } from "../../utils/validator";
import { authLimiter } from "../../middlewares/rateLimiters";
import { googleSignInPayloadValidation } from "../../validators/auth/authPayloadValidation";
import { googleSignInController } from "../../../main/factories/auth/authFactory";

const socialGoogleRouter = Router();

const socialGoogleSwaggerSchema = zodToJsonSchema(googleSignInPayloadValidation, {
  name: "GoogleSignInSchema",
});

const socialGoogleSwagger = {
  post: {
    summary: "Sign in with Google (OIDC ID token)",
    tags: ["Auth"],
    responses: {
      200: {
        description: "Sign-in successful. Returns { token, refreshToken, user }",
      },
      400: {
        description: "Field validation error / Google Sign-In not configured",
      },
      401: {
        description: "Invalid ID token or unverified Google email",
      },
      500: {
        description: "Internal server error",
      },
    },
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: socialGoogleSwaggerSchema,
        },
      },
    },
  },
};

socialGoogleRouter.post(
  "/",
  authLimiter,
  validateBody(googleSignInPayloadValidation),
  async (req, res) => {
    await googleSignInController.execute(req, res);
  }
);

export { socialGoogleRouter, socialGoogleSwagger };
