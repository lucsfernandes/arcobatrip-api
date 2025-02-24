import { IActivity } from "../Activity/IActivity";
import { ILink } from "../Link/ILink";
import { IParticipant } from "../Participant/IParticipant";
import { IUser } from "../User/IUser";

export interface ITrip {
  id: string;
  destination: string;
  startsAt: string;
  endsAt: string;
  participants: IParticipant[];
  activities?: IActivity[];
  links?: ILink[];
  users?: IUser[];
}