import { Router } from "express";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { getTripDetailController } from "../../../main/factories/trip/tripFactory";

const getTripDetailRouter = Router();

const getTripDetailSwaggerSchema = zodToJsonSchema(z.string(), {
  name: "GetTripDetailSchema"
});

const getTripDetailSwagger = {
  get: {
    summary: "Get trip detail by ID",
    tags: ["Trip"],
    responses: {
      200: {
        description: "Returns trip detail"
      },
      400: {
        description: "Field validation error"
      },
      500: {
        description: "Internal server error"
      }
    },
    parameters: [
      {
        name: "tripId",
        in: "path",
        required: true,
        schema: getTripDetailSwaggerSchema,
        description: "ID of the trip to retrieve details for"
      }
    ]
  }
};

getTripDetailRouter.get("/:tripId", async (req, res) => {
  // Implementation for getting trip detail by ID goes here
  await getTripDetailController.execute(req, res);
  // res.status(200).json({ message: "Trip detail retrieved successfully" });
});

export { getTripDetailRouter, getTripDetailSwagger };