import { GuestStatus } from "../../../contracts/contract";

export interface SetGuestStatusRequestDTO {
  tripId: string;
  guestId: string;
  status: GuestStatus;
}
