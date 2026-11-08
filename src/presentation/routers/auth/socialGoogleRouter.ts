import { Router } from "express";
import { zodToSwagger } from "../../utils/zodToSwagger";
import { validateBody } from "../../utils/validator";
import { authLimiter } from "../../middlewares/rateLimiters";
import { googleSignInPayloadValidation } from "../../validators/auth/authPayloadValidation";
import { googleSignInController } from "../../../main/factories/auth/authFactory";

const socialGoogleRouter = Router();

const socialGoogleSwaggerSchema = zodToSwagger(googleSignInPayloadValidation, {
  name: "GoogleSignInSchema",
});

const socialGoogleSwagger = {
  post: {
    summary: "Sign in with Google (OIDC ID token)",
    description:
      "Verifies a Google ID token. Known e-mail → signs in to that account; unknown e-mail → creates a password-less account. Returns the same body as login.",
    tags: ["Auth"],
    responses: {
      200: {
        description: "Signed in. Returns { token, refreshToken, user }",
      },
      400: {
        description: "Field validation error",
      },
      401: {
        description: "Invalid/expired ID token, or the Google e-mail is not verified",
      },
      403: {
        description: "User inactive",
      },
      503: {
        description: "Google Sign-In is not configured on the server (GOOGLE_CLIENT_ID)",
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
