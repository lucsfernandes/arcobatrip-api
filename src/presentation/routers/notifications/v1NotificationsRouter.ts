import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import {
  getNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
} from "../../../main/factories/notification/notificationFactory";

const v1NotificationsRouter = Router();

v1NotificationsRouter.use(authMiddleware);

v1NotificationsRouter.get("/", (req, res) => {
  getNotificationsController.execute(req, res);
});
v1NotificationsRouter.post("/read-all", (req, res) => {
  markAllNotificationsReadController.execute(req, res);
});
v1NotificationsRouter.patch("/:id/read", (req, res) => {
  markNotificationReadController.execute(req, res);
});

export { v1NotificationsRouter };
