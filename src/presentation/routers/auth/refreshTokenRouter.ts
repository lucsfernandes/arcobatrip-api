import { Router } from "express";
import zodToJsonSchema from "zod-to-json-schema";
import { validateBody } from "../../utils/validator";
import { refreshTokenPayloadValidation } from "../../validators/auth/authPayloadValidation";
import { refreshTokenController } from "../../../main/factories/auth/authFactory";

const refreshTokenRouter = Router();

const refreshTokenSwaggerSchema = zodToJsonSchema(refreshTokenPayloadValidation, {
  name: "RefreshTokenSchema",
});

const refreshTokenSwagger = {
  post: {
    summary: "Refresh access token",
    tags: ["Auth"],
    responses: {
      200: {
        description: "Token refreshed successfully",
      },
      400: {
        description: "Field validation error",
      },
      401: {
        description: "Invalid or expired refresh token",
      },
      500: {
        description: "Internal server error",
      },
    },
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: refreshTokenSwaggerSchema
        },
      },
    },
  },
};

refreshTokenRouter.post("/", validateBody(refreshTokenPayloadValidation), async (req, res) => {
  await refreshTokenController.execute(req, res);
});

export { refreshTokenRouter, refreshTokenSwagger };
