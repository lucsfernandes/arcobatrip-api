import {
  tripContractRepo,
  userRepo,
  notificationEmitter,
  expenseRepo,
  settledPaymentRepo,
} from "../typeOrmRepoFactory";
import { storageService } from "../../../infra/services/storage/CloudinaryStorageService";

import { CreateTripContractUseCase } from "../../../application/usecases/trips/createTrip/CreateTripContractUseCase";
import { ListTripsUseCase } from "../../../application/usecases/trips/listTrips/ListTripsUseCase";
import { GetTripUseCase } from "../../../application/usecases/trips/getTrip/GetTripUseCase";
import { AddActivityUseCase } from "../../../application/usecases/trips/addActivity/AddActivityUseCase";
import { UpdateActivityUseCase } from "../../../application/usecases/trips/updateActivity/UpdateActivityUseCase";
import { DeleteActivityUseCase } from "../../../application/usecases/trips/deleteActivity/DeleteActivityUseCase";
import { DeleteTripUseCase } from "../../../application/usecases/trips/deleteTrip/DeleteTripUseCase";
import { RemoveGuestUseCase } from "../../../application/usecases/trips/removeGuest/RemoveGuestUseCase";
import { AddLinkUseCase } from "../../../application/usecases/trips/addLink/AddLinkUseCase";
import { AddGuestUseCase } from "../../../application/usecases/trips/addGuest/AddGuestUseCase";
import { SetGuestStatusUseCase } from "../../../application/usecases/trips/setGuestStatus/SetGuestStatusUseCase";
import { UploadTripBannerUseCase } from "../../../application/usecases/trips/uploadTripBanner/UploadTripBannerUseCase";
import { DeleteTripBannerUseCase } from "../../../application/usecases/trips/deleteTripBanner/DeleteTripBannerUseCase";
import { UploadActivityBannerUseCase } from "../../../application/usecases/trips/uploadActivityBanner/UploadActivityBannerUseCase";
import { DeleteActivityBannerUseCase } from "../../../application/usecases/trips/deleteActivityBanner/DeleteActivityBannerUseCase";
import { AddCommentUseCase } from "../../../application/usecases/trips/addComment/AddCommentUseCase";
import { ListCommentsUseCase } from "../../../application/usecases/trips/listComments/ListCommentsUseCase";
import { DeleteCommentUseCase } from "../../../application/usecases/trips/deleteComment/DeleteCommentUseCase";
import { AddActivityLinkUseCase } from "../../../application/usecases/trips/addActivityLink/AddActivityLinkUseCase";
import { ListActivityLinksUseCase } from "../../../application/usecases/trips/listActivityLinks/ListActivityLinksUseCase";
import { DeleteActivityLinkUseCase } from "../../../application/usecases/trips/deleteActivityLink/DeleteActivityLinkUseCase";

import { CreateTripContractController } from "../../../presentation/controllers/Trip/CreateTripContractController";
import { ListTripsController } from "../../../presentation/controllers/Trip/ListTripsController";
import { GetTripController } from "../../../presentation/controllers/Trip/GetTripController";
import { AddActivityController } from "../../../presentation/controllers/Trip/AddActivityController";
import { UpdateActivityController } from "../../../presentation/controllers/Trip/UpdateActivityController";
import { DeleteActivityController } from "../../../presentation/controllers/Trip/DeleteActivityController";
import { DeleteTripController } from "../../../presentation/controllers/Trip/DeleteTripController";
import { RemoveGuestController } from "../../../presentation/controllers/Trip/RemoveGuestController";
import { AddLinkController } from "../../../presentation/controllers/Trip/AddLinkController";
import { AddGuestController } from "../../../presentation/controllers/Trip/AddGuestController";
import { SetGuestStatusController } from "../../../presentation/controllers/Trip/SetGuestStatusController";
import { UploadTripBannerController } from "../../../presentation/controllers/Trip/UploadTripBannerController";
import { DeleteTripBannerController } from "../../../presentation/controllers/Trip/DeleteTripBannerController";
import { UploadActivityBannerController } from "../../../presentation/controllers/Trip/UploadActivityBannerController";
import { DeleteActivityBannerController } from "../../../presentation/controllers/Trip/DeleteActivityBannerController";
import { AddCommentController } from "../../../presentation/controllers/Trip/AddCommentController";
import { ListCommentsController } from "../../../presentation/controllers/Trip/ListCommentsController";
import { DeleteCommentController } from "../../../presentation/controllers/Trip/DeleteCommentController";
import { AddActivityLinkController } from "../../../presentation/controllers/Trip/AddActivityLinkController";
import { ListActivityLinksController } from "../../../presentation/controllers/Trip/ListActivityLinksController";
import { DeleteActivityLinkController } from "../../../presentation/controllers/Trip/DeleteActivityLinkController";

