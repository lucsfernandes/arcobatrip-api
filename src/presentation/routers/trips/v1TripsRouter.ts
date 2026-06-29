import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { validateBody } from "../../utils/validator";
import {
  createTripValidation,
  createActivityValidation,
  createLinkValidation,
  createGuestValidation,
  updateGuestStatusValidation,
} from "../../validators/trip/tripContractValidation";
import { createExpenseValidation } from "../../validators/expense/expenseValidation";
import {
  createTripContractController,
  listTripsController,
  getTripContractController,
  addActivityController,
  addLinkController,
  addGuestController,
  setGuestStatusController,
} from "../../../main/factories/trip/tripContractFactory";
import {
  getExpensesController,
  createExpenseController,
} from "../../../main/factories/expense/expenseFactory";

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

// Sub-resources
v1TripsRouter.post("/:id/activities", validateBody(createActivityValidation), (req, res) => {
  addActivityController.execute(req, res);
});
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

// Expenses (nested under a trip)
v1TripsRouter.get("/:id/expenses", (req, res) => {
  getExpensesController.execute(req, res);
});
v1TripsRouter.post("/:id/expenses", validateBody(createExpenseValidation), (req, res) => {
  createExpenseController.execute(req, res);
});

export { v1TripsRouter };
