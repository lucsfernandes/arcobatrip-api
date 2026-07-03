import { ActivityStatus } from "../../../contracts/contract";

export interface UpdateActivityRequestDTO {
  tripId: string;
  activityId: string;
  /** Authenticated user id — used to authorize by "creator". */
  userId: string;
  /** Authenticated user email — used to authorize by "trip owner". */
  userEmail: string;
  title?: string;
  /** ISO datetime. */
  at?: string;
  status?: ActivityStatus;
}
