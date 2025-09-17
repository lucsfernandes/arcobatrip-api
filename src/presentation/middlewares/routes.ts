import { Router } from "express";
import { v1TripRouter, v1TripRouterSwagger } from "../routers/v1TripRouter";

const v1Router = Router();

const v1RouterSwagger = {
  ...v1TripRouterSwagger
};

v1Router.get("/health", (_req, res) => {
  console.info('Health check is OK!');
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

v1Router.use(v1TripRouter)

export { v1Router, v1RouterSwagger };