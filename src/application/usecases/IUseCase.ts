import { Result } from './Result';

export interface IUseCase<REQ, RES> {
  execute(request?: REQ): Promise<Result<RES>>;
}