const createTripUseCase = new CreateTripContractUseCase(tripContractRepo, userRepo, notificationEmitter);
const listTripsUseCase = new ListTripsUseCase(tripContractRepo);
const getTripUseCase = new GetTripUseCase(tripContractRepo);
const addActivityUseCase = new AddActivityUseCase(tripContractRepo, notificationEmitter);
const updateActivityUseCase = new UpdateActivityUseCase(tripContractRepo);
const deleteActivityUseCase = new DeleteActivityUseCase(tripContractRepo);
const addLinkUseCase = new AddLinkUseCase(tripContractRepo, notificationEmitter);
const addGuestUseCase = new AddGuestUseCase(tripContractRepo, notificationEmitter);
const setGuestStatusUseCase = new SetGuestStatusUseCase(tripContractRepo, notificationEmitter);
const uploadTripBannerUseCase = new UploadTripBannerUseCase(tripContractRepo, storageService);
const deleteTripBannerUseCase = new DeleteTripBannerUseCase(tripContractRepo, storageService);
const uploadActivityBannerUseCase = new UploadActivityBannerUseCase(
  tripContractRepo,
  storageService
);
const deleteActivityBannerUseCase = new DeleteActivityBannerUseCase(
  tripContractRepo,
  storageService
);
const addCommentUseCase = new AddCommentUseCase(tripContractRepo);
const listCommentsUseCase = new ListCommentsUseCase(tripContractRepo);
const deleteCommentUseCase = new DeleteCommentUseCase(tripContractRepo);
const addActivityLinkUseCase = new AddActivityLinkUseCase(tripContractRepo);
const listActivityLinksUseCase = new ListActivityLinksUseCase(tripContractRepo);
const deleteActivityLinkUseCase = new DeleteActivityLinkUseCase(tripContractRepo);
const deleteTripUseCase = new DeleteTripUseCase(tripContractRepo);
const removeGuestUseCase = new RemoveGuestUseCase(
  tripContractRepo,
  expenseRepo,
  settledPaymentRepo
);

const createTripContractController = new CreateTripContractController(createTripUseCase);
const listTripsController = new ListTripsController(listTripsUseCase);
const getTripContractController = new GetTripController(getTripUseCase);
const addActivityController = new AddActivityController(addActivityUseCase);
const updateActivityController = new UpdateActivityController(updateActivityUseCase);
const deleteActivityController = new DeleteActivityController(deleteActivityUseCase);
const addLinkController = new AddLinkController(addLinkUseCase);
const addGuestController = new AddGuestController(addGuestUseCase);
const setGuestStatusController = new SetGuestStatusController(setGuestStatusUseCase);
const uploadTripBannerController = new UploadTripBannerController(uploadTripBannerUseCase);
const deleteTripBannerController = new DeleteTripBannerController(deleteTripBannerUseCase);
const uploadActivityBannerController = new UploadActivityBannerController(
  uploadActivityBannerUseCase
);
const deleteActivityBannerController = new DeleteActivityBannerController(
  deleteActivityBannerUseCase
);
const addCommentController = new AddCommentController(addCommentUseCase);
const listCommentsController = new ListCommentsController(listCommentsUseCase);
const deleteCommentController = new DeleteCommentController(deleteCommentUseCase);
const addActivityLinkController = new AddActivityLinkController(addActivityLinkUseCase);
const listActivityLinksController = new ListActivityLinksController(
  listActivityLinksUseCase
);
const deleteActivityLinkController = new DeleteActivityLinkController(
  deleteActivityLinkUseCase
);
const deleteTripController = new DeleteTripController(deleteTripUseCase);
const removeGuestController = new RemoveGuestController(removeGuestUseCase);

export {
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
};
