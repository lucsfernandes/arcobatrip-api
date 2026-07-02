import { ActivityStatus } from "../../../contracts/contract";

export interface AddActivityRequestDTO {
  tripId: string;
  title: string;
  /** ISO datetime. */
  at: string;
  status: ActivityStatus;
  /** Authenticated user creating the activity (persisted as `created_by`). */
  createdBy?: string | null;
}
