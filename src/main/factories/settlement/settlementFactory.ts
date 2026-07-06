import { tripContractRepo, settledPaymentRepo } from "../typeOrmRepoFactory";
import { CreateSettlementUseCase } from "../../../application/usecases/settlements/createSettlement/CreateSettlementUseCase";
import { DeleteSettlementUseCase } from "../../../application/usecases/settlements/deleteSettlement/DeleteSettlementUseCase";
import { CreateSettlementController } from "../../../presentation/controllers/Settlement/CreateSettlementController";
import { DeleteSettlementController } from "../../../presentation/controllers/Settlement/DeleteSettlementController";

const createSettlementUseCase = new CreateSettlementUseCase(
  tripContractRepo,
  settledPaymentRepo
);
const deleteSettlementUseCase = new DeleteSettlementUseCase(
  tripContractRepo,
  settledPaymentRepo
);

const createSettlementController = new CreateSettlementController(
  createSettlementUseCase
);
const deleteSettlementController = new DeleteSettlementController(
  deleteSettlementUseCase
);

export { createSettlementController, deleteSettlementController };
