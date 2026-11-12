import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { uploadAvatarMiddleware } from "../../middlewares/uploadAvatar";
import { validateBody } from "../../utils/validator";
import {
  createTripValidation,
  createActivityValidation,
  updateActivityValidation,
  createLinkValidation,
  createGuestValidation,
  updateGuestStatusValidation,
  createActivityLinkValidation,
  createCommentValidation,
} from "../../validators/trip/tripContractValidation";
import { createExpenseValidation } from "../../validators/expense/expenseValidation";
import { createSettlementValidation } from "../../validators/settlement/settlementValidation";
import {
  createTripContractController,
  listTripsController,
  getTripContractController,
  addActivityController,
  updateActivityController,
  deleteActivityController,
  addLinkController,
  addGuestController,
  setGuestStatusController,
  uploadTripBannerController,
  deleteTripBannerController,
  uploadActivityBannerController,
  deleteActivityBannerController,
  addCommentController,
  listCommentsController,
  deleteCommentController,
  addActivityLinkController,
  listActivityLinksController,
  deleteActivityLinkController,
  deleteTripController,
  removeGuestController,
} from "../../../main/factories/trip/tripContractFactory";
import {
  getExpensesController,
  createExpenseController,
} from "../../../main/factories/expense/expenseFactory";
import {
  createSettlementController,
  deleteSettlementController,
} from "../../../main/factories/settlement/settlementFactory";

const v1TripsRouter = Router();

// Every trip route requires an authenticated session.
v1TripsRouter.use(authMiddleware);

// Trips
v1TripsRouter.get("/", (req, res) => {
  listTripsController.execute(req, res);
});
v1TripsRouter.post("/", validateBody(createTripValidation), (req, res) => {
  createTripContractController.execute(req, res);
});
v1TripsRouter.get("/:id", (req, res) => {
  getTripContractController.execute(req, res);
});
// Owner only; soft delete (the rows get `deleted_at`, nothing is erased).
v1TripsRouter.delete("/:id", (req, res) => {
  deleteTripController.execute(req, res);
});

// Trip banner (owner only). Reuses the single-image multipart middleware (field
// `file`, memory storage, jpeg/png/webp, 5MB) shared with the avatar flow.
v1TripsRouter.post("/:id/banner", uploadAvatarMiddleware, (req, res) => {
  uploadTripBannerController.execute(req, res);
});
v1TripsRouter.delete("/:id/banner", (req, res) => {
  deleteTripBannerController.execute(req, res);
});

// Sub-resources
v1TripsRouter.post("/:id/activities", validateBody(createActivityValidation), (req, res) => {
  addActivityController.execute(req, res);
});
v1TripsRouter.patch(
  "/:id/activities/:activityId",
  validateBody(updateActivityValidation),
  (req, res) => {
    updateActivityController.execute(req, res);
  }
);
v1TripsRouter.delete("/:id/activities/:activityId", (req, res) => {
  deleteActivityController.execute(req, res);
});
// Activity banner (activity creator or trip owner).
v1TripsRouter.post(
  "/:id/activities/:activityId/banner",
  uploadAvatarMiddleware,
  (req, res) => {
    uploadActivityBannerController.execute(req, res);
  }
);
v1TripsRouter.delete("/:id/activities/:activityId/banner", (req, res) => {
  deleteActivityBannerController.execute(req, res);
});

// Activity comments (Item 7b). Any participant reads/comments; author or trip
// owner deletes.
v1TripsRouter.get("/:id/activities/:activityId/comments", (req, res) => {
  listCommentsController.execute(req, res);
});
v1TripsRouter.post(
  "/:id/activities/:activityId/comments",
  validateBody(createCommentValidation),
  (req, res) => {
    addCommentController.execute(req, res);
  }
);
v1TripsRouter.delete(
  "/:id/activities/:activityId/comments/:commentId",
  (req, res) => {
    deleteCommentController.execute(req, res);
  }
);

// Activity links (Item 7c). Any participant reads; activity creator or trip
// owner adds/removes. URL is restricted to http/https.
v1TripsRouter.get("/:id/activities/:activityId/links", (req, res) => {
  listActivityLinksController.execute(req, res);
});
v1TripsRouter.post(
  "/:id/activities/:activityId/links",
  validateBody(createActivityLinkValidation),
  (req, res) => {
    addActivityLinkController.execute(req, res);
  }
);
v1TripsRouter.delete(
  "/:id/activities/:activityId/links/:linkId",
  (req, res) => {
    deleteActivityLinkController.execute(req, res);
  }
);

v1TripsRouter.post("/:id/links", validateBody(createLinkValidation), (req, res) => {
  addLinkController.execute(req, res);
});
v1TripsRouter.post("/:id/guests", validateBody(createGuestValidation), (req, res) => {
  addGuestController.execute(req, res);
});
v1TripsRouter.patch(
  "/:id/guests/:guestId",
  validateBody(updateGuestStatusValidation),
  (req, res) => {
    setGuestStatusController.execute(req, res);
  }
);
// Owner only, pending guests only (409 for host, confirmed or in the accounts).
v1TripsRouter.delete("/:id/guests/:guestId", (req, res) => {
  removeGuestController.execute(req, res);
});

// Expenses (nested under a trip)
v1TripsRouter.get("/:id/expenses", (req, res) => {
  getExpensesController.execute(req, res);
});
v1TripsRouter.post("/:id/expenses", validateBody(createExpenseValidation), (req, res) => {
  createExpenseController.execute(req, res);
});

// Settlements ("acerto de contas" — recorded payments). Any participant may
// record/undo. The pending settlements in GET/POST expenses discount these.
v1TripsRouter.post(
  "/:id/settlements",
  validateBody(createSettlementValidation),
  (req, res) => {
    createSettlementController.execute(req, res);
  }
);
v1TripsRouter.delete("/:id/settlements/:settlementId", (req, res) => {
  deleteSettlementController.execute(req, res);
});

export { v1TripsRouter };
