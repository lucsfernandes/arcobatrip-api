import { Router } from "express";
import { getMeController } from "../../../main/factories/auth/authFactory";
import { authMiddleware } from "../../middlewares/authMiddleware";

const meRouter = Router();

const meSwagger = {
  get: {
    summary: "Get current user profile",
    tags: ["Auth"],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "User profile retrieved successfully",
      },
      401: {
        description: "Unauthorized",
      },
      404: {
        description: "User not found",
      },
      500: {
        description: "Internal server error",
      },
    },
  },
};

meRouter.get("/", authMiddleware, async (req, res) => {
  await getMeController.execute(req, res);
});

export { meRouter, meSwagger };
