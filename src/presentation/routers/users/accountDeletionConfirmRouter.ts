import { Router } from "express";
import { authLimiter } from "../../middlewares/rateLimiters";
import { validateBody } from "../../utils/validator";
import { confirmAccountDeletionValidation } from "../../validators/user/confirmAccountDeletionValidation";
import { confirmAccountDeletionController } from "../../../main/factories/user/userFactory";

/**
 * `POST /users/me/deletion/confirm` is PUBLIC: it is opened from the link in an
 * e-mail, possibly in a browser or an app with no session. It lives in its own
 * router, mounted before `v1UsersRouter`, because every route there demands a
 * session. The single-use token is what authorises it.
 */
const accountDeletionConfirmRouter = Router();

accountDeletionConfirmRouter.post(
  "/",
  authLimiter,
  validateBody(confirmAccountDeletionValidation),
  async (req, res) => {
    await confirmAccountDeletionController.execute(req, res);
  }
);

export { accountDeletionConfirmRouter };
