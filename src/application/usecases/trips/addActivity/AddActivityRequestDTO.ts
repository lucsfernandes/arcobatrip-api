import { ActivityStatus } from "../../../contracts/contract";

export interface AddActivityRequestDTO {
  tripId: string;
  title: string;
  /** ISO datetime. */
  at: string;
  status: ActivityStatus;
}
