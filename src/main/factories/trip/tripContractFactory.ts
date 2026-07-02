import { tripContractRepo, userRepo, notificationEmitter } from "../typeOrmRepoFactory";

import { CreateTripContractUseCase } from "../../../application/usecases/trips/createTrip/CreateTripContractUseCase";
import { ListTripsUseCase } from "../../../application/usecases/trips/listTrips/ListTripsUseCase";
import { GetTripUseCase } from "../../../application/usecases/trips/getTrip/GetTripUseCase";
import { AddActivityUseCase } from "../../../application/usecases/trips/addActivity/AddActivityUseCase";
import { UpdateActivityUseCase } from "../../../application/usecases/trips/updateActivity/UpdateActivityUseCase";
import { DeleteActivityUseCase } from "../../../application/usecases/trips/deleteActivity/DeleteActivityUseCase";
import { AddLinkUseCase } from "../../../application/usecases/trips/addLink/AddLinkUseCase";
import { AddGuestUseCase } from "../../../application/usecases/trips/addGuest/AddGuestUseCase";
import { SetGuestStatusUseCase } from "../../../application/usecases/trips/setGuestStatus/SetGuestStatusUseCase";

import { CreateTripContractController } from "../../../presentation/controllers/Trip/CreateTripContractController";
import { ListTripsController } from "../../../presentation/controllers/Trip/ListTripsController";
import { GetTripController } from "../../../presentation/controllers/Trip/GetTripController";
import { AddActivityController } from "../../../presentation/controllers/Trip/AddActivityController";
import { UpdateActivityController } from "../../../presentation/controllers/Trip/UpdateActivityController";
import { DeleteActivityController } from "../../../presentation/controllers/Trip/DeleteActivityController";
import { AddLinkController } from "../../../presentation/controllers/Trip/AddLinkController";
import { AddGuestController } from "../../../presentation/controllers/Trip/AddGuestController";
import { SetGuestStatusController } from "../../../presentation/controllers/Trip/SetGuestStatusController";

const createTripUseCase = new CreateTripContractUseCase(tripContractRepo, userRepo, notificationEmitter);
const listTripsUseCase = new ListTripsUseCase(tripContractRepo);
const getTripUseCase = new GetTripUseCase(tripContractRepo);
const addActivityUseCase = new AddActivityUseCase(tripContractRepo, notificationEmitter);
const updateActivityUseCase = new UpdateActivityUseCase(tripContractRepo);
const deleteActivityUseCase = new DeleteActivityUseCase(tripContractRepo);
const addLinkUseCase = new AddLinkUseCase(tripContractRepo, notificationEmitter);
const addGuestUseCase = new AddGuestUseCase(tripContractRepo, notificationEmitter);
const setGuestStatusUseCase = new SetGuestStatusUseCase(tripContractRepo, notificationEmitter);

const createTripContractController = new CreateTripContractController(createTripUseCase);
const listTripsController = new ListTripsController(listTripsUseCase);
const getTripContractController = new GetTripController(getTripUseCase);
const addActivityController = new AddActivityController(addActivityUseCase);
const updateActivityController = new UpdateActivityController(updateActivityUseCase);
const deleteActivityController = new DeleteActivityController(deleteActivityUseCase);
const addLinkController = new AddLinkController(addLinkUseCase);
const addGuestController = new AddGuestController(addGuestUseCase);
const setGuestStatusController = new SetGuestStatusController(setGuestStatusUseCase);

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
};
