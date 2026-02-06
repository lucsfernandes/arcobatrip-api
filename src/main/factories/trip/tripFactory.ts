import { CreateTripUseCase } from "../../../application/usecases/trips/create/CreateTripUseCase";
import { GetTripDetailUseCase } from "../../../application/usecases/trips/getTripDetail/GetTripDetailUseCase";
import { CreateTripController } from "../../../presentation/controllers/Trip/CreateTripController";
import { GetTripDetailController } from "../../../presentation/controllers/Trip/GetTripDetailController";
import { tripRepo } from "../typeOrmRepoFactory";

const createTripUseCase = new CreateTripUseCase(tripRepo);
const createTripController = new CreateTripController(createTripUseCase);

const getTripDetailUseCase = new GetTripDetailUseCase(tripRepo);
const getTripDetailController = new GetTripDetailController(getTripDetailUseCase);

export {
  createTripController,
  getTripDetailController
}