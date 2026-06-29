import { Router } from "express";
import { v1AuthRouter, v1AuthRouterSwagger } from "../routers/v1AuthRouter";
import { v1TripsRouter } from "../routers/trips/v1TripsRouter";
import { v1NotificationsRouter } from "../routers/notifications/v1NotificationsRouter";
import { meRouter } from "../routers/auth/meRouter";

const v1Router = Router();

const v1RouterSwagger = {
  ...v1AuthRouterSwagger,
};

v1Router.get("/health", (_req, res) => {
  console.info('Health check is OK!');
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Auth (login / signup / logout / refresh / register) under /auth, plus /me at root.
v1Router.use(v1AuthRouter);
v1Router.use("/me", meRouter);

// Trips and their sub-resources (activities, links, guests, expenses).
v1Router.use("/trips", v1TripsRouter);

// Notifications.
v1Router.use("/notifications", v1NotificationsRouter);

export { v1Router, v1RouterSwagger };
