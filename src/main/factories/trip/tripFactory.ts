import { CreateTripUseCase } from "../../../application/usecases/trips/create/CreateTripUseCase";
import { CreateTripController } from "../../../presentation/controllers/Trip/CreateTripController";
import { participantRepo, tripRepo } from "../typeOrmRepoFactory";

const createTripUseCase = new CreateTripUseCase(tripRepo, participantRepo);
const createTripController = new CreateTripController(createTripUseCase);

export {
  createTripController
}