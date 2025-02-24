import { EntityManager } from "typeorm";

export interface ITransactionRepo {
  executeTransaction<T>(action: (manager: EntityManager) => Promise<T>): Promise<T>;
}