import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { AppError } from "../../../errors/AppError";
import { ITripContractRepo } from "../ITripContractRepo";
import { IExpenseRepo } from "../../expenses/IExpenseRepo";
import { ISettledPaymentRepo } from "../../settlements/ISettledPaymentRepo";
import { isTripOwner } from "../tripAuthorization";
import { RemoveGuestRequestDTO } from "./RemoveGuestRequestDTO";
import { RemoveGuestResponseDTO } from "./RemoveGuestResponseDTO";

/**
 * Contract: `DELETE /trips/{id}/guests/{guestId}` (soft delete).
 *
 * Only a PENDING guest can be removed, and only by the trip owner:
 * - 404 when the trip or the guest (in this trip) is missing.
 * - 403 when the caller is not the trip owner.
 * - 409 when the guest is the host, has confirmed, or appears in an expense
 *   (paid or split) or a recorded payment — removing them would break the
 *   trip's accounts.
 * - 204 otherwise; the invite notification sent to them is removed too.
 */
export class RemoveGuestUseCase
  implements IUseCase<RemoveGuestRequestDTO, RemoveGuestResponseDTO>
{
  constructor(
    private readonly tripRepo: ITripContractRepo,
    private readonly expenseRepo: IExpenseRepo,
    private readonly settledPaymentRepo: ISettledPaymentRepo
  ) {}

  async execute(request: RemoveGuestRequestDTO): Promise<Result<RemoveGuestResponseDTO>> {
    const trip = await this.tripRepo.findTripById(request.tripId);
    if (!trip) {
      return Result.fail(AppError.notFound("Viagem não encontrada"));
    }

    if (!isTripOwner(trip, request.userEmail)) {
      return Result.fail(
        AppError.forbidden("Só quem criou a viagem pode remover convidados")
      );
    }

    const guest = await this.tripRepo.findGuest(request.tripId, request.guestId);
    if (!guest) {
      return Result.fail(AppError.notFound("Convidado não encontrado"));
    }

    if (guest.isOwner) {
      return Result.fail(AppError.conflict("O anfitrião não pode ser removido da viagem"));
    }
    if (guest.isConfirmed) {
      return Result.fail(
        AppError.conflict("Só é possível remover convidados que ainda não confirmaram")
      );
    }

    const [expenses, payments] = await Promise.all([
      this.expenseRepo.findByTrip(trip.id),
      this.settledPaymentRepo.findByTrip(trip.id),
    ]);
    const inAccounts =
      expenses.some((e) => e.paidById === guest.id || e.splitBetween.includes(guest.id)) ||
      payments.some((p) => p.fromId === guest.id || p.toId === guest.id);
    if (inAccounts) {
      return Result.fail(
        AppError.conflict("Este convidado tem despesas ou pagamentos na viagem")
      );
    }

    await this.tripRepo.softDeleteGuest(guest);
    return Result.ok();
  }
}
