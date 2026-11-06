import { Router } from "express";
import { zodToSwagger } from "../../utils/zodToSwagger";
import { validateBody } from "../../utils/validator";
import { authLimiter } from "../../middlewares/rateLimiters";
import { registerPayloadValidation } from "../../validators/auth/authPayloadValidation";
import { registerUserController } from "../../../main/factories/auth/authFactory";

const registerRouter = Router();

const registerSwaggerSchema = zodToSwagger(registerPayloadValidation, {
  name: "RegisterUserSchema",
});

const registerSwagger = {
  post: {
    summary: "Register a new user",
    tags: ["Auth"],
    responses: {
      201: {
        description: "User created successfully",
      },
      400: {
        description: "Field validation error",
      },
      409: {
        description: "Email already exists",
      },
      500: {
        description: "Internal server error",
      },
    },
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: registerSwaggerSchema
        },
      },
    },
  },
};

registerRouter.post("/", authLimiter, validateBody(registerPayloadValidation), async (req, res) => {
  await registerUserController.execute(req, res);
});

export { registerRouter, registerSwagger };
