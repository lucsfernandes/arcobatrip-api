import { Router } from "express";
import { createTripRouter } from "./trips/createTripRouter";

const v1TripRouter = Router();

const v1TripRouterSwagger = {
  '/v1/trips': {
  }
}

v1TripRouter.use('/trips', createTripRouter);

export { v1TripRouter, v1TripRouterSwagger };