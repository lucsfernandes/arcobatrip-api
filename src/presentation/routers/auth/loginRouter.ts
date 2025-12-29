import { Router } from "express";
import zodToJsonSchema from "zod-to-json-schema";
import { validateBody } from "../../utils/validator";
import { loginPayloadValidation } from "../../validators/auth/authPayloadValidation";
import { loginUserController } from "../../../main/factories/auth/authFactory";

const loginRouter = Router();

const loginSwaggerSchema = zodToJsonSchema(loginPayloadValidation, {
  name: "LoginUserSchema",
});

const loginSwagger = {
  post: {
    summary: "Login user",
    tags: ["Auth"],
    responses: {
      200: {
        description: "Login successful",
      },
      400: {
        description: "Field validation error",
      },
      401: {
        description: "Invalid credentials",
      },
      403: {
        description: "User inactive",
      },
      500: {
        description: "Internal server error",
      },
    },
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: loginSwaggerSchema
        },
      },
    },
  },
};

loginRouter.post("/", validateBody(loginPayloadValidation), async (req, res) => {
  await loginUserController.execute(req, res);
});

export { loginRouter, loginSwagger };
