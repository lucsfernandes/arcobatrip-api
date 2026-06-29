import { Router } from "express";
import zodToJsonSchema from "zod-to-json-schema";
import { validateBody } from "../../utils/validator";
import { signupValidation } from "../../validators/auth/signupValidation";
import { signupController } from "../../../main/factories/auth/authFactory";

const signupRouter = Router();

const signupSwaggerSchema = zodToJsonSchema(signupValidation, { name: "SignupSchema" });

const signupSwagger = {
  post: {
    summary: "Register a new account and start a session",
    tags: ["Auth"],
    responses: {
      201: { description: "Account created. Returns { token, user }" },
      400: { description: "Field validation error" },
      409: { description: "Email already registered" },
    },
    requestBody: {
      required: true,
      content: { "application/json": { schema: signupSwaggerSchema } },
    },
  },
};

signupRouter.post("/", validateBody(signupValidation), async (req, res) => {
  await signupController.execute(req, res);
});

export { signupRouter, signupSwagger };
