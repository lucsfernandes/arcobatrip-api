import { FindOneParticipantByEmailUseCase } from "../../../application/usecases/participants/findOneByEmail/FindOneParticipantByEmailUseCase";
import { FindOneParticipantByEmailController } from "../../../presentation/controllers/Participant/FindOneParticipantByEmailController";
import { participantRepo } from "../typeOrmRepoFactory";

const findOneParticipantByEmailUseCase = new FindOneParticipantByEmailUseCase(participantRepo);

const findOneParticipantByEmailController = new FindOneParticipantByEmailController(findOneParticipantByEmailUseCase);

export {
  findOneParticipantByEmailController
};