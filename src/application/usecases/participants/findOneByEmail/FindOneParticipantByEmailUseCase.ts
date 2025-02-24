import { Repository } from "typeorm";
import { IUseCase } from "../../IUseCase";
import { IParticipantRepo } from "../IParticipantRepo";
import { FindOneParticipantByEmailRequest } from "./FindOneParticipantByEmailRequestDTO";
import { FindOneParticipantByEmailResponse } from "./FindOneParticipantByEmailResponseDTO";
import { Result } from '../../Result';
import { NotFoundError } from "../../../errors/NotFoundError";

export class FindOneParticipantByEmailUseCase
  implements IUseCase<FindOneParticipantByEmailRequest, FindOneParticipantByEmailResponse>
{
  constructor(private repo: IParticipantRepo) {}

  async execute(request: FindOneParticipantByEmailRequest): Promise<Result<FindOneParticipantByEmailResponse>> {
    const result = await this.repo.findOneByEmail(request.email);

    if (!result) {
      return Result.fail(new NotFoundError());
    }

    return Result.ok(result);
  };
}