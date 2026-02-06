import { Router } from "express";
import { createTripRouter } from "./trips/createTripRouter";
import { getTripDetailRouter } from "./trips/getTripDetailRouter";

const v1TripRouter = Router();

const v1TripRouterSwagger = {
  '/v1/trips': {
  }
}

v1TripRouter.use('/trips', createTripRouter);
v1TripRouter.use("/trips", getTripDetailRouter);

export { v1TripRouter, v1TripRouterSwagger };