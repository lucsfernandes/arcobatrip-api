import { UploadTripBannerUseCase } from "../../../../application/usecases/trips/uploadTripBanner/UploadTripBannerUseCase";
import { MockTripContractRepo, buildTrip } from "../../../mocks/mockTripContractRepo";
import { MockStorageService } from "../../../mocks/mockStorageService";
import { Trip } from "../../../../domain/entities/Trip/trip.entity";

/** Real 1x1 PNG — valid magic bytes so the use case's file-type check passes. */
const VALID_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

const OWNER_EMAIL = "owner@test.com";

describe("UploadTripBannerUseCase", () => {
  let repo: MockTripContractRepo;
  let storage: MockStorageService;
  let useCase: UploadTripBannerUseCase;

  beforeEach(() => {
    repo = new MockTripContractRepo();
    storage = new MockStorageService();
    useCase = new UploadTripBannerUseCase(repo, storage);
  });

  afterEach(() => {
    repo.clear();
    storage.clear();
  });

  it("uploads the banner (owner) and persists cover url + public id", async () => {
    repo.seedTrip(buildTrip());

    const result = await useCase.execute({
      tripId: "trip-1",
      userEmail: OWNER_EMAIL,
      fileBuffer: VALID_PNG,
    });

    expect(result.isSuccess).toBe(true);
    expect(storage.uploads).toHaveLength(1);
    expect(storage.uploads[0].folder).toBe("zarpa/trip-banners");
    expect(result.getValue().coverUrl).toMatch(/^https:\/\/cdn\.test\//);
    const stored = await repo.findTripById("trip-1");
    expect(stored?.coverPublicId).toBeTruthy();
  });

  it("replaces and deletes the previous banner asset", async () => {
    repo.seedTrip(
      buildTrip({ coverPublicId: "zarpa/trip-banners/old" } as Partial<Trip>)
    );

    const result = await useCase.execute({
      tripId: "trip-1",
      userEmail: OWNER_EMAIL,
      fileBuffer: VALID_PNG,
    });

    expect(result.isSuccess).toBe(true);
    expect(storage.deleted).toEqual(["zarpa/trip-banners/old"]);
  });

  it("denies (403) a non-owner participant", async () => {
    repo.seedTrip(buildTrip());

    const result = await useCase.execute({
      tripId: "trip-1",
      userEmail: "guest@test.com",
      fileBuffer: VALID_PNG,
    });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(403);
    expect(storage.uploads).toHaveLength(0);
  });

  it("returns 404 when the trip does not exist", async () => {
    const result = await useCase.execute({
      tripId: "missing-trip",
      userEmail: OWNER_EMAIL,
      fileBuffer: VALID_PNG,
    });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(404);
    expect(storage.uploads).toHaveLength(0);
  });

  it("rejects a non-image buffer (spoofed content) with 400 before storage", async () => {
    repo.seedTrip(buildTrip());

    const result = await useCase.execute({
      tripId: "trip-1",
      userEmail: OWNER_EMAIL,
      fileBuffer: Buffer.from("definitely not an image"),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(400);
    expect(result.errorValue().code).toBe("validation_error");
    expect(storage.uploads).toHaveLength(0);
  });
});
