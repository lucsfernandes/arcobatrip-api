import { Router } from "express";
import { logoutUserController } from "../../../main/factories/auth/authFactory";
import { authMiddleware } from "../../middlewares/authMiddleware";

const logoutRouter = Router();

const logoutSwagger = {
  post: {
    summary: "Logout user",
    tags: ["Auth"],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Logout successful",
      },
      401: {
        description: "Unauthorized",
      },
      500: {
        description: "Internal server error",
      },
    },
  },
};

logoutRouter.post("/", authMiddleware, async (req, res) => {
  await logoutUserController.execute(req, res);
});

export { logoutRouter, logoutSwagger };
