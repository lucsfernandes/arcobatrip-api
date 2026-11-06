import { Router } from "express";
import { zodToSwagger } from "../../utils/zodToSwagger";
import { validateBody } from "../../utils/validator";
import { authLimiter } from "../../middlewares/rateLimiters";
import { signupValidation } from "../../validators/auth/signupValidation";
import { signupController } from "../../../main/factories/auth/authFactory";

const signupRouter = Router();

const signupSwaggerSchema = zodToSwagger(signupValidation, { name: "SignupSchema" });

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

signupRouter.post("/", authLimiter, validateBody(signupValidation), async (req, res) => {
  await signupController.execute(req, res);
});

export { signupRouter, signupSwagger };
