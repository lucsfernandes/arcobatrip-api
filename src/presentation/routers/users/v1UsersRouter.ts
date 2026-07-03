import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { rejectEmailMutation } from "../../middlewares/rejectEmailMutation";
import { uploadAvatarMiddleware } from "../../middlewares/uploadAvatar";
import { validateBody } from "../../utils/validator";
import { updateProfileValidation } from "../../validators/user/updateProfileValidation";
import { requestPhoneValidation } from "../../validators/user/requestPhoneValidation";
import { verifyPhoneValidation } from "../../validators/user/verifyPhoneValidation";
import {
  getProfileController,
  updateProfileController,
  uploadAvatarController,
  deleteAvatarController,
  requestPhoneVerificationController,
  verifyPhoneController,
} from "../../../main/factories/user/userFactory";

const v1UsersRouter = Router();

// Every /users route is authenticated.
v1UsersRouter.use(authMiddleware);

// Profile read / edit.
v1UsersRouter.get("/me", async (req, res) => {
  await getProfileController.execute(req, res);
});

v1UsersRouter.patch(
  "/me",
  rejectEmailMutation,
  validateBody(updateProfileValidation),
  async (req, res) => {
    await updateProfileController.execute(req, res);
  }
);

// Avatar.
v1UsersRouter.post("/me/avatar", uploadAvatarMiddleware, async (req, res) => {
  await uploadAvatarController.execute(req, res);
});

v1UsersRouter.delete("/me/avatar", async (req, res) => {
  await deleteAvatarController.execute(req, res);
});

// Phone verification (by email).
v1UsersRouter.post(
  "/me/phone",
  validateBody(requestPhoneValidation),
  async (req, res) => {
    await requestPhoneVerificationController.execute(req, res);
  }
);

v1UsersRouter.post(
  "/me/phone/verify",
  validateBody(verifyPhoneValidation),
  async (req, res) => {
    await verifyPhoneController.execute(req, res);
  }
);

export { v1UsersRouter };
