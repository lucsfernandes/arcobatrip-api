import { DataSource, Repository } from "typeorm";
import {
  ActivityBannerData,
  CreateTripData,
  ITripContractRepo,
  NewActivityCommentData,
  NewActivityData,
  NewGuestData,
  NewLinkData,
  TripCoverData,
  UpdateActivityData,
} from "../../application/usecases/trips/ITripContractRepo";
import { Trip } from "../../domain/entities/Trip/trip.entity";
import { Participant } from "../../domain/entities/Participant/participant.entity";
import { Activity } from "../../domain/entities/Activity/activity.entity";
import { Link } from "../../domain/entities/Link/link.entity";
import { ActivityComment } from "../../domain/entities/ActivityComment/activityComment.entity";

export class TripContractRepo implements ITripContractRepo {
  private tripRepository: Repository<Trip>;
  private participantRepository: Repository<Participant>;
  private activityRepository: Repository<Activity>;
  private linkRepository: Repository<Link>;
  private commentRepository: Repository<ActivityComment>;

  constructor(private readonly dataSource: DataSource) {
    this.tripRepository = dataSource.getRepository(Trip);
    this.participantRepository = dataSource.getRepository(Participant);
    this.activityRepository = dataSource.getRepository(Activity);
    this.linkRepository = dataSource.getRepository(Link);
    this.commentRepository = dataSource.getRepository(ActivityComment);
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

  async updateTripCover(tripId: string, data: TripCoverData): Promise<Trip> {
    await this.tripRepository.update(tripId, {
      coverUrl: data.coverUrl,
      coverPublicId: data.coverPublicId,
    });
    const hydrated = await this.findTripById(tripId);
    if (!hydrated) {
      throw new Error(`Trip ${tripId} não encontrada após atualizar o banner`);
    }
    return hydrated;
  }

  async addActivity(tripId: string, data: NewActivityData): Promise<Activity> {
    const activity = this.activityRepository.create({
      title: data.title,
      occursAt: new Date(data.at),
      status: data.status,
      tripId,
      createdBy: data.createdBy ?? null,
      description: data.description ?? null,
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
    if (data.description !== undefined) activity.description = data.description;
    return this.activityRepository.save(activity);
  }

  async updateActivityBanner(
    activity: Activity,
    data: ActivityBannerData
  ): Promise<Activity> {
    activity.bannerUrl = data.bannerUrl;
    activity.bannerPublicId = data.bannerPublicId;
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

  // --- Activity links (Item 7c) ---

  async addActivityLink(
    tripId: string,
    activityId: string,
    data: NewLinkData
  ): Promise<Link> {
    const link = this.linkRepository.create({
      title: data.label,
      url: data.url,
      tripId,
      activityId,
    });
    return this.linkRepository.save(link);
  }

  async findActivityLinks(activityId: string): Promise<Link[]> {
    return this.linkRepository.find({
      where: { activityId },
      order: { createdAt: "ASC" },
    });
  }

  async findActivityLink(activityId: string, linkId: string): Promise<Link | null> {
    return this.linkRepository.findOne({
      where: { id: linkId, activityId },
    });
  }

  async softDeleteLink(linkId: string): Promise<void> {
    await this.linkRepository.softDelete(linkId);
  }

  // --- Activity comments (Item 7b) ---

  async addComment(
    activityId: string,
    data: NewActivityCommentData
  ): Promise<ActivityComment> {
    const comment = this.commentRepository.create({
      activityId,
      authorId: data.authorId,
      authorName: data.authorName,
      body: data.body,
    });
    return this.commentRepository.save(comment);
  }

  async findComments(activityId: string): Promise<ActivityComment[]> {
    return this.commentRepository.find({
      where: { activityId },
      order: { createdAt: "ASC" },
    });
  }

  async findComment(
    activityId: string,
    commentId: string
  ): Promise<ActivityComment | null> {
    return this.commentRepository.findOne({
      where: { id: commentId, activityId },
    });
  }

  async softDeleteComment(commentId: string): Promise<void> {
    await this.commentRepository.softDelete(commentId);
  }
}
