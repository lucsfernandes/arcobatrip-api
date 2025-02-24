import { Request, Response } from "express";
import { BaseController } from "../BaseController";
import { CreateTripUseCase } from "../../../application/usecases/trips/create/CreateTripUseCase";

export class CreateTripController extends BaseController {
  constructor(private createTripUseCase: CreateTripUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<Response> {
    const { body } = req;

    const result = await this.createTripUseCase.execute({
      destination: body.destination,
      startsAt: body.starts_at,
      endsAt: body.ends_at,
      ownerName: body.owner_name,
      ownerEmail: body.owner_email,
      participantToInvite: body.participants_to_invite
    });

    if (result.isFailure) return this.fail(res, result.errorValue());
    return this.ok(res, { data: result.getValue() });
  };
}
