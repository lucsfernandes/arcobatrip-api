import { DataSource, Repository } from "typeorm";
import {
  CreateTripData,
  ITripContractRepo,
  NewActivityData,
  NewGuestData,
  NewLinkData,
  UpdateActivityData,
} from "../../application/usecases/trips/ITripContractRepo";
import { Trip } from "../../domain/entities/Trip/trip.entity";
import { Participant } from "../../domain/entities/Participant/participant.entity";
import { Activity } from "../../domain/entities/Activity/activity.entity";
import { Link } from "../../domain/entities/Link/link.entity";

export class TripContractRepo implements ITripContractRepo {
  private tripRepository: Repository<Trip>;
  private participantRepository: Repository<Participant>;
  private activityRepository: Repository<Activity>;
  private linkRepository: Repository<Link>;

  constructor(private readonly dataSource: DataSource) {
    this.tripRepository = dataSource.getRepository(Trip);
    this.participantRepository = dataSource.getRepository(Participant);
    this.activityRepository = dataSource.getRepository(Activity);
    this.linkRepository = dataSource.getRepository(Link);
  }

  async createTrip(data: CreateTripData): Promise<Trip> {
    const trip = this.tripRepository.create({
      destination: data.destination,
      startsAt: data.startDate,
      endsAt: data.endDate,
      participants: data.participants.map((p) =>
        this.participantRepository.create({
          name: p.name,
          email: p.email,
          isOwner: p.isOwner,
          isConfirmed: p.isConfirmed,
        })
      ),
      activities: [],
      links: [],
    });

    const saved = await this.tripRepository.save(trip);
    const hydrated = await this.findTripById(saved.id);
    return hydrated ?? saved;
  }

  async findTripsForUserEmail(email: string): Promise<Trip[]> {
    return this.tripRepository
      .createQueryBuilder("trip")
      .leftJoinAndSelect("trip.participants", "participant")
      .leftJoinAndSelect("trip.activities", "activity")
      .leftJoinAndSelect("trip.links", "link")
      .where((qb) => {
        const sub = qb
          .subQuery()
          .select("p.trip_id")
          .from(Participant, "p")
          .where("p.email = :email")
          .getQuery();
        return "trip.id IN " + sub;
      })
      .setParameter("email", email)
      .orderBy("trip.created_at", "DESC")
      .getMany();
  }

  async findTripById(id: string): Promise<Trip | null> {
    return this.tripRepository.findOne({
      where: { id },
      relations: ["participants", "activities", "links"],
    });
  }

  async addActivity(tripId: string, data: NewActivityData): Promise<Activity> {
    const activity = this.activityRepository.create({
      title: data.title,
      occursAt: new Date(data.at),
      status: data.status,
      tripId,
      createdBy: data.createdBy ?? null,
    });
    return this.activityRepository.save(activity);
  }

  async findActivity(tripId: string, activityId: string): Promise<Activity | null> {
    return this.activityRepository.findOne({
      where: { id: activityId, tripId },
    });
  }

  async updateActivity(activity: Activity, data: UpdateActivityData): Promise<Activity> {
    if (data.title !== undefined) activity.title = data.title;
    if (data.at !== undefined) activity.occursAt = new Date(data.at);
    if (data.status !== undefined) activity.status = data.status;
    return this.activityRepository.save(activity);
  }

  async softDeleteActivity(activityId: string): Promise<void> {
    await this.activityRepository.softDelete(activityId);
  }

  async addLink(tripId: string, data: NewLinkData): Promise<Link> {
    const link = this.linkRepository.create({
      title: data.label,
      url: data.url,
      tripId,
    });
    return this.linkRepository.save(link);
  }

  async addGuest(tripId: string, data: NewGuestData): Promise<Participant> {
    const participant = this.participantRepository.create({
      name: data.name,
      email: data.email,
      isOwner: false,
      isConfirmed: false,
      tripId,
    });
    return this.participantRepository.save(participant);
  }

  async findGuest(tripId: string, guestId: string): Promise<Participant | null> {
    return this.participantRepository.findOne({
      where: { id: guestId, tripId },
    });
  }

  async saveGuest(guest: Participant): Promise<Participant> {
    return this.participantRepository.save(guest);
  }
}
