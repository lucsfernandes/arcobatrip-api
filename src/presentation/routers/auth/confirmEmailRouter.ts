import { Router } from "express";
import zodToJsonSchema from "zod-to-json-schema";
import { validateBody } from "../../utils/validator";
import { verifyEmailValidation } from "../../validators/auth/verifyEmailValidation";
import { confirmEmailController } from "../../../main/factories/auth/authFactory";

const confirmEmailRouter = Router();

const confirmEmailSwaggerSchema = zodToJsonSchema(verifyEmailValidation, {
  name: "ConfirmEmailSchema",
});

const confirmEmailSwagger = {
  post: {
    summary: "Confirm user email",
    tags: ["Auth"],
    responses: {
      200: { description: "Email confirmed successfully" },
      400: { description: "Field validation error" },
      500: { description: "Internal server error" },
    },
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: confirmEmailSwaggerSchema,
        },
      },
    },
  },
};

confirmEmailRouter.post("/", validateBody(verifyEmailValidation), async (req, res) => {
  await confirmEmailController.execute(req, res);
});

export { confirmEmailRouter, confirmEmailSwagger };