import { Router } from "express";
import zodToJsonSchema from "zod-to-json-schema";
import { validateBody } from "../../utils/validator";
import { tripPayloadValidation } from "../../validators/trip/tripPayloadValidation";
import { createTripController } from "../../../main/factories/trip/tripFactory";

const createTripRouter = Router();

const createTripSwaggerSchema = zodToJsonSchema(tripPayloadValidation, {
  name: "CreateTripSchema",
});

const createTripSwagger = {
  post: {
    summary: "Create a new trip",
    tags: ["Trip"],
    responses: {
      200: {
        description: "Returns success message",
      },
      400: {
        description: "Field validation error",
      },
      500: {
        description: "Internal server error",
      },
    },
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: createTripSwaggerSchema
        },
      },
    },
  },
};

createTripRouter.post("/", validateBody(tripPayloadValidation), async (req, res) => {
  await createTripController.execute(req, res);
});

export { createTripRouter, createTripSwagger };